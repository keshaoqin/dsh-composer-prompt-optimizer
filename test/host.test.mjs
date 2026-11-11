import assert from 'node:assert/strict'
import test from 'node:test'
import { enhanceDraft, normalizeConfig } from '../index.js'

function fakeCtx(options = {}) {
  return {
    get(name) {
      if (name === 'llm') {
        return {
          stream: async function* () {
            for (const text of options.chunks ?? ['请解释这段代码。']) {
              yield { type: 'text-delta', index: 0, text }
            }
            yield { type: 'finish', reason: options.reason ?? { kind: 'stop' } }
          },
        }
      }
      if (name === 'agentDefaultModel') {
        return {
          currentSelection: () => ({ provider: 'p', model: 'm' }),
        }
      }
      return undefined
    },
  }
}

test('enhanceDraft streams a single completion and returns clean text', async () => {
  const result = await enhanceDraft(
    fakeCtx({ chunks: ['“请解释这段代码', '的主要功能。”'] }),
    normalizeConfig({}),
    { text: '帮我解释这段代码的功能' },
  )
  assert.equal(result.text, '请解释这段代码的主要功能。')
  assert.equal(result.provider, 'p')
  assert.equal(result.model, 'm')
})

test('enhanceDraft maps a provider error finish to model_error', async () => {
  await assert.rejects(
    enhanceDraft(fakeCtx({ reason: { kind: 'error', failure: { message: 'boom' } } }), normalizeConfig({}), {
      text: '做个网站',
    }),
    (error) => {
      assert.equal(error.code, 'model_error')
      assert.equal(error.message, 'boom')
      return true
    },
  )
})

test('enhanceDraft rejects an empty model result', async () => {
  await assert.rejects(
    enhanceDraft(fakeCtx({ chunks: ['   '] }), normalizeConfig({}), { text: '做个网站' }),
    (error) => {
      assert.equal(error.code, 'empty_result')
      return true
    },
  )
})
