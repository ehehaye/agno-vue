<template>
  <div class="workflow-steps">
    <div class="workflow-steps-title">{{ $t('workflow.steps') }}</div>
    <WorkflowStepBlock
      v-for="step in steps"
      :key="step.id"
      :step="step"
    />
  </div>
</template>

<script setup>
import WorkflowStepBlock from '@/components/chat/messages/blocks/WorkflowStepBlock.vue'

defineProps({
  steps: {
    type: Array,
    default: () => [],
  },
})
</script>

<style lang="less" scoped>
.workflow-steps {
  display: flex;
  flex-direction: column;
  gap: @spacing-xs;

  .workflow-steps-title {
    font-size: 12px;
    font-weight: 600;
    color: @text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
}
</style>
