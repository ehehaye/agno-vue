import Vue from 'vue';
import ElementUI from 'element-ui';
import locale from 'element-ui/lib/locale/lang/en';
import 'element-ui/lib/theme-chalk/index.css';
import App from '@/App.vue';
import './assets/styles/main.less';

Vue.use(ElementUI, {
  locale,
});

new Vue({
  render: (h) => h(App),
}).$mount('#app');