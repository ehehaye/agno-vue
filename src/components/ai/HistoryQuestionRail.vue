<template>
  <nav
    v-if="messages.length > 1"
    class="history-question-rail"
    aria-label="History questions"
  >
    <button
      v-for="(question, idx) in messages"
      v-show="idx <= 5"
      :key="question.id"
      type="button"
      class="question-entry"
      :title="question.title"
    >
      <span class="question-line" />
      <span class="question-text">{{ question.content }}</span>
    </button>
  </nav>
</template>

<script>
import { defineComponent } from '@vue/composition-api'

export default defineComponent({
  name: 'HistoryQuestionRail',
  props: {
    messages: {
      type: Array,
      default: () => [],
    },
  },
})
</script>

<style lang="less" scoped>
.history-question-rail {
  position: fixed;
  top: 0;
  right: 40px;
  bottom: 0;
  width: 30px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: @spacing-sm;
  padding: @spacing-sm 0 @spacing-sm @spacing-sm;
  overflow: visible;
}

.question-entry {
  width: 22px;
  height: 26px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: @text-secondary;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: @spacing-sm;
  overflow: hidden;
  white-space: nowrap;
  transition:
    width @transition-base,
    padding @transition-base,
    border-color @transition-fast,
    background-color @transition-fast;

  &:hover,
  &:focus-visible {
    width: 220px;
    padding: 0 @spacing-sm 0 @spacing-md;
    border-color: @primary-color;
    background: @surface-color;
    outline: none;

    .question-line {
      background: @primary-color;
    }

    .question-text {
      max-width: 170px;
      opacity: 1;
    }
  }
}

.question-line {
  width: 18px;
  height: 3px;
  flex-shrink: 0;
  border-radius: 999px;
  background: fade(@primary-color, 72%);
  transition: background-color @transition-fast;
}

.question-text {
  max-width: 0;
  min-width: 0;
  overflow: hidden;
  color: @text-color;
  font-size: 13px;
  line-height: 1;
  text-align: left;
  text-overflow: ellipsis;
  opacity: 0;
  transition:
    max-width @transition-base,
    opacity @transition-fast;
}
</style>
