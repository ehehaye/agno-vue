<template>
  <div
    :id="`assistant-message-${message.id}`"
    class="message-assistant"
  >
    <!-- reasoning block -->
    <template v-if="message.reasoning_content">
      <ReasoningBlock :content="message.reasoning_content" />
    </template>

    <!-- tool call block -->
    <template v-if="message.tool_calls.length > 0">
      <ToolCallBlock
        v-for="toolCall in message.tool_calls"
        :key="toolCall.tool.tool_call_id"
        class="tool-call-block"
        :status="toolCall.status"
        :tool="toolCall.tool"
      />
    </template>

    <!-- member run block -->
    <template v-if="message.member_runs.length > 0">
      <MemberRunBlock
        v-for="memberRun in message.member_runs"
        :key="memberRun.run_id"
        :member-run="memberRun"
      />
    </template>

    <!-- content block -->
    <template v-if="message.content">
      <MarkdownRenderer :content="message.content" />
    </template>

    <!-- completed block -->
    <template v-if="message.status === $c.RunStatus.Completed">
      <DurationBlock :duration="message.metrics?.duration" />
    </template>

    <!-- error block -->
    <template v-if="message.status === $c.RunStatus.Error">
      <span class="mt-sm text-xs text-danger">{{ message.error || $t('chat.generationFailed') }}</span>
    </template>

    <!-- cancelled block -->
    <template v-if="message.status === $c.RunStatus.Cancelled">
      <span class="mt-sm text-xs text-ink-muted">{{ $t('chat.stopped') }}</span>
    </template>

    <!-- Streaming block -->
    <template v-if="message.status === $c.RunStatus.Streaming">
      <StreamingIndicator :style="{ width: '60px' }" />
    </template>
  </div>
</template>

<script>
import { defineComponent } from '@vue/composition-api'
import { StreamingIndicator } from '@/components/common'
import { MarkdownRenderer } from '@/components/md'
import { CUSTOM_COMPONENTS, CUSTOM_TAGS } from '@/components/chat/hydration'
import {
  DurationBlock,
  MemberRunBlock,
  ReasoningBlock,
  ToolCallBlock,
} from '@/components/chat/messages/blocks'

export default defineComponent({
  name: 'AssistantMessage',
  components: {
    MarkdownRenderer,
    StreamingIndicator,
    ReasoningBlock,
    DurationBlock,
    MemberRunBlock,
    ToolCallBlock,
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
        member_runs: [],
      }),
    },
  },
})
</script>

<style lang="less" scoped>
</style>
