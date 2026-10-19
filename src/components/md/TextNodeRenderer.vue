<script>
import {
  defineComponent,
  getCurrentInstance,
  onBeforeUnmount,
  onMounted,
  watch,
} from '@vue/composition-api'
import { createTextVNode } from '@/hooks/createTextVNode'

/**
 * Markdown 文本节点渲染器。
 *
 * 流式场景下文本几乎每帧都在变，而 Vue 对文本 vnode 的更新是整段覆写 nodeValue，
 * 会重置文本选区/光标/滚动位置。这里让 render 恒返回空文本（diff 判定未变、不碰 DOM），
 * 内容交给 syncText：尾部纯追加只 appendData，否则复用同一 Text 节点整体覆写。
 */
export default defineComponent({
  name: 'TextNodeRenderer',
  props: {
    data: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const instance = getCurrentInstance()

    // 闭包内用普通变量，避免大文本进入响应式系统
    let rafId = null
    let lastRenderedText = null

    const syncText = () => {
      const textNode = instance.proxy.$el
      if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return

      const nextText = props.data || ''
      if (nextText === lastRenderedText) return

      if (lastRenderedText != null && nextText.startsWith(lastRenderedText)) {
        // 尾部追加：仅写增量，保留文本选区/光标位置
        textNode.appendData(nextText.slice(lastRenderedText.length))
      } else {
        // 非纯追加：复用同一 Text 节点整体覆写
        textNode.data = nextText
      }
      lastRenderedText = nextText
    }

    const scheduleSyncText = () => {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        rafId = null
        syncText()
      })
    }

    // render 不依赖 props.data，需显式监听以触发 syncText
    watch(() => props.data, scheduleSyncText)

    onMounted(() => {
      syncText()
    })

    onBeforeUnmount(() => {
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    })

    // 返回空文本 vnode，让 diff 视为未变化，DOM 内容由 syncText 维护
    return () => createTextVNode('')
  },
})
</script>
