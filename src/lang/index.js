import Vue from 'vue';
import VueI18n from 'vue-i18n';
import zh from './zh';
import en from './en';

Vue.use(VueI18n);

const i18n = new VueI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    zh,
    en
  }
});

export default i18n;