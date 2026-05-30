'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

const ThemeContext = createContext<{
  theme: Theme
  toggle: () => void
}>({ theme: 'dark', toggle: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pp-theme') as Theme | null
      if (saved) {
        setTheme(saved)
        document.documentElement.setAttribute('data-theme', saved)
      } else {
        const preferLight = window.matchMedia('(prefers-color-scheme: light)').matches
        const initial = preferLight ? 'light' : 'dark'
        setTheme(initial)
        document.documentElement.setAttribute('data-theme', initial)
      }
    } catch {
      // localStorage may be unavailable in some contexts
      const preferLight = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
      const initial = preferLight ? 'light' : 'dark'
      setTheme(initial)
      try { document.documentElement.setAttribute('data-theme', initial) } catch {}
    }
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    try { document.documentElement.setAttribute('data-theme', next) } catch {}
    try { localStorage.setItem('pp-theme', next) } catch {}
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
