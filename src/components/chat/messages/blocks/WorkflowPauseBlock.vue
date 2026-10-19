<template>
  <div class="workflow-pause">
    <div class="workflow-pause-title">{{ $t('workflow.paused') }}</div>
    <div
      v-if="requirement.step_name"
      class="workflow-pause-step"
    >
      {{ requirement.step_name }}
    </div>
    <p class="workflow-pause-message">
      {{ message }}
    </p>
    <p
      v-if="!supportsConfirmation"
      class="workflow-pause-note"
    >
      {{ $t('workflow.unsupportedPause') }}
    </p>
    <template v-else>
      <textarea
        v-model="feedback"
        class="workflow-pause-feedback"
        :placeholder="$t('workflow.feedbackPlaceholder')"
        rows="3"
      />
      <div class="workflow-pause-actions">
        <button
          type="button"
          class="workflow-pause-btn workflow-pause-btn--approve"
          :disabled="isStreaming"
          @click="approve"
        >
          {{ $t('workflow.approve') }}
        </button>
        <button
          type="button"
          class="workflow-pause-btn workflow-pause-btn--reject"
          :disabled="isStreaming"
          @click="reject"
        >
          {{ $t(rejectLabelKey) }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from '@vue/composition-api'
import { useAgentRun } from '@/hooks/agno/useAgentRun'

const props = defineProps({
  run: {
    type: Object,
    required: true,
  },
})

const { isStreaming, continueRun } = useAgentRun()

const feedback = ref('')
const requirement = computed(() => props.run.pausedRequirement || {})
const supportsConfirmation = computed(
  () => requirement.value.requires_confirmation || requirement.value.requires_output_review
)
const message = computed(
  () =>
    requirement.value.confirmation_message ||
    requirement.value.output_review_message ||
    requirement.value.user_input_message ||
    ''
)
const rejectLabelKey = computed(() => {
  if (requirement.value.on_reject === 'retry') {
    return 'workflow.rejectRetry'
  }
  if (requirement.value.on_reject === 'skip') {
    return 'workflow.rejectSkip'
  }
  return 'workflow.reject'
})

const approve = () => continueRun(true, props.run)
const reject = () => continueRun(false, props.run, { feedback: feedback.value })
</script>

<style lang="less" scoped>
.workflow-pause {
  padding: @spacing-md;
  border: 1px solid fade(@warning-color, 40%);
  border-radius: @border-radius-lg;
  background: fade(@warning-color, 6%);

  .workflow-pause-title {
    font-size: 13px;
    font-weight: 600;
    color: @text-color;
  }

  .workflow-pause-step {
    margin-top: @spacing-xs;
    font-size: 12px;
    color: @text-secondary;
  }

  .workflow-pause-message {
    margin: @spacing-sm 0 0;
    font-size: 14px;
    color: @text-color;
  }

  .workflow-pause-note {
    margin: @spacing-sm 0 0;
    font-size: 12px;
    color: @text-secondary;
  }

  .workflow-pause-feedback {
    box-sizing: border-box;
    width: 100%;
    margin-top: @spacing-md;
    padding: @spacing-sm @spacing-md;
    border: 1px solid @border-color;
    border-radius: @border-radius-md;
    background: @surface-color;
    color: @text-color;
    font-family: inherit;
    font-size: 13px;
    line-height: 1.5;
    resize: vertical;
    outline: none;
    transition:
      border-color @transition-fast,
      box-shadow @transition-fast;

    &:focus {
      border-color: @primary-color;
      box-shadow: @focus-shadow;
    }

    &::placeholder {
      color: @text-disabled;
    }
  }

  .workflow-pause-actions {
    display: flex;
    gap: @spacing-sm;
    margin-top: @spacing-md;
  }

  .workflow-pause-btn {
    padding: 6px 14px;
    border-radius: @border-radius-md;
    border: 1px solid @border-color;
    background: @surface-color;
    color: @text-color;
    font-size: 13px;
    cursor: pointer;
    transition:
      background-color @transition-fast,
      border-color @transition-fast,
      opacity @transition-fast;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &--approve {
      border-color: @primary-color;
      background: @primary-color;
      color: #fff;

      &:hover:not(:disabled) {
        background: @primary-active;
      }
    }

    &--reject {
      color: @error-color;
      border-color: fade(@error-color, 40%);

      &:hover:not(:disabled) {
        background: fade(@error-color, 8%);
      }
    }
  }
}
</style>
