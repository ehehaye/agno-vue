import Vue from 'vue'
import VueI18n from 'vue-i18n'
import zh from './zh'
import en from './en'
import { readStorage, writeStorage } from '@/utils/storage'

Vue.use(VueI18n)

const DEFAULT_LOCALE = 'en'
const initialLocale = readStorage('locale', DEFAULT_LOCALE)

export function applyLocale(locale) {
  writeStorage('locale', locale)
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
}

const i18n = new VueI18n({
  locale: initialLocale,
  fallbackLocale: DEFAULT_LOCALE,
  messages: {
    zh,
    en,
  },
})

applyLocale(initialLocale)

export default i18n
