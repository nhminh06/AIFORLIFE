"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CalendarDays, Loader2, RotateCcw, Sparkles, Volume2 } from "lucide-react"

import { PageHeading } from "@/components/dashboard/page-heading"
import { SiteShell } from "@/components/dashboard/site-shell"
import { VocabularyLearner } from "@/components/vocab/vocabulary-learner"
import { useAuth } from "@/lib/auth-context"
import {
  DAILY_VOCAB_UPDATED_EVENT,
  loadDailyVocabDays,
  type DailyVocabDay,
} from "@/lib/daily-vocab"
import type { VocabWord } from "@/lib/data/vocabulary"
import { speak } from "@/lib/speak"

/* Xáo trộn Fisher–Yates — giống cách ôn ngẫu nhiên ở trang Ôn tập */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function dayLabel(dateKey: string): string {
  const today = new Date()
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (dateKey === fmt(today)) return "Hôm nay"
  if (dateKey === fmt(yesterday)) return "Hôm qua"

  const [y, m, d] = dateKey.split("-").map(Number)
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(y, m - 1, d))
}

export default function TuVungTheoNgayPage() {
  const { user } = useAuth()
  const uid = user?.uid ?? null

  const [days, setDays] = useState<DailyVocabDay[]>([])
  const [ready, setReady] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [reviewQueue, setReviewQueue] = useState<VocabWord[]>([])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const load = () => setDays(loadDailyVocabDays(uid))
    load()
    setReady(true)
    window.addEventListener(DAILY_VOCAB_UPDATED_EVENT, load)
    window.addEventListener("storage", load)
    return () => {
      window.removeEventListener(DAILY_VOCAB_UPDATED_EVENT, load)
      window.removeEventListener("storage", load)
    }
  }, [uid])

  /* Tất cả từ của mọi ngày đã lưu, mỗi từ chỉ xuất hiện 1 lần */
  const allWords = useMemo(() => {
    const seen = new Set<string>()
    const out: VocabWord[] = []
    for (const day of days) {
      for (const w of day.words) {
        const key = w.en.toLowerCase()
        if (!seen.has(key)) {
          seen.add(key)
          out.push(w)
        }
      }
    }
    return out
  }, [days])

  const startReview = () => {
    setReviewQueue(shuffleArray(allWords))
    setIndex(0)
    setReviewing(true)
  }

  const current = reviewQueue[index]

  if (reviewing) {
    return (
      <SiteShell>
        <button
          type="button"
          onClick={() => setReviewing(false)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Kho từ vựng theo ngày
        </button>
        <div className="mt-3">
          <PageHeading
            icon={RotateCcw}
            title="Ôn tập từ các ngày trước"
            desc={
              "Từ " +
              (allWords.length === 0 ? 0 : Math.min(index, allWords.length - 1) + 1) +
              "/" +
              allWords.length +
              " — thứ tự ngẫu nhiên"
            }
          />
        </div>
        <div className="mt-4">
          {current ? (
            <VocabularyLearner
              key={current.en.toLowerCase() + "-" + index}
              word={current}
              mode="review"
              uid={uid}
              onLearned={() => {}}
              onWordDone={() => setIndex((prev) => prev + 1)}
              onBack={() => setReviewing(false)}
            />
          ) : (
            <div className="mx-auto max-w-2xl py-10 text-center">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Ôn tập xong!</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Bạn đã ôn hết {allWords.length} từ đã lưu từ các ngày trước.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={startReview}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <RotateCcw className="h-4 w-4" />
                  Ôn lại (thứ tự mới)
                </button>
                <button
                  type="button"
                  onClick={() => setReviewing(false)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Về kho từ vựng
                </button>
              </div>
            </div>
          )}
        </div>
      </SiteShell>
    )
  }

  const totalWords = days.reduce((sum, d) => sum + d.words.length, 0)

  return (
    <SiteShell>
      <Link
        href="/ca-nhan"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Trang cá nhân
      </Link>
      <div className="mt-3">
        <PageHeading
          icon={CalendarDays}
          title="Kho từ vựng theo ngày"
          desc="Toàn bộ 5 từ AI đã chọn và lưu lại cho bạn trong các ngày học"
          bubbleClass="bg-amber-500"
        />
      </div>

      {!ready && (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {ready && days.length === 0 && (
        <div className="mx-auto mt-6 max-w-2xl rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-10 text-center dark:border-slate-700 dark:bg-slate-800/40">
          <Sparkles className="mx-auto h-8 w-8 text-slate-400 dark:text-slate-500" />
          <h2 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
            Chưa có từ nào được lưu
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Vào mục Từ vựng — AI sẽ tự tạo 5 từ cho hôm nay và lưu vào đây.
          </p>
          <Link
            href="/tu-vung"
            className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700"
          >
            Tạo bộ từ hôm nay
          </Link>
        </div>
      )}

      {ready && days.length > 0 && (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <div className="flex gap-6">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Ngày đã lưu
                </p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white">{days.length}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tổng số từ</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white">{totalWords}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Từ khác nhau
                </p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {allWords.length}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={startReview}
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700"
            >
              <RotateCcw className="h-4 w-4" />
              Ôn tập ngẫu nhiên
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {days.map((day) => (
              <section
                key={day.date}
                className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold capitalize text-slate-900 dark:text-white">
                    {dayLabel(day.date)}
                  </h3>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    {day.words.length} từ
                  </span>
                </div>
                <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
                  {day.words.map((w) => (
                    <li key={w.en.toLowerCase()} className="flex items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="flex items-baseline gap-1.5">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {w.en}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            ({w.type})
                          </span>
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
              </section>
            ))}
          </div>
        </>
      )}
    </SiteShell>
  )
}


