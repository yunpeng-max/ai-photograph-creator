import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import i18n from '../i18n'

type Locale = 'zh' | 'en'

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(
    (typeof localStorage !== 'undefined' ? localStorage.getItem('locale') : 'zh') as Locale || 'zh'
  )

  useEffect(() => {
    i18n.changeLanguage(locale)
    localStorage.setItem('locale', locale)
  }, [locale])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale(): LocaleContextType {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}
