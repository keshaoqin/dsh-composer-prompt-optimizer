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
    maxTokens: Math.round(numberInRange(config.maxTokens, 1024, 64, 8192)),
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
 * Call the Harness LLM service once. The request contains only a system
 * message and the draft prompt; no tools, history, or session events.
 */
export async function enhanceDraft(ctx, config, request) {
  const draft = cleanInput(request.text)
  const llm = ctx.get('llm')
  if (!llm || typeof llm.stream !== 'function') {
    throw new PromptOptimizerError('unavailable', '当前运行环境没有可用的 LLM 服务。')
  }

  const selection = resolveSelection(
    ctx,
    config,
    request.provider,
    request.model,
    request.reasoningEffort,
  )
  if (!selection.provider || !selection.model) {
    throw new PromptOptimizerError('no_model', '没有可用的模型，请先在 Harness 中选择默认模型。')
  }

  const startedAt = Date.now()
  const textParts = []
  const blockTexts = []
  try {
    for await (const chunk of llm.stream({
      provider: selection.provider,
      model: selection.model,
      ...(selection.reasoningEffort ? { reasoningEffort: selection.reasoningEffort } : {}),
      system: config.systemPrompt || SYSTEM_PROMPT,
      messages: [{ role: 'user', content: [{ type: 'text', text: draft }] }],
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      signal: request.signal,
    })) {
      if (chunk.type === 'text-delta') {
        textParts.push(chunk.text)
      } else if (chunk.type === 'block-end' && chunk.block?.type === 'text') {
        blockTexts.push(chunk.block.text)
      } else if (chunk.type === 'finish') {
        const reason = chunk.reason?.kind
        if (reason === 'error') {
          throw new PromptOptimizerError(
            'model_error',
            chunk.reason?.failure?.message || '模型调用失败。',
          )
        }
        if (reason === 'aborted') {
          throw new PromptOptimizerError('cancelled', '优化已取消。')
        }
      }
    }
  } catch (error) {
    if (error instanceof PromptOptimizerError) throw error
    throw new PromptOptimizerError(
      'model_error',
      error && typeof error.message === 'string' ? error.message : '模型调用失败。',
    )
  }

  const raw = textParts.length ? textParts.join('') : blockTexts.join('')
  const text = cleanOutput(raw)
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
    case 'unavailable':
    case 'no_model':
      return 503
    case 'cancelled':
      return 408
    case 'model_error':
    case 'empty_result':
      return 502
    default:
      return 500
  }
}

function publicError(error) {
  if (error instanceof PromptOptimizerError) {
    return { code: error.code, message: error.message }
  }
  return {
    code: 'unknown',
    message: error && typeof error.message === 'string' ? error.message : '优化失败。',
  }
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
      json(res, 400, { ok: false, error: { code: 'bad_request', message: '请求地址无效。' } })
      return
    }

    if (url.pathname === `${ROUTE_PREFIX}/health` && req.method === 'GET') {
      json(res, 200, healthPayload(ctx, config))
      return
    }

    if (url.pathname !== `${ROUTE_PREFIX}/enhance` || req.method !== 'POST') {
      json(res, 404, { ok: false, error: { code: 'not_found', message: 'Not found.' } })
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
      const failure = publicError(error)
      if (controller.signal.aborted && !timedOut) return
      if (timedOut) {
        json(res, 504, {
          ok: false,
          error: { code: 'timeout', message: '优化超时，请重试。' },
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
