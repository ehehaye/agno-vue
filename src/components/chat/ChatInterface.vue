<template>
  <div class="chat-interface">
    <div
      ref="messageListRef"
      class="chat-messages"
    >
      <div
        v-if="messages.length === 0"
        class="empty-state"
      >
        <div class="empty-icon">💬</div>
        <p>{{ $t('chat.emptyState') }}</p>
      </div>
      <ChatMessage
        v-for="(msg, index) in messages"
        :key="index"
        :type="msg.role"
        :content="msg.content"
        :thinking="formatThinking(msg)"
        :streaming="index === messages.length - 1 && isStreaming"
      />
    </div>

    <ChatInput
      ref="inputRef"
      v-model="inputText"
      @cancel="cancelRun"
      @send="handleSend"
    />
  </div>
</template>

<script>
import { defineComponent, nextTick, onMounted, ref, watch } from '@vue/composition-api';
import { useAgnoChat } from '@/hooks/useAgnoChat';
import { useAgnoSession } from '@/hooks/useAgnoSession';
import ChatInput from './ChatInput.vue';
import ChatMessage from './ChatMessage.vue';

export default defineComponent({
  name: 'ChatInterface',
  components: {
    ChatInput,
    ChatMessage,
  },
  setup() {
    const chat = useAgnoChat();
    const { messages, sendMessage } = chat;
    const { currentSessionId } = useAgnoSession();

    const inputRef = ref(null);
    const messageListRef = ref(null);
    const inputText = ref('');
    const isUserScrolling = ref(false);

    const clearInput = () => {
      inputText.value = '';
    };

    const focusInput = () => {
      nextTick(() => {
        inputRef.value?.focus?.();
      });
    };

    const scrollToBottom = async () => {
      if (messageListRef.value) {
        await nextTick();
        messageListRef.value.scrollTo({
          top: messageListRef.value.scrollHeight,
          behavior: 'smooth',
        });
      }
    };

    const smartScrollToBottom = () => {
      if (!isUserScrolling.value) {
        scrollToBottom();
      }
    };

    const formatThinking = (msg) => {
      const { extra_data } = msg;
      if (!extra_data) return '';
      const { reasoning_content = '', reasoning_messages = [], reasoning_steps = [] } = extra_data;
      if (reasoning_content) return reasoning_content;
      if (reasoning_messages.length) return reasoning_messages.map(step => step.reasoning).join('\n');
      if (reasoning_steps.length) return reasoning_steps.map(step => step.reasoning).join('\n');
      return '';
    };

    const handleSend = async () => {
      const text = inputText.value.trim();
      if (!text) return;
      try {
        clearInput();
        await scrollToBottom();
        await sendMessage(text);
      } finally {
        await scrollToBottom();
      }
    };

    watch(currentSessionId, () => {
      clearInput();
      focusInput();
    });

    watch(
      messages,
      () => {
        smartScrollToBottom();
      },
      { deep: true }
    );

    onMounted(() => {
      focusInput();
    });

    return {
      ...chat,
      currentSessionId,
      inputRef,
      messageListRef,
      inputText,
      clearInput,
      focusInput,
      scrollToBottom,
      smartScrollToBottom,
      formatThinking,
      handleSend,
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
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: @spacing-md;
    padding: @spacing-md;
    border: 1px solid fade(@border-color, 72%);
    border-radius: @border-radius-xl 8px 8px @border-radius-xl;
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
