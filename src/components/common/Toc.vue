<template>
  <div class="js-toc" />
</template>

<script>
import { defineComponent, onBeforeUnmount, onMounted, watch } from '@vue/composition-api'
import tocbot from 'tocbot'

// Singleton
export default defineComponent({
  name: 'Toc',
  props: {
    dependencies: {
      type: [Array, Object, String, Number],
      default: () => [],
    },
    options: {
      type: Object,
      default: () => {},
    }
  },
  setup(props) {
    watch(
      () => props.dependencies,
      () => {
        tocbot.refresh()
      }
    )

    onMounted(() => {
      tocbot.init({
        ...props.options,
        tocSelector: '.js-toc',
        linkClass: 'toc-link',
        activeLinkClass: 'is-active-link',
        activeListItemClass: 'is-active-li',
        scrollSmooth: true,
        hasInnerContainers: true,
      })
    })

    onBeforeUnmount(() => {
      tocbot.destroy()
    })
  },
})
</script>

<style lang="less">
.toc-link.is-active-link {
  color: red;
}
</style>
<style lang="less" scoped>
.js-toc {
  position: fixed;
  top: 0;
  right: 40px;
  bottom: 0;
  width: 30px;
}
</style>
