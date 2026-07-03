<template>
  <div
    ref="containerRef"
    class="stick-to-bottom"
  >
    <slot />
    <div ref="messagesEndRef" />
  </div>
</template>

<script>
import { defineComponent, watch, ref, nextTick } from '@vue/composition-api';
import { createScrollIntoView } from '@/utils/scroll.js';
import { useManualScrollDetector } from '@/hooks/useManualScrollDetector.js';

export default defineComponent({
  name: 'StickToBottom',
  props: {
    messages: {
      type: Array,
      default: () => [],
    },
    messageKey: {
      type: String,
      default: 'created_at',
    }
  },
  setup(props) {
    const containerRef = ref(null);
    const messagesEndRef = ref(null);

    const { scrollIntoView, cancelNextScroll } = createScrollIntoView();
    const {
      isManualScrolling, isManuallyMovedToSafeArea, restart
    } = useManualScrollDetector(containerRef, { threshold: '100' }); // TODO: ratio threshold

    const getFirstMessageKey = messages => messages?.[0]?.[props.messageKey];

    watch(
      () => props.messages,
      async (next, prev) => {
        // Session context changed
        if (getFirstMessageKey(next) !== getFirstMessageKey(prev)) {
          return
        }

        // Append message
        if (next.length > prev.length) {
          restart();
        }

        if (isManualScrolling.value || isManuallyMovedToSafeArea.value) {
          cancelNextScroll();
        } else {
          await nextTick();
          scrollIntoView(messagesEndRef.value);
        }
        return
      }
    )

    return {
      containerRef,
      messagesEndRef,
    }
  }
})
</script>

<style lang="less" scoped>
.stick-to-bottom {
  height: 100%;
  overflow-y: auto;
}
</style>
