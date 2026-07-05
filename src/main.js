import Vue from 'vue';
import './plugins';
import App from '@/App.vue';
import './assets/styles/main.less';
import i18n from '@/lang';

new Vue({
  i18n,
  render: (h) => h(App),
}).$mount('#app');
