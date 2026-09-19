"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CalendarDays, ChevronDown, ChevronRight, Sparkles, Volume2 } from "lucide-react"

import { speak } from "@/lib/speak"
import {
  DAILY_VOCAB_UPDATED_EVENT,
  ensureTodayVocab,
  loadDailyVocabDays,
  type DailyVocabDay,
} from "@/lib/daily-vocab"
import type { VocabWord } from "@/lib/data/vocabulary"
import { useAuth } from "@/lib/auth-context"

/** Số ngày hiển thị ban đầu, nút "Xem thêm" sẽ mở rộng */
const INITIAL_DAYS = 7

/** Nhãn ngày: "Hôm nay", "Hôm qua" hoặc ngày đầy đủ tiếng Việt */
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

function WordRow({ word }: { word: VocabWord }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-1.5">
          <span className="font-semibold text-slate-900 dark:text-slate-100">{word.en}</span>
          <span className="text-xs text-slate-400 dark:text-slate-500">({word.type})</span>
        </p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          {word.ipa} — {word.vi}
        </p>
      </div>
      <button
        type="button"
        aria-label={`Phát âm từ ${word.en}`}
        onClick={() => speak(word.en)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
      >
        <Volume2 className="h-4 w-4" />
      </button>
    </li>
  )
}

export function DailyVocabCard() {
  const { user, userProfile } = useAuth()
  const uid = user?.uid ?? null
  const [days, setDays] = useState<DailyVocabDay[]>([])
  const [ready, setReady] = useState(false)
  const [expanded, setExpanded] = useState(false)

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

  /* Vào trang cá nhân lần đầu trong ngày cũng kích hoạt AI tạo bộ từ hôm nay */
  useEffect(() => {
    ensureTodayVocab(uid, userProfile.level).catch(() => {
      /* Lỗi im lặng — người dùng có thể thử lại từ mục Từ vựng */
    })
  }, [uid, userProfile.level])

  const visibleDays = expanded ? days : days.slice(0, INITIAL_DAYS)
  const todayKeyStr = days[0]?.date

  return (
    <section
      id="daily-vocab-section"
      className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
    >
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <CalendarDays className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Từ vựng theo ngày</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              5 từ AI chọn riêng cho bạn mỗi ngày bạn vào học
            </p>
          </div>
        </div>
        <Link
          href="/ca-nhan/tu-vung-theo-ngay"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Xem tất cả
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {ready && days.length === 0 && (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center dark:border-slate-700 dark:bg-slate-800/40">
          <Sparkles className="mx-auto h-6 w-6 text-slate-400 dark:text-slate-500" />
          <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Chưa có bộ từ nào
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Vào mục Từ vựng — AI sẽ tự tạo 5 từ cho hôm nay.
          </p>
          <Link
            href="/tu-vung"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700"
          >
            Tạo bộ từ hôm nay
          </Link>
        </div>
      )}

      {ready && days.length > 0 && (
        <div className="mt-4 space-y-3">
          {visibleDays.map((day) => {
            const isToday = day.date === todayKeyStr
            return (
              <details
                key={day.date}
                open={isToday}
                className="group rounded-2xl border border-slate-200 bg-slate-50/70 open:bg-white dark:border-slate-800 dark:bg-slate-800/40 dark:open:bg-slate-900"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold capitalize ${
                        isToday
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {dayLabel(day.date)}
                    </span>
                   
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                      {day.words.length} từ
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
                  </span>
                </summary>
                <ul className="divide-y divide-slate-100 px-4 pb-2 dark:divide-slate-800">
                  {day.words.map((w) => (
                    <WordRow key={w.en.toLowerCase()} word={w} />
                  ))}
                </ul>
              </details>
            )
          })}

          {days.length > INITIAL_DAYS && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-blue-400 dark:hover:bg-slate-800"
            >
              {expanded ? "Thu gọn" : `Xem thêm ${days.length - INITIAL_DAYS} ngày trước đó`}
            </button>
          )}
        </div>
      )}
    </section>
  )
}

