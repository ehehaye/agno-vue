<template>
  <div class="ai-chat">
    <div
      ref="messageListRef"
      class="chat-messages"
      @scroll="handleScroll"
    >
      <div
        v-if="messages.length === 0"
        class="empty-state"
      >
        <div class="empty-icon">💬</div>
        <p>开始一段新对话吧</p>
      </div>
      <ChatMessage
        v-for="(msg, index) in messages"
        :key="index"
        :type="msg.role"
        :content="msg.content"
        :thinking="formatThinking(msg)"
        :streaming="isStreaming"
      />
    </div>

    <div class="chat-input-area">
      <el-input
        ref="inputRef"
        v-model="inputText"
        type="textarea"
        :rows="3"
        :placeholder="isMac ? '输入您的问题，按 Command + Enter 发送...' : '输入您的问题，按 Alt + Enter 发送...'"
        @keydown.native="handleKeydown"
      />
      <div class="input-wrapper">
        <p class="tip">
          <span>{{ isMac ? 'Command + Enter 发送' : 'Alt + Enter 发送' }}</span>
        </p>
        <el-button 
          v-if="isStreaming"
          type="primary"
          @click="$agno.cancelRun()"
        >
          停止
        </el-button>
        <el-button
          v-else
          type="primary"
          :disabled="!inputText.trim()"
          @click="handleSend"
        >
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import ChatMessage from './ChatMessage.vue';

export default {
  name: 'AiChat',
  components: {
    ChatMessage,
  },
  data() {
    return {
      inputText: '',
      isMac: navigator.platform.toUpperCase().indexOf('MAC') >= 0,
      isUserScrolling: false,
      scrollTolerance: 50,
    };
  },
  computed: {
    isStreaming() {
      return this.$agno.isStreaming;
    },
    messages() {
      return this.$agno.messages;
    },
  },
  watch: {
    '$agno.sessionId'() {
      this.clearInput();
      this.focusInput();
    },
    messages: {
      handler() {
        this.smartScrollToBottom();
      },
      deep: true,
    },
  },
  mounted() {
    this.focusInput();
  },
  methods: {
    clearInput() {
      this.inputText = '';
    },
    focusInput() {
      this.$nextTick(() => {
        if (this.$refs.inputRef) {
          this.$refs.inputRef.focus?.();
        }
      });
    },
    async scrollToBottom() {
      if (this.$refs.messageListRef) {
        await this.$nextTick();
        this.$refs.messageListRef.scrollTo({
          top: this.$refs.messageListRef.scrollHeight,
          behavior: 'smooth',
        })
      }
    },
    smartScrollToBottom() {
      if (!this.isUserScrolling) {
        this.scrollToBottom();
      }
    },
    handleScroll() {
      if (!this.$refs.messageListRef) return;
      const { scrollTop, scrollHeight, clientHeight } = this.$refs.messageListRef;
      const isNearBottom = scrollHeight - scrollTop - clientHeight <= this.scrollTolerance;
      this.isUserScrolling = !isNearBottom;
    },
    handleKeydown(event) {
      if (event.key === 'Enter') {
        if (this.isMac ? event.metaKey : event.altKey) {
          this.handleSend();
        }
      }
    },
    formatThinking(msg) {
      const { extra_data } = msg
      if (!extra_data) return '';
      const { reasoning_content = '', reasoning_messages = [], reasoning_steps = [] } = extra_data
      if (reasoning_content) return reasoning_content;
      if (reasoning_messages.length) return reasoning_messages.map(step => step.reasoning).join('\n');
      if (reasoning_steps.length) return reasoning_steps.map(step => step.reasoning).join('\n');
      return '';
    },
    async handleSend() {
      const text = this.inputText.trim();
      if (!text) return;
      try {
        this.clearInput();
        await this.scrollToBottom();
        await this.$agno.sendMessage(text);
      } finally {
        await this.scrollToBottom();
      }
    },
  },
};
</script>

<style lang="less" scoped>
@import '/src/assets/styles/variables.less';

.ai-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: @spacing-lg;
  gap: @spacing-md;

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;

    .chat-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: @text-color;
    }
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: @spacing-md;
    padding: @spacing-sm;

    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: lighten(@text-color, 20%);

      .empty-icon {
        font-size: 48px;
        margin-bottom: @spacing-md;
      }

      p {
        margin: 0;
        font-size: 16px;
      }
    }
  }

  .chat-input-area {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: @spacing-sm;

    .input-wrapper {
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: text;

      .tip {
        font-size: 12px;
        color: lighten(@text-color, 30%);
      }
    }
  }
}
</style>
