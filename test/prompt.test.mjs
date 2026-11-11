import assert from 'node:assert/strict'
import test from 'node:test'
import {
  PromptOptimizerError,
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
    maxTokens: 1024,
    timeoutMs: 60_000,
    provider: undefined,
    model: undefined,
    reasoningEffort: undefined,
    systemPrompt: undefined,
  })
  const clamped = normalizeConfig({ temperature: 9, maxTokens: 100_000, timeoutMs: 1 })
  assert.equal(clamped.temperature, 2)
  assert.equal(clamped.maxTokens, 8192)
  assert.equal(clamped.timeoutMs, 1000)
})

test('resolveSelection prefers request override, then config, then default', () => {
  const ctx = {
    get(name) {
      if (name === 'agentDefaultModel') {
        return { currentSelection: () => ({ provider: 'default-provider', model: 'default-model' }) }
      }
      return undefined
    },
  }
  const config = normalizeConfig({ provider: 'config-provider', model: 'config-model' })
  assert.deepEqual(resolveSelection(ctx, config, 'request-provider', 'request-model'), {
    provider: 'request-provider',
    model: 'request-model',
    reasoningEffort: undefined,
  })
  assert.deepEqual(resolveSelection(ctx, config), {
    provider: 'config-provider',
    model: 'config-model',
    reasoningEffort: undefined,
  })
  assert.deepEqual(resolveSelection(ctx, normalizeConfig({})), {
    provider: 'default-provider',
    model: 'default-model',
    reasoningEffort: undefined,
  })
})
