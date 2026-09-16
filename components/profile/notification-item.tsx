"use client"

import type { ComponentType } from "react"
import {
  Award,
  Bell,
  BookOpenText,
  Check,
  Flame,
  Mic,
  Sparkles,
} from "lucide-react"

import { toneClass, type AppNotification, type NotificationIcon } from "@/lib/notifications"

const NOTIF_ICONS: Record<NotificationIcon, ComponentType<{ className?: string }>> = {
  flame: Flame,
  award: Award,
  book: BookOpenText,
  check: Check,
  sparkles: Sparkles,
  mic: Mic,
}

export function NotificationItem({
  notification,
  isRead,
  onClick,
}: {
  notification: AppNotification
  isRead: boolean
  onClick?: () => void
}) {
  const Icon = NOTIF_ICONS[notification.icon] ?? Bell
  const tone = toneClass[notification.tone]
  const unreadDot = !isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                isRead
          ? "hover:bg-slate-50 dark:hover:bg-slate-800/60"
          : "bg-blue-50/60 hover:bg-blue-50/80 dark:bg-blue-900/15 dark:hover:bg-blue-900/25"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}
      >
        <Icon className="h-4 w-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span
            className={`truncate text-sm font-semibold ${
              isRead
                ? "text-slate-600 line-through dark:text-slate-500"
                : "text-slate-900 dark:text-slate-100"
            }`}
          >
            {notification.title}
          </span>
          {unreadDot}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {notification.body}
        </span>
        <span className="mt-1 block text-[11px] text-slate-400 dark:text-slate-500">
          {notification.time}
        </span>
      </span>
    </button>
  )
}
