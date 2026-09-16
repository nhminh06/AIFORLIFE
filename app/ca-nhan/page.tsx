"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Award, BookOpenText, Check, ChevronRight, Flame } from "lucide-react"

import { initialNotifications, getReadIds } from "@/lib/notifications"

import { ProfileSidebar } from "@/components/dashboard/profile-sidebar"
import { ProfileHero } from "@/components/profile/profile-hero"
import { AppearanceCard } from "@/components/profile/appearance-card"
import { NotificationItem } from "@/components/profile/notification-item"

const recentNotifs = initialNotifications.slice(0, 4)

const TONE_COLORS = {
  orange: "bg-orange-100 text-orange-500 dark:bg-orange-900/20 dark:text-orange-400",
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
}

const QUICK_STATS = [
  { label: "Chuỗi học", value: "12 ngày", icon: Flame, tone: "orange" as const },
  { label: "Từ vựng", value: "1,127", icon: BookOpenText, tone: "blue" as const },
  { label: "Huy hiệu", value: "4/12", icon: Award, tone: "purple" as const },
] as const

export default function CaNhanPage() {
  const [readIds, setReadIds] = useState<string[]>([])

  useEffect(() => {
    const load = () => setReadIds(getReadIds())
    load()
    window.addEventListener("storage", load)
    window.addEventListener("learnenglish-notif-changed" as any, load)
    return () => {
      window.removeEventListener("storage", load)
      window.removeEventListener("learnenglish-notif-changed" as any, load)
    }
  }, [])

  const unreadCount = initialNotifications.filter((n) => !readIds.includes(n.id)).length

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6 lg:grid lg:grid-cols-[240px_1fr] lg:gap-6 lg:px-6">
      <ProfileSidebar />

      <div>
        <ProfileHero />

        {/* Quick stats */}
        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          {QUICK_STATS.map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.label}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900"
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${TONE_COLORS[s.tone]}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{s.label}</dt>
                  <dd className="text-xl font-bold text-slate-900 dark:text-slate-100">{s.value}</dd>
                </div>
              </div>
            )
          })}
        </dl>

        {/* Recent notifications summary */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Thông báo gần đây</h2>
            <Link
              href="/ca-nhan/thong-bao"
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Xem tất cả <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {unreadCount > 0 && (
            <span className="mt-2 inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {unreadCount} chưa đọc
            </span>
          )}

          <ul className="mt-4 space-y-1.5">
            {recentNotifs.map((n) => (
              <NotificationItem key={n.id} notification={n} isRead={readIds.includes(n.id)} />
            ))}
          </ul>
        </section>

        {/* Appearance settings */}
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-bold text-slate-900 dark:text-slate-100">Giao diện</h2>
          <AppearanceCard />
        </div>
      </div>
    </div>
  )
}
