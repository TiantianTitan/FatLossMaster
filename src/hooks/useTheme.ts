import { useEffect, useState } from 'react'
import type { ThemeMode } from '../types/record'

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => (localStorage.getItem('theme') as ThemeMode) || 'system')
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => document.documentElement.dataset.theme = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme
    apply(); media.addEventListener('change', apply); return () => media.removeEventListener('change', apply)
  }, [theme])
  const setTheme = (next: ThemeMode) => { localStorage.setItem('theme', next); setThemeState(next) }
  return { theme, setTheme }
}
