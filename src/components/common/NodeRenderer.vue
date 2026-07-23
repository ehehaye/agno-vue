<template>
  <component
    :is="node.tagName"
    v-bind="node.attribs"
  >
    <template
      v-for="(child, index) in node.children"
    >
      <template v-if="child.type === 'text'">{{ child.data }}</template>
      <NodeRenderer
        v-else
        :key="index"
        :node="child"
      />
    </template>
  </component>
</template>

<script>
import { defineComponent } from '@vue/composition-api'

export default defineComponent({
  name: 'NodeRenderer',
  props: {
    node: {
      type: Object,
      required: true,
    },
  },
})
</script>

<style lang="less">

</style>
