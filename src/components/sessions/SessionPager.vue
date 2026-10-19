<template>
  <div
    v-if="totalPages > 1"
    class="session-pager"
  >
    <button
      type="button"
      class="pager-btn"
      :disabled="page <= 1 || isLoading"
      :aria-label="$t('sidebar.prev')"
      @click="$emit('change', page - 1)"
    >
      &lsaquo;
    </button>
    <span>{{ page }} / {{ totalPages }}</span>
    <button
      type="button"
      class="pager-btn"
      :disabled="page >= totalPages || isLoading"
      :aria-label="$t('sidebar.next')"
      @click="$emit('change', page + 1)"
    >
      &rsaquo;
    </button>
  </div>
</template>

<script setup>
defineProps({
  page: {
    type: Number,
    required: true,
  },
  totalPages: {
    type: Number,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['change'])
</script>

<style lang="less" scoped>
.session-pager {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: @spacing-md;
  padding-top: @spacing-sm;
  font-size: 12px;
  color: @text-secondary;

  .pager-btn {
    width: 24px;
    height: 24px;
    padding: 0;
    border: 1px solid @border-color;
    border-radius: @border-radius-sm;
    background: @surface-color;
    color: @text-secondary;
    cursor: pointer;

    &:hover:not(:disabled) {
      border-color: @primary-color;
      color: @primary-color;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
}
</style>
