<template>
  <div
    class="chat-message"
    :class="[`message-${messageType}`]"
  >
    <div class="message-avatar">
      <div
        v-if="isUserMessage"
        class="avatar user-avatar"
      >
        <span>User</span>
      </div>
      <div
        v-else
        class="avatar ai-avatar"
      >
        <span>AI</span>
      </div>
    </div>
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
      <div class="message-body">
        <div
          v-if="isUserMessage"
          class="user-message"
          v-text="content"
        />
        <MarkdownRenderer
          v-else
          :content="content"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from '@vue/composition-api';
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue';

export default defineComponent({
  name: 'ChatMessage',
  components: {
    MarkdownRenderer,
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
  padding: @spacing-md;
  border-radius: @border-radius-md;

  &.message-user {
    flex-direction: row-reverse;

    .message-content {
      align-items: flex-end;

      .message-body {
        background-color: @primary-color;
        color: white;
        border-radius: @border-radius-md @border-radius-md 0 @border-radius-md;
      }
    }
  }

  &.message-ai {
    .message-content {
      .message-body {
        background-color: white;
        border-radius: @border-radius-md @border-radius-md @border-radius-md 0;
      }
    }
  }

  .message-avatar {
    flex-shrink: 0;

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
    }

    .user-avatar {
      background-color: @primary-color;
      color: white;
    }

    .ai-avatar {
      background-color: #67c23a;
      color: white;
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
        color: @text-color;
      }

    }

    .message-body {
      line-height: 1.6;
      padding: @spacing-sm @spacing-md;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

      .user-message {
        word-break: break-word;
      }
    }

    .thinking-section {
      background-color: #f8f8f8;
      border-radius: @border-radius-md;
      padding: @spacing-sm @spacing-md;
      margin-bottom: @spacing-sm;
      font-size: 14px;
      line-height: 1.6;
      color: lighten(@text-color, 10%);
      border-left: 3px solid #e6a23c;

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
        color: lighten(@text-color, 5%);
        white-space: pre-wrap;
      }
    }
  }
}

</style>
