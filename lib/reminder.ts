/**
 * Nhắc nhở học tập hằng ngày.
 *
 * Cơ chế (thuần web, không cần backend):
 * 1. Service Worker + Periodic Background Sync (Chrome/Android) → vẫn nhắc
 *    được khi đóng app.
 * 2. Song song luôn hẹn 1 timer trong tab đang mở → hoạt động mọi trình duyệt.
 * 3. Mở app mà giờ nhắc đã qua trong ngày và chưa nhắc → nhắc bù ngay 1 lần.
 *
 * Người dùng cần cấp quyền Notification và giữ cài đặt này bật.
 */

import type { StudySettings } from "@/lib/profile"

const SW_URL = "/sw.js"
/** Ghi nhận ngày đã nhắc để không nhắc lặp trong cùng 1 ngày */
const LAST_FIRED_KEY = "afl:reminder:last-fired"
export const REMINDER_PERIODIC_TAG = "afl-daily-reminder"

/** Ngày hôm nay dạng YYYY-MM-DD theo giờ địa phương */
function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** "HH:MM" → số phút kể từ 00:00; chuỗi sai trả về null */
export function parseReminderTime(value: string | undefined): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec((value ?? "").trim())
  if (!match) return null
  const h = Number(match[1])
  const m = Number(match[2])
  if (!Number.isFinite(h) || !Number.isFinite(m) || h > 23 || m > 59) return null
  return h * 60 + m
}

/** Số phút còn lại tới giờ nhắc hôm nay (0 nếu đã qua, Infinity nếu giờ sai) */
export function minutesUntilReminder(now: Date, time: string): number {
  const target = parseReminderTime(time)
  if (target === null) return Number.POSITIVE_INFINITY
  const diff = target - (now.getHours() * 60 + now.getMinutes())
  return diff > 0 ? diff : 0
}

/** Chỉ nhắc khi: bật cờ + thời gian hợp lệ + đã cấp quyền thông báo */
export function canRemind(settings: Pick<StudySettings, "reminder" | "reminderTime">): boolean {
  if (!settings.reminder) return false
  if (parseReminderTime(settings.reminderTime) === null) return false
  return typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted"
}

function alreadyFiredToday(): boolean {
  try {
    return localStorage.getItem(LAST_FIRED_KEY) === todayKey()
  } catch {
    return false
  }
}

function markFiredToday() {
  try {
    localStorage.setItem(LAST_FIRED_KEY, todayKey())
  } catch {
    /* localStorage bị chặn — bỏ qua, có thể nhắc lặp */
  }
}

/**
 * Gửi 1 thông báo nhắc nhở học tập.
 * `force: true` bỏ qua cờ "đã nhắc hôm nay" — dùng cho nút thử trong cài đặt.
 */
export function fireReminder(opts?: { force?: boolean }) {
  if (typeof window === "undefined" || !("Notification" in window)) return
  if (Notification.permission !== "granted") return
  if (!opts?.force && alreadyFiredToday()) return
  markFiredToday()

  const notifOptions: NotificationOptions = {
    body: "Dành 20 phút hôm nay để giữ chuỗi học liên tiếp nhé. Bạn cũng có 5 từ mới đang chờ!",
    icon: "/icon-light-32x32.png",
    badge: "/icon.svg",
    tag: REMINDER_PERIODIC_TAG,
  }

  try {
    new Notification("Đã tới giờ học tiếng Anh!", notifOptions)
  } catch {
    // Safari/iOS chặn new Notification trên desktop → nhờ Service Worker hiển thị.
    void navigator.serviceWorker
      ?.ready
      .then((reg) => reg.showNotification?.("Đã tới giờ học tiếng Anh!", notifOptions))
      .catch(() => {})
  }
}

/* ------------------------------------------------------------------ */
/*  Service Worker + Periodic Background Sync                          */
/* ------------------------------------------------------------------ */

/** Đăng ký Service Worker (idempotent). */
async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null
  try {
    return await navigator.serviceWorker.register(SW_URL, { scope: "/" })
  } catch (err) {
    console.warn("[reminder] Không đăng ký được Service Worker:", err)
    return null
  }
}

/**
 * Lên lịch Periodic Background Sync (Chrome/Android).
 * Periodic Sync không cho chọn giờ chính xác → đăng ký mỗi giờ, Service Worker
 * tự so với giờ nhắc người dùng đặt (xem public/sw.js).
 */
async function schedulePeriodicSync(reg: ServiceWorkerRegistration | null): Promise<void> {
  if (!reg) return
  const manager = (reg as any).periodicSync
  if (!manager?.register) return // Safari/Firefox: dựa vào timer trong tab
  try {
    await manager.register(REMINDER_PERIODIC_TAG, { minInterval: 60 * 60 * 1000 })
  } catch (err) {
    console.warn("[reminder] Không lên lịch Periodic Sync:", err)
  }
}

/**
 * Bật nhắc nhở: xin cấp quyền + đăng ký SW + lên lịch.
 * Phải gọi từ thao tác người dùng (click) để trình duyệt cho phép.
 * Trả về true nếu cấp quyền thành công.
 */
export async function enableReminder(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false

  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission

  if (permission !== "granted") return false

  const reg = await ensureServiceWorker()
  await schedulePeriodicSync(reg)
  return true
}

/** Báo cho Service Worker biết giờ nhắc hiện tại (để SW tự kiểm tra khi app đóng). */
export function postReminderTimeToSW(reminderTime: string) {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return
  void navigator.serviceWorker.ready
    .then((reg) => {
      reg.active?.postMessage({ type: "SET_REMINDER_TIME", time: reminderTime })
    })
    .catch(() => {})
}

/** Tắt nhắc nhở: huỷ lịch + xoá cờ đã nhắc hôm nay. */
export async function disableReminder(): Promise<void> {
  try {
    localStorage.removeItem(LAST_FIRED_KEY)
  } catch {
    /* bỏ qua */
  }
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    const manager = (reg as any)?.periodicSync
    await manager?.unregister?.(REMINDER_PERIODIC_TAG)
  } catch {
    /* bỏ qua */
  }
}

/**
 * Timer trong tab đang mở: hẹn 1 lần tới giờ nhắc sắp tới.
 * Xử lý luôn "vừa mở app mà giờ nhắc đã qua" → nhắc bù 1 lần.
 * Trả về hàm huỷ timer.
 */
export function startReminderTimer(
  settings: Pick<StudySettings, "reminder" | "reminderTime">,
  onBlocked?: () => void,
): () => void {
  if (typeof window === "undefined") return () => {}

  if (!settings.reminder) {
    void disableReminder()
    return () => {}
  }

  if (!("Notification" in window) || Notification.permission !== "granted") {
    onBlocked?.()
    return () => {}
  }

  void ensureServiceWorker()

  const minutes = minutesUntilReminder(new Date(), settings.reminderTime)
  if (minutes === Number.POSITIVE_INFINITY) return () => {}

  // Giờ nhắc đã qua hôm nay mà chưa nhắc (app bị đóng cả buổi) → nhắc bù.
  if (minutes === 0) {
    fireReminder()
    return () => {}
  }

  const timer = window.setTimeout(() => fireReminder(), minutes * 60 * 1000)
  return () => window.clearTimeout(timer)
}