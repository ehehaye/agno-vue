<template>
  <Toc
    v-show="messages.length"
    :dependencies="messages"
    :options="options"
    class="history-question-rail"
  />
</template>

<script>
import { defineComponent } from '@vue/composition-api'
import Toc from '@/components/common/Toc.vue'

export default defineComponent({
  name: 'HistoryQuestionRail',
  components: {
    Toc,
  },
  props: {
    messages: {
      type: Array,
      default: () => [],
    },
    messageSelector: {
      type: String,
      default: '',
      required: true,
    },
    containerSelector: {
      type: String,
      default: 'body',
    },
  },
  computed: {
    options() {
      return {
        contentSelector: this.containerSelector,
        scrollContainer: this.containerSelector,
        headingSelector: this.messageSelector,
        headingsOffset: 102,
        scrollSmoothOffset: -102,
        onClick: this.onClick,
      }
    }
  },
  methods: {
    onClick(e) {
      e.preventDefault()
      const target = document.getElementById(e.target.id)
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }
    }
  }
})
</script>

<style lang="less" scoped>
.history-question-rail {
  position: fixed;
  top: 0;
  right: 40px;
  bottom: 0;
  width: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
