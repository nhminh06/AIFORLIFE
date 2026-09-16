"use client"

import { Quote } from "lucide-react"

import { StudyStatsCard } from "./study-stats-card"
import { TodayVocabulary } from "./today-vocabulary"

export function DashboardSidebar() {
  return (
    <div className="space-y-6">
      {/* Motivation quote */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-white shadow-lg shadow-blue-600/20">
        <Quote className="absolute right-4 top-4 h-12 w-12 rotate-180 text-white/15" />
        <img
          src="/images/mountain-quote.png"
          alt="Minh hoạ người leo lên đỉnh núi cắm cờ"
          className="mx-auto h-28 w-auto object-contain"
        />
        <p className="mt-3 text-pretty text-base font-semibold leading-relaxed">
          Mỗi từ mới bạn học hôm nay là một bước tiến đến phiên bản tốt hơn của
          chính mình.
        </p>
        <p className="mt-2 text-sm text-blue-100">— Chinh phục tiếng Anh</p>
      </section>

      <StudyStatsCard />
      <TodayVocabulary />
    </div>
  )
}
