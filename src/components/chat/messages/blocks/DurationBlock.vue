<template>
  <div class="completion-status">
    <span>{{ $t('memberRun.runCompleted') }}{{ durationHuman ? $t('memberRun.inDuration', { duration: durationHuman }) : '' }}</span>
  </div>
</template>

<script>
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  props: {
    duration: {
      type: Number,
      default: null,
    },
  },
  computed: {
    durationHuman() {
      const duration = this.duration
      if (!duration) {
        return '';
      }
      const seconds = duration.toFixed(1);
      if (seconds < 60) {
        return `${seconds}s`;
      }
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds - minutes * 60;
      return `${minutes}m${remainingSeconds}s`;
    }
  },
});

</script>

<style lang="less" scoped>
.completion-status {
  .status-badge();

  margin-top: @spacing-sm;
  padding: @spacing-xs @spacing-sm;
  border: 1px solid @border-light;
}
</style>
