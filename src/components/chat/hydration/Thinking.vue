<template>
  <div class="thinking">[Hydration Component Example] Thinking</div>
</template>

<script>
import { defineComponent } from '@vue/composition-api'

export default defineComponent({
  name: 'Thinking',
  created() {
    console.log('thinking created')
  },
  beforeDestroy() {
    console.log('thinking beforeDestroy')
  },
})
</script>

<style lang="less" scoped>
.thinking {
  color: #dd5862;
  pointer-events: none;
  user-select: none;
}
</style>
