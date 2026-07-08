<template>
  <div class="sender-area">
    <textarea
      ref="textareaRef"
      v-model="value"
      class="ai-textarea"
      :rows="`${maxRows}`"
      :placeholder="$t('chat.placeholder')"
      @keydown="handleKeydown"
      @compositionstart="handleCompositionStart"
      @compositionend="handleCompositionEnd"
    />
    <div class="input-actions">
      <button
        v-if="isStreaming"
        class="ai-button send-button streaming"
        @click="$emit('cancel')"
      >
        <StopIcon />
      </button>
      <button
        v-else
        class="ai-button send-button"
        :disabled="disabled"
        @click="send()"
      >
        <SendIcon />
      </button>
    </div>
  </div>
</template>

<script>
import { computed, defineComponent, nextTick, ref } from '@vue/composition-api'
import { useAutoFocus } from '@/hooks/useAutoFocus'
import { isMac } from '@/utils/ua'
import { usePerfTrack } from '@/hooks/usePerfTrack'
import { SendIcon, StopIcon } from '@/components/icons'

export default defineComponent({
  name: 'Sender',
  components: {
    StopIcon,
    SendIcon,
  },
  props: {
    streaming: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    usePerfTrack()
    const textareaRef = ref(null)
    const value = ref('')
    const composing = ref(false)
    const { focus } = useAutoFocus(textareaRef)

    const rows = computed(() => value.value.split('\n').length || 1)
    const maxRows = computed(() => rows.value >= 3 ? 3 : rows.value)
    const disabled = computed(() => !props.streaming && !value.value.trim())

    const send = () => {
      if (disabled.value) {
        return
      }
      const text = value.value
      emit('send', text)
      value.value = ''
      focus()
    }

    const handleKeydown = async (event) => {
      if (composing.value || event.isComposing || event.keyCode === 229) {
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        if ((isMac ? event.metaKey : event.altKey)) {
          value.value += '\n'
          await nextTick()
          textareaRef.value.scrollTop = textareaRef.value.scrollHeight
        } else {
          send()
        }
      }
    }

    const handleCompositionStart = () => {
      composing.value = true
    }

    const handleCompositionEnd = () => {
      composing.value = false
    }

    return {
      disabled,
      value,
      isMac,
      textareaRef,
      focus,
      handleKeydown,
      handleCompositionStart,
      handleCompositionEnd,
      send,
      maxRows,
    }
  },
})
</script>

<style lang="less" scoped>
.sender-area {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: @spacing-md;
  padding: @spacing-md;
  border: 1px solid @border-color;
  border-radius: @border-radius-xl;
  background: @surface-color;
  transition:
    border-color @transition-fast;

  &:focus-within {
    border-color: @primary-color;
  }

  textarea {
    flex: 1;
    border-color: transparent;
    background: transparent;
  }

  .input-actions {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    gap: @spacing-sm;
    flex-shrink: 0;

    .send-button {
      position: relative;
      width: 40px;
      height: 40px;
      padding: 0;
      border: none;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      background: @primary-color;
      font-weight: 600;
      transition:
        background @transition-fast,
        transform @transition-fast;

      &:hover:not(:disabled) {
        background: @primary-hover;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      svg {
        width: 20px;
        height: 20px;
        fill: currentColor;
      }

      &.streaming::before {
        content: '';
        position: absolute;
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        border-radius: 50%;
        border: 2px solid fade(@primary-color, 20%);
        border-top-color: @primary-color;
        animation: spin 1s linear infinite;
      }
    }
  }
}
</style>
