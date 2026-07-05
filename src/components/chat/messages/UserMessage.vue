<template>
  <div v-text="content" />
</template>

<script>
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  name: 'UserMessage',
  props: {
    content: {
      type: String,
      default: '',
    },
  }
})
</script>

<style lang="less">

</style>
