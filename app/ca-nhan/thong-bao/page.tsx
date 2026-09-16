"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCheck, Sparkles } from "lucide-react"

import {
  initialNotifications,
  getReadIds,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/notifications"

import { ProfileSidebar } from "@/components/dashboard/profile-sidebar"
import { NotificationItem } from "@/components/profile/notification-item"

export const dynamic = "force-dynamic"

type Filter = "all" | "unread" | "read"

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "unread", label: "Chưa đọc" },
  { key: "read", label: "Đã đọc" },
]

export default function ThongBaoPage() {
  const [readIds, setReadIds] = useState<string[]>([])
  const [filter, setFilter] = useState<Filter>("all")

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

  const items = useMemo(() => {
    const list = initialNotifications.map(
      (n): AppNotification => ({ ...n, read: readIds.includes(n.id) })
    )
    if (filter === "all") return list
    return list.filter((n) => n.read === (filter === "read"))
  }, [readIds, filter])

  const handleMarkAll = () => setReadIds(markAllNotificationsRead())
  const handleMarkOne = (id: string) => setReadIds(markNotificationRead(id))

  const chipCount = (f: Filter) => {
    if (f === "all") return initialNotifications.length
    if (f === "unread") return unreadCount
    return initialNotifications.length - unreadCount
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6 lg:grid lg:grid-cols-[240px_1fr] lg:gap-6 lg:px-6">
      <ProfileSidebar />

      <div>
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thông báo</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {items.length} thông báo
              {filter === "unread" && ` · ${unreadCount} chưa đọc`}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-600/25 transition-colors hover:bg-blue-700"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="mb-5 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.key
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`relative rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-500 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800"
                }`}
              >
                {f.label}
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.25 text-[10px] font-bold ${
                    active
                      ? "bg-blue-500/20 text-white"
                      : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  {chipCount(f.key)}
                </span>
              </button>
            )
          })}
        </div>

        {/* List */}
        {items.length === 0 ? (
          <div className="py-12 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {filter === "read"
                ? "Chưa có thông báo nào đã đọc."
                : filter === "unread"
                  ? "Tất cả thông báo đã được đọc rồi!"
                  : "Không có thông báo nàо ở mục này."}
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {items.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                isRead={!!n.read}
                onClick={() => handleMarkOne(n.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
