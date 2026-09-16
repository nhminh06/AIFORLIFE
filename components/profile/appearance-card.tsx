"use client"

import { BellRing, Check, Moon, Sun, SunMoon } from "lucide-react"

import { useTheme, type ThemeChoice } from "@/lib/theme"
import { cn } from "@/lib/utils"

const themeOptions: { id: ThemeChoice; label: string; desc: string; icon: typeof Sun }[] = [
  { id: "light", label: "Sáng", desc: "Nền trắng quen thuộc", icon: Sun },
  { id: "dark", label: "Tối", desc: "Dịu mắt khi học đêm", icon: Moon },
  { id: "system", label: "Theo máy", desc: "Tự đổi theo hệ thống", icon: SunMoon },
]

function Toggle({
  on,
  onClick,
  label,
}: {
  on: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        on ? "bg-blue-600" : "bg-slate-200"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-all",
          on ? "left-[1.375rem]" : "left-0.5"
        )}
      >
        {on && <Check className="h-3 w-3 text-blue-600" />}
      </span>
    </button>
    )
}

export function AppearanceCard() {
  const { theme, resolved, setTheme } = useTheme()

  const badge = (choice: ThemeChoice) =>
    theme === choice ? "border-blue-500 bg-blue-50/70 shadow dark:bg-blue-900/20" : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <SunMoon className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Giao diện</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Chọn chế độ hiển thị mong muốn</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {themeOptions.map((opt) => {
          const Icon = opt.icon
          const selected = theme === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id)}
              aria-pressed={selected}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${badge(opt.id)}`}
            >
              <span
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  selected ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="flex flex-1 flex-col">
                <span className={`text-sm font-semibold ${selected ? "text-blue-700 dark:text-blue-400" : "text-slate-900 dark:text-slate-100"}`}>
                  {opt.label}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</span>
              </div>
              <Toggle on={selected} onClick={() => setTheme(opt.id)} label={`Chế độ ${opt.label}`} />
            </button>
          )
        })}
      </div>

      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-700/60 dark:bg-slate-800/40">
        <div className="flex items-start gap-2.5">
          <BellRing className="mt-0.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Chế độ <span className="font-medium text-slate-700 dark:text-slate-300">đã chọn</span>:{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {theme === "system" ? `Theo máy (${resolved})` : theme === "light" ? "Sáng" : "Tối"}
            </span>
          </p>
        </div>
      </div>
    </section>
  )
}
