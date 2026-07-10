<template>
  <div class="chat-interface">
    <div class="chat-messages">
      <div
        v-if="displayMessages.length === 0"
        class="empty-state"
      >
        <div class="empty-icon">💬</div>
        <p class="empty-text">{{ $t('chat.emptyState') }}</p>
      </div>
      <template v-else>
        <StickToBottom :messages="displayMessages">
          <DynamicScroller
            :items="displayMessages"
            :min-item-size="60"
          >
            <template #default="{ item: message, index, active }">
              <DynamicScrollerItem
                class="message-item"
                :item="message"
                :active="active"
                :size-dependencies="[
                  calMsgFingerprint(message),
                ]"
                :data-index="index"
              >
                <ChatMessage
                  :id="`message-${message.id}`"
                  :message="message"
                />
              </DynamicScrollerItem>
            </template>
          </DynamicScroller>
        </StickToBottom>
        <Toc
          v-show="tocContents.length > 1"
          :contents="tocContents"
          container-selector=".stick-to-bottom"
        />
      </template>
    </div>

    <Sender
      class="sender"
      :streaming="isStreaming"
      @cancel="cancelRun"
      @send="handleSend"
    />
  </div>
</template>

<script>
import { computed, defineComponent } from '@vue/composition-api'
import Sender from '@/components/ai/Sender.vue'
import StickToBottom from '@/components/ai/StickToBottom.vue'
import ChatMessage from '@/components/chat/ChatMessage.vue'
import { Toc } from '@/components/common'
import { useAgentRun } from '@/hooks/agno/useAgentRun.js'
import { useConfig } from '@/hooks/agno/useConfig.js'
import { usePerfTrack } from '@/hooks/usePerfTrack.js'
import { $c } from '@/constants'
import { calMsgFingerprint } from '@/utils'

export default defineComponent({
  name: 'ChatInterface',
  components: {
    Sender,
    ChatMessage,
    StickToBottom,
    Toc,
  },
  setup() {
    usePerfTrack()
    const { currentSessionId } = useConfig()
    const { messages, currentRun, isStreaming, sendMessage } = useAgentRun()

    const streamingMessage = computed(() => {
      if (currentRun.value?.status === $c.RunStatus.Streaming) {
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
      return messages.value
    })

    const userMessages = computed(() => messages.value.filter((message) => message.role === $c.Role.User))
    const tocContents = computed(() => userMessages.value.map((message) => ({
      ...message,
      hash: `#message-${message.id}`,
    })))

    const handleSend = async (text) => {
      await sendMessage(text)
    }

    return {
      isStreaming,
      displayMessages,
      currentSessionId,
      tocContents,
      handleSend,
      cancelRun: () => { },
      calMsgFingerprint,
    }
  },
})
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

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;

    .chat-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: @text-color;
    }
  }

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
