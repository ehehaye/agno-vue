<template>
  <div class="chat-interface">
    <div class="chat-messages">
      <div
        v-if="messages.length === 0"
        class="empty-state"
      >
        <div class="empty-icon">💬</div>
        <p>{{ $t('chat.emptyState') }}</p>
      </div>
      <StickToBottom
        v-else
        :messages="messages"
      >
        <!-- done messages -->
        <ChatMessage
          v-for="(message) in messages"
          :key="message.id"
          :message="message"
        />
        <!-- streaming message -->
        <ChatMessage
          v-if="streamingMessage"
          :message="streamingMessage"
        />
      </StickToBottom>
    </div>

    <Sender
      :streaming="!!streamingMessage"
      @cancel="cancelRun"
      @send="handleSend"
    />
  </div>
</template>

<script>
import { defineComponent, computed } from '@vue/composition-api';
import Sender from '@/components/ai/Sender.vue';
import StickToBottom from '@/components/ai/StickToBottom.vue';
import ChatMessage from '@/components/chat/ChatMessage.vue';
import { useAgentRun } from '@/hooks/agno/useAgentRun.js'
import { useConfig } from '@/hooks/agno/useConfig.js'; 
import { usePerfTrack } from '@/hooks/usePerfTrack.js';

export default defineComponent({
  name: 'ChatInterface',
  components: {
    Sender,
    ChatMessage,
    StickToBottom,
  },
  setup() {
    usePerfTrack()
    const { currentSessionId } = useConfig();
    const { messages, currentRun, isStreaming, sendMessage } = useAgentRun();

    const streamingMessage = computed(() => {
      if (currentRun.value?.status === 'streaming') {
        return {
          id: 'streaming',
          role: 'assistant',
          content: '',
          timestamp: 0,
          streamMessage: currentRun.value,
        };
      }
      return null;
    });

    const handleSend = async (text) => {
      await sendMessage(text);
    };

    return {
      isStreaming,
      messages,
      currentSessionId,
      handleSend,
      cancelRun: () => { },
      streamingMessage,
    };
  },
});
</script>

<style lang="less" scoped>
.chat-interface {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: @spacing-lg;
  gap: @spacing-md;

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
    flex: 1;
    overflow-y: hidden;
    display: flex;
    flex-direction: column;
    gap: @spacing-md;
    padding: @spacing-md;
    border: 1px solid fade(@border-color, 72%);
    border-radius: @border-radius-xl @border-radius-sm @border-radius-sm @border-radius-xl;
    background:
      linear-gradient(180deg, fade(@surface-color, 80%) 0%, fade(@surface-muted, 72%) 100%);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), @shadow-sm;
    scroll-behavior: smooth;

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
        filter: drop-shadow(0 12px 20px rgba(63, 126, 232, 0.2));
        animation: empty-icon-float 2.8s ease-in-out infinite;
      }

      p {
        margin: 0;
        font-size: 16px;
        padding: @spacing-sm @spacing-md;
        border-radius: 999px;
        background-color: fade(@surface-color, 72%);
        border: 1px solid fade(@border-color, 58%);
      }
    }
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
