import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zh from './zh.json'
import en from './en.json'

const storedLocale = typeof localStorage !== 'undefined'
  ? localStorage.getItem('locale')
  : 'zh'
const initialLocale = storedLocale || 'zh'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      zh: { translation: zh.translation },
      en: { translation: en.translation },
    },
    lng: initialLocale,
    fallbackLng: 'zh',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
