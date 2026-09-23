"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Bell, CheckCheck, Sparkles } from "lucide-react"

import { PageHeading } from "@/components/dashboard/page-heading"
import { SiteShell } from "@/components/dashboard/site-shell"
import { NotificationItem } from "@/components/profile/notification-item"
import { useNotifications } from "@/lib/progress/notifications.hooks"
import { useAuth } from "@/lib/auth-context"

export const dynamic = "force-dynamic"

type Filter = "all" | "unread" | "read"

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "unread", label: "Chưa đọc" },
  { key: "read", label: "Đã đọc" },
]

export default function ThongBaoPage() {
  const [filter, setFilter] = useState<Filter>("all")
  const { user } = useAuth()
  // Cùng nguồn với chuông: Firestore qua hook. Chưa đăng nhập → rỗng.
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
    useNotifications({ limitCount: 50 })

  const items = useMemo(() => {
    if (!user) return []
    if (filter === "all") return notifications
    return notifications.filter((n) => n.read === (filter === "read"))
  }, [notifications, user, filter])

  const handleMarkAll = () => void markAllAsRead()
  const handleMarkOne = (id: string) => void markAsRead(id)

  const chipCount = (f: Filter) => {
    if (f === "all") return notifications.length
    if (f === "unread") return unreadCount
    return notifications.length - unreadCount
  }

  return (
    <SiteShell>
      <div className="mb-4">
        <Link
          href="/ca-nhan"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại Trang cá nhân
        </Link>
      </div>

      <PageHeading
        icon={Bell}
        title="Trung tâm Thông báo"
        desc="Theo dõi các thông báo mới nhất về chuỗi học, bài học được gợi ý và thành tích cá nhân."
        bubbleClass="bg-rose-500"
      />

      <div className="mt-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        {/* Actions bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const active = filter === f.key
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`relative rounded-full border px-4 py-1.5 text-xs font-bold transition-colors ${
                    active
                      ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {f.label}
                  <span
                    className={`ml-1.5 rounded-full px-1.5 py-0.25 text-[10px] font-bold ${
                      active
                        ? "bg-white text-blue-600"
                        : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {chipCount(f.key)}
                  </span>
                </button>
              )
            })}
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

        {/* List: guest -> nhac dang nhap, dang tai -> loading, rong -> empty */}
        <div className="mt-5">
          {!user ? (
            <div className="py-12 text-center">
              <Bell className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                Vui lòng đăng nhập để xem thông báo.
              </p>
            </div>
          ) : loading ? (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {filter === "read"
                  ? "Chưa có thông báo nào đã đọc."
                  : filter === "unread"
                    ? "Tuyệt vời! Tất cả thông báo đã được đọc."
                    : "Không có thông báo nào."}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
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
    </SiteShell>
  )
}
