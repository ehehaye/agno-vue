<template>
  <div
    :id="`user-message-${message.id}`"
    class="user-message"
    v-text="message.content"
  />
</template>

<script>
import { defineComponent } from '@vue/composition-api'

export default defineComponent({
  name: 'UserMessage',
  props: {
    message: {
      type: Object,
      default: () => ({
        id: '',
        content: '',
      }),
    },
  }
})
</script>

<style lang="less" scoped>
.user-message {
  color: #0f1115;
  background: #edf3fe;
  box-sizing: border-box;
  white-space: pre-wrap;
  word-break: break-word;
  border-radius: 22px;
  max-width: calc(100% - 88px);
  padding: 10px 16px;
  font-size: 16px;
  line-height: 24px;
  transition: background .3s;
}
</style>
