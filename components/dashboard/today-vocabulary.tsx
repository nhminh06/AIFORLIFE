"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, RefreshCw, Sparkles, Volume2 } from "lucide-react"

import { speak } from "@/lib/speak"
import { ensureTodayVocab } from "@/lib/daily-vocab"
import type { VocabWord } from "@/lib/data/vocabulary"
import { useAuth } from "@/lib/auth-context"

type Status = "loading" | "ready" | "error"

export function TodayVocabulary() {
  const { user, userProfile } = useAuth()
  const uid = user?.uid ?? null
  const [words, setWords] = useState<VocabWord[]>([])
  const [status, setStatus] = useState<Status>("loading")

  const load = useCallback(() => {
    setStatus("loading")
    ensureTodayVocab(uid, userProfile.level)
      .then((result) => {
        setWords(result.words)
        setStatus("ready")
      })
      .catch(() => {
        /* Lỗi: không lưu ngày để lần thử lại vẫn gọi AI tạo mới */
        setStatus("error")
      })
  }, [uid, userProfile.level])

  /* Vào lần đầu trong ngày → AI tự tạo 5 từ và lưu lại cho user */
  useEffect(() => {
    load()
  }, [load])

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Từ vựng hôm nay</h3>
      </div>
      <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
        Từ mới mỗi ngày, theo đúng trình độ của bạn
      </p>

      {status === "loading" && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
          <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
            AI đang chọn 5 từ cho hôm nay...
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Chưa tạo được bộ từ hôm nay.
          </p>
          <button
            type="button"
            onClick={load}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Thử lại
          </button>
        </div>
      )}

      {status === "ready" && (
        <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
          {words.map((w) => (
            <li key={w.en.toLowerCase()} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="flex items-baseline gap-1.5">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{w.en}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">({w.type})</span>
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {w.ipa} — {w.vi}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Phát âm từ ${w.en}`}
                onClick={() => speak(w.en)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

