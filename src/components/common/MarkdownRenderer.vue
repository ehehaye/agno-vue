<template>
  <div class="markdown-renderer">
    <div ref="renderer" />
  </div>
</template>

<script>
import { defineComponent } from '@vue/composition-api';
import DOMPurify from 'dompurify';
import remend from "remend";
import { marked } from 'marked';
import hljs from 'highlight.js/lib/common';

marked.setOptions({
  highlight (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true,
});

export default defineComponent({
  name: 'MarkdownRenderer',
  props: {
    content: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      htmlRafId: null,
      pendingUpdate: false,
    };
  },
  watch: {
    content: {
      handler() {
        if (!this.pendingUpdate) {
          this.pendingUpdate = true;
          this.updateHtml();
        }
      },
      immediate: true,
    },
  },
  beforeDestroy() {
    if (this.htmlRafId) {
      cancelAnimationFrame(this.htmlRafId);
    }
  },
  methods: {
    getHtml() {
      const { content } = this;
      /** 
       * Avoid flickering by building self-healing markdown content used remend
       * example: "This is **bold text"
       * output: "This is **bold text**"
       */
      return content ? DOMPurify.sanitize(marked(remend(content))) : '';
    },
    updateHtml() {
      if (this.htmlRafId) {
        cancelAnimationFrame(this.htmlRafId);
      }
      this.htmlRafId = requestAnimationFrame(() => {
        this.pendingUpdate = false;
        this.htmlRafId = null;
        // Optimized for vue2
        // Avoid directly using `v-html` to prevent recursive updates lifecycle. 
        // TODO: Progressively append
        this.$refs.renderer.innerHTML = this.getHtml();
      });
    },
  },
});
</script>

<style lang="less" scoped>
.markdown-renderer {
  line-height: 1.8;
  color: @text-color;

  ::v-deep h1,
  ::v-deep h2,
  ::v-deep h3,
  ::v-deep h4,
  ::v-deep h5,
  ::v-deep h6 {
    margin-top: 16px;
    margin-bottom: 8px;
    font-weight: 600;
    line-height: 1.3;
  }

  ::v-deep h1 {
    font-size: 28px;
    border-bottom: 1px solid @border-color;
    padding-bottom: 8px;
  }

  ::v-deep h2 {
    font-size: 24px;
  }

  ::v-deep h3 {
    font-size: 20px;
  }

  ::v-deep p {
    margin: 12px 0;
  }

  ::v-deep ul,
  ::v-deep ol {
    padding-left: 24px;
    margin: 12px 0;
  }

  ::v-deep li {
    margin: 4px 0;
  }

  ::v-deep code {
    background-color: @code-bg;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
  }

  ::v-deep pre {
    background-color: @code-bg;
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 16px 0;

    code {
      background: none;
      padding: 0;
      font-size: 14px;
      line-height: 1.5;
    }
  }

  ::v-deep blockquote {
    border-left: 4px solid @primary-color;
    padding-left: 16px;
    margin: 16px 0;
    color: lighten(@text-color, 20%);
  }

  ::v-deep table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;

    th,
    td {
      border: 1px solid @border-color;
      padding: 8px 12px;
      text-align: left;
    }

    th {
      background-color: #f5f7fa;
      font-weight: 600;
    }
  }

  ::v-deep a {
    color: @primary-color;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  ::v-deep img {
    max-width: 100%;
    height: auto;
  }

  ::v-deep hr {
    border: none;
    border-top: 1px solid @border-color;
    margin: 24px 0;
  }
}
</style>
