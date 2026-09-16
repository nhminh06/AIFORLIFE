"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

export type ThemeChoice = "light" | "dark" | "system"
export type ResolvedTheme = "light" | "dark"

const STORAGE_KEY = "learnenglish-theme"

function resolveChoice(choice: ThemeChoice): ResolvedTheme {
  if (choice !== "system") return choice
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyResolved(resolved: ResolvedTheme) {
  document.documentElement.classList.toggle("dark", resolved === "dark")
}

/** Script chặn chớp nền (FOUC), chèn vào <head> qua dangerouslySetInnerHTML. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.classList.add('dark');}}catch(e){}})();`

type ThemeContextValue = {
  theme: ThemeChoice
  resolved: ResolvedTheme
  setTheme: (t: ThemeChoice) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  resolved: "light",
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeChoice>("system")
  const [resolved, setResolved] = useState<ResolvedTheme>("light")

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeChoice | null
      const initial: ThemeChoice =
        saved === "light" || saved === "dark" || saved === "system" ? saved : "system"
      setThemeState(initial)
      const r = resolveChoice(initial)
      setResolved(r)
      applyResolved(r)
    } catch {
      /* bỏ qua */
    }
  }, [])

  useEffect(() => {
    if (theme !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => {
      const r: ResolvedTheme = mq.matches ? "dark" : "light"
      setResolved(r)
      applyResolved(r)
    }
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [theme])

  const setTheme = useCallback((t: ThemeChoice) => {
    setThemeState(t)
    const r = resolveChoice(t)
    setResolved(r)
    applyResolved(r)
    try {
      localStorage.setItem(STORAGE_KEY, t)
    } catch {
      /* bỏ qua */
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
