"use client"

import { useState } from "react"
import { Mic, Volume2 } from "lucide-react"

import { speak } from "@/lib/speak"
import { cn } from "@/lib/utils"

export function PhraseRow({ en, vi }: { en: string; vi: string }) {
  const [practicing, setPracticing] = useState(false)

  return (
    <li className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 md:grid-cols-2 md:gap-4">
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
      <div className="flex items-center rounded-xl bg-slate-50 p-3">
        <p className="text-sm leading-relaxed text-slate-600">{vi}</p>
      </div>
    </li>
  )
}
