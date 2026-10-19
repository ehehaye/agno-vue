<template>
  <div
    class="chat-message"
    :class="[`message-${message.role}`]"
  >
    <div class="message-content">
      <UserMessage
        v-if="message.role === $c.Role.User"
        :message="message"
      />
      <AssistantMessage
        v-else
        :message="message.streamMessage"
      />
    </div>
  </div>
</template>

<script setup>
import AssistantMessage from '@/components/chat/messages/AssistantMessage.vue'
import UserMessage from '@/components/chat/messages/UserMessage.vue'

defineProps({
  message: {
    type: Object,
    default: () => ({
      content: '',
      id: '',
      role: '',
      timestamp: '',
      streamMessage: {
        status: '',
        content: '',
        reasoning_content: '',
        tool_calls: [],
        member_runs: [],
        steps: [],
      },
    }),
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
