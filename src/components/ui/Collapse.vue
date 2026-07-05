<template>
  <div
    class="collapse"
    :class="{ gap }"
  >
    <button
      type="button"
      class="collapse-header"
      @click="toggle"
    >
      <div
        v-if="$slots.icon"
        class="collapse-icon"
      >
        <slot name="icon" />
      </div>
      <slot name="header" />
      <div class="collapse-extra">
        <slot name="extra" />
      </div>
      <div
        class="collapse-icon"
        :class="{ expanded }"
      >
        <ChevronRightIcon class="collapse-chevron" />
      </div>
    </button>
    <div
      v-show="expanded"
      class="collapse-body"
    >
      <slot />
    </div>
  </div>
</template>

<script>
import { defineComponent } from '@vue/composition-api';
import { ChevronRightIcon } from '@/components/icons';

export default defineComponent({
  name: 'Collapse',
  components: {
    ChevronRightIcon,
  },
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    gap: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      internalExpanded: this.value,
    };
  },
  computed: {
    expanded() {
      return this.internalExpanded;
    },
  },
  watch: {
    value(newValue) {
      this.internalExpanded = newValue;
    },
  },
  methods: {
    toggle() {
      this.internalExpanded = !this.internalExpanded;
      this.$emit('input', this.internalExpanded);
      this.$emit('toggle', this.internalExpanded);
    },
  },
});
</script>

<style lang="less" scoped>
.collapse {
  .surface-card();

  &.gap {
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    border-radius: 0.5rem;
    border-width: 1px;
    overflow: hidden;
  }
}

.collapse-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: @spacing-sm;
  padding: @spacing-sm @spacing-md;
  background: none;
  border: none;
  cursor: pointer;
  transition: background-color @transition-fast;

  &:hover {
    background-color: @surface-hover;
  }
}

.collapse-extra {
  display: flex;
  align-items: center;
  gap: @spacing-sm;
  margin-left: auto;
}

.collapse-icon {
  .icon-circle(24px, fade(@primary-color, 12%), @primary-active);
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  transition: transform @transition-base;

  &.expanded {
    transform: rotate(90deg);
  }
}

.collapse-chevron {
  width: 100%;
  height: 100%;
}

.collapse-body {
  padding: @spacing-md @spacing-md;
  display: flex;
  flex-direction: column;
  gap: @spacing-sm;
}
</style>
