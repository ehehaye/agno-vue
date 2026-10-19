export function formatDuration(duration) {
  if (!duration) {
    return ''
  }

  const total = Number(duration)
  if (!Number.isFinite(total) || total <= 0) {
    return ''
  }

  const rounded = Number(total.toFixed(1))
  if (rounded < 60) {
    return `${rounded.toFixed(1)}s`
  }

  const minutes = Math.floor(rounded / 60)
  const seconds = rounded - minutes * 60
  return `${minutes}m${seconds.toFixed(1)}s`
}

export function formatTokenCount(value) {
  if (value == null || value === '') {
    return ''
  }
  const count = Number(value)
  if (!Number.isFinite(count) || count < 0) {
    return ''
  }
  return String(Math.round(count)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
