export type NotificationTone = "blue" | "green" | "orange" | "purple" | "rose"

export type NotificationIcon = "flame" | "award" | "book" | "check" | "sparkles" | "mic"

export type NotificationCategory = "streak" | "badge" | "lesson" | "exercise" | "vocab" | "system"

export const NOTIFICATION_CATEGORIES: Record<NotificationCategory, { icon: NotificationIcon; tone: NotificationTone }> = {
  streak: { icon: "flame", tone: "orange" },
  badge: { icon: "award", tone: "purple" },
  lesson: { icon: "book", tone: "blue" },
  exercise: { icon: "check", tone: "green" },
  vocab: { icon: "sparkles", tone: "blue" },
  system: { icon: "mic", tone: "rose" },
}

export type AppNotification = {
  id: string
  title: string
  body: string
  time: string
  icon: NotificationIcon
  tone: NotificationTone
  read: boolean
  category: NotificationCategory
  metadata?: Record<string, unknown>
  createdAt: string
}

export type NotificationInput = {
  title: string
  body: string
  category: NotificationCategory
  metadata?: Record<string, unknown>
}

export const toneClass: Record<NotificationTone, string> = {
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  green: "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400",
  orange: "bg-orange-100 text-orange-500 dark:bg-orange-900/20 dark:text-orange-400",
  purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  rose: "bg-rose-100 text-rose-500 dark:bg-rose-900/20 dark:text-rose-400",
}

export const NOTIF_READ_KEY = "learnenglish-notif-read"

/** Dữ liệu mẫu dùng khi chưa có BE / chưa đăng nhập (fallback). */
export const initialNotifications: AppNotification[] = [
  {
    id: "streak-12",
    title: "Chuỗi 12 ngày học liên tiếp!",
    body: "Bạn đang giữ phong độ rất tốt. Học thêm hôm nay để nối dài streak nhé.",
    time: "5 phút trước",
    icon: "flame",
    tone: "orange",
    read: false,
    category: "streak",
    createdAt: new Date().toISOString(),
  },
  {
    id: "badge-words",
    title: "Nhận huy hiệu “1000 Words”",
    body: "Chúc mừng! Bạn đã cán mốc 1.000 từ vựng đã học.",
    time: "1 giờ trước",
    icon: "award",
    tone: "purple",
    read: false,
    category: "badge",
    createdAt: new Date().toISOString(),
  },
  {
    id: "daily-words",
    title: "5 từ vựng mới hôm nay",
    body: "accomplish, diligent, milestone… đã sẵn sàng để bạn ôn tập.",
    time: "3 giờ trước",
    icon: "book",
    tone: "blue",
    read: false,
    category: "vocab",
    createdAt: new Date().toISOString(),
  },
  {
    id: "quiz-result",
    title: "Bài “Present Simple Basics” đạt 8/8",
    body: "Tuyệt vời! Thử sức với “Mixed Tenses” để nâng cao hơn nhé.",
    time: "Hôm qua",
    icon: "check",
    tone: "green",
    read: false,
    category: "exercise",
    createdAt: new Date().toISOString(),
  },
  {
    id: "speak-reminder",
    title: "Nhắc luyện nói",
    body: "Bạn còn 2 câu trong bộ “Greetings” chưa luyện nói theo.",
    time: "Hôm qua",
    icon: "mic",
    tone: "rose",
    read: false,
    category: "lesson",
    createdAt: new Date().toISOString(),
  },
  {
    id: "new-lesson",
    title: "Bài mới: “Passive Voice”",
    body: "Chủ điểm ngữ pháp câu bị động vừa được thêm vào thư viện.",
    time: "2 ngày trước",
    icon: "sparkles",
    tone: "blue",
    read: false,
    category: "lesson",
    createdAt: new Date().toISOString(),
  },
]

/** Custom event fired when read-state changes (syncs bell ↔ pages). */
export const NOTIF_READ_EVENT = "learnenglish-notif-changed"

export const NOTIF_UPDATED_EVENT = "learnenglish-notif-updated"

/** Load the set of read notification ids from localStorage. */
export function getReadIds(): string[] {
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

/** Persist the read-id set and broadcast a change event. */
export function persistReadIds(ids: string[]): void {
  try {
    localStorage.setItem(NOTIF_READ_KEY, JSON.stringify(ids))
  } catch {
    /* bỏ qua */
  }
  window.dispatchEvent(new Event(NOTIF_READ_EVENT))
}

/** Mark a single notification as read, returning the new id list. */
export function markNotificationRead(id: string): string[] {
  const ids = getReadIds()
  if (ids.includes(id)) return ids
  const next = [...ids, id]
  persistReadIds(next)
  return next
}

/** Mark every notification as read, returning the new id list. */
export function markAllNotificationsRead(notifications: AppNotification[] = []): string[] {
  const ids = notifications.length > 0 ? notifications.map((n) => n.id) : getReadIds()
  persistReadIds(ids)
  return ids
}

/** Convenience: is a notification read? */
export function isNotificationRead(id: string, readIds: string[]): boolean {
  return readIds.includes(id)
}

/** Định dạng thời gian tương đối (5 phút trước, 1 giờ trước, Hôm qua, ...) */
export function formatTimeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return "Vừa mới"
  if (diffMin < 60) return `${diffMin} phút trước`
  if (diffHour < 24) return `${diffHour} giờ trước`
  if (diffDay === 1) return "Hôm qua"
  if (diffDay < 7) return `${diffDay} ngày trước`
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
}

/** Factory: tạo notification object từ input + thời gian hiện tại */
export function createNotification(input: NotificationInput, now = new Date()): AppNotification {
  const { category } = input
  const preset = NOTIFICATION_CATEGORIES[category] ?? { icon: "system", tone: "blue" }
  return {
    id: `notif-${now.getTime()}-${Math.random().toString(36).slice(2, 6)}`,
    title: input.title,
    body: input.body,
    time: formatTimeAgo(now),
    icon: preset.icon,
    tone: preset.tone,
    read: false,
    category,
    metadata: input.metadata,
    createdAt: now.toISOString(),
  }
}

