import Events from 'events'

// TODO: 时间流整理，循环引用
const SessionEvents = {
  SESSION_CREATED: 'session:created',
}

export const RuntimeEvents = {
  ...SessionEvents,
}

export default new Events()
