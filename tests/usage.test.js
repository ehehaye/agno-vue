import test from 'node:test'
import assert from 'node:assert/strict'
import { extractUsage, hasUsage, sumUsage } from '../src/utils/usage.js'

test('sums token fields across metrics', () => {
  assert.deepEqual(
    sumUsage([
      { input_tokens: 10, output_tokens: 2 },
      { input_tokens: 5, total_tokens: 7 },
    ]),
    { input_tokens: 15, output_tokens: 2, total_tokens: 7 }
  )
})

test('ignores missing and non-numeric fields', () => {
  assert.deepEqual(
    sumUsage([
      null,
      { input_tokens: 'nope', output_tokens: Number.NaN },
      { cache_read_tokens: 4 },
    ]),
    { cache_read_tokens: 4 }
  )
})

test('detects whether metrics contain usage', () => {
  assert.equal(hasUsage(null), false)
  assert.equal(hasUsage({ duration: 1 }), false)
  assert.equal(hasUsage({ input_tokens: 0 }), true)
  assert.equal(hasUsage({ total_tokens: 12 }), true)
})

test('extracts flat usage from metrics', () => {
  assert.deepEqual(
    extractUsage({
      duration: 1,
      input_tokens: 20,
      output_tokens: 3,
      total_tokens: 23,
    }),
    { input_tokens: 20, output_tokens: 3, total_tokens: 23 }
  )
})

test('extracts usage nested by workflow step', () => {
  assert.deepEqual(
    extractUsage({
      duration: 1,
      steps: {
        billing: { metrics: { input_tokens: 10, output_tokens: 2 } },
        support: { metrics: { input_tokens: 5, total_tokens: 7 } },
      },
    }),
    { input_tokens: 15, output_tokens: 2, total_tokens: 7 }
  )
})

test('returns no usage for empty metrics', () => {
  assert.deepEqual(extractUsage(null), {})
  assert.deepEqual(extractUsage({ duration: 1 }), {})
})
