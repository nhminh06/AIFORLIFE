"use client"

import { useEffect, useState } from "react"
import { BookText, CheckCircle2, Flame } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { PROGRESS_UPDATED_EVENT } from "@/lib/progress/local-store"
import { getStatsSummary } from "@/lib/progress-service"

const RADIUS = 52
const CIRC = 2 * Math.PI * RADIUS

export function StudyStatsCard() {
  const { user } = useAuth()
  const [stats, setStats] = useState([
    { label: "Từ đã học", value: "0", icon: BookText, color: "text-blue-600 bg-blue-50" },
    { label: "Đã hoàn thành", value: "0", icon: CheckCircle2, color: "text-green-600 bg-green-50" },
    { label: "Ngày liên tiếp", value: "0", icon: Flame, color: "text-orange-500 bg-orange-50" },
  ])
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let cancelled = false
    /* Dùng chung nguồn số liệu với trang /tien-do để 2 nơi không lệch số */
    const load = () => {
      getStatsSummary(user?.uid).then((summary) => {
        if (cancelled) return
        setProgress(summary.courseProgress)
        setStats([
          {
            label: "Từ đã học",
            value: summary.wordsLearned.toLocaleString("vi-VN"),
            icon: BookText,
            color: "text-blue-600 bg-blue-50",
          },
          {
            label: "Đã hoàn thành",
            value: summary.completedLessons.toString(),
            icon: CheckCircle2,
            color: "text-green-600 bg-green-50",
          },
          {
            label: "Ngày liên tiếp",
            value: summary.currentStreak.toString(),
            icon: Flame,
            color: "text-orange-500 bg-orange-50",
          },
        ])
      })
    }
    load()
    const refresh = () => { load() }
    window.addEventListener(PROGRESS_UPDATED_EVENT, refresh)
    window.addEventListener("afl-vocab-progress-updated", refresh)
    window.addEventListener("afl-phrase-progress-updated", refresh)
    window.addEventListener("afl-grammar-progress-updated", refresh)
    window.addEventListener("focus", refresh)
    return () => {
      cancelled = true
      window.removeEventListener(PROGRESS_UPDATED_EVENT, refresh)
      window.removeEventListener("afl-vocab-progress-updated", refresh)
      window.removeEventListener("afl-phrase-progress-updated", refresh)
      window.removeEventListener("afl-grammar-progress-updated", refresh)
      window.removeEventListener("focus", refresh)
    }
  }, [user?.uid])
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <h3 className="text-base font-bold text-slate-900 dark:text-white">Thống kê học tập</h3>
      <div className="mt-4 flex justify-center">
        <div className="relative flex h-36 w-36 items-center justify-center">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-slate-100 dark:text-slate-800"
            />
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC - (progress / 100) * CIRC}
              className="text-teal-500"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">{progress}%</span>
            <span className="text-xs text-slate-400 dark:text-slate-400">Hoàn thành</span>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="flex flex-col items-center rounded-xl bg-slate-50 p-2.5 text-center dark:bg-slate-800/60"
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.color}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="mt-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">{s.value}</span>
              <span className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">{s.label}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
