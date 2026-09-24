"use client"

import { useEffect, useState } from "react"
import { Award, Check, Lock, Sparkles, X, ChevronRight } from "lucide-react"
import Link from "next/link"

import { badges, type Badge } from "@/lib/data/progress"
import { getEarnedBadges } from "@/lib/progress/badge-service"
import { useAuth } from "@/lib/auth-context"

const BADGE_CRITERIA_DESC: Record<string, string> = {
  "first-steps": "Học thuộc từ vựng đầu tiên trong bất kỳ chủ đề nào.",
  "week-streak": "Duy trì chuỗi học liên tục không ngắt quãng trong ít nhất 7 ngày.",
  "word-100": "Hoàn thành và thuộc tối thiểu 100 từ vựng tiếng Anh.",
  "perfect-score": "Đạt điểm số tuyệt đối 100% trong bất kỳ bài kiểm tra trắc nghiệm nào.",
  speaker: "Luyện phát âm thành công tối thiểu 20 mẫu câu giao tiếp trong thư viện.",
  "word-1000": "Cán mốc 1.000 từ vựng đã thuộc trên toàn hệ thống.",
  "grammar-master": "Nắm vững toàn bộ các chủ điểm ngữ pháp trong thư viện bài học.",
  "month-streak": "Giữ vững tinh thần thép với chuỗi học 30 ngày liên tục.",
}

export function BadgesShowcaseCard() {
  const { user } = useAuth()
  const [earnedMap, setEarnedMap] = useState<Record<string, string>>({})
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        const earned = await getEarnedBadges(user?.uid)
        if (isMounted) {
          setEarnedMap(earned)
          setLoading(false)
        }
      } catch {
        if (isMounted) setLoading(false)
      }
    }
    load()
    window.addEventListener("storage", load)
    window.addEventListener("learnenglish-progress-updated" as any, load)
    return () => {
      isMounted = false
      window.removeEventListener("storage", load)
      window.removeEventListener("learnenglish-progress-updated" as any, load)
    }
  }, [user?.uid])

  const earnedCount = badges.filter((b) => Boolean(earnedMap[b.id])).length

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <Award className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Huy hiệu & Thành tích
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Đã mở khóa {earnedCount}/{badges.length} danh hiệu danh giá
            </p>
          </div>
        </div>

        <Link
          href="/tien-do"
          className="text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Xem chi tiết tiến độ →
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {badges.map((b) => {
          const Icon = b.icon
          const isEarned = Boolean(earnedMap[b.id])
          const earnedIso = earnedMap[b.id]
          const earnedDate = earnedIso
            ? new Date(earnedIso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
            : null

          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelectedBadge(b)}
              className={`group relative flex flex-col items-center rounded-2xl border p-4 text-center transition-all hover:scale-[1.02] ${
                isEarned
                  ? "border-amber-200/80 bg-gradient-to-b from-amber-50/50 to-white shadow-sm dark:border-amber-900/30 dark:from-amber-950/20 dark:to-slate-900"
                  : "border-slate-100 bg-slate-50/50 opacity-65 hover:opacity-100 dark:border-slate-800 dark:bg-slate-800/30"
              }`}
            >
              <div
                className={`relative flex h-12 w-12 items-center justify-center rounded-2xl ${
                  isEarned ? b.bg : "bg-slate-200 dark:bg-slate-700"
                } text-white shadow-md transition-transform group-hover:scale-105`}
              >
                <Icon className="h-6 w-6" />
                {isEarned ? (
                  <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 text-amber-300 animate-pulse" />
                ) : (
                  <Lock className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-slate-500 p-0.5 text-white" />
                )}
              </div>
              <h4 className="mt-2.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                {b.name}
              </h4>
              <p className="mt-0.5 text-[11px] leading-tight text-slate-500 dark:text-slate-400">
                {b.vi}
              </p>
              {isEarned && earnedDate && (
                <span className="mt-1.5 inline-block text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  {earnedDate}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Modal chi tiết huy hiệu khi bấm vào */}
      {selectedBadge && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-3xl ${
                  Boolean(earnedMap[selectedBadge.id]) ? selectedBadge.bg : "bg-slate-200 dark:bg-slate-700"
                } text-white shadow-lg`}
              >
                <selectedBadge.icon className="h-8 w-8" />
              </div>

              <h4 className="mt-4 text-base font-extrabold text-slate-900 dark:text-white">
                {selectedBadge.name}
              </h4>
              <span className="mt-0.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                {selectedBadge.vi}
              </span>

              <div className="mt-4 w-full rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                <span className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Tiêu chí mở khóa:
                </span>
                {BADGE_CRITERIA_DESC[selectedBadge.id] || "Hoàn thành các mốc bài tập trong ứng dụng."}
              </div>

              <div className="mt-4 w-full">
                {Boolean(earnedMap[selectedBadge.id]) ? (
                  <div className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-2 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <Check className="h-4 w-4" />
                    Đã mở khóa huy hiệu này!
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <Lock className="h-3.5 w-3.5" />
                    Chưa đạt — hãy tiếp tục rèn luyện nhé!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
