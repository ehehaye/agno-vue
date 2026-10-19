import test from 'node:test'
import assert from 'node:assert/strict'
import { getDistanceToBottom } from '../src/utils/scroll.js'

test('returns the remaining scroll distance', () => {
  assert.equal(
    getDistanceToBottom({ scrollHeight: 1000, scrollTop: 200, clientHeight: 300 }),
    500
  )
})

test('never returns a negative distance', () => {
  assert.equal(
    getDistanceToBottom({ scrollHeight: 300, scrollTop: 200, clientHeight: 300 }),
    0
  )
})
