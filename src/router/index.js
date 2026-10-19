import Vue from 'vue'
import VueRouter from 'vue-router'
import { useConfig } from '@/hooks/agno/useConfig'

Vue.use(VueRouter)

const ChatView = () => import('@/views/ChatView.vue')
const SetupView = () => import('@/views/SetupView.vue')

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'hash',
  routes: [
    { path: '/', name: 'chat', component: ChatView },
    { path: '/setup', name: 'setup', component: SetupView },
    { path: '*', redirect: '/' },
  ],
})

router.beforeEach(async (to, from, next) => {
  if (to.name === 'setup') {
    next()
    return
  }

  const { serverUrl, ensureConnected } = useConfig()

  if (!serverUrl.value.trim()) {
    next({ name: 'setup', query: { redirect: to.fullPath } })
    return
  }

  let connected = false
  try {
    connected = await ensureConnected()
  } catch {
    connected = false
  }

  if (!connected) {
    next({ name: 'setup', query: { redirect: to.fullPath } })
    return
  }

  next()
})

export default router
