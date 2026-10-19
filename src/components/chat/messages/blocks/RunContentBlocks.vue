<template>
  <div class="run-content">
    <template v-if="run.reasoning_content">
      <ReasoningBlock :content="run.reasoning_content" />
    </template>

    <template v-if="toolCalls.length">
      <ToolCallBlock
        v-for="(toolCall, index) in toolCalls"
        :key="toolCall.tool.tool_call_id || index"
        :status="toolCall.status"
        :tool="toolCall.tool"
      />
    </template>

    <slot />

    <template v-if="run.content">
      <MarkdownRenderer :content="run.content" />
    </template>

    <template v-if="showUsage && run.status === $c.RunStatus.Completed">
      <RunUsageBlock :metrics="run.metrics" />
    </template>
  </div>
</template>

<script setup>
import { computed } from '@vue/composition-api'
import RunUsageBlock from '@/components/chat/messages/blocks/RunUsageBlock.vue'
import ReasoningBlock from '@/components/chat/messages/blocks/ReasoningBlock.vue'
import ToolCallBlock from '@/components/chat/messages/blocks/ToolCallBlock.vue'
import { MarkdownRenderer } from '@/components/markdown'

const props = defineProps({
  run: {
    type: Object,
    required: true,
  },
  showUsage: {
    type: Boolean,
    default: true,
  },
})

const toolCalls = computed(() => props.run.tool_calls || [])
</script>

<style lang="less" scoped>
.run-content {
  display: contents;
}
</style>
