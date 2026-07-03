<template>
  <div
    class="chat-message hover-lift"
    :class="[`message-${messageType}`]"
  >
    <MessageAvatar :type="messageType" />
    <div class="message-content">
      <div class="message-header">
        <span class="message-name">{{
          isUserMessage ? $t('message.user') : $t('message.ai')
        }}</span>
      </div>
      <div
        v-if="thinking"
        class="thinking-section"
      >
        <div class="thinking-header">
          <span class="thinking-icon">🧐</span>
          <span class="thinking-label">{{ $t('chat.thinking') }}</span>
        </div>
        <div class="thinking-content">{{ thinking }}</div>
      </div>
      <MessageBubble
        v-if="content"
        :type="messageType"
      >
        <div
          v-if="isUserMessage"
          class="user-message"
          v-text="content"
        />
        <MarkdownRenderer
          v-else
          :content="content"
        />
      </MessageBubble>
      <StreamingIndicator
        v-else-if="streaming"
        :style="{ width: '60px' }"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent } from '@vue/composition-api';
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue';
import StreamingIndicator from '@/components/common/StreamingIndicator.vue';
import MessageAvatar from '@/components/ai/MessageAvatar.vue';
import MessageBubble from '@/components/ai/MessageBubble.vue';

export default defineComponent({
  name: 'ChatMessage',
  components: {
    MarkdownRenderer,
    MessageAvatar,
    MessageBubble,
    StreamingIndicator,
  },
  props: {
    type: {
      type: String,
      default: 'user',
      validator: (value) => ['user', 'ai', 'agent', 'assistant'].includes(value),
    },
    content: {
      type: String,
      default: '',
    },
    thinking: {
      type: String,
      default: '',
    },
    streaming: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    isUserMessage() {
      return this.type === 'user';
    },
    messageType() {
      return this.isUserMessage ? 'user' : 'ai';
    },
  },
});
</script>

<style lang="less" scoped>
.chat-message {
  display: flex;
  gap: @spacing-md;
  padding: @spacing-sm;
  border-radius: @border-radius-lg;
  content-visibility: auto;
  transition:
    background-color @transition-fast,
    transform @transition-base;

  &:hover {
    background-color: fade(@surface-color, 54%);
  }

  &.message-user {
    flex-direction: row-reverse;

    .message-content {
      align-items: flex-end;
    }

    .message-name {
      color: fade(@primary-active, 84%);
    }
  }

  .message-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    max-width: 80%;

    .message-header {
      display: flex;
      align-items: center;
      gap: @spacing-sm;
      margin-bottom: @spacing-xs;

      .message-name {
        font-weight: 600;
        font-size: 14px;
        color: @text-secondary;
      }

    }

    .thinking-section {
      background: linear-gradient(135deg, rgba(255, 250, 235, 0.92), rgba(255, 255, 255, 0.9));
      border-radius: @border-radius-lg;
      padding: @spacing-sm @spacing-md;
      margin-bottom: @spacing-sm;
      font-size: 14px;
      line-height: 1.6;
      color: @text-secondary;
      border: 1px solid fade(@warning-color, 28%);
      border-left: 3px solid @warning-color;
      box-shadow: 0 8px 22px rgba(230, 162, 60, 0.12);

      .thinking-header {
        display: flex;
        align-items: center;
        gap: @spacing-xs;
        margin-bottom: @spacing-xs;
        color: #e6a23c;
        font-weight: 600;

        .thinking-icon {
          font-size: 16px;
        }

        .thinking-label {
          font-size: 13px;
        }
      }

      .thinking-content {
        color: @text-color;
        white-space: pre-wrap;
      }
    }
  }
}
</style>
