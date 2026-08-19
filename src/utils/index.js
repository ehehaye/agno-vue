export function uuid() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Calculate the characteristic fingerprint of the message for change comparison, which does not reflect the actual length.
 * @param {Object} message - The message object.
 * @returns {number} - The characteristic fingerprint value.
 */
export function calMsgFingerprint(message) {
  let length = 0
  // The length of completed messages does not need to track internal changes.
  if (message.id !== 'streaming') {
    return length
  }
  length +=
    (message.content?.length || 0) + (message.reasoning_content?.length || 0)
  length += message.tool_calls?.length || 0
  length += message.member_runs?.length || 0
  return length
}

export function debounce(fn, delay) {
  let timer
  return function (...args) {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

export function truncateByWidth(text, maxWidth, fontStyle = '14px Arial') {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx.font = fontStyle

  let result = text
  while (ctx.measureText(result).width > maxWidth && result.length > 0) {
    result = result.slice(0, -1)
  }
  return result
}
