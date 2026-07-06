<template>
  <div
    class="chat-message"
    :class="[`message-${message.role}`]"
  >
    <div class="message-content">
      <UserMessage
        v-if="message.role === 'user'"
        :message="message"
      />
      <AssistantMessage
        v-else
        :message="message.streamMessage"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent } from '@vue/composition-api'
import AssistantMessage from '@/components/chat/messages/AssistantMessage.vue'
import UserMessage from '@/components/chat/messages/UserMessage.vue'

export default defineComponent({
  name: 'ChatMessage',
  components: {
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
  padding: @spacing-sm 0;
  border-radius: @border-radius-lg;
  content-visibility: auto;

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

  }
}
</style>
