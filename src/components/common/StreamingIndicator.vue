<template>
  <span class="streaming-indicator">
    <span class="dot" />
    <span class="dot" />
    <span class="dot" />
  </span>
</template>

<script>
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  name: 'StreamingIndicator',
});
</script>

<style lang="less" scoped>
.streaming-indicator {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 10px;
  border-radius: 999px;
  background: fade(@success-color, 10%);
  border: 1px solid fade(@success-color, 18%);

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: linear-gradient(135deg, #8add66, @success-color);
    box-shadow: 0 0 10px fade(@success-color, 45%);
    animation: bounce 1.2s infinite ease-in-out both;

    &:nth-child(1) {
      animation-delay: -0.32s;
    }

    &:nth-child(2) {
      animation-delay: -0.16s;
    }
  }
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}
</style>
