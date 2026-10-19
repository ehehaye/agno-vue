/**
 * Parse a single SSE line into an event/data field.
 * https://html.spec.whatwg.org/multipage/server-sent-events.html#event-stream-interpretation
 */
export function parseSSELine(line) {
  if (!line || line.startsWith(':')) {
    return {}
  }

  const colonIndex = line.indexOf(':')
  const field = colonIndex === -1 ? line : line.slice(0, colonIndex)
  let value = colonIndex === -1 ? '' : line.slice(colonIndex + 1)

  // The spec removes exactly one leading space from the field value.
  if (value.startsWith(' ')) {
    value = value.slice(1)
  }

  if (field === 'event') {
    return { event: value }
  }
  if (field === 'data') {
    return { data: value }
  }
  return {}
}

export function parseSSEStream(text, onEvent, onError) {
  const parser = new SSEParser({ onError })
  parser.parse(text, onEvent)
  parser.flush(onEvent)
}

export class SSEParser {
  constructor({ onError } = {}) {
    this.buffer = ''
    this.currentEvent = null
    this.dataLines = []
    this.onError = onError
  }

  /**
   * Feed a chunk. Chunks may split lines, CRLF pairs, or multi-byte characters.
   */
  parse(chunk, onEvent) {
    this.buffer += chunk
    const lines = this.buffer.split('\n')
    this.buffer = lines.pop()

    lines.forEach((line) => this.consumeLine(line, onEvent))
  }

  /**
   * Flush a trailing line/event at the end of the stream.
   */
  flush(onEvent) {
    if (this.buffer) {
      this.consumeLine(this.buffer, onEvent)
      this.buffer = ''
    }
    this.dispatch(onEvent)
  }

  reset() {
    this.buffer = ''
    this.currentEvent = null
    this.dataLines = []
  }

  consumeLine(rawLine, onEvent) {
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine

    if (line === '') {
      this.dispatch(onEvent)
      return
    }

    const parsed = parseSSELine(line)
    if (Object.prototype.hasOwnProperty.call(parsed, 'event')) {
      this.currentEvent = parsed.event
    } else if (Object.prototype.hasOwnProperty.call(parsed, 'data')) {
      this.dataLines.push(parsed.data)
    }
  }

  dispatch(onEvent) {
    if (this.dataLines.length === 0) {
      this.currentEvent = null
      return
    }

    const rawData = this.dataLines.join('\n')
    const eventName = this.currentEvent
    this.currentEvent = null
    this.dataLines = []

    let payload
    try {
      payload = JSON.parse(rawData)
    } catch (err) {
      if (this.onError) {
        this.onError(err, rawData)
      } else {
        console.error('Failed to parse SSE data:', rawData, err)
      }
      return
    }

    // Agno payloads usually carry their own `event` field. Fall back to the
    // SSE `event:` line so the parser also works with standard event streams.
    if (
      eventName &&
      payload !== null &&
      typeof payload === 'object' &&
      !Array.isArray(payload) &&
      !payload.event
    ) {
      payload.event = eventName
    }

    onEvent(payload)
  }
}
