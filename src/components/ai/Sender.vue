<template>
  <div class="chat-input-area">
    <textarea
      ref="textareaRef"
      v-model="value"
      rows="2"
      :style="{ resize: 'none' }"
      :placeholder="$t('chat.placeholder', { key: isMac ? 'Command + Enter' : 'Alt + Enter' })"
      @keydown="handleKeydown"
    />
    <div class="input-actions">
      <button
        v-if="streaming"
        @click="$emit('cancel')"
      >
        {{ $t('chat.stop') }}
      </button>
      <button
        v-else
        :disabled="!value.trim()"
        @click="send"
      >
        {{ $t('chat.send') }}
      </button>
      <div class="indicator-slot">
        <StreamingIndicator v-show="streaming" />
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from '@vue/composition-api';
import StreamingIndicator from '@/components/common/StreamingIndicator.vue';
import { isMac } from '@/utils/ua';

export default defineComponent({
  name: 'ChatInput',
  components: {
    StreamingIndicator,
  },
  props: {
    streaming: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const textareaRef = ref(null);
    const value = ref('')

    // TODO: caller
    const focus = () => {
      textareaRef.value?.focus?.();
    };

    const send = () => {
      const text = value.value
      emit('send', text);
      value.value = '';
    };

    const handleKeydown = (event) => {
      if (event.key === 'Enter' && (isMac ? event.metaKey : event.altKey)) {
        send();
      }
    };

    onMounted(() => {
      focus();
    });

    return {
      value,
      isMac,
      textareaRef,
      focus,
      handleKeydown,
      send,
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
