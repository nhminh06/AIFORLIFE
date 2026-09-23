/**
 * Kho dữ liệu tiến độ cho CHẾ ĐỘ KHÁCH (chưa đăng nhập) — lưu ở localStorage.
 * Cùng cấu trúc với dữ liệu trên Firestore để khi đăng nhập có thể di trú
 * lên cloud mà không phải đổi kiểu dữ liệu.
 */

import { todayKey } from "@/lib/daily-vocab"
import type { ProgressSummary, StudyDay, StudyEvent, StudyEventType } from "@/lib/progress/types"

const DAYS_KEY = "afl:study-days"
const EVENTS_KEY = "afl:study-events"
const BADGES_KEY = "afl:badges"

/** Sự kiện báo cho UI biết số liệu tiến độ vừa thay đổi */
export const PROGRESS_UPDATED_EVENT = "afl-progress-updated"

export function emitProgressUpdated(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(PROGRESS_UPDATED_EVENT))
}

function storageKey(base: string, uid?: string | null): string {
  return `${base}:${uid || "guest"}`
}

/* ------------------------------------------------------------------ */
/*  studyDays                                                          */
/* ------------------------------------------------------------------ */

function emptyDay(date: string): StudyDay {
  return {
    date,
    seconds: 0,
    minutes: 0,
    wordsLearned: 0,
    phrasesLearned: 0,
    grammarCompleted: 0,
    exercisesCompleted: 0,
    reviews: 0,
    xp: 0,
  }
}

function readDays(uid?: string | null): StudyDay[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(storageKey(DAYS_KEY, uid))
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((d): d is StudyDay => !!d && typeof (d as StudyDay).date === "string")
  } catch {
    return []
  }
}

function writeDays(uid: string | null | undefined, days: StudyDay[]): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(storageKey(DAYS_KEY, uid), JSON.stringify(days))
  } catch {
    /* localStorage đầy hoặc bị chặn → bỏ qua */
  }
}

function upsertDay(uid: string | null | undefined, date: string, patch: Partial<StudyDay>): StudyDay {
  const days = readDays(uid)
  const index = days.findIndex((d) => d.date === date)
  const current = index >= 0 ? days[index] : emptyDay(date)
  const next: StudyDay = { ...current, ...patch, date }
  next.minutes = Math.round(next.seconds / 60)
  if (index >= 0) days[index] = next
  else days.push(next)
  days.sort((a, b) => a.date.localeCompare(b.date))
  writeDays(uid, days)
  return next
}

export function addLocalStudySeconds(uid: string | null | undefined, seconds: number): void {
  if (seconds <= 0) return
  const date = todayKey()
  const current = readDays(uid).find((d) => d.date === date) ?? emptyDay(date)
  upsertDay(uid, date, { seconds: Math.min(current.seconds + seconds, 24 * 3600) })
  emitProgressUpdated()
}

export type StudyCountersPatch = {
  wordsLearned?: number
  phrasesLearned?: number
  grammarCompleted?: number
  exercisesCompleted?: number
  reviews?: number
  xp?: number
}

export function addLocalStudyCounters(uid: string | null | undefined, patch: StudyCountersPatch): void {
  const date = todayKey()
  const current = readDays(uid).find((d) => d.date === date) ?? emptyDay(date)
  upsertDay(uid, date, {
    wordsLearned: Math.max(0, current.wordsLearned + (patch.wordsLearned ?? 0)),
    phrasesLearned: Math.max(0, current.phrasesLearned + (patch.phrasesLearned ?? 0)),
    grammarCompleted: Math.max(0, current.grammarCompleted + (patch.grammarCompleted ?? 0)),
    exercisesCompleted: Math.max(0, current.exercisesCompleted + (patch.exercisesCompleted ?? 0)),
    reviews: Math.max(0, current.reviews + (patch.reviews ?? 0)),
    xp: Math.max(0, current.xp + (patch.xp ?? 0)),
  })
  emitProgressUpdated()
}

export function loadLocalStudyDays(uid?: string | null): StudyDay[] {
  return readDays(uid)
}

/* ------------------------------------------------------------------ */
/*  studyEvents                                                        */
/* ------------------------------------------------------------------ */

function readEvents(uid?: string | null): StudyEvent[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(storageKey(EVENTS_KEY, uid))
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((e): e is StudyEvent => !!e && typeof (e as StudyEvent).id === "string")
  } catch {
    return []
  }
}

function writeEvents(uid: string | null | undefined, events: StudyEvent[]): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(storageKey(EVENTS_KEY, uid), JSON.stringify(events.slice(-200)))
  } catch {
    /* bỏ qua */
  }
}

/** Gộp sự kiện cùng id (theo ngày + đối tượng) — giống hành vi setDoc merge trên Firestore */
export function upsertLocalStudyEvent(
  uid: string | null | undefined,
  input: {
    id: string
    type: StudyEventType
    refId: string
    title: string
    count?: number
    xp?: number
    score?: number
    total?: number
    detail?: string
  }
): void {
  const events = readEvents(uid)
  const date = todayKey()
  const index = events.findIndex((e) => e.id === input.id)
  if (index >= 0) {
    const current = events[index]
    events[index] = {
      ...current,
      title: input.title || current.title,
      count: current.count + Math.max(1, input.count ?? 1),
      xp: current.xp + (input.xp ?? 0),
      score: input.score ?? current.score,
      total: input.total ?? current.total,
      detail: input.detail || current.detail,
      at: Date.now(),
    }
  } else {
    events.push({
      id: input.id,
      type: input.type,
      refId: input.refId,
      title: input.title,
      date,
      at: Date.now(),
      count: Math.max(1, input.count ?? 1),
      xp: input.xp ?? 0,
      score: input.score,
      total: input.total,
      detail: input.detail,
    })
  }
  writeEvents(uid, events)
  emitProgressUpdated()
}

export function loadLocalStudyEvents(uid?: string | null, limit = 20): StudyEvent[] {
  return [...readEvents(uid)].sort((a, b) => b.at - a.at).slice(0, limit)
}

/* ------------------------------------------------------------------ */
/*  badges (chế độ khách)                                              */
/* ------------------------------------------------------------------ */

export function loadLocalBadges(uid?: string | null): Record<string, string> {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(storageKey(BADGES_KEY, uid))
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {}
  } catch {
    return {}
  }
}

export function addLocalBadges(uid: string | null | undefined, ids: string[]): void {
  if (typeof window === "undefined" || ids.length === 0) return
  const badges = loadLocalBadges(uid)
  const now = new Date().toISOString()
  ids.forEach((id) => {
    if (!badges[id]) badges[id] = now
  })
  try {
    window.localStorage.setItem(storageKey(BADGES_KEY, uid), JSON.stringify(badges))
  } catch {
    /* bỏ qua */
  }
}

/* ------------------------------------------------------------------ */
/*  Tổng hợp cho chế độ khách                                          */
/* ------------------------------------------------------------------ */

export function emptyProgressSummary(): ProgressSummary {
  return {
    totalXp: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: "",
    activeDays: 0,
    totalMinutes: 0,
    wordsLearnedTotal: 0,
  }
}

/** Xóa sạch dữ liệu tiến độ local của 1 tài khoản (dùng sau khi di trú lên cloud) */
export function clearLocalProgress(uid?: string | null): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(storageKey(DAYS_KEY, uid))
    window.localStorage.removeItem(storageKey(EVENTS_KEY, uid))
  } catch {
    /* bỏ qua */
  }
  emitProgressUpdated()
}
