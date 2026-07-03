<template>
  <div
    class="message-bubble hover-lift"
    :class="[`message-bubble-${bubbleType}`]"
  >
    <slot />
  </div>
</template>

<script>
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  name: 'MessageBubble',
  props: {
    type: {
      type: String,
      default: 'user',
      validator: (value) => ['user', 'ai'].includes(value),
    },
  },
  computed: {
    bubbleType() {
      return this.type === 'user' ? 'user' : 'ai';
    },
  },
});
</script>

<style lang="less" scoped>
.message-bubble {
  line-height: 1.6;
  padding: @spacing-md;
  box-shadow: @shadow-sm;
  transition:
    box-shadow @transition-base,
    transform @transition-base;

  &:hover {
    box-shadow: @shadow-md;
  }

  &.message-bubble-user {
    background: linear-gradient(135deg, @primary-hover 0%, @primary-color 100%);
    color: white;
    border-radius: @border-radius-lg @border-radius-lg @border-radius-sm @border-radius-lg;
    box-shadow: 0 12px 26px rgba(63, 126, 232, 0.24);
  }

  &.message-bubble-ai {
    background: fade(@surface-color, 92%);
    border: 1px solid fade(@border-color, 62%);
    border-radius: @border-radius-lg @border-radius-lg @border-radius-lg @border-radius-sm;
  }

  ::v-deep .user-message {
    word-break: break-word;
  }
}
</style>
