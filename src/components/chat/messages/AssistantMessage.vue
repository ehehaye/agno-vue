<template>
  <div class="message-assistant">
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
    <template v-if="message.status === 'completed'">
      <DurationBlock :duration="message.metrics?.duration" />
    </template>

    <!-- Streaming block -->
    <template v-if="message.status === 'streaming'">
      <StreamingIndicator :style="{ width: '60px' }" />
    </template>
  </div>
</template>

<script>
import { defineComponent } from '@vue/composition-api'
import { MarkdownRenderer, StreamingIndicator } from '@/components/common'
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
