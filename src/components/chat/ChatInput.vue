<template>
  <div class="chat-input-area">
    <textarea
      ref="textareaRef"
      :value="value"
      rows="3"
      :placeholder="$t('chat.placeholder', { key: isMac ? 'Command + Enter' : 'Alt + Enter' })"
      @input="handleInput"
      @keydown="handleKeydown"
    />
    <div class="input-wrapper">
      <div>
        <StreamingIndicator v-show="isStreaming" />
      </div>
      <button
        v-if="isStreaming"
        @click="$emit('cancel')"
      >
        {{ $t('chat.stop') }}
      </button>
      <button
        v-else
        :disabled="!value.trim()"
        @click="$emit('send')"
      >
        {{ $t('chat.send') }}
      </button>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from '@vue/composition-api';
import StreamingIndicator from '@/components/common/StreamingIndicator.vue';
import { useAgnoChat } from '@/hooks/useAgnoChat';
import { isMac } from '@/utils/ua';

export default defineComponent({
  name: 'ChatInput',
  components: {
    StreamingIndicator,
  },
  props: {
    value: {
      type: String,
      default: '',
    },
  },
  setup(props, { emit }) {
    const { isStreaming } = useAgnoChat();
    const textareaRef = ref(null);

    const focus = () => {
      textareaRef.value?.focus?.();
    };

    const handleInput = (event) => {
      emit('input', event.target.value);
    };

    const handleKeydown = (event) => {
      if (event.key === 'Enter' && (isMac ? event.metaKey : event.altKey)) {
        emit('send');
      }
    };

    return {
      isMac,
      isStreaming,
      textareaRef,
      focus,
      handleInput,
      handleKeydown,
    };
  },
});
</script>

<style lang="less" scoped>
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
  }
}
</style>
