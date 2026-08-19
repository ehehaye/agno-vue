export function parseSSELine(line) {
  if (line.startsWith('event:')) {
    return { event: line.slice(6).trim() }
  }
  if (line.startsWith('data:')) {
    return { data: line.slice(5).trim() }
  }
  return {}
}

export function parseSSEStream(text, onEvent) {
  const lines = text.split('\n')
  let currentEvent = null
  let currentData = null

  for (const line of lines) {
    const parsed = parseSSELine(line)

    if (parsed.event) {
      currentEvent = parsed.event
    } else if (parsed.data) {
      currentData = parsed.data
    }

    if (line === '' && currentEvent && currentData) {
      try {
        const parsedData = JSON.parse(currentData)
        onEvent(parsedData)
      } catch (e) {
        console.error('Failed to parse SSE data:', currentData, e)
      }
      currentEvent = null
      currentData = null
    }
  }
}

export class SSEParser {
  constructor() {
    this.buffer = ''
    this.currentEvent = null
    this.currentData = null
  }

  parse(chunk, onEvent) {
    this.buffer += chunk
    const lines = this.buffer.split('\n')

    let i = 0
    for (; i < lines.length - 1; i++) {
      const line = lines[i]
      const parsed = parseSSELine(line)

      if (parsed.event) {
        this.currentEvent = parsed.event
      } else if (parsed.data) {
        this.currentData = parsed.data
      }

      if (line === '' && this.currentEvent && this.currentData) {
        try {
          const parsedData = JSON.parse(this.currentData)
          onEvent(parsedData)
        } catch (e) {
          console.error('Failed to parse SSE data:', this.currentData, e)
        }
        this.currentEvent = null
        this.currentData = null
      }
    }

    this.buffer = lines[lines.length - 1]
  }

  reset() {
    this.buffer = ''
    this.currentEvent = null
    this.currentData = null
  }
}

export function isEventType(event, type) {
  return (
    typeof event === 'object' &&
    event !== null &&
    'event' in event &&
    event.event === type
  )
}
