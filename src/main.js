import Vue from 'vue'
import { i18n } from './plugins'
import router from './router'
import App from '@/App.vue'
import './assets/styles/main.less'
import './assets/styles/tailwind.css'

new Vue({
  router,
  i18n,
  render: (h) => h(App),
}).$mount('#app')
