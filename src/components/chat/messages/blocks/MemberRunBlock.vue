<template>
  <Collapse v-model="isExpanded">
    <template #icon>
      <RobotIcon class="member-run-icon" />
    </template>

    <template #header>
      <span class="member-run-name">{{ memberRun.agent_name }}</span>
    </template>

    <template #extra>
      <SpinnerIcon
        v-if="memberRun.status === $c.RunStatus.Streaming"
        class="member-run-icon member-run-status-streaming"
      />
      <CheckCircleIcon
        v-else
        class="member-run-icon member-run-status-completed"
      />
    </template>

    <!-- reasoning block -->
    <template v-if="memberRun.reasoning_content">
      <ReasoningBlock :content="memberRun.reasoning_content" />
    </template>

    <!-- tool call block -->
    <template v-if="memberRun.tool_calls.length">
      <ToolCallBlock
        v-for="toolCall in memberRun.tool_calls"
        :key="toolCall.tool.tool_call_id"
        :status="toolCall.status"
        :tool="toolCall.tool"
      />
    </template>

    <!-- content block -->
    <template v-if="memberRun.content">
      <MarkdownRenderer :content="memberRun.content" />
    </template>

    <!-- duration block -->
    <div v-if="memberRun.status === $c.RunStatus.Completed">
      <DurationBlock :duration="memberRun.metrics?.duration" />
    </div>
  </Collapse>
</template>

<script>
import { defineComponent } from '@vue/composition-api'
import { Collapse } from '@/components/ui'
import { MarkdownRenderer } from '@/components/common'
import { DurationBlock, ReasoningBlock } from '@/components/chat/messages/blocks'
import { CheckCircleIcon, RobotIcon, SpinnerIcon } from '@/components/icons'

export default defineComponent({
  name: 'MemberRunBlock',
  components: {
    Collapse,
    ReasoningBlock,
    MarkdownRenderer,
    DurationBlock,
    RobotIcon,
    SpinnerIcon,
    CheckCircleIcon,
  },
  props: {
    memberRun: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      isExpanded: false,
    }
  },
})
</script>

<style lang="less" scoped>
.member-run-status-streaming {
  color: @primary-color;
  animation: member-run-spin 1s linear infinite;
}

.member-run-status-completed {
  color: @success-color;
}

@keyframes member-run-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.member-run-name {
  font-size: 14px;
  font-weight: 500;
  color: @text-color;
}
</style>
