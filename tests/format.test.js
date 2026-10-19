import test from 'node:test'
import assert from 'node:assert/strict'
import { formatDuration, formatTokenCount } from '../src/utils/format.js'

test('returns an empty string for missing durations', () => {
  assert.equal(formatDuration(null), '')
  assert.equal(formatDuration(undefined), '')
  assert.equal(formatDuration(0), '')
})

test('formats sub-minute durations in seconds', () => {
  assert.equal(formatDuration(1.5), '1.5s')
  assert.equal(formatDuration(59.9), '59.9s')
})

test('formats durations of a minute or more', () => {
  assert.equal(formatDuration(60), '1m0.0s')
  assert.equal(formatDuration(90.1), '1m30.1s')
  assert.equal(formatDuration(125), '2m5.0s')
})

test('formats token counts with thousands separators', () => {
  assert.equal(formatTokenCount(0), '0')
  assert.equal(formatTokenCount(999), '999')
  assert.equal(formatTokenCount(1709), '1,709')
  assert.equal(formatTokenCount(1234567), '1,234,567')
})

test('returns an empty string for invalid token counts', () => {
  assert.equal(formatTokenCount(null), '')
  assert.equal(formatTokenCount(undefined), '')
  assert.equal(formatTokenCount(-1), '')
  assert.equal(formatTokenCount('nope'), '')
})
