"use client"

import { Moon, Sun } from "lucide-react"

import { useTheme } from "@/lib/theme"

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { resolved, setTheme } = useTheme()
  const isDark = resolved === "dark"

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      title={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={
        compact
          ? "flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          : "flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:text-slate-900"
      }
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {!compact && (isDark ? "Sáng" : "Tối")}
    </button>
  )
}
