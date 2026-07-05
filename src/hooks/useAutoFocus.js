import { onMounted, onUnmounted } from '@vue/composition-api'

const FOCUS_KEEPER_SELECTOR = 'input, textarea, select, [contenteditable="true"]'
const BLOCKING_DIALOGS = ['confirm', 'alert', 'prompt']

const autoFocusStack = []

function keepsFocus(target) {
  const tag = target.tagName?.toLowerCase()
  if (['input', 'textarea', 'select'].includes(tag)) {
    return true
  }
  return target.closest?.(FOCUS_KEEPER_SELECTOR) != null
}

function shouldRestoreFocus(activeBefore, element) {
  if (activeBefore === element) {
    return true
  }
  if (keepsFocus(document.activeElement)) {
    return false
  }
  if (window.getSelection().toString().length > 0) {
    return false
  }
  return true
}

function patchBlockingDialogs() {
  if (patchBlockingDialogs.patched) {
    return
  }
  patchBlockingDialogs.patched = true

  BLOCKING_DIALOGS.forEach((name) => {
    const original = window[name]
    if (typeof original !== 'function') {
      return
    }

    window[name] = function (...args) {
      const activeBefore = document.activeElement
      const result = original.apply(this, args)
      const element = autoFocusStack[autoFocusStack.length - 1]?.value
      if (element && shouldRestoreFocus(activeBefore, element)) {
        element.focus?.()
      }
      return result
    }
  })
}

export function useAutoFocus(elementRef) {
  patchBlockingDialogs()

  const focus = () => {
    elementRef.value?.focus?.()
  }

  const handleDocumentClick = (event) => {
    if (keepsFocus(event.target)) {
      return
    }

    setTimeout(() => {
      if (!shouldRestoreFocus(null, elementRef.value)) {
        return
      }
      focus()
    }, 0)
  }

  onMounted(() => {
    autoFocusStack.push(elementRef)
    focus()
    document.addEventListener('click', handleDocumentClick)
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleDocumentClick)
    const index = autoFocusStack.indexOf(elementRef)
    if (index > -1) {
      autoFocusStack.splice(index, 1)
    }
  })

  return {
    focus,
  }
}
