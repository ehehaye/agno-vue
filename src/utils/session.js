export function formatSessionName(name) {
  if (typeof name !== 'string') {
    return name || ''
  }

  // Name is a JSON string during session creation.
  if (name.includes('input_content')) {
    try {
      return JSON.parse(name).input_content
    } catch {
      return name
    }
  }
  return name
}

export function formatSessionTime(time) {
  return new Date(time).toLocaleString()
}
