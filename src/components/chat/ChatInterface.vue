<template>
  <div class="chat-interface">
    <div class="chat-messages">
      <div
        v-if="isLoadingSession"
        class="loading-state"
      >
        <StreamingIndicator />
      </div>
      <div
        v-else-if="displayMessages.length === 0"
        class="empty-state"
      >
        <div
          class="empty-icon"
          aria-hidden="true"
        >
          💬
        </div>
        <p class="empty-text">{{ $t('chat.emptyState') }}</p>
      </div>
      <template v-else>
        <StickToBottom
          :messages="displayMessages"
          @scroll="handleChatScroll"
        >
          <ChatMessage
            v-for="message in displayMessages"
            :id="`message-${message.id}`"
            :key="message.id"
            class="message-item"
            :message="message"
          />
        </StickToBottom>
        <Toc
          v-show="tocItems.length > 1"
          :items="tocItems"
          :active-id="activeTocId"
          @navigate="handleTocNavigate"
        />
      </template>
    </div>

    <div
      v-if="runError"
      class="tw:mx-auto tw:mb-compact tw:flex tw:w-[70%] tw:items-center tw:justify-between tw:gap-compact tw:rounded-md tw:border tw:border-danger tw:bg-surface-muted tw:px-base tw:py-compact tw:text-sm tw:text-danger"
      role="alert"
    >
      <span class="tw:min-w-0 tw:flex-1 tw:break-words">{{ runError }}</span>
      <button
        type="button"
        class="tw:shrink-0 tw:cursor-pointer tw:border-0 tw:bg-transparent tw:px-compact tw:text-lg tw:leading-none tw:text-danger"
        :aria-label="$t('chat.dismiss')"
        @click="dismissError"
      >
        &times;
      </button>
    </div>

    <Sender
      class="sender"
      :streaming="isStreaming"
      :loading="isLoadingSession"
      @cancel="cancelRun"
      @send="sendMessage"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from '@vue/composition-api'
import ChatMessage from './ChatMessage.vue'
import { Sender, StickToBottom, StreamingIndicator, Toc } from '@/components/ui'
import { useAgentRun } from '@/hooks/agno/useAgentRun.js'
import { usePerfTrack } from '@/hooks/usePerfTrack.js'
import { getDistanceToBottom } from '@/utils/scroll'
import { $c } from '@/constants'

usePerfTrack()
const {
  messages,
  currentRun,
  isStreaming,
  isLoadingSession,
  error: runError,
  sendMessage,
  cancelRun,
} = useAgentRun()

const activeTocId = ref('')
let activeFrame = null

const streamingMessage = computed(() => {
  const status = currentRun.value?.status
  if (
    status === $c.RunStatus.Streaming ||
    status === $c.RunStatus.Paused
  ) {
    return {
      id: 'streaming',
      role: $c.Role.Assistant,
      content: '',
      timestamp: 0,
      streamMessage: currentRun.value,
    }
  }
  return null
})

const displayMessages = computed(() => {
  if (streamingMessage.value) {
    return [...messages.value, streamingMessage.value]
  }
  return [...messages.value]
})

const tocItems = computed(() =>
  displayMessages.value
    .filter((message) => message.role === $c.Role.User)
    .map((message) => ({
      id: message.id,
      label: message.content,
    }))
)

const tocKey = computed(() => tocItems.value.map((item) => item.id).join('|'))

watch(
  tocKey,
  () => {
    const items = tocItems.value
    if (!items.length) {
      activeTocId.value = ''
      return
    }
    if (!items.some((item) => item.id === activeTocId.value)) {
      activeTocId.value = items[0].id
    }
  },
  { immediate: true }
)

const handleChatScroll = (container) => {
  if (activeFrame) {
    cancelAnimationFrame(activeFrame)
  }
  activeFrame = requestAnimationFrame(() => {
    activeFrame = null
    const items = tocItems.value
    if (!items.length || !container) {
      return
    }

    const scrollable = container.scrollHeight - container.clientHeight
    if (scrollable > 100 && getDistanceToBottom(container) <= 100) {
      activeTocId.value = items[items.length - 1].id
      return
    }

    const containerTop = container.getBoundingClientRect().top
    let nextActive = items[0].id
    for (const item of items) {
      const el = document.getElementById(`message-${item.id}`)
      if (!el) {
        continue
      }
      if (el.getBoundingClientRect().top - containerTop <= 24) {
        nextActive = item.id
      } else {
        break
      }
    }
    activeTocId.value = nextActive
  })
}

const handleTocNavigate = (id) => {
  activeTocId.value = id
  const el = document.getElementById(`message-${id}`)
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onBeforeUnmount(() => {
  if (activeFrame) {
    cancelAnimationFrame(activeFrame)
  }
})

const dismissError = () => {
  runError.value = null
}
</script>

<style lang="less" scoped>
@content-width: 70%;

.chat-interface {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: @spacing-lg 0;
  gap: @spacing-md;
  background: #fff;

  .chat-messages {
    position: relative;
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: @spacing-md;

    .message-item {
      width: @content-width;
      margin: 0 auto;
    }

    .loading-state {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: @text-secondary;
      animation: empty-state-in 0.52s @transition-base;

      .empty-icon {
        font-size: 48px;
        margin-bottom: @spacing-md;
        animation: empty-icon-float 2.8s ease-in-out infinite;
      }

      .empty-text {
        margin: 0;
        font-size: 16px;
        padding: @spacing-sm @spacing-md;
        border-radius: 999px;
        background-color: fade(@surface-color, 72%);
        border: 1px solid fade(@border-color, 58%);
      }
    }
  }

  .sender {
    width: calc(@content-width - 20px);
    margin: 0 auto;
  }
}

@keyframes empty-state-in {
  from {
    opacity: 0;
    transform: scale(0.96);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes empty-icon-float {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-8px);
  }
}
</style>
