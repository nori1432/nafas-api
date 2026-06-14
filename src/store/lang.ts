import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Lang = 'en' | 'ar'

interface LangStore {
  lang: Lang
  toggle: () => void
  dir: 'ltr' | 'rtl'
}

export const useLang = create<LangStore>()(
  persist(
    (set, get) => ({
      lang: 'en',
      dir: 'ltr',
      toggle: () => {
        const next: Lang = get().lang === 'en' ? 'ar' : 'en'
        set({ lang: next, dir: next === 'ar' ? 'rtl' : 'ltr' })
        document.documentElement.setAttribute('dir', next === 'ar' ? 'rtl' : 'ltr')
        document.documentElement.setAttribute('lang', next)
      },
    }),
    {
      name: 'nafas-lang',
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.setAttribute('dir', state.lang === 'ar' ? 'rtl' : 'ltr')
          document.documentElement.setAttribute('lang', state.lang)
        }
      },
    }
  )
)

/** Returns a translation function: t(en, ar) => string based on current lang */
export function useT() {
  const lang = useLang((s) => s.lang)
  return (en: string, ar: string) => (lang === 'ar' ? ar : en)
}
