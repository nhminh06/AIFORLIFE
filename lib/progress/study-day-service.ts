/**
 * Sổ ghi ngày học (studyDays) — nguồn cho biểu đồ "Thời gian học theo ngày",
 * "Tiến độ theo tuần", XP và streak.
 *
 * - Đã đăng nhập: lưu ở users/{uid}/studyDays/{YYYY-MM-DD}
 * - Khách: lưu ở localStorage qua lib/progress/local-store.ts
 *
 * Mọi thao tác ghi đều dùng increment()/transaction nên có thể gọi song song
 * mà không sợ mất dữ liệu.
 */

import {
  collection,
  doc,
  getDocs,
  increment,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore"

import { db } from "@/lib/firebase"
import { todayKey } from "@/lib/daily-vocab"
import { xpRules } from "@/lib/progress/progress-config"
import {
  addLocalStudyCounters,
  addLocalStudySeconds,
  emitProgressUpdated,
  loadLocalStudyDays,
  type StudyCountersPatch,
} from "@/lib/progress/local-store"
import type { StudyDay, StudyXpSource } from "@/lib/progress/types"

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Ngày dạng YYYY-MM-DD theo giờ địa phương */
export function dateKey(date: Date): string {
  return todayKey(date)
}

/** Ngày cách hôm nay `daysAgo` ngày (0 = hôm nay) */
export function dateKeyDaysAgo(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return dateKey(d)
}

/** XP cộng theo thời gian học, có trần mỗi ngày */
export function timeXpForSeconds(seconds: number): number {
  const raw = Math.floor((seconds / 600) * xpRules.timePerTenMinutes)
  return Math.min(raw, xpRules.maxTimeXpPerDay)
}

export function emptyStudyDay(date: string): StudyDay {
  return {
    date,
    seconds: 0,
    minutes: 0,
    wordsLearned: 0,
    phrasesLearned: 0,
    grammarCompleted: 0,
    exercisesCompleted: 0,
    lessonsCompleted: 0,
    reviews: 0,
    xp: 0,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToStudyDay(date: string, data: Record<string, any>): StudyDay {
  const seconds = Number(data.seconds ?? 0)
  return {
    ...emptyStudyDay(date),
    date,
    seconds,
    minutes: data.minutes != null ? Number(data.minutes) : Math.round(seconds / 60),
    wordsLearned: Number(data.wordsLearned ?? 0),
    phrasesLearned: Number(data.phrasesLearned ?? 0),
    grammarCompleted: Number(data.grammarCompleted ?? 0),
    exercisesCompleted: Number(data.exercisesCompleted ?? 0),
    lessonsCompleted: Number(data.lessonsCompleted ?? 0),
    reviews: Number(data.reviews ?? 0),
    xp: Number(data.xp ?? 0),
    xpBreakdown: data.xpBreakdown ?? undefined,
  }
}

function studyDayRef(uid: string, date: string) {
  return doc(db, "users", uid, "studyDays", date)
}

/* ------------------------------------------------------------------ */
/*  Ghi: thời gian học                                                 */
/* ------------------------------------------------------------------ */

/**
 * Cộng thời gian học (giây) vào ngày hôm nay.
 * Dùng transaction để cộng XP-thời-gian đúng theo trần maxTimeXpPerDay.
 */
async function addCloudStudySeconds(uid: string, seconds: number): Promise<void> {
  const date = todayKey()
  const ref = studyDayRef(uid, date)
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    const prevSeconds = snap.exists() ? Number(snap.data().seconds ?? 0) : 0
    const nextSeconds = Math.min(prevSeconds + seconds, 24 * 3600)
    /* chênh lệch XP thời gian giữa 2 mốc — nhờ vậy trần ngày luôn đúng */
    const timeXpDelta = timeXpForSeconds(nextSeconds) - timeXpForSeconds(prevSeconds)
    tx.set(
      ref,
      {
        date,
        seconds: nextSeconds,
        minutes: Math.round(nextSeconds / 60),
        xp: increment(timeXpDelta),
        xpBreakdown: { time: increment(timeXpDelta) },
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )
  })
}

/** Cộng thời gian học vào hôm nay (cloud nếu đã đăng nhập, local nếu là khách). */
export async function addStudySeconds(uid: string | null | undefined, seconds: number): Promise<void> {
  if (seconds <= 0) return
  if (!uid) {
    addLocalStudySeconds(uid, seconds)
    return
  }
  try {
    await addCloudStudySeconds(uid, seconds)
    emitProgressUpdated()
  } catch (err) {
    console.error("[study-day-service] Lỗi khi lưu thời gian học:", err)
  }
}

/* ------------------------------------------------------------------ */
/*  Ghi: các bộ đếm trong ngày                                         */
/* ------------------------------------------------------------------ */

export type StudyCountersInput = StudyCountersPatch & {
  /** XP tách theo nguồn để hiển thị/biểu đồ sau này */
  xpParts?: Partial<Record<StudyXpSource, number>>
}

const COUNTER_KEYS = [
  "wordsLearned",
  "phrasesLearned",
  "grammarCompleted",
  "exercisesCompleted",
  "lessonsCompleted",
  "reviews",
] as const

/** Cộng các bộ đếm học tập của hôm nay (từ mới, bài hoàn thành, XP…). */
export async function addStudyCounters(
  uid: string | null | undefined,
  input: StudyCountersInput
): Promise<void> {
  if (!uid) {
    addLocalStudyCounters(uid, input)
    return
  }

  const date = todayKey()
  const data: Record<string, unknown> = { date, updatedAt: serverTimestamp() }

  COUNTER_KEYS.forEach((key) => {
    const value = input[key]
    if (typeof value === "number" && value !== 0) data[key] = increment(value)
  })

  if (typeof input.xp === "number" && input.xp !== 0) data.xp = increment(input.xp)

  if (input.xpParts) {
    const parts: Record<string, unknown> = {}
    Object.entries(input.xpParts).forEach(([source, value]) => {
      if (typeof value === "number" && value !== 0) parts[source] = increment(value)
    })
    if (Object.keys(parts).length > 0) data.xpBreakdown = parts
  }

  try {
    await setDoc(studyDayRef(uid, date), data, { merge: true })
    emitProgressUpdated()
  } catch (err) {
    console.error("[study-day-service] Lỗi khi lưu bộ đếm học tập:", err)
  }
}

/* ------------------------------------------------------------------ */
/*  Đọc                                                                */
/* ------------------------------------------------------------------ */

/** Lấy studyDays trong `days` ngày gần nhất (tăng dần theo ngày), đã điền ngày trống = 0. */
export async function getStudyDays(uid: string | null | undefined, days = 7): Promise<StudyDay[]> {
  const all = await getAllStudyDays(uid)
  const byDate = new Map(all.map((d) => [d.date, d]))
  const result: StudyDay[] = []
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = dateKeyDaysAgo(i)
    result.push(byDate.get(date) ?? emptyStudyDay(date))
  }
  return result
}

/** Lấy toàn bộ studyDays (tăng dần theo ngày). */
export async function getAllStudyDays(uid: string | null | undefined): Promise<StudyDay[]> {
  if (!uid) return loadLocalStudyDays(uid).sort((a, b) => a.date.localeCompare(b.date))
  try {
    const snap = await getDocs(collection(db, "users", uid, "studyDays"))
    return snap.docs
      .map((d) => docToStudyDay(d.id, d.data()))
      .sort((a, b) => a.date.localeCompare(b.date))
  } catch (err) {
    console.error("[study-day-service] Lỗi khi đọc studyDays:", err)
    return []
  }
}

/** Điền các ngày trống (không học) vào danh sách để biểu đồ không bị hụt cột. */
export function fillMissingDays(days: StudyDay[], count: number): StudyDay[] {
  const byDate = new Map(days.map((d) => [d.date, d]))
  const out: StudyDay[] = []
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = dateKeyDaysAgo(i)
    out.push(byDate.get(date) ?? emptyStudyDay(date))
  }
  return out
}

/**
 * Lấy studyDays từ ngày `from` (YYYY-MM-DD) tới nay — query có điều kiện
 * (dùng cho biểu đồ tuần, tránh đọc dữ liệu quá cũ).
 */
export async function getStudyDaysSince(
  uid: string | null | undefined,
  from: string
): Promise<StudyDay[]> {
  if (!uid) return loadLocalStudyDays(uid).filter((d) => d.date >= from)
  try {
    const q = query(
      collection(db, "users", uid, "studyDays"),
      where("date", ">=", from),
      orderBy("date", "asc")
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => docToStudyDay(d.id, d.data()))
  } catch (err) {
    console.error("[study-day-service] Lỗi khi đọc studyDays theo khoảng:", err)
    return []
  }
}
