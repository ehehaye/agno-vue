<template>
  <div
    class="user-message"
    v-text="content"
  />
</template>

<script>
import { defineComponent } from '@vue/composition-api'

export default defineComponent({
  name: 'UserMessage',
  props: {
    content: {
      type: String,
      default: '',
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
