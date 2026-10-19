<template>
  <div class="message-assistant">
    <RunContentBlocks :run="message">
      <template v-if="memberRuns.length > 0">
        <MemberRunBlock
          v-for="memberRun in memberRuns"
          :key="memberRun.run_id"
          :member-run="memberRun"
        />
      </template>

      <template v-if="workflowSteps.length > 0">
        <WorkflowStepsBlock :steps="workflowSteps" />
      </template>

      <template v-if="message.status === $c.RunStatus.Paused">
        <WorkflowPauseBlock :run="message" />
      </template>
    </RunContentBlocks>

    <!-- error block -->
    <template v-if="message.status === $c.RunStatus.Error">
      <span class="tw:mt-compact tw:text-xs tw:text-danger">{{ message.error || $t('chat.generationFailed') }}</span>
    </template>

    <!-- cancelled block -->
    <template v-if="message.status === $c.RunStatus.Cancelled">
      <span class="tw:mt-compact tw:text-xs tw:text-ink-muted">{{ $t('chat.stopped') }}</span>
    </template>

    <!-- Streaming block -->
    <template v-if="message.status === $c.RunStatus.Streaming">
      <StreamingIndicator :style="{ width: '60px' }" />
    </template>
  </div>
</template>

<script>
import { defineComponent } from '@vue/composition-api'
import { CUSTOM_COMPONENTS, CUSTOM_TAGS } from '@/components/chat/customComponents'
import {
  MemberRunBlock,
  RunContentBlocks,
  WorkflowPauseBlock,
  WorkflowStepsBlock,
} from '@/components/chat/messages/blocks'
import { StreamingIndicator } from '@/components/ui'

export default defineComponent({
  name: 'AssistantMessage',
  components: {
    StreamingIndicator,
    MemberRunBlock,
    RunContentBlocks,
    WorkflowPauseBlock,
    WorkflowStepsBlock,
  },
  provide() {
    return {
      CUSTOM_COMPONENTS,
      CUSTOM_TAGS,
    }
  },
  props: {
    message: {
      type: Object,
      default: () => ({
        status: '',
        content: '',
        reasoning_content: '',
        tool_calls: [],
        member_runs: [],
        steps: [],
      }),
    },
  },
  computed: {
    memberRuns() {
      return this.message.member_runs || []
    },
    workflowSteps() {
      return this.message.steps || []
    },
  },
})
</script>
