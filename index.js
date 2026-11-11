// Host half of dsh-composer-prompt-optimizer.
//
// Exposes one same-origin HTTP endpoint used by the composer button. The
// endpoint turns a draft prompt into a clearer one by calling the Harness LLM
// service with a single, tool-free completion. It never executes the task the
// prompt describes.
//
// The plugin deliberately keeps the transport small:
//   GET  /prompt-optimizer/api/health   -> capability and model snapshot
//   POST /prompt-optimizer/api/enhance  -> { text, provider?, model? }
//
// The browser half owns all rendering and the revert snapshot.

import { readFileSync } from 'node:fs'

const PKG = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
const SYSTEM_PROMPT = readFileSync(new URL('./prompts/system-prompt.txt', import.meta.url), 'utf8').trim()

const ROUTE_PREFIX = '/prompt-optimizer/api'
const DEFAULT_TIMEOUT_MS = 60_000
const MAX_BODY_BYTES = 1024 * 1024
const MAX_INPUT_CHARS = 30_000
const ZERO_WIDTH = /[\u200B\uFEFF]/g
const WRAPPING_START = /^["'\u201C\u201D\u2018\u2019]/
const WRAPPING_END = /["'\u201C\u201D\u2018\u2019]$/
const FENCE = /^```[a-zA-Z0-9_-]*[ \t]*\r?\n?([\s\S]*?)\r?\n?[ \t]*```$/

/**
 * Actionable hints for every failure code. The browser shows these verbatim,
 * so each one names the cause and tells the user what to do next.
 */
export const ERROR_HINTS = {
  empty_input: '请先输入要优化的提示词。',
  input_too_long: '草稿过长。请缩短后重试，或拆成几次优化。',
  bad_request: '请求格式不正确。请刷新页面后重试。',
  unavailable: '当前 Harness 没有可用的 LLM 服务。请确认插件已启用、Harness 已完全启动。',
  no_model: '当前没有可用模型。请先在输入框选择一个模型，再点击优化。',
  rate_limited: '当前模型已触发调用频率/配额限制。请在输入框切换其他模型，或等待配额重置后重试。',
  unsupported_effort: '当前模型不支持所选推理等级。插件已自动以默认等级重试；若仍失败请切换模型。',
  unknown_model: '所选模型未在当前模型服务中配置。请在输入框切换一个可用模型后重试。',
  unknown_provider: '模型服务未注册。请检查 Harness 的模型设置，或切换模型后重试。',
  auth_failed: '模型服务鉴权失败。请检查 API Key、账号登录状态或本地网关配置。',
  output_truncated: '模型输出被长度上限截断，没有生成完整提示词。请缩短草稿后重试。',
  empty_result: '模型没有返回可用的提示词正文（可能只输出了推理过程）。请切换模型后重试。',
  timeout: '优化超时。请重试，或缩短草稿、切换到更快的模型。',
  cancelled: '优化已取消，原文保持不变。',
  model_error: '模型调用失败。建议切换其他模型后重试；若持续失败请查看下方的错误详情。',
  unknown: '优化失败。请重试；若持续失败请查看下方的错误详情。',
}

/** One failure with a stable code the browser can localize. */
export class PromptOptimizerError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'PromptOptimizerError'
    this.code = code
  }
}

/** Remove editor placeholders and trim; rejects an empty draft. */
export function cleanInput(value) {
  const text = String(value ?? '').replace(ZERO_WIDTH, '').trim()
  if (!text) throw new PromptOptimizerError('empty_input', '草稿为空，无法优化。')
  if (text.length > MAX_INPUT_CHARS) {
    throw new PromptOptimizerError('input_too_long', `草稿超过 ${MAX_INPUT_CHARS} 字符，请缩短后再试。`)
  }
  return text
}

/** Trim, unwrap a code fence, then strip one pair of wrapping quotes. */
export function cleanOutput(value) {
  let text = String(value ?? '').replace(ZERO_WIDTH, '').trim()
  const fenced = FENCE.exec(text)
  if (fenced) text = fenced[1].trim()
  text = text.replace(WRAPPING_START, '').replace(WRAPPING_END, '').trim()
  if (!text) throw new PromptOptimizerError('empty_result', '模型没有返回可用的提示词。')
  return text
}

function optionalString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function numberInRange(value, fallback, min, max) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback
}

/** Normalize the row config without requiring a schema package. */
export function normalizeConfig(config = {}) {
  return {
    temperature: numberInRange(config.temperature, 0.3, 0, 2),
    maxTokens: Math.round(numberInRange(config.maxTokens, 2048, 256, 8192)),
    timeoutMs: Math.round(numberInRange(config.timeoutMs, DEFAULT_TIMEOUT_MS, 1_000, 300_000)),
    provider: optionalString(config.provider),
    model: optionalString(config.model),
    reasoningEffort: optionalString(config.reasoningEffort),
    systemPrompt: optionalString(config.systemPrompt),
  }
}

/** Resolve the model route: request override > row config > Harness default. */
export function resolveSelection(ctx, config, provider, model, reasoningEffort) {
  let fallback = {}
  try {
    const service = ctx.get('agentDefaultModel')
    const selection = service?.currentSelection?.()
    if (selection && typeof selection === 'object') fallback = selection
  } catch {
    /* A missing default is reported below. */
  }
  return {
    provider: optionalString(provider) ?? config.provider ?? optionalString(fallback.provider),
    model: optionalString(model) ?? config.model ?? optionalString(fallback.model),
    reasoningEffort:
      optionalString(reasoningEffort) ??
      config.reasoningEffort ??
      optionalString(fallback.reasoningEffort),
  }
}

function json(res, status, payload) {
  if (res.writableEnded) return
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  })
  res.end(body)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers?.['content-length'])
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
      reject(new PromptOptimizerError('input_too_long', '请求体过大。'))
      req.destroy()
      return
    }
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new PromptOptimizerError('input_too_long', '请求体过大。'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw.trim()) {
        resolve({})
        return
      }
      try {
        const parsed = JSON.parse(raw)
        resolve(parsed && typeof parsed === 'object' ? parsed : {})
      } catch {
        reject(new PromptOptimizerError('bad_request', '请求体不是合法 JSON。'))
      }
    })
    req.on('error', reject)
  })
}

/**
 * Classify a provider/adapter failure into a stable code plus an actionable
 * hint. Provider errors arrive as free-form text (often an embedded JSON
 * string), so matching is on recognizable fragments rather than error classes.
 */
export function classifyFailure(error, selection = {}) {
  const raw =
    error instanceof PromptOptimizerError
      ? error.message
      : error && typeof error.message === 'string'
        ? error.message
        : String(error ?? '')
  const lower = raw.toLowerCase()
  let code = error instanceof PromptOptimizerError ? error.code : 'unknown'

  if (code === 'model_error' || code === 'unknown') {
    if (/429|rate.?limit|频率限制|配额|quota|too many requests|限流/.test(lower)) code = 'rate_limited'
    else if (/does not support reasoning effort|unsupported.*effort|reasoning effort/.test(lower)) code = 'unsupported_effort'
    else if (/has no configured model|unknown model|model not found|no configured model/.test(lower)) code = 'unknown_model'
    else if (/no adapter registered|unknown provider|provider not found/.test(lower)) code = 'unknown_provider'
    else if (/401|403|unauthorized|forbidden|invalid api key|authentication|鉴权/.test(lower)) code = 'auth_failed'
    else if (/max.?tokens|context.*exceed|length limit/.test(lower)) code = 'output_truncated'
    else if (/timeout|timed out|etimedout|超时/.test(lower)) code = 'timeout'
    else if (/aborted|cancelled|取消/.test(lower)) code = 'cancelled'
  }

  const diagnostics = (error && error.diagnostics) || {}
  return {
    code,
    message: raw,
    hint: ERROR_HINTS[code] ?? ERROR_HINTS.unknown,
    details: {
      ...(selection.provider ? { provider: selection.provider } : {}),
      ...(selection.model ? { model: selection.model } : {}),
      ...(selection.reasoningEffort ? { reasoningEffort: selection.reasoningEffort } : {}),
      ...diagnostics,
      ...(raw ? { raw: raw.slice(0, 600) } : {}),
    },
  }
}

/** Run one tool-free completion and collect text plus diagnostic metadata. */
async function runStream(llm, config, selection, request, draft, maxTokens) {
  const textParts = []
  const blockTexts = []
  const chunkTypes = []
  let reasoningChars = 0
  let finishReason = null

  for await (const chunk of llm.stream({
    provider: selection.provider,
    model: selection.model,
    ...(selection.reasoningEffort ? { reasoningEffort: selection.reasoningEffort } : {}),
    system: config.systemPrompt || SYSTEM_PROMPT,
    messages: [{ role: 'user', content: [{ type: 'text', text: draft }] }],
    temperature: config.temperature,
    maxTokens: maxTokens ?? config.maxTokens,
    signal: request.signal,
  })) {
    if (chunkTypes.length < 40) chunkTypes.push(chunk.type)
    if (chunk.type === 'text-delta') {
      textParts.push(chunk.text)
    } else if (chunk.type === 'reasoning-delta') {
      reasoningChars += String(chunk.text ?? '').length
    } else if (chunk.type === 'block-end' && chunk.block?.type === 'text') {
      blockTexts.push(chunk.block.text)
    } else if (chunk.type === 'finish') {
      finishReason = chunk.reason?.kind ?? null
      if (finishReason === 'error') {
        throw new PromptOptimizerError(
          'model_error',
          chunk.reason?.failure?.message || '模型调用失败。',
        )
      }
      if (finishReason === 'aborted') throw new PromptOptimizerError('cancelled', '优化已取消。')
      if (finishReason === 'max-tokens') {
        throw new PromptOptimizerError('output_truncated', '模型输出被 maxTokens 截断。')
      }
    }
  }

  return {
    raw: textParts.length ? textParts.join('') : blockTexts.join(''),
    diagnostics: { reasoningChars, chunkTypes, finishReason },
  }
}

/**
 * Call the Harness LLM service once. The request contains only a system
 * message and the draft prompt; no tools, history, or session events.
 *
 * Reasoning effort is deliberately NOT forwarded from the request or the
 * Harness default selection: a rewrite task needs no high reasoning, and a
 * stale effort left over from a previous model is the most common cause of
 * "model does not support reasoning effort <x>" after the user switches
 * models. Only an explicit plugin config value is honored, and even then a
 * single automatic retry without the effort recovers from a mismatch.
 */
export async function enhanceDraft(ctx, config, request) {
  const draft = cleanInput(request.text)
  const llm = ctx.get('llm')
  if (!llm || typeof llm.stream !== 'function') {
    throw new PromptOptimizerError('unavailable', '当前运行环境没有可用的 LLM 服务。')
  }

  const resolved = resolveSelection(
    ctx,
    config,
    request.provider,
    request.model,
    request.reasoningEffort,
  )
  if (!resolved.provider || !resolved.model) {
    throw new PromptOptimizerError('no_model', '没有可用的模型，请先在 Harness 中选择默认模型。')
  }
  const selection = {
    provider: resolved.provider,
    model: resolved.model,
    reasoningEffort: config.reasoningEffort,
  }

  const startedAt = Date.now()
  let stream
  try {
    stream = await runStream(llm, config, selection, request, draft, config.maxTokens)
  } catch (error) {
    const classified = classifyFailure(error, selection)
    if (classified.code === 'unsupported_effort' && selection.reasoningEffort) {
      // A stale reasoning level must never block a simple rewrite.
      selection.reasoningEffort = undefined
      stream = await runStream(llm, config, selection, request, draft, config.maxTokens)
    } else if (classified.code === 'output_truncated' && config.maxTokens < 8192) {
      // Reasoning models can spend the whole budget on hidden reasoning before
      // writing the answer. One retry with a doubled budget usually recovers.
      stream = await runStream(
        llm, config, selection, request, draft, Math.min(8192, config.maxTokens * 2),
      )
    } else {
      throw error
    }
  }

  let text
  try {
    text = cleanOutput(stream.raw)
  } catch (error) {
    error.diagnostics = stream.diagnostics
    throw error
  }
  return {
    text,
    provider: selection.provider,
    model: selection.model,
    elapsedMs: Date.now() - startedAt,
  }
}

function statusFor(code) {
  switch (code) {
    case 'empty_input':
    case 'input_too_long':
    case 'bad_request':
      return 400
    case 'auth_failed':
      return 401
    case 'unknown_model':
    case 'unknown_provider':
    case 'unsupported_effort':
    case 'no_model':
      return 503
    case 'rate_limited':
      return 429
    case 'cancelled':
    case 'timeout':
      return 408
    case 'unavailable':
      return 503
    case 'model_error':
    case 'empty_result':
    case 'output_truncated':
      return 502
    default:
      return 500
  }
}

function publicError(error, selection = {}) {
  return classifyFailure(error, selection)
}

function healthPayload(ctx, config) {
  let selection = null
  try {
    selection = resolveSelection(ctx, config)
  } catch {
    selection = null
  }
  return {
    ok: true,
    plugin: 'dsh-composer-prompt-optimizer',
    version: PKG.version,
    llm: typeof ctx.get('llm')?.stream === 'function',
    model: selection && selection.provider && selection.model ? selection : null,
  }
}

function makeHandler(ctx, config) {
  return async function handleRequest(req, res) {
    let url
    try {
      url = new URL(req.url || '/', 'http://localhost')
    } catch {
      json(res, 400, {
        ok: false,
        error: {
          code: 'bad_request',
          message: '请求地址无效。',
          hint: ERROR_HINTS.bad_request,
          details: {},
        },
      })
      return
    }

    if (url.pathname === `${ROUTE_PREFIX}/health` && req.method === 'GET') {
      json(res, 200, healthPayload(ctx, config))
      return
    }

    if (url.pathname !== `${ROUTE_PREFIX}/enhance` || req.method !== 'POST') {
      json(res, 404, {
        ok: false,
        error: {
          code: 'not_found',
          message: 'Not found.',
          hint: ERROR_HINTS.bad_request,
          details: {},
        },
      })
      return
    }

    let body
    try {
      body = await readBody(req)
    } catch (error) {
      const failure = publicError(error)
      json(res, statusFor(failure.code), { ok: false, error: failure })
      return
    }

    const controller = new AbortController()
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, config.timeoutMs)
    if (typeof timer.unref === 'function') timer.unref()
    const onClose = () => {
      if (!res.writableEnded) controller.abort()
    }
    res.on('close', onClose)

    try {
      const result = await enhanceDraft(ctx, config, {
        text: body.text,
        provider: body.provider,
        model: body.model,
        reasoningEffort: body.reasoningEffort,
        signal: controller.signal,
      })
      if (!res.writableEnded) {
        json(res, 200, {
          ok: true,
          text: result.text,
          provider: result.provider,
          model: result.model,
          elapsedMs: result.elapsedMs,
        })
      }
    } catch (error) {
      if (res.writableEnded) return
      // Report the model the Host actually resolved, even when the browser did
      // not send one. Knowing which model failed is the fastest way for a user
      // to act on a rate limit or a missing model.
      let selection = {}
      try {
        const resolved = resolveSelection(ctx, config, body.provider, body.model, body.reasoningEffort)
        selection = {
          ...(resolved.provider ? { provider: resolved.provider } : {}),
          ...(resolved.model ? { model: resolved.model } : {}),
        }
      } catch {
        /* diagnostic only */
      }
      const failure = publicError(error, selection)
      if (controller.signal.aborted && !timedOut) return
      if (timedOut) {
        json(res, 504, {
          ok: false,
          error: {
            code: 'timeout',
            message: '优化超时，请重试。',
            hint: ERROR_HINTS.timeout,
            details: selection,
          },
        })
        return
      }
      json(res, statusFor(failure.code), { ok: false, error: failure })
    } finally {
      clearTimeout(timer)
      res.off('close', onClose)
    }
  }
}

/**
 * Attach the API route, retrying briefly when the web server starts after this
 * plugin on a restart. Returns a disposer that clears the timer and route.
 */
function attachRoute(ctx, config) {
  let routeDispose = null
  let timer = null
  let stopped = false
  let attempts = 0
  const MAX_ATTEMPTS = 120
  const INTERVAL_MS = 500
  const handler = makeHandler(ctx, config)

  const tryAttach = () => {
    if (stopped || routeDispose) return
    const webServer = ctx.get('webServer')
    if (webServer && typeof webServer.register === 'function') {
      try {
        const dispose = webServer.register({
          kind: 'prefix',
          path: ROUTE_PREFIX,
          handler,
        })
        routeDispose = typeof dispose === 'function' ? dispose : () => {}
      } catch (error) {
        try {
          ctx.logger?.warn?.(`[prompt-optimizer] route registration skipped: ${error?.message ?? error}`)
        } catch {
          /* ignore logger failures */
        }
      }
      return
    }
    attempts += 1
    if (attempts >= MAX_ATTEMPTS) return
    timer = setTimeout(tryAttach, INTERVAL_MS)
    if (typeof timer.unref === 'function') timer.unref()
  }

  tryAttach()

  return () => {
    stopped = true
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (routeDispose) {
      try {
        routeDispose()
      } catch {
        /* ignore route disposal failures */
      }
      routeDispose = null
    }
  }
}

export function apply(ctx, rawConfig = {}) {
  const config = normalizeConfig(rawConfig)
  ctx.effect(() => attachRoute(ctx, config), 'prompt-optimizer: api route')
}
