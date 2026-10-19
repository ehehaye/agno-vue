import test from 'node:test'
import assert from 'node:assert/strict'
import { formatSessionName } from '../src/utils/session.js'

test('keeps a plain session name', () => {
  assert.equal(formatSessionName('hello'), 'hello')
})

test('extracts input_content from a JSON session name', () => {
  const name = JSON.stringify({ input_content: '用 JS 写一个冒泡排序' })
  assert.equal(formatSessionName(name), '用 JS 写一个冒泡排序')
})

test('returns the original string when the JSON is malformed', () => {
  const name = '{"input_content": oops'
  assert.equal(formatSessionName(name), name)
})

test('handles non-string names', () => {
  assert.equal(formatSessionName(null), '')
  assert.equal(formatSessionName(undefined), '')
  assert.equal(formatSessionName(42), 42)
})
