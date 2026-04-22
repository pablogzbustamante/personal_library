import { create } from 'zustand'

interface ThemeState {
  dark: boolean
  setDark: (dark: boolean) => void
  toggleDark: () => void
}

const STORAGE_KEY = 'folio_dark'

const getStoredDark = () => localStorage.getItem(STORAGE_KEY) === 'true'

const applyTheme = (dark: boolean) => {
  document.documentElement.classList.toggle('dark', dark)
}

const initialDark = getStoredDark()
applyTheme(initialDark)

export const useThemeStore = create<ThemeState>((set) => ({
  dark: initialDark,
  setDark: (dark) => {
    localStorage.setItem(STORAGE_KEY, String(dark))
    applyTheme(dark)
    set({ dark })
  },
  toggleDark: () =>
    set((s) => {
      const next = !s.dark
      localStorage.setItem(STORAGE_KEY, String(next))
      applyTheme(next)
      return { dark: next }
    }),
}))
