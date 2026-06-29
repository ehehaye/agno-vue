<template>
  <span class="streaming-indicator">
    <span class="dot" />
    <span class="dot" />
    <span class="dot" />
  </span>
</template>

<script>
export default {
  name: 'StreamingIndicator',
}
</script>

<style lang="less" scoped>
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

.streaming-indicator {
  display: flex;
  gap: 4px;

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #67c23a;
    animation: bounce 1.4s infinite ease-in-out both;

    &:nth-child(1) {
      animation-delay: -0.32s;
    }

    &:nth-child(2) {
      animation-delay: -0.16s;
    }
  }
}
</style>
