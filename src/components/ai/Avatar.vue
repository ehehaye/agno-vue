<template>
  <div class="message-avatar">
    <div
      class="avatar"
      :class="`${type}-avatar`"
    >
      <span>{{ type === 'user' ? 'User' : 'AI' }}</span>
    </div>
  </div>
</template>

<script>
import { defineComponent } from '@vue/composition-api'

export default defineComponent({
  name: 'Avatar',
  props: {
    type: {
      type: String,
      default: 'user',
      validator: (value) => ['user', 'assistant'].includes(value),
    },
  },
})
</script>

<style lang="less" scoped>
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

  .assistant-avatar {
    background: linear-gradient(135deg, fade(@primary-color, 70%), @primary-active);
    color: white;
  }
}
</style>
