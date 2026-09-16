"use client"

import { Award, Lock, Sparkles } from "lucide-react"
import Link from "next/link"

import { badges } from "@/lib/data/progress"

export function BadgesShowcaseCard() {
  const earnedCount = badges.filter((b) => b.earned).length

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
          Xem chi tiết →
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {badges.map((b) => {
          const Icon = b.icon
          return (
            <div
              key={b.id}
              className={`relative flex flex-col items-center rounded-2xl border p-4 text-center transition-all ${
                b.earned
                  ? "border-amber-200/80 bg-gradient-to-b from-amber-50/50 to-white shadow-sm dark:border-amber-900/30 dark:from-amber-950/20 dark:to-slate-900"
                  : "border-slate-100 bg-slate-50/50 opacity-60 dark:border-slate-800 dark:bg-slate-800/30"
              }`}
            >
              <div
                className={`relative flex h-12 w-12 items-center justify-center rounded-2xl ${
                  b.earned ? b.bg : "bg-slate-200 dark:bg-slate-700"
                } text-white shadow-md`}
              >
                <Icon className="h-6 w-6" />
                {b.earned ? (
                  <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 text-amber-300" />
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
            </div>
          )
        })}
      </div>
    </section>
  )
}
