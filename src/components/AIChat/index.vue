<template>
  <div class="ai-chat">
    <div
      ref="messageListRef"
      class="chat-messages"
      @scroll="handleScroll"
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
        :streaming="isStreaming"
      />
    </div>

    <div class="chat-input-area">
      <textarea
        ref="inputRef"
        v-model="inputText"
        rows="3"
        :placeholder="$t('chat.placeholder', { key: isMac ? 'Command + Enter' : 'Alt + Enter' })"
        @keydown="handleKeydown"
      />
      <div class="input-wrapper">
        <p class="tip">
          <span>{{ $t('chat.sendKey', { key: isMac ? 'Command + Enter' : 'Alt + Enter' }) }}</span>
        </p>
        <button
          v-if="isStreaming"
          @click="cancelRun"
        >
          {{ $t('chat.stop') }}
        </button>
        <button
          v-else
          :disabled="!inputText.trim()"
          @click="handleSend"
        >
          {{ $t('chat.send') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, nextTick, onMounted, ref, watch } from '@vue/composition-api';
import { useAgnoChat } from '@/hooks/useAgnoChat';
import { useAgnoSession } from '@/hooks/useAgnoSession';
import ChatMessage from './ChatMessage.vue';

export default defineComponent({
  name: 'AiChat',
  components: {
    ChatMessage,
  },
  setup() {
    const chat = useAgnoChat();
    const { messages, sendMessage } = chat;
    const { currentSessionId } = useAgnoSession();

    const inputRef = ref(null);
    const messageListRef = ref(null);
    const inputText = ref('');
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const isUserScrolling = ref(false);
    const scrollTolerance = 50;

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

    const handleScroll = () => {
      if (!messageListRef.value) return;
      const { scrollTop, scrollHeight, clientHeight } = messageListRef.value;
      const isNearBottom = scrollHeight - scrollTop - clientHeight <= scrollTolerance;
      isUserScrolling.value = !isNearBottom;
    };

    const handleKeydown = (event) => {
      if (event.key === 'Enter') {
        if (isMac ? event.metaKey : event.altKey) {
          handleSend();
        }
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
      isMac,
      clearInput,
      focusInput,
      scrollToBottom,
      smartScrollToBottom,
      handleScroll,
      handleKeydown,
      formatThinking,
      handleSend,
    };
  },
});
</script>

<style lang="less" scoped>
.ai-chat {
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
    padding: @spacing-sm;

    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: lighten(@text-color, 20%);

      .empty-icon {
        font-size: 48px;
        margin-bottom: @spacing-md;
      }

      p {
        margin: 0;
        font-size: 16px;
      }
    }
  }

  .chat-input-area {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: @spacing-sm;

    .input-wrapper {
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: text;

      .tip {
        font-size: 12px;
        color: lighten(@text-color, 30%);
      }
    }
  }
}
</style>
