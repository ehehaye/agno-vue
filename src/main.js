import Vue from 'vue'
import './plugins'
import App from '@/App.vue'
import './assets/styles/main.less'
import i18n from '@/lang'
import VueScrollactive from 'vue-scrollactive'
import 'vue-scrollactive/dist/vue-scrollactive.css'
import { $c } from '@/constants'

Vue.prototype.$c = $c
Vue.use(VueScrollactive)

new Vue({
  i18n,
  render: (h) => h(App),
}).$mount('#app')
