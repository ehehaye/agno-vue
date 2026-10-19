<template>
  <Collapse class="tool-call-block">
    <template #icon>
      <WrenchIcon />
    </template>

    <template #header>
      <span class="tool-call-name">{{ tool.tool_name }}</span>
    </template>

    <template #extra>
      <span
        class="tool-call-status"
        :class="`status-${status}`"
      >{{ $t(`toolCall.status.${status}`) }}</span>
    </template>

    <!-- args block -->
    <Collapse
      v-if="argsMarkdown"
      :gap="false"
    >
      <template #header>
        <span class="tool-call-section-label">{{ $t('toolCall.arguments') }}</span>
      </template>
      <MarkdownRenderer
        class="tool-call-args"
        :content="argsMarkdown"
      />
    </Collapse>

    <!-- result block -->
    <Collapse
      v-if="resultMarkdown"
      :gap="false"
    >
      <template #header>
        <span class="tool-call-section-label">{{ $t('toolCall.result') }}</span>
      </template>
      <MarkdownRenderer
        class="tool-call-result"
        :content="resultMarkdown"
      />
    </Collapse>
  </Collapse>
</template>

<script setup>
import { computed } from '@vue/composition-api'
import { Collapse } from '@/components/ui'
import { MarkdownRenderer } from '@/components/markdown'
import { WrenchIcon } from '@/components/icons'
import { analyzeContent } from '@/utils/content'
import { $c as constants } from '@/constants'

const props = defineProps({
  status: {
    type: String,
    default: constants.ToolCallStatus.Running,
    validator: (val) => constants.ToolCallStatusList.includes(val),
  },
  tool: {
    type: Object,
    default: () => ({
      tool_name: '',
      tool_args: null,
      result: null,
    }),
  },
})

const argsMarkdown = computed(() => {
  const raw = props.tool.tool_args
  if (raw == null || raw === '') {
    return ''
  }
  const text = typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2)
  return '```json\n' + text + '\n```'
})

const resultMarkdown = computed(() => {
  const raw = props.tool.result
  if (!raw) {
    return ''
  }

  const content = String(raw)
  const info = analyzeContent(content)
  switch (info.type) {
    case 'json-object':
    case 'json-array':
      return '```json\n' + content + '\n```'
    case 'code':
      return '```' + info.language + '\n' + content + '\n```'
    default:
      return content
  }
})
</script>

<style lang="less" scoped>
.tool-call-block {
  background-color: @surface-muted;

  ::v-deep .collapse-header {
    gap: @spacing-sm;
  }

  ::v-deep .collapse-body {
    gap: @spacing-sm;
  }
}

.tool-call-name {
  font-size: 13px;
  font-weight: 500;
  color: @text-color;
}

.tool-call-status {
  .status-badge();

  &.status-error {
    background-color: fade(@error-color, 12%);
    color: @error-color;
  }

  &.status-completed {
    background-color: fade(@success-color, 12%);
    color: @success-color;
  }
}

.tool-call-section-label {
  font-size: 12px;
  font-weight: 500;
  color: @text-secondary;
}

.tool-call-args,
.tool-call-result {
  padding: @spacing-sm;
  border-radius: @border-radius-sm;
  font-size: 14px;
  line-height: 1.5;
  overflow-x: auto;
}
</style>
