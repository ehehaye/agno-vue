import { getCurrentInstance } from '@vue/composition-api'

export const createTextVNode = (...args) => {
  const instance = getCurrentInstance()
  return instance.proxy._v(...args)
}
