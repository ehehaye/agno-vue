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
      v-if="tool.tool_args"
      :gap="false"
    >
      <template #header>
        <span class="tool-call-section-label">{{ $t('toolCall.arguments') }}</span>
      </template>
      <MarkdownRenderer
        class="tool-call-args"
        :content="argus"
      />
    </Collapse>

    <!-- result block -->
    <Collapse
      v-if="tool.result"
      :gap="false"
    >
      <template #header>
        <span class="tool-call-section-label">{{ $t('toolCall.result') }}</span>
      </template>
      <MarkdownRenderer
        class="tool-call-result"
        :content="result"
      />
    </Collapse>
  </Collapse>
</template>

<script>
import { defineComponent } from '@vue/composition-api'
import { MarkdownRenderer } from '@/components/common'
import { Collapse } from '@/components/ui'
import { analyzeContent } from '@/utils/content-utils'
import { WrenchIcon } from '@/components/icons'
import { $c } from '@/constants'

export default defineComponent({
  name: 'ToolCallBlock',
  components: {
    Collapse,
    MarkdownRenderer,
    WrenchIcon,
  },
  mixins: [],
  props: {
    status: {
      type: String,
      default: '',
      validator: (val) => $c.ToolCallStatusList.includes(val)
    },
    tool: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {}
  },
  computed: {
    argus() {
      const str = JSON.stringify(this.tool.tool_args, null, 2)
      return '```json' + '\n' + str + '\n' + '```'
    },
    result() {
      const content = this.tool.result
      if (!content) {
        return ''
      }
      const info = analyzeContent(content)
      switch (info.type) {
      case 'json-object':
      case 'json-array':
        return '```json' + '\n' + content + '\n' + '```'
      case 'code':
        return '```' + info.language + '\n' + content + '\n' + '```'
      default:
        return content
      }
    },
  },
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
