<template>
  <Collapse
    v-model="expanded"
    class="thinking-section"
  >
    <template #header>
      <span class="thinking-label">{{ $t('chat.thinking') }}</span>
    </template>

    <div
      class="thinking-content"
      v-text="content"
    />
  </Collapse>
</template>

<script>
import { defineComponent } from '@vue/composition-api';
import { Collapse } from '@/components/ui';

export default defineComponent({
  name: 'ReasoningBlock',
  components: {
    Collapse,
  },
  props: {
    content: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      expanded: true,
    };
  },
});
</script>

<style lang="less" scoped>
.thinking-section {
  margin: @spacing-sm 0;
  border-radius: @border-radius-md;
  background-color: @surface-muted;

  ::v-deep .collapse-header {
    padding: @spacing-sm @spacing-md;
  }

  ::v-deep .collapse-body {
    padding: @spacing-sm @spacing-md;
  }
}

.thinking-label {
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  color: @text-secondary;
}

.thinking-content {
  font-size: 14px;
  line-height: 1.6;
  color: @text-secondary;
  border-top: 1px solid @border-light;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
