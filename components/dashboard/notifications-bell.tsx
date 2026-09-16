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
  NOTIF_READ_KEY,
  initialNotifications,
  toneClass,
  type NotificationIcon,
} from "@/lib/notifications"

function NotifIcon({ icon }: { icon: NotificationIcon }) {
  const cls = "h-4 w-4"
  if (icon === "flame") return <Flame className={cls} />
  if (icon === "award") return <Award className={cls} />
  if (icon === "book") return <BookOpenText className={cls} />
  if (icon === "check") return <Check className={cls} />
  if (icon === "mic") return <Mic className={cls} />
  return <Sparkles className={cls} />
}

function loadRead(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(NOTIF_READ_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const [readIds, setReadIds] = useState<string[]>([])
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setReadIds(loadRead())
  }, [])

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

  const persist = (ids: string[]) => {
    setReadIds(ids)
    try {
      localStorage.setItem(NOTIF_READ_KEY, JSON.stringify(ids))
    } catch {
      /* bỏ qua */
    }
  }

  const unread = initialNotifications.filter((n) => !readIds.includes(n.id))
  const markAll = () => persist(initialNotifications.map((n) => n.id))
  const markOne = (id: string) => {
    if (readIds.includes(id)) return
    persist([...readIds, id])
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label={unread.length > 0 ? `Thông báo (${unread.length} chưa đọc)` : "Thông báo"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
          open ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <Bell className="h-5 w-5" />
        {unread.length > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <p className="font-bold text-slate-900">
              Thông báo{" "}
              {unread.length > 0 && (
                <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                  {unread.length} mới
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={markAll}
              disabled={unread.length === 0}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 disabled:text-slate-300"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Đánh dấu đã đọc
            </button>
          </div>

          <ul className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto">
            {initialNotifications.map((n) => {
              const isUnread = !readIds.includes(n.id)
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => markOne(n.id)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                      isUnread ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${toneClass[n.tone]}`}
                    >
                      <NotifIcon icon={n.icon} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900">
                          {n.title}
                        </span>
                        {isUnread && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                        )}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-slate-500">
                        {n.body}
                      </span>
                      <span className="mt-1 block text-[11px] text-slate-400">{n.time}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
