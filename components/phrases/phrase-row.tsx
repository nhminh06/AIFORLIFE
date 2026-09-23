"use client"

import { useState } from "react"
import { Check, Mic, Volume2 } from "lucide-react"

import { speak } from "@/lib/speak"
import { cn } from "@/lib/utils"

type PhraseRowProps = {
  en: string
  vi: string
  /**
   * Trạng thái "đã học".
   * Trang gọi truyền vào để đồng bộ thanh tiến độ;
   * nếu không truyền thì component tự quản lý như trước.
   */
  learned?: boolean
  onLearnedChange?: (learned: boolean) => void
}

export function PhraseRow({ en, vi, learned: learnedProp, onLearnedChange }: PhraseRowProps) {
  const [practicing, setPracticing] = useState(false)
  const [learnedLocal, setLearnedLocal] = useState(false)

  const learned = learnedProp ?? learnedLocal

  const toggleLearned = () => {
    const next = !learned
    if (onLearnedChange) onLearnedChange(next)
    else setLearnedLocal(next)
  }

  return (
    <li
      className={cn(
        "grid gap-3 rounded-2xl border bg-white p-4 shadow-sm shadow-slate-200/50 md:grid-cols-2 md:gap-4",
        learned ? "border-green-300 bg-green-50/40 dark:border-green-800" : "border-slate-200"
      )}
    >
      <div className="rounded-xl bg-green-50/70 p-3">
        <p className="text-sm font-bold leading-relaxed text-slate-900">{en}</p>
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => speak(en)}
            aria-label={`Phát âm câu ${en}`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-green-700 shadow-sm transition-colors hover:bg-green-600 hover:text-white"
          >
            <Volume2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setPracticing((v) => !v)
              speak(en)
            }}
            aria-pressed={practicing}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              practicing
                ? "bg-green-600 text-white shadow-sm"
                : "bg-white text-green-700 shadow-sm hover:bg-green-100"
            )}
          >
            <Mic className="h-3.5 w-3.5" />
            {practicing ? "Đang luyện nói…" : "Luyện nói theo"}
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-3">
        <p className="min-w-0 flex-1 text-sm leading-relaxed text-slate-600">{vi}</p>
        <button
          type="button"
          onClick={toggleLearned}
          aria-label={learned ? "Bỏ đánh dấu đã học" : "Đánh dấu đã học câu này"}
          aria-pressed={learned}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            learned
              ? "bg-green-600 text-white shadow-sm shadow-green-600/25"
              : "bg-white text-slate-600 shadow-sm hover:bg-green-100 hover:text-green-700"
          )}
        >
          <Check className="h-3.5 w-3.5" />
          {learned ? "Đã học" : "Đánh dấu đã học"}
        </button>
      </div>
    </li>
  )
}
