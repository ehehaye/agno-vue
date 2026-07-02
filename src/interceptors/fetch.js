const STATE_KEY = Symbol.for('agno-vue.fetchInterceptorState');

class InterceptorManager {
  constructor() {
    this.handlers = [];
  }

  use(onFulfilled, onRejected) {
    this.handlers.push({
      fulfilled: typeof onFulfilled === 'function' ? onFulfilled : (value) => value,
      rejected: typeof onRejected === 'function' ? onRejected : undefined,
    });

    return this.handlers.length - 1;
  }

  eject(id) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }

  clear() {
    this.handlers = [];
  }

  forEach(callback) {
    this.handlers.forEach((handler) => {
      if (handler !== null) {
        callback(handler);
      }
    });
  }
}

const isRequestConfig = (value) =>
  value && typeof value === 'object' && ('input' in value || 'init' in value || 'url' in value);

const normalizeRequestConfig = (value) => {
  if (Array.isArray(value)) {
    return {
      input: value[0],
      init: value[1],
    };
  }

  if (isRequestConfig(value)) {
    return {
      ...value,
      input: 'input' in value ? value.input : value.url,
      init: value.init,
    };
  }

  return {
    input: value,
    init: undefined,
  };
};

const createState = () => {
  const originalFetch = globalThis.fetch;

  if (typeof originalFetch !== 'function') {
    throw new Error('fetch is not available in the current runtime.');
  }

  return {
    originalFetch: originalFetch.bind(globalThis),
    interceptors: {
      request: new InterceptorManager(),
      response: new InterceptorManager(),
    },
    installed: false,
  };
};

const state = globalThis[STATE_KEY] || createState();
globalThis[STATE_KEY] = state;

const dispatchRequest = (config) => {
  const { input, init } = normalizeRequestConfig(config);
  return state.originalFetch(input, init);
};

export const fetchInterceptors = state.interceptors;

export const rawFetch = (...args) => state.originalFetch(...args);

export const installFetchInterceptors = () => {
  if (state.installed) {
    return;
  }

  globalThis.fetch = (input, init) => {
    const chain = [
      {
        fulfilled: dispatchRequest,
        rejected: undefined,
      },
    ];

    fetchInterceptors.request.forEach((handler) => {
      chain.unshift(handler);
    });

    fetchInterceptors.response.forEach((handler) => {
      chain.push(handler);
    });

    let promise = Promise.resolve({ input, init });

    while (chain.length) {
      const { fulfilled, rejected } = chain.shift();
      promise = promise.then(fulfilled, rejected);
    }

    return promise;
  };

  state.installed = true;
};

export const uninstallFetchInterceptors = () => {
  if (!state.installed) {
    return;
  }

  globalThis.fetch = state.originalFetch;
  state.installed = false;
};

installFetchInterceptors();

export default fetchInterceptors;
