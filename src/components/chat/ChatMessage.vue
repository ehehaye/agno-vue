<template>
  <div
    class="chat-message hover-lift"
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
      <div class="message-body hover-lift">
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
  padding: @spacing-sm;
  border-radius: @border-radius-lg;
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

      .message-body {
        background: linear-gradient(135deg, @primary-hover 0%, @primary-color 100%);
        color: white;
        border-radius: @border-radius-lg @border-radius-lg @border-radius-sm @border-radius-lg;
        box-shadow: 0 12px 26px rgba(63, 126, 232, 0.24);
      }
    }

    .message-name {
      color: fade(@primary-active, 84%);
    }
  }

  &.message-ai {
    .message-content {
      .message-body {
        background: fade(@surface-color, 92%);
        border: 1px solid fade(@border-color, 62%);
        border-radius: @border-radius-lg @border-radius-lg @border-radius-lg @border-radius-sm;
      }
    }
  }

  .message-avatar {
    flex-shrink: 0;

    .avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 13px;
      letter-spacing: 0.02em;
      box-shadow: @shadow-sm;
      transition:
        transform @transition-base,
        box-shadow @transition-base;
    }

    .avatar:hover {
      transform: scale(1.06) rotate(-2deg);
      box-shadow: @shadow-md;
    }

    .user-avatar {
      background: linear-gradient(135deg, @primary-hover, @primary-color);
      color: white;
    }

    .ai-avatar {
      background: linear-gradient(135deg, #8add66, @success-color);
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
        color: @text-secondary;
      }

    }

    .message-body {
      line-height: 1.6;
      padding: @spacing-md;
      box-shadow: @shadow-sm;
      transition:
        box-shadow @transition-base,
        transform @transition-base;

      &:hover {
        box-shadow: @shadow-md;
      }

      .user-message {
        word-break: break-word;
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
