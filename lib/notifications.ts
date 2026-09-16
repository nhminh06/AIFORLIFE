export type NotificationTone = "blue" | "green" | "orange" | "purple" | "rose"

export type NotificationIcon = "flame" | "award" | "book" | "check" | "sparkles" | "mic"

export type AppNotification = {
  id: string
  title: string
  body: string
  time: string
  icon: NotificationIcon
  tone: NotificationTone
  read?: boolean
}

export const toneClass: Record<NotificationTone, string> = {
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  green: "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400",
  orange: "bg-orange-100 text-orange-500 dark:bg-orange-900/20 dark:text-orange-400",
  purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  rose: "bg-rose-100 text-rose-500 dark:bg-rose-900/20 dark:text-rose-400",
}

export const initialNotifications: AppNotification[] = [
  {
    id: "streak-12",
    title: "Chuỗi 12 ngày học liên tiếp!",
    body: "Bạn đang giữ phong độ rất tốt. Học thêm hôm nay để nối dài streak nhé.",
    time: "5 phút trước",
    icon: "flame",
    tone: "orange",
  },
  {
    id: "badge-words",
    title: "Nhận huy hiệu “1000 Words”",
    body: "Chúc mừng! Bạn đã cán mốc 1.000 từ vựng đã học.",
    time: "1 giờ trước",
    icon: "award",
    tone: "purple",
  },
  {
    id: "daily-words",
    title: "5 từ vựng mới hôm nay",
    body: "accomplish, diligent, milestone… đã sẵn sàng để bạn ôn tập.",
    time: "3 giờ trước",
    icon: "book",
    tone: "blue",
  },
  {
    id: "quiz-result",
    title: "Bài “Present Simple Basics” đạt 8/8",
    body: "Tuyệt vời! Thử sức với “Mixed Tenses” để nâng cao hơn nhé.",
    time: "Hôm qua",
    icon: "check",
    tone: "green",
  },
  {
    id: "speak-reminder",
    title: "Nhắc luyện nói",
    body: "Bạn còn 2 câu trong bộ “Greetings” chưa luyện nói theo.",
    time: "Hôm qua",
    icon: "mic",
    tone: "rose",
  },
  {
    id: "new-lesson",
    title: "Bài mới: “Passive Voice”",
    body: "Chủ điểm ngữ pháp câu bị động vừa được thêm vào thư viện.",
    time: "2 ngày trước",
    icon: "sparkles",
    tone: "blue",
  },
]

export const NOTIF_READ_KEY = "learnenglish-notif-read"

/** Custom event fired when read-state changes (syncs bell ↔ pages). */
export const NOTIF_READ_EVENT = "learnenglish-notif-changed"

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
export function markAllNotificationsRead(notifications: AppNotification[] = initialNotifications): string[] {
  const ids = notifications.map((n) => n.id)
  persistReadIds(ids)
  return ids
}

/** Convenience: is a notification read? */
export function isNotificationRead(id: string, readIds: string[]): boolean {
  return readIds.includes(id)
}
