<template>
  <div class="run-usage">
    <span class="run-usage__status">
      {{ durationText ? $t('usage.completedIn', { duration: durationText }) : $t('usage.completed') }}
    </span>
    <span
      v-for="(item, index) in usageItems"
      :key="item.key"
      class="run-usage__item"
    >
      <span
        v-if="index > 0"
        class="run-usage__separator"
        aria-hidden="true"
      >·</span>
      {{ $t(`usage.${item.key}`, { tokens: item.value }) }}
    </span>
  </div>
</template>

<script setup>
import { computed } from '@vue/composition-api'
import { formatDuration, formatTokenCount } from '@/utils/format'
import { hasUsage } from '@/utils/usage'

const props = defineProps({
  metrics: {
    type: Object,
    default: null,
  },
})

const durationText = computed(() => formatDuration(props.metrics?.duration))

const usageItems = computed(() => {
  const metrics = props.metrics
  if (!hasUsage(metrics)) {
    return []
  }
  return [
    ['input', metrics.input_tokens],
    ['output', metrics.output_tokens],
    ['total', metrics.total_tokens],
    ['cached', metrics.cache_read_tokens],
  ]
    .filter(([, value]) => typeof value === 'number' && value > 0)
    .map(([key, value]) => ({ key, value: formatTokenCount(value) }))
})
</script>

<style lang="less" scoped>
.run-usage {
  .status-badge();

  display: inline-flex;
  flex-wrap: wrap;
  gap: @spacing-xs;
  margin-top: @spacing-sm;
  padding: @spacing-xs @spacing-sm;
  border: 1px solid @border-light;
}

.run-usage__status {
  font-weight: 600;
}

.run-usage__item {
  display: inline-flex;
  gap: @spacing-xs;
  font-weight: 500;
  color: @text-secondary;
}

.run-usage__separator {
  color: @border-color;
}
</style>
