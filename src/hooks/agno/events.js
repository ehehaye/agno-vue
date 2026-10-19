const listeners = new Map()

export const RuntimeEvents = {
  SESSION_CREATED: 'session:created',
}

const events = {
  on(name, handler) {
    if (!listeners.has(name)) {
      listeners.set(name, new Set())
    }
    listeners.get(name).add(handler)
    return () => events.off(name, handler)
  },

  off(name, handler) {
    const handlers = listeners.get(name)
    if (!handlers) {
      return
    }
    handlers.delete(handler)
    if (handlers.size === 0) {
      listeners.delete(name)
    }
  },

  emit(name, payload) {
    const handlers = listeners.get(name)
    if (!handlers) {
      return
    }
    for (const handler of handlers) {
      handler(payload)
    }
  },
}

export default events
