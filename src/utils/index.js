export const sleepWith = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const retryWithInterval = async (
  ms = 4,
  retries = 1,
  cb = async () => true
) =>
  new Promise(async (resolve, reject) => {
    for (let i = 0; i < retries; i++) {
      try {
        const result = await cb();
        if (result) {
          resolve(result);
          break;
        }
      } catch (error) {
        await sleepWith(ms);
      }
    }
    reject(new Error('Retry failed'));
  });

export const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
};

// TODO: element-ui confirm dialog ?
export const confirm = (message) =>
  new Promise((resolve, reject) => {
    if (window.confirm(message)) {
      resolve();
    } else {
      reject();
    }
  });

export const pick = (obj, keys) => {
  return keys.reduce((acc, key) => {
    acc[key] = obj[key];
    return acc;
  }, {});
};
