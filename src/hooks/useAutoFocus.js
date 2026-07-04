import { onMounted, onUnmounted } from '@vue/composition-api';

const FOCUS_KEEPER_SELECTOR = 'input, textarea, select, [contenteditable="true"]';

function keepsFocus(target) {
  const tag = target.tagName?.toLowerCase();
  if (['input', 'textarea', 'select'].includes(tag)) {
    return true;
  }
  return target.closest?.(FOCUS_KEEPER_SELECTOR) != null;
}

export function useAutoFocus(elementRef) {
  const focus = () => {
    elementRef.value?.focus?.();
  };

  const handleDocumentClick = (event) => {
    if (keepsFocus(event.target)) {
      return;
    }

    setTimeout(() => {
      if (keepsFocus(document.activeElement)) {
        return;
      }
      if (window.getSelection().toString().length > 0) {
        return;
      }
      focus();
    }, 0);
  };

  onMounted(() => {
    focus();
    document.addEventListener('click', handleDocumentClick);
  });

  onUnmounted(() => {
    document.removeEventListener('click', handleDocumentClick);
  });

  return {
    focus,
  };
}
