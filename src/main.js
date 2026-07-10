import Vue from 'vue'
import { i18n } from './plugins'
import App from '@/App.vue'
import './assets/styles/main.less'

new Vue({
  i18n,
  render: (h) => h(App),
}).$mount('#app')
