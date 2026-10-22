import { createContext, useContext, useEffect, useState } from 'react'

const Ctx = createContext(null)

// English / Hindi. Copy lives in {en, hi} pairs and tx() picks the current language.
export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return new URLSearchParams(location.search).get('lang') || localStorage.getItem('raja-lang') || 'en'
    } catch {
      return 'en'
    }
  })
  useEffect(() => {
    document.documentElement.lang = lang
    try { localStorage.setItem('raja-lang', lang) } catch {}
  }, [lang])
  const tx = (o) => (typeof o === 'string' ? o : o?.[lang] ?? o?.en ?? '')
  return <Ctx.Provider value={{ lang, setLang, tx }}>{children}</Ctx.Provider>
}

export const useLang = () => useContext(Ctx)
