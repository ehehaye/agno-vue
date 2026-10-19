<template>
  <div class="markdown-renderer">
    <NodeRenderer
      v-for="(node, index) in astTree"
      :key="index"
      :node="node"
    />
  </div>
</template>

<script>
import { defineComponent } from '@vue/composition-api'
import { parseDocument } from 'htmlparser2'
import { renderMarkdown } from './markdown'
import NodeRenderer from './NodeRenderer.vue'

const RENDER_INTERVAL = 50

export default defineComponent({
  name: 'MarkdownRenderer',
  components: {
    NodeRenderer,
  },
  inject: {
    CUSTOM_TAGS: {
      default: () => [],
    },
  },
  props: {
    content: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      updateTimer: null,
      lastRenderAt: 0,
      lastHtml: '',
      astTree: [],
    }
  },
  watch: {
    content: {
      handler() {
        this.scheduleUpdate()
      },
      immediate: true,
    },
  },
  beforeDestroy() {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer)
      this.updateTimer = null
    }
  },
  methods: {
    scheduleUpdate() {
      if (this.updateTimer) {
        return
      }
      const elapsed = performance.now() - this.lastRenderAt
      this.updateTimer = setTimeout(() => {
        this.updateTimer = null
        this.updateAstTree()
      }, Math.max(RENDER_INTERVAL - elapsed, 0))
    },
    updateAstTree() {
      this.lastRenderAt = performance.now()
      const html = renderMarkdown(this.content, this.CUSTOM_TAGS)
      if (this.lastHtml === html) {
        return
      }
      this.lastHtml = html
      // Convert HTML to vNodes so that every content change triggers Vue's diff algorithm for incremental updates only.
      // Freezing lets Vue 2 skip deep reactive observation of the parsed tree; the tree must then be replaced wholesale.
      this.astTree = Object.freeze(html ? parseDocument(html).children : [])
    },
  },
})
</script>

<style lang="less">
.markdown-renderer {
  line-height: 1.8;
  color: @text-color;

  // 还原列表样式
  ul > li {
    list-style-type: disc;
  }

  ol > li {
    list-style-type: decimal;
  }

  .md-h1,
  .md-h2,
  .md-h3,
  .md-h4,
  .md-h5,
  .md-h6 {
    margin-top: @spacing-md;
    margin-bottom: @spacing-sm;
    font-weight: 600;
    line-height: 1.3;
  }

  .md-h1 {
    font-size: 28px;
    border-bottom: 1px solid @border-color;
    padding-bottom: @spacing-sm;
  }

  .md-h2 {
    font-size: 24px;
  }

  .md-h3 {
    font-size: 20px;
  }

  .md-p {
    margin: @spacing-sm 0;
  }

  .md-list {
    padding-left: @spacing-lg;
    margin: @spacing-sm 0;
  }

  .md-li {
    margin: @spacing-xs 0;
  }

  .md-code {
    background-color: @code-bg;
    padding: 2px 6px;
    border-radius: @border-radius-sm;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
    line-break: anywhere;
  }

  .md-code-wrapper {
    background-color: @code-bg;
    border-radius: @border-radius-md;
    overflow: hidden;
    margin: @spacing-xs 0;

    .md-code-lang {
      text-align: left;
      font-size: 12px;
      color: @text-secondary;
      padding: 4px @spacing-sm;
      border-bottom: 1px solid @border-color;
    }

    .md-code-scroll {
      display: flex;
      overflow-x: hidden;
    }

    .md-code-lines {
      padding: @spacing-xs @spacing-sm;
      border-right: 1px solid @border-color;
      background-color: @surface-muted;
      user-select: none;
      min-width: 40px;
      text-align: right;

      span {
        display: block;
        font-size: 14px;
        line-height: 1.5;
        color: @text-secondary;
        font-family: 'Courier New', monospace;
      }
    }

    .md-pre {
      background: none;
      padding: @spacing-xs;
      margin: 0;
      flex: 1;
      overflow-x: auto;

      .md-code {
        background: none;
        padding: 0;
        font-size: 14px;
        line-height: 1.5;
      }
    }
  }

  .md-blockquote {
    border-left: 4px solid @primary-color;
    padding-left: @spacing-md;
    margin: @spacing-md 0;
    color: @text-secondary;
  }

  .md-table {
    width: 100%;
    border-collapse: collapse;
    margin: @spacing-md 0;

    .md-th,
    .md-td {
      border: 1px solid @border-color;
      padding: @spacing-sm @spacing-md;
      text-align: left;
    }

    .md-th {
      background-color: @surface-muted;
      font-weight: 600;
    }
  }

  .md-link {
    color: @primary-color;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  .md-img {
    max-width: 100%;
    height: auto;
  }

  .md-hr {
    border: none;
    border-top: 1px solid @border-color;
    margin: @spacing-lg 0;
  }
}
</style>
