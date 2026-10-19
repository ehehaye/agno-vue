<template>
  <div
    ref="containerRef"
    class="stick-to-bottom"
  >
    <slot />
    <div ref="messagesEndRef" />
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from '@vue/composition-api'
import { createScrollIntoView } from '@/utils/scroll.js'
import { useManualScrollDetector } from '@/hooks/useManualScrollDetector.js'

const props = defineProps({
  messages: {
    type: Array,
    default: () => [],
  },
  messageKey: {
    type: String,
    default: 'id',
  }
})

const containerRef = ref(null)
const messagesEndRef = ref(null)

const { scrollIntoView, cancelNextScroll } = createScrollIntoView()
const {
  isManualScrolling, isManuallyMovedToSafeArea, restart
} = useManualScrollDetector(containerRef, { threshold: '100' }) // TODO: ratio threshold

const getFirstMessageKey = (messages = []) => messages?.[0]?.[props.messageKey]

const getLastMessageSize = () => {
  const messages = props.messages || []
  const last = messages[messages.length - 1]
  if (!last) return 0

  const stream = last.streamMessage
  const memberSize =
    stream?.member_runs?.reduce(
      (sum, run) =>
        sum +
        (run.content?.length || 0) +
        (run.reasoning_content?.length || 0) +
        (run.tool_calls?.length || 0),
      0
    ) || 0

  return (
    (last.content?.length || 0) +
    (stream?.content?.length || 0) +
    (stream?.reasoning_content?.length || 0) +
    (stream?.tool_calls?.length || 0) +
    memberSize
  )
}

watch(
  [
    () => getFirstMessageKey(props.messages),
    () => props.messages.length,
    getLastMessageSize,
  ],
  async ([firstKey, length, lastSize], [prevFirstKey, prevLength, prevLastSize]) => {
    // Session context changed
    if (firstKey !== prevFirstKey) {
      return
    }

    // Append message
    if (length > prevLength) {
      restart()
    }

    if (length === prevLength && lastSize === prevLastSize) {
      return
    }

    // Append chunk to last message
    if (isManualScrolling.value || isManuallyMovedToSafeArea.value) {
      cancelNextScroll()
    } else {
      await nextTick()
      scrollIntoView(messagesEndRef.value, { behavior: 'instant' })
    }
  }
)
</script>

<style lang="less" scoped>
.stick-to-bottom {
  height: 100%;
  position: relative;
  overflow-y: auto;
  scroll-behavior: smooth;
}
</style>
