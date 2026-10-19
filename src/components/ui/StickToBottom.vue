<template>
  <div
    ref="containerRef"
    class="stick-to-bottom"
    @scroll="onScroll"
  >
    <div ref="contentRef">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from '@vue/composition-api'
import { getDistanceToBottom } from '@/utils/scroll'
import { $c as constants } from '@/constants'

const props = defineProps({
  messages: {
    type: Array,
    default: () => [],
  },
  threshold: {
    type: Number,
    default: 100,
  },
})
const emit = defineEmits(['scroll'])

const containerRef = ref(null)
const contentRef = ref(null)
const isPinned = ref(false)
let scrollFrame = null
let resizeObserver = null
const observedTargets = new WeakSet()

const onScroll = () => {
  const el = containerRef.value
  if (!el) {
    return
  }
  isPinned.value = getDistanceToBottom(el) <= props.threshold
  if (!isPinned.value && scrollFrame) {
    cancelAnimationFrame(scrollFrame)
    scrollFrame = null
  }
  emit('scroll', el)
}

const scrollToBottom = async () => {
  await nextTick()
  const el = containerRef.value
  if (el) {
    el.scrollTo({ top: el.scrollHeight, behavior: 'instant' })
  }
}

const scheduleScrollToBottom = () => {
  if (!isPinned.value) {
    return
  }
  if (scrollFrame) {
    cancelAnimationFrame(scrollFrame)
  }
  const scheduledTop = containerRef.value?.scrollTop
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = null
    const el = containerRef.value
    if (!el) {
      return
    }
    // Content growth does not move scrollTop. If it changed and left the
    // pinned zone, the user moved away and we should not fight them.
    if (
      el.scrollTop !== scheduledTop &&
      getDistanceToBottom(el) > props.threshold
    ) {
      isPinned.value = false
      return
    }
    scrollToBottom()
  })
}

const onContentResize = (entries) => {
  let shouldScroll = false
  for (const entry of entries) {
    // The first callback reports the initial size; do not jump on mount.
    if (!observedTargets.has(entry.target)) {
      observedTargets.add(entry.target)
      continue
    }
    shouldScroll = true
  }
  if (shouldScroll) {
    scheduleScrollToBottom()
  }
}

watch(
  () => props.messages.length,
  (next, prev) => {
    if (next <= prev) {
      return
    }
    const last = props.messages[next - 1]
    if (last?.role !== constants.Role.User) {
      return
    }
    // Sending a message is an explicit request to follow the conversation.
    isPinned.value = true
    scheduleScrollToBottom()
  }
)

onMounted(() => {
  // A conversation that ends with a user message is either brand new or
  // waiting for the first token; follow it. A loaded history session starts
  // at the top and only pins after the user scrolls back to the bottom.
  const last = props.messages[props.messages.length - 1]
  isPinned.value = last?.role === constants.Role.User

  if (typeof ResizeObserver === 'undefined') {
    return
  }
  resizeObserver = new ResizeObserver(onContentResize)
  if (contentRef.value) {
    resizeObserver.observe(contentRef.value)
  }
  if (containerRef.value) {
    resizeObserver.observe(containerRef.value)
  }
})

onBeforeUnmount(() => {
  if (scrollFrame) {
    cancelAnimationFrame(scrollFrame)
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})
</script>

<style lang="less" scoped>
.stick-to-bottom {
  height: 100%;
  position: relative;
  overflow-y: auto;
  scroll-behavior: smooth;
}
</style>
