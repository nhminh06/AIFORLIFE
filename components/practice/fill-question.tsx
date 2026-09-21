"use client"

import { Lightbulb } from "lucide-react"

type Props = {
  prompt: string
  hint?: string
  showHint: boolean
  onToggleHint: () => void
  value: string
  checked: boolean
  onChange: (v: string) => void
  onSubmit: () => void
}

export function FillQuestion({ prompt, hint, showHint, onToggleHint, value, checked, onChange, onSubmit }: Props) {
  return (
    <>
      <p className="text-lg font-bold leading-relaxed text-slate-900 dark:text-white">{prompt}</p>
      {hint && !checked && (
        <button
          type="button"
          onClick={onToggleHint}
          className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/40"
        >
          <Lightbulb className="h-3.5 w-3.5" />
          {showHint ? "Ẩn gợi ý" : "Hiện gợi ý"}
        </button>
      )}
      {hint && showHint && (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Gợi ý nghĩa: <span className="font-medium text-slate-700 dark:text-slate-300">{hint}</span>
        </p>
      )}
      <input
        value={value}
        disabled={checked}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit()
        }}
        placeholder="Gõ đáp án của bạn…"
        className="mt-4 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
      />
      {!checked && (
        <button
          type="button"
          onClick={onSubmit}
          disabled={!value.trim()}
          className="mt-3 w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-40"
        >
          Kiểm tra
        </button>
      )}
    </>
  )
}
