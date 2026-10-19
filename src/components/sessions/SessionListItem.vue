<template>
  <div
    class="session-item"
    :class="{
      active,
      selected: selectionMode && selected,
    }"
    role="button"
    tabindex="0"
    @click="$emit('select', session.session_id)"
    @keydown.enter.prevent="$emit('select', session.session_id)"
    @keydown.space.prevent="$emit('select', session.session_id)"
  >
    <span
      v-if="selectionMode"
      class="select-indicator"
      :class="{ checked: selected }"
    />
    <div class="session-content">
      <div
        class="session-title"
        :title="session.display_name"
      >
        {{ session.display_name }}
      </div>
      <div class="session-time">{{ session.display_time }}</div>
    </div>
    <button
      v-if="!selectionMode"
      type="button"
      class="delete-btn ai-button"
      :aria-label="$t('sidebar.deleteSession')"
      @click.stop="$emit('delete', session.session_id)"
    >
      x
    </button>
  </div>
</template>

<script setup>
defineProps({
  session: {
    type: Object,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
  selectionMode: {
    type: Boolean,
    default: false,
  },
  selected: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['select', 'delete'])
</script>

<style lang="less" scoped>
.session-item {
  position: relative;
  box-sizing: border-box;
  height: calc(100% - @spacing-xs);
  margin-bottom: @spacing-xs;
  padding: 10px 12px;
  border-radius: @border-radius-md;
  cursor: pointer;
  transition:
    transform @transition-fast,
    background-color @transition-base,
    border-color @transition-fast;
  border: 1px solid @border-color;
  background-color: @surface-color;
  display: flex;
  align-items: center;
  justify-content: space-between;
  outline: none;

  &:hover {
    background-color: @surface-hover;
    border-color: @primary-color;
  }

  &.active,
  &.selected {
    background: fade(@primary-color, 8%);
    border-color: @primary-color;
  }

  &.active {
    border-left-width: 3px;
    border-left-color: @primary-color;
  }

  &:focus-visible {
    border-color: @primary-color;
    outline: 2px solid rgba(63, 126, 232, 0.2);
    outline-offset: -1px;
  }

  &:hover .delete-btn,
  &:focus-within .delete-btn {
    opacity: 1;
    transform: scale(1);
  }

  .select-indicator {
    flex-shrink: 0;
    width: 14px;
    height: 14px;
    margin-right: @spacing-sm;
    border: 1px solid @border-color;
    border-radius: 50%;
    background: @surface-color;
    transition:
      background-color @transition-fast,
      border-color @transition-fast;

    &.checked {
      border-color: @primary-color;
      background: @primary-color;
      box-shadow: inset 0 0 0 3px @surface-color;
    }
  }

  .session-content {
    flex: 1;
    overflow: hidden;
    margin-right: @spacing-sm;
  }

  .session-title {
    font-size: 14px;
    font-weight: 500;
    color: @text-color;
    margin-bottom: 4px;
    .ellipsis();
  }

  .session-time {
    font-size: 12px;
    color: lighten(@text-color, 20%);
  }

  .delete-btn {
    opacity: 0;
    transform: scale(0.86);
    transition:
      opacity @transition-fast,
      transform @transition-fast,
      background-color @transition-fast,
      color @transition-fast;
    padding: 0;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border-color: transparent;
    background: fade(@error-color, 10%);
    color: @error-color;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: @error-color;
      color: #fff;
    }

    &:active {
      transform: scale(0.94);
    }

    &:focus-visible {
      opacity: 1;
      transform: scale(1);
      outline: 2px solid fade(@error-color, 30%);
      outline-offset: 2px;
    }
  }
}
</style>
