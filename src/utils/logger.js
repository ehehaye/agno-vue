const isDevelopment = import.meta.env.DEV;

// TODO: window.devtoolsFormatters

const noop = () => {};

export const logger = {
  log: isDevelopment ? console.log : noop,
};
