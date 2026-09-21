"use client"

import { Volume2 } from "lucide-react"

import { speak } from "@/lib/speak"
import { cn } from "@/lib/utils"

type Props = {
  words: string[]
  picked: number[]
  checked: boolean
  onToggle: (i: number) => void
  onClear: () => void
  onSubmit: () => void
}

export function OrderQuestion({ words, picked, checked, onToggle, onClear, onSubmit }: Props) {
  return (
    <>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        Nhấn vào các từ theo đúng thứ tự để tạo thành câu:
      </p>
      <div className="mt-3 min-h-[3.5rem] rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
        {picked.length === 0 ? "…" : picked.map((w) => words[w]).join(" ")}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {words.map((w, i) => {
          const used = picked.includes(i)
          return (
            <button
              key={`${w}-${i}`}
              type="button"
              disabled={checked || used}
              onClick={() => {
                onToggle(i)
                speak(w)
              }}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-all",
                used
                  ? "bg-slate-200 text-slate-400 line-through dark:bg-slate-700 dark:text-slate-500"
                  : "bg-teal-600 text-white hover:bg-teal-700"
              )}
            >
              {w}
            </button>
          )
        })}
      </div>
      <div className="mt-3 flex gap-2">
        {!checked && picked.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Xóa hết
          </button>
        )}
        {!checked && (
          <button
            type="button"
            onClick={onSubmit}
            disabled={picked.length === 0}
            className="flex-1 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-teal-700 disabled:opacity-40"
          >
            Kiểm tra
          </button>
        )}
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <Volume2 className="h-3.5 w-3.5" />
        Nhấn vào từ để nghe phát âm từng từ.
      </p>
    </>
  )
}
