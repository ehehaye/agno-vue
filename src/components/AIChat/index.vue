<template>
  <div class="ai-chat">
    <div
      ref="messageListRef"
      class="chat-messages"
    >
      <div
        v-if="messages.length === 0"
        class="empty-state"
      >
        <div class="empty-icon">
          <i class="el-icon-chat-line-round" />
        </div>
        <p>Start a new conversation...</p>
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
        :placeholder="isMac ? 'Type your question, press the Command + Enter to send...' : 'Type your question, press the Alt + Enter to send...'"
        @keydown.native="handleKeydown"
      />
      <div class="input-wrapper">
        <p class="tip">
          <StreamingIndicator v-show="isStreaming" />
          <span v-show="!isStreaming">{{ isMac ? 'Command + Enter to send' : 'Alt + Enter to send' }}</span>
        </p>
        <el-button 
          v-if="isStreaming"
          type="primary"
          @click="$agno.cancelRun()"
        >
          Stop
        </el-button>
        <el-button
          v-else
          type="primary"
          :disabled="!inputText.trim()"
          @click="handleSend"
        >
          Send
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import StreamingIndicator from '@/components/common/StreamingIndicator.vue';
import ChatMessage from './ChatMessage.vue';
import { client } from '@/agno/client.js';

export default {
  name: 'AiChat',
  components: {
    ChatMessage,
    StreamingIndicator,
  },
  data() {
    return {
      inputText: '',
      isMac: navigator.platform.toUpperCase().indexOf('MAC') >= 0,
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
  mounted() {
    this.focusInput();
    this.$agno.$on('new-session', () => this.focusInput());
    client.on('session:loaded', this.focusInput);
    client.on('session:loaded', this.scrollToTop);
    client.on('message:update', this.scrollToBottom);
  },
  beforeDestroy() {
    client.off('session:loaded', this.focusInput);
    client.off('session:loaded', this.scrollToTop);
    client.off('message:update', this.scrollToBottom);
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
    scrollToTop() {
      this.$refs.messageListRef.scrollTop = 0
    },
    scrollToBottom() {
      // TODO: safe distance
      this.$refs.messageListRef.scrollTo({
        top: this.$refs.messageListRef.scrollHeight,
        behavior: 'smooth',
      })
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
      if (reasoning_messages.length) return reasoning_messages.map(step => step.reasoning).join('');
      if (reasoning_steps.length) return reasoning_steps.map(step => step.reasoning).join('');
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
