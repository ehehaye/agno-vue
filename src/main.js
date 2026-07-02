import Vue from 'vue';
import VueCompositionApi from '@vue/composition-api';
import '@/interceptors';
import App from '@/App.vue';
import './assets/styles/main.less';
import i18n from '@/lang';

Vue.use(VueCompositionApi);

new Vue({
  i18n,
  render: (h) => h(App),
}).$mount('#app');
