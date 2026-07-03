<template>
  <div class="chat-input-area">
    <textarea
      ref="textareaRef"
      :value="value"
      rows="2"
      :style="{ resize: 'none' }"
      :placeholder="$t('chat.placeholder', { key: isMac ? 'Command + Enter' : 'Alt + Enter' })"
      @input="handleInput"
      @keydown="handleKeydown"
    />
    <div class="input-actions">
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
      <div class="indicator-slot">
        <StreamingIndicator v-show="isStreaming" />
      </div>
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
  align-items: stretch;
  gap: @spacing-md;
  padding: @spacing-md;
  border: 1px solid fade(@border-color, 72%);
  border-radius: @border-radius-xl;
  background: fade(@surface-color, 88%);
  box-shadow: @shadow-md;
  backdrop-filter: blur(18px);
  transition:
    border-color @transition-fast,
    box-shadow @transition-base,
    transform @transition-base;

  &:focus-within {
    border-color: fade(@primary-color, 58%);
    box-shadow: @focus-shadow, @shadow-lg;
    transform: translateY(-2px);
  }

  textarea {
    flex: 1;
    border-color: transparent;
    background:
      linear-gradient(180deg, fade(@surface-muted, 72%), fade(@surface-color, 92%));

    &:focus {
      border-color: fade(@primary-color, 48%);
    }
  }

  .input-actions {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    gap: @spacing-sm;
    flex-shrink: 0;

    button {
      min-width: 86px;
      border-radius: 999px;
      font-weight: 600;
    }

    .indicator-slot {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 27px;
    }
  }
}
</style>
