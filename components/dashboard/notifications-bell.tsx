"use client"

import { useEffect, useRef, useState } from "react"
import {
  Award,
  Bell,
  BookOpenText,
  Check,
  CheckCheck,
  Flame,
  Mic,
  Sparkles,
} from "lucide-react"

import {
  toneClass,
  type NotificationIcon,
} from "@/lib/notifications"
import { useNotifications } from "@/lib/progress/notifications.hooks"
import { useAuth } from "@/lib/auth-context"

function NotifIcon({ icon }: { icon: NotificationIcon }) {
  const cls = "h-4 w-4"
  if (icon === "flame") return <Flame className={cls} />
  if (icon === "award") return <Award className={cls} />
  if (icon === "book") return <BookOpenText className={cls} />
  if (icon === "check") return <Check className={cls} />
  if (icon === "mic") return <Mic className={cls} />
  return <Sparkles className={cls} />
}

function BellEmpty({ text }: { text: string }) {
  return (
    <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
      {text}
    </p>
  )
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  // Nguồn thật duy nhất: Firestore qua hook. Chưa đăng nhập → [] + count 0.
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications({ limitCount: 50 })

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open ])

  const markAll = () => void markAllAsRead()
  const markOne = (id: string) => void markAsRead(id)

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label={unreadCount > 0 ? `Thông báo (${unreadCount} chưa đọc)` : "Thông báo"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
          open ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white dark:ring-slate-900">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="font-bold text-slate-900 dark:text-white">
              Thông báo{" "}
              {unreadCount > 0 && (
                <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600 dark:bg-red-950/50 dark:text-red-400">
                  {unreadCount} mới
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={markAll}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 disabled:text-slate-300 dark:text-blue-400 dark:hover:text-blue-300 dark:disabled:text-slate-600"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Đánh dấu đã đọc
            </button>
          </div>

          {!user ? (
            <BellEmpty text="Đăng nhập để nhận thông báo về streak, huy hiệu và bài học mới." />
          ) : notifications.length === 0 ? (
            <BellEmpty text="Chưa có thông báo nào." />
          ) : (
          <ul className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
            {notifications.map((n) => {
              const isUnread = !n.read
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => markOne(n.id)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                      isUnread ? "bg-blue-50/50 dark:bg-blue-950/30" : ""
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${toneClass[n.tone]}`}
                    >
                      <NotifIcon icon={n.icon} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {n.title}
                        </span>
                        {isUnread && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600 dark:bg-blue-400" />
                        )}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {n.body}
                      </span>
                      <span className="mt-1 block text-[11px] text-slate-400 dark:text-slate-500">{n.time}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          )}
        </div>
      )}
    </div>
  )
}
