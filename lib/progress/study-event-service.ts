/**
 * Nhật ký hoạt động học tập (studyEvents) — nguồn cho khối
 * "Lịch sử hoạt động" của trang /tien-do.
 *
 * - Đã đăng nhập: users/{uid}/studyEvents/{eventId}
 * - Khách: localStorage qua lib/progress/local-store.ts
 *
 * Sự kiện được GỘP theo (loại + ngày + đối tượng) nên id có dạng
 * `${type}_${date}_${refId}` — học 20 từ trong 1 bộ chỉ ra 1 dòng
 * "Từ vựng · 20 từ mới" thay vì 20 dòng rời rạc.
 */

import { doc, getDocs, increment, limit, orderBy, query, serverTimestamp, setDoc, collection } from "firebase/firestore"

import { db } from "@/lib/firebase"
import { todayKey } from "@/lib/daily-vocab"
import { emitProgressUpdated, loadLocalStudyEvents, upsertLocalStudyEvent } from "@/lib/progress/local-store"
import type { StudyEvent, StudyEventType } from "@/lib/progress/types"

export type StudyEventInput = {
  type: StudyEventType
  /** slug bộ từ / bộ mẫu câu / chủ điểm ngữ pháp / id bài luyện / id huy hiệu */
  refId: string
  /** tiêu đề hiển thị (tên bộ, tên bài…) */
  title: string
  /** số lượng gộp vào sự kiện (số từ mới, số câu mới…) */
  count?: number
  xp?: number
  score?: number
  total?: number
  /** mô tả phụ, VD "Nghe – chọn đáp án" */
  detail?: string
}

/** Loại sự kiện được gộp trong ngày (các loại khác vẫn gộp theo ngày + refId) */
const GROUPED_TYPES: StudyEventType[] = ["vocab", "phrase"]

/** Tạo id sự kiện ổn định: 1 doc / (loại + ngày + đối tượng) */
export function makeEventId(type: StudyEventType, refId: string, date = todayKey()): string {
  const safe = refId.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 60)
  return `${type}_${date}_${safe || "unknown"}`
}

/** Ghi 1 sự kiện học tập (tự chọn cloud hay local theo uid). */
export async function recordStudyEvent(
  uid: string | null | undefined,
  input: StudyEventInput
): Promise<void> {
  const date = todayKey()
  const id = makeEventId(input.type, input.refId, date)

  if (!uid) {
    upsertLocalStudyEvent(uid, {
      id,
      type: input.type,
      refId: input.refId,
      title: input.title,
      count: input.count,
      xp: input.xp,
      score: input.score,
      total: input.total,
      detail: input.detail,
    })
    return
  }

  const payload: Record<string, unknown> = {
    id,
    type: input.type,
    refId: input.refId,
    title: input.title,
    date,
    count: increment(Math.max(1, input.count ?? 1)),
    xp: increment(input.xp ?? 0),
    at: serverTimestamp(),
  }
  if (input.score != null) payload.score = input.score
  if (input.total != null) payload.total = input.total
  if (input.detail) payload.detail = input.detail

  try {
    await setDoc(doc(db, "users", uid, "studyEvents", id), payload, { merge: true })
    emitProgressUpdated()
  } catch (err) {
    console.error("[study-event-service] Lỗi khi ghi sự kiện học tập:", err)
  }
}

/** Lấy `limit` sự kiện gần nhất (mới nhất trước). */
export async function getRecentStudyEvents(
  uid: string | null | undefined,
  eventLimit = 20
): Promise<StudyEvent[]> {
  if (!uid) return loadLocalStudyEvents(uid, eventLimit)
  try {
    const q = query(
      collection(db, "users", uid, "studyEvents"),
      orderBy("at", "desc"),
      limit(eventLimit)
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        type: (data.type ?? "vocab") as StudyEventType,
        refId: data.refId ?? "",
        title: data.title ?? "",
        date: data.date ?? "",
        at: data.at?.toMillis?.() ?? 0,
        count: Number(data.count ?? 1),
        xp: Number(data.xp ?? 0),
        score: data.score != null ? Number(data.score) : undefined,
        total: data.total != null ? Number(data.total) : undefined,
        detail: data.detail ?? undefined,
      } satisfies StudyEvent
    })
  } catch (err) {
    console.error("[study-event-service] Lỗi khi đọc sự kiện học tập:", err)
    return []
  }
}

/** Loại sự kiện có được gộp trong ngày hay không (dùng khi cần phân biệt ở UI). */
export function isGroupedEvent(type: StudyEventType): boolean {
  return GROUPED_TYPES.includes(type)
}
