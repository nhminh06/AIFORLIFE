/** Quản lý thông báo (notifications) — ghi/đọc lên Firestore users/{uid}/notifications/{id}.
 *
 * - Client ghi bằng Firebase SDK (đúng convention hiện tại của project).
 * - Lỗi chỉ log, không throw — UI vẫn chạy với dữ liệu cũ.
 * - Mỗi notification: id, title, body, category, metadata, read, createdAt.
 *
 * Auto-create:
 *  - badge-service: khi có huy hiệu mới → tạo notification "badge_earned".
 *  - summary-service: khi streak thay đổi → tạo notification.
 */

import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore"

import { db } from "@/lib/firebase"
import {
  type AppNotification,
  type NotificationCategory,
  type NotificationInput,
  createNotification,
} from "@/lib/notifications"

/** Điểm đến của notifications trên Firestore. */
export function notificationsRef(uid: string) {
  return collection(db, "users", uid, "notifications")
}

export function notificationDocRef(uid: string, id: string) {
  return doc(db, "users", uid, "notifications", id)
}
/* ------------------------------------------------------------------ */
/*  Đọc                                                                  */
/* ------------------------------------------------------------------ */

export async function getNotifications(
  uid: string | null | undefined,
  options?: { limitCount?: number; unreadOnly?: boolean }
): Promise<AppNotification[]> {
  if (!uid) return []
  const limitCount = options?.limitCount ?? 50
  try {
    const notifications = notificationsRef(uid)
    // NOTE: không dùng orderBy + where cùng lúc để tránh lỗi
    // "requires composite index" trên Firestore. Sort in-memory bên dưới.
    const q = options?.unreadOnly
      ? query(notifications, where("read", "==", false), limit(limitCount))
      : query(notifications, limit(limitCount))
    const snap = await getDocs(q)
    const items = snap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        title: data.title ?? "",
        body: data.body ?? "",
        time: data.time ?? "",
        category: data.category ?? "system",
        icon: (data.icon as AppNotification["icon"]) ?? "mic",
        tone: (data.tone as AppNotification["tone"]) ?? "blue",
        read: Boolean(data.read),
        metadata: (data.metadata as Record<string, unknown>) ?? undefined,
        createdAt: data._createdAtIso ?? data.createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
      }
    })
    // Sắp xếp mới nhất trước theo ISO string (so sánh string ISO là an toàn).
    items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
    return items.slice(0, limitCount)
  } catch (err) {
    console.error("[notifications.service] Lỗi khi đọc notifications:", err)
    return []
  }
}

export async function getUnreadCount(uid: string | null | undefined): Promise<number> {
  if (!uid) return 0
  try {
    const q = query(notificationsRef(uid), where("read", "==", false))
    const snap = await getDocs(q)
    return snap.size
  } catch (err) {
    console.error("[notifications.service] Lỗi khi đếm notifications chưa đọc:", err)
    return 0
  }
}

export async function getLatestNotification(
  uid: string | null | undefined
): Promise<AppNotification | null> {
  if (!uid) return null
  try {
    const q = query(notificationsRef(uid), limit(20))
    const snap = await getDocs(q)
    if (snap.empty) return null
    const items = snap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        title: data.title ?? "",
        body: data.body ?? "",
        time: data.time ?? "",
        category: data.category ?? "system",
        icon: (data.icon as AppNotification["icon"]) ?? "mic",
        tone: (data.tone as AppNotification["tone"]) ?? "blue",
        read: Boolean(data.read),
        metadata: (data.metadata as Record<string, unknown>) ?? undefined,
        createdAt: data._createdAtIso ?? data.createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
      }
    })
    items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
    return items[0] ?? null
  } catch (err) {
    console.error("[notifications.service] Lỗi khi lấy notification mới nhất:", err)
    return null
  }
}

/* ------------------------------------------------------------------ */
/*  Cập nhật read                                                      */
/* ------------------------------------------------------------------ */

export async function markAsRead(uid: string | null | undefined, id: string): Promise<void> {
  if (!uid) return
  try {
    const ref = notificationDocRef(uid, id)
    await setDoc(ref, { read: true }, { merge: true })
  } catch (err) {
    console.error("[notifications.service] Lỗi khi đánh dấu đã đọc:", err)
  }
}

export async function markAllAsRead(uid: string | null | undefined): Promise<void> {
  if (!uid) return
  try {
    const notifications = notificationsRef(uid)
    const q = query(notifications, where("read", "==", false))
    const snap = await getDocs(q)
    const batch = writeBatch(db)
    snap.forEach((docSnap) => {
      batch.update(docSnap.ref, { read: true })
    })
    if (!snap.empty) {
      await batch.commit()
    }
  } catch (err) {
    console.error("[notifications.service] Lỗi khi đánh dấu tất cả đã đọc:", err)
  }
}


/* ------------------------------------------------------------------ */
/*  Ghi                                                                  */
/* ------------------------------------------------------------------ */

export async function createNotificationRecord(
  uid: string | null | undefined,
  input: NotificationInput
): Promise<string | null> {
  if (!uid) return null
  const now = new Date()
  const notification = createNotification(input, now)
  const ref = notificationDocRef(uid, notification.id)
  try {
    await setDoc(ref, {
      ...notification,
      createdAt: serverTimestamp(),
      _createdAtIso: now.toISOString(),
    })
    return notification.id
  } catch (err) {
    console.error("[notifications.service] Lỗi khi tạo notification:", err)
    return null
  }
}

/** Tạo nhiều notification trong 1 batch. */
export async function createNotificationBatch(
  uid: string | null | undefined,
  inputs: NotificationInput[]
): Promise<string[]> {
  if (!uid || inputs.length === 0) return []
  const now = new Date()
  const batch = writeBatch(db)
  const ids: string[] = []
  for (const input of inputs) {
    const notification = createNotification(input, now)
    const ref = notificationDocRef(uid, notification.id)
    batch.set(ref, {
      ...notification,
      createdAt: serverTimestamp(),
      _createdAtIso: now.toISOString(),
    })
    ids.push(notification.id)
  }
  try {
    await batch.commit()
  } catch (err) {
    console.error("[notifications.service] Lỗi khi tạo batch notification:", err)
  }
  return ids
}
