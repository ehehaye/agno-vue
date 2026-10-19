export function uuid() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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
