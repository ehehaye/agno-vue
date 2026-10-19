import test from 'node:test'
import assert from 'node:assert/strict'
import {
  SSEParser,
  parseSSELine,
  parseSSEStream,
} from '../src/utils/sse-parser.js'

const collect = (parser, chunks) => {
  const events = []
  chunks.forEach((chunk) => parser.parse(chunk, (event) => events.push(event)))
  return events
}

test('parses a single LF-delimited event', () => {
  const events = collect(
    new SSEParser(),
    ['event: RunContent\ndata: {"content":"hi"}\n\n']
  )
  assert.deepEqual(events, [{ content: 'hi', event: 'RunContent' }])
})

test('parses a CRLF-delimited event', () => {
  const events = collect(
    new SSEParser(),
    ['event: RunContent\r\ndata: {"content":"hi"}\r\n\r\n']
  )
  assert.deepEqual(events, [{ content: 'hi', event: 'RunContent' }])
})

test('parses a CRLF pair split across chunks', () => {
  const parser = new SSEParser()
  const events = collect(parser, [
    'event: RunContent\r\ndata: {"content":"hi"}\r',
    '\n\r\n',
  ])
  assert.deepEqual(events, [{ content: 'hi', event: 'RunContent' }])
})

test('handles events split across chunk boundaries', () => {
  const parser = new SSEParser()
  const events = collect(parser, [
    'event: RunCont',
    'ent\ndata: {"cont',
    'ent":"hello"}\n',
    '\n',
  ])
  assert.deepEqual(events, [{ content: 'hello', event: 'RunContent' }])
})

test('dispatches multiple events from one chunk', () => {
  const events = collect(
    new SSEParser(),
    [
      'event: RunStarted\ndata: {"run_id":"1"}\n\n' +
        'event: RunContent\ndata: {"content":"a"}\n\n',
    ]
  )
  assert.deepEqual(events, [
    { run_id: '1', event: 'RunStarted' },
    { content: 'a', event: 'RunContent' },
  ])
})

test('joins multiple data lines according to the SSE spec', () => {
  const events = collect(
    new SSEParser(),
    ['event: RunContent\ndata: {"content":\ndata: "a"}\n\n']
  )
  assert.deepEqual(events, [{ content: 'a', event: 'RunContent' }])
})

test('ignores comments and unknown fields', () => {
  const events = collect(
    new SSEParser(),
    [': keep-alive\nid: 42\nretry: 1000\nevent: RunContent\ndata: {"content":"x"}\n\n']
  )
  assert.deepEqual(events, [{ content: 'x', event: 'RunContent' }])
})

test('strips exactly one leading space from field values', () => {
  assert.deepEqual(parseSSELine('data: {"content":"x"}'), {
    data: '{"content":"x"}',
  })
  assert.deepEqual(parseSSELine('data:  x'), { data: ' x' })
})

test('flushes a pending event at end of stream', () => {
  const parser = new SSEParser()
  const events = collect(parser, ['event: RunContent\ndata: {"content":"tail"}'])
  assert.deepEqual(events, [])
  parser.flush((event) => events.push(event))
  assert.deepEqual(events, [{ content: 'tail', event: 'RunContent' }])
})

test('reports malformed JSON without throwing', () => {
  const errors = []
  const parser = new SSEParser({
    onError: (err, raw) => errors.push({ err, raw }),
  })
  const events = collect(parser, ['event: RunContent\ndata: {oops\n\n'])
  assert.deepEqual(events, [])
  assert.equal(errors.length, 1)
  assert.equal(errors[0].raw, '{oops')
})

test('attaches the SSE event name when the payload has none', () => {
  const events = collect(
    new SSEParser(),
    ['event: RunContent\ndata: {"content":"hi"}\n\n']
  )
  assert.deepEqual(events, [{ content: 'hi', event: 'RunContent' }])
})

test('keeps the payload event field when present', () => {
  const events = collect(
    new SSEParser(),
    ['event: TeamRunContent\ndata: {"event":"RunContent","content":"hi"}\n\n']
  )
  assert.deepEqual(events, [{ event: 'RunContent', content: 'hi' }])
})

test('does not dispatch events without data', () => {
  const events = collect(new SSEParser(), ['event: RunStarted\n\n'])
  assert.deepEqual(events, [])
})

test('parseSSEStream consumes a complete stream', () => {
  const events = []
  parseSSEStream(
    'event: RunContent\ndata: {"content":"a"}\n\n' +
      'event: RunContent\ndata: {"content":"b"}\n\n',
    (event) => events.push(event)
  )
  assert.deepEqual(events, [
    { content: 'a', event: 'RunContent' },
    { content: 'b', event: 'RunContent' },
  ])
})

test('parseSSELine handles values containing colons', () => {
  assert.deepEqual(parseSSELine('data: {"url":"http://example.com"}'), {
    data: '{"url":"http://example.com"}',
  })
})
