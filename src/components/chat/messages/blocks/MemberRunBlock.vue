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
        v-if="isStreaming"
        class="member-run-icon member-run-status-streaming"
      />
      <CheckCircleIcon
        v-else-if="isCompleted"
        class="member-run-icon member-run-status-completed"
      />
      <span
        v-else
        class="member-run-status"
      >{{ $t(statusLabelKey) }}</span>
    </template>

    <RunContentBlocks :run="memberRun" />
  </Collapse>
</template>

<script setup>
import { computed, ref } from '@vue/composition-api'
import { Collapse } from '@/components/ui'
import RunContentBlocks from '@/components/chat/messages/blocks/RunContentBlocks.vue'
import { CheckCircleIcon, RobotIcon, SpinnerIcon } from '@/components/icons'
import { $c as constants } from '@/constants'

const props = defineProps({
  memberRun: {
    type: Object,
    required: true,
  },
})

const isExpanded = ref(false)
const isStreaming = computed(
  () => props.memberRun.status === constants.RunStatus.Streaming
)
const isCompleted = computed(
  () => props.memberRun.status === constants.RunStatus.Completed
)

const STATUS_LABEL_KEYS = {
  error: 'memberRun.status.error',
  cancelled: 'memberRun.status.cancelled',
  paused: 'memberRun.status.paused',
}
const statusLabelKey = computed(
  () => STATUS_LABEL_KEYS[props.memberRun.status] || 'memberRun.status.error'
)
</script>

<style lang="less" scoped>
.member-run-status-streaming {
  color: @primary-color;
  animation: spin 1s linear infinite;
}

.member-run-status-completed {
  color: @success-color;
}

.member-run-status {
  .status-badge();
}

.member-run-name {
  font-size: 14px;
  font-weight: 500;
  color: @text-color;
}
</style>
