<template>
  <div
    class="chat-message"
    :class="[`message-${message.role}`]"
  >
    <!-- <Avatar :type="message.role" /> -->
    <div class="message-content">
      <!-- <div class="message-header">
        <span class="message-name">{{ $t(`message.${message.role}`) }}</span>
      </div> -->
      <UserMessage
        v-if="message.role === 'user'"
        :id="message.id"
        :content="message.content"
      />
      <AssistantMessage
        v-else
        :id="message.id"
        :message="message.streamMessage"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent } from '@vue/composition-api'
import Avatar from '@/components/ai/Avatar.vue'
import AssistantMessage from '@/components/chat/messages/AssistantMessage.vue'
import UserMessage from '@/components/chat/messages/UserMessage.vue'

export default defineComponent({
  name: 'ChatMessage',
  components: {
    Avatar,
    AssistantMessage,
    UserMessage,
  },
  props: {
    message: {
      type: Object,
      default: () => ({
        content: '',
        id: '',
        role: '',
        timestamp: '',
        // is null when not role is user
        streamMessage: {
          status: '',
          content: '',
          reasoning_content: '',
        },
      }),
    },
  },
})
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

  }
}
</style>
