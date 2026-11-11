import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ERROR_HINTS,
  PromptOptimizerError,
  classifyFailure,
  cleanInput,
  cleanOutput,
  normalizeConfig,
  resolveSelection,
} from '../index.js'

test('cleanInput strips zero-width characters and trims', () => {
  assert.equal(cleanInput('\u200B  hello  \uFEFF'), 'hello')
})

test('cleanInput rejects empty drafts', () => {
  assert.throws(() => cleanInput(' \u200B '), (error) => {
    assert.ok(error instanceof PromptOptimizerError)
    assert.equal(error.code, 'empty_input')
    return true
  })
})

test('cleanInput enforces the input bound', () => {
  assert.throws(() => cleanInput('x'.repeat(30_001)), (error) => {
    assert.equal(error.code, 'input_too_long')
    return true
  })
})

test('cleanOutput unwraps one pair of quotes', () => {
  assert.equal(cleanOutput('  “请解释这段代码的功能”  '), '请解释这段代码的功能')
  assert.equal(cleanOutput("'Explain this code.'"), 'Explain this code.')
})

test('cleanOutput unwraps a code fence', () => {
  assert.equal(cleanOutput('```text\n请解释这段代码。\n```'), '请解释这段代码。')
})

test('cleanOutput rejects an empty result', () => {
  assert.throws(() => cleanOutput('  \u200B  '), (error) => {
    assert.equal(error.code, 'empty_result')
    return true
  })
})

test('cleanOutput keeps ordinary text unchanged', () => {
  assert.equal(cleanOutput('请解释这段代码的主要功能。'), '请解释这段代码的主要功能。')
})

test('normalizeConfig applies defaults and clamps ranges', () => {
  assert.deepEqual(normalizeConfig({}), {
    temperature: 0.3,
    maxTokens: 2048,
    timeoutMs: 60_000,
    reasoningEffort: undefined,
    systemPrompt: undefined,
  })
  // A plugin config must never be able to pin a model (and therefore a
  // credential) that differs from the one selected in the composer.
  assert.equal('provider' in normalizeConfig({ provider: 'p', model: 'm' }), false)
  assert.equal('model' in normalizeConfig({ provider: 'p', model: 'm' }), false)
  const clamped = normalizeConfig({ temperature: 9, maxTokens: 100_000, timeoutMs: 1 })
  assert.equal(clamped.temperature, 2)
  assert.equal(clamped.maxTokens, 8192)
  assert.equal(clamped.timeoutMs, 1000)
})

test('resolveSelection uses the composer session model and never plugin config', () => {
  const ctx = {
    get(name) {
      if (name === 'agentDefaultModel') {
        return { currentSelection: () => ({ provider: 'default-provider', model: 'default-model' }) }
      }
      return undefined
    },
  }
  const config = normalizeConfig({ provider: 'config-provider', model: 'config-model' })
  assert.deepEqual(resolveSelection(ctx, config, 'session-provider', 'session-model'), {
    provider: 'session-provider',
    model: 'session-model',
    reasoningEffort: undefined,
  })
  // No session selection: only then is the Harness default used, never config.
  assert.deepEqual(resolveSelection(ctx, config), {
    provider: 'default-provider',
    model: 'default-model',
    reasoningEffort: undefined,
  })
})

test('classifyFailure recognizes rate limiting from a provider 429 payload', () => {
  const raw = '429: {"code":null,"message":"WorkBuddy: 您的使用量已超出频率限制，将在 2026-11-12 10:09:02 UTC+8 重置，您也可以切换其他模型继续使用。","type":"rate_limit_error"}'
  const failure = classifyFailure(new PromptOptimizerError('model_error', raw), {
    provider: 'magpie', model: 'workbuddy/deepseek-v4.1-flash',
  })
  assert.equal(failure.code, 'rate_limited')
  assert.match(failure.hint, /切换其他模型/)
  assert.equal(failure.details.provider, 'magpie')
  assert.match(failure.details.raw, /rate_limit_error/)
})

test('classifyFailure recognizes unsupported reasoning effort', () => {
  const failure = classifyFailure(
    new PromptOptimizerError('model_error', 'provider "magpie" model "workbuddy/hy4free" does not support reasoning effort "max"'),
    { provider: 'magpie', model: 'workbuddy/hy4free' },
  )
  assert.equal(failure.code, 'unsupported_effort')
  assert.match(failure.hint, /推理等级/)
})

test('classifyFailure recognizes unknown model, provider, auth and truncation', () => {
  const cases = [
    ['pi-ai provider "magpie" has no configured model "does-not-exist"', 'unknown_model'],
    ['no adapter registered for provider "nope"', 'unknown_provider'],
    ['401: invalid api key', 'auth_failed'],
    ['finish reason max-tokens exceeded', 'output_truncated'],
  ]
  for (const [raw, expected] of cases) {
    const failure = classifyFailure(new PromptOptimizerError('model_error', raw), {})
    assert.equal(failure.code, expected, raw)
    assert.ok(failure.hint.length > 0)
  }
})

test('classifyFailure keeps explicit plugin codes and always supplies a hint', () => {
  for (const code of Object.keys(ERROR_HINTS)) {
    const failure = classifyFailure(new PromptOptimizerError(code, 'x'), {})
    assert.equal(failure.hint, ERROR_HINTS[code])
  }
  assert.equal(classifyFailure(new PromptOptimizerError('no_model', 'x')).code, 'no_model')
  assert.equal(classifyFailure(new Error('random failure')).code, 'unknown')
  assert.ok(classifyFailure(new Error('random failure')).hint.length > 0)
})
