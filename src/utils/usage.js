const USAGE_FIELDS = [
  'input_tokens',
  'output_tokens',
  'total_tokens',
  'cache_read_tokens',
  'reasoning_tokens',
]

function addUsage(target, metrics) {
  if (!metrics || typeof metrics !== 'object') {
    return target
  }
  for (const field of USAGE_FIELDS) {
    const value = metrics[field]
    if (typeof value === 'number' && Number.isFinite(value)) {
      target[field] = (target[field] || 0) + value
    }
  }
  return target
}

export function sumUsage(metricsList) {
  return (metricsList || []).reduce(addUsage, {})
}

export function hasUsage(metrics) {
  return Boolean(
    metrics &&
    USAGE_FIELDS.some((field) => typeof metrics[field] === 'number')
  )
}

// Workflow metrics may be flat, or nested per step as { steps: { name: { metrics } } }.
export function extractUsage(metrics) {
  if (!metrics || typeof metrics !== 'object') {
    return {}
  }
  if (hasUsage(metrics)) {
    return addUsage({}, metrics)
  }
  return sumUsage(
    Object.values(metrics.steps || {}).map((step) => step?.metrics)
  )
}
