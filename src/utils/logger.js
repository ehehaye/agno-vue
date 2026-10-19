const isDevelopment = import.meta.env.DEV

const noop = () => {}

export const logger = {
  log: isDevelopment ? console.log : noop,
}
