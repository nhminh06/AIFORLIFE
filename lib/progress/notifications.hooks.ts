import { useCallback, useEffect, useState } from "react"

import { getNotifications, markAsRead, markAllAsRead } from "@/lib/progress/notifications.service"
import {
  getReadIds,
  markNotificationRead,
  markAllNotificationsRead,
  NOTIF_READ_EVENT,
  NOTIF_UPDATED_EVENT,
  type AppNotification,
  type NotificationCategory,
} from "@/lib/notifications"
import { useAuth } from "@/lib/auth-context"

export function useNotifications(options?: { limitCount?: number }) {
  const { user, loading } = useAuth()
  const uid = user?.uid ?? null
  const limitCount = options?.limitCount ?? 50
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loadingData, setLoadingData] = useState(true)

  const loadNotifications = useCallback(async () => {
    // Chưa đăng nhập → không có thông báo (tránh hiện data mẫu + kẹt số 4).
    if (!uid) {
      setNotifications([])
      setUnreadCount(0)
      setLoadingData(false)
      return
    }
    setLoadingData(true)
    const items = await getNotifications(uid, { limitCount })
    // Merge với readIds local (migrate từ bản cũ dùng localStorage).
    // Hiển thị read = BE.read || local.read để bell và trang luôn trùng nhau.
    const readIds = getReadIds()
    const merged = items.map((n) => ({
      ...n,
      read: n.read || readIds.includes(n.id),
    }))
    setNotifications(merged)
    setUnreadCount(merged.filter((n) => !n.read).length)
    setLoadingData(false)
  }, [uid, limitCount])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    const onReadChanged = () => {
      // Đồng bộ read-state local → state (để bell ↔ trang trùng nhau).
      setNotifications((prev) => {
        const readIds = getReadIds()
        const next = prev.map((n) => ({
          ...n,
          read: n.read || readIds.includes(n.id),
        }))
        setUnreadCount(next.filter((n) => !n.read).length)
        return next
      })
    }
    const onUpdated = () => {
      loadNotifications()
    }
    window.addEventListener(NOTIF_READ_EVENT, onReadChanged)
    window.addEventListener(NOTIF_UPDATED_EVENT, onUpdated)
    return () => {
      window.removeEventListener(NOTIF_READ_EVENT, onReadChanged)
      window.removeEventListener(NOTIF_UPDATED_EVENT, onUpdated)
    }
  }, [loadNotifications])

  const handleMarkRead = useCallback(
    async (id: string) => {
      // Optimistic update để badge giảm ngay, bell và trang trùng nhau.
      setNotifications((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        setUnreadCount(next.filter((n) => !n.read).length)
        return next
      })
      markNotificationRead(id)
      if (uid) {
        await markAsRead(uid, id)
      }
    },
    [uid]
  )

  const handleMarkAllRead = useCallback(async () => {
    setNotifications((prev) => {
      markAllNotificationsRead(prev)
      return prev.map((n) => ({ ...n, read: true }))
    })
    setUnreadCount(0)
    if (uid) {
      await markAllAsRead(uid)
    }
  }, [uid])

  return {
    notifications,
    unreadCount,
    loading: loading || loadingData,
    markAsRead: handleMarkRead,
    markAllAsRead: handleMarkAllRead,
    refresh: loadNotifications,
  }
}

export function useNotificationCategories() {
  const categories: NotificationCategory[] = [
    "streak",
    "badge",
    "lesson",
    "exercise",
    "vocab",
    "system",
  ]
  return categories
}

