<template>
  <div
    class="workflow-step"
    :style="{ marginLeft: `${step.depth * 16}px` }"
  >
    <Collapse
      v-model="isExpanded"
      :gap="false"
    >
      <template #icon>
        <RobotIcon class="workflow-step-icon" />
      </template>

      <template #header>
        <span class="workflow-step-name">{{ step.name }}</span>
        <span class="workflow-step-type">{{ step.type }}</span>
        <span
          v-if="step.executor_name"
          class="workflow-step-executor"
        >{{ step.executor_name }}</span>
      </template>

      <template #extra>
        <SpinnerIcon
          v-if="isRunning"
          class="workflow-step-status workflow-step-status-running"
        />
        <CheckCircleIcon
          v-else-if="isCompleted"
          class="workflow-step-status workflow-step-status-completed"
        />
        <span
          v-else
          class="workflow-step-badge"
        >{{ $t(`workflow.status.${step.status}`) }}</span>
      </template>

      <template v-if="step.reasoning_content">
        <ReasoningBlock :content="step.reasoning_content" />
      </template>

      <template v-if="step.tool_calls.length">
        <ToolCallBlock
          v-for="toolCall in step.tool_calls"
          :key="toolCall.tool.tool_call_id"
          :status="toolCall.status"
          :tool="toolCall.tool"
        />
      </template>

      <template v-if="step.content">
        <MarkdownRenderer :content="step.content" />
      </template>

      <RunUsageBlock
        v-if="hasStepUsage"
        :metrics="step.metrics"
      />
    </Collapse>
  </div>
</template>

<script setup>
import { computed, ref, watch } from '@vue/composition-api'
import { Collapse } from '@/components/ui'
import { MarkdownRenderer } from '@/components/markdown'
import RunUsageBlock from './RunUsageBlock.vue'
import { ReasoningBlock, ToolCallBlock } from '@/components/chat/messages/blocks'
import { CheckCircleIcon, RobotIcon, SpinnerIcon } from '@/components/icons'
import { $c as constants } from '@/constants'
import { hasUsage } from '@/utils/usage'

const props = defineProps({
  step: {
    type: Object,
    required: true,
  },
})

const isExpanded = ref(props.step.status === constants.StepStatus.Running)
const isRunning = computed(() => props.step.status === constants.StepStatus.Running)
const isCompleted = computed(() => props.step.status === constants.StepStatus.Completed)
const hasStepUsage = computed(() => hasUsage(props.step.metrics))

watch(
  () => props.step.status,
  (status) => {
    if (status === constants.StepStatus.Running) {
      isExpanded.value = true
    }
  }
)
</script>

<style lang="less" scoped>
.workflow-step {
  border-left: 2px solid @border-light;
  padding-left: @spacing-sm;

  .workflow-step-icon {
    width: 100%;
    height: 100%;
  }

  .workflow-step-name {
    font-size: 13px;
    font-weight: 500;
    color: @text-color;
    white-space: nowrap;
  }

  .workflow-step-type,
  .workflow-step-executor {
    font-size: 12px;
    color: @text-secondary;
    white-space: nowrap;
  }

  .workflow-step-executor {
    color: @text-disabled;
  }

  .workflow-step-status {
    width: 16px;
    height: 16px;
  }

  .workflow-step-status-running {
    color: @primary-color;
    animation: workflow-step-spin 1s linear infinite;
  }

  .workflow-step-status-completed {
    color: @success-color;
  }

  .workflow-step-badge {
    .status-badge();
  }
}

@keyframes workflow-step-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
