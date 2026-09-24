/**
 * Tổng hợp hành trình học (users/{uid}/stats/summary) — nguồn cho
 * thẻ "Ngày liên tiếp", "Tổng điểm XP" và huy hiệu.
 *
 * Summary được TÍNH LẠI từ studyDays mỗi lần mở trang Tiến độ (rẻ: mỗi ngày
 * 1 doc) rồi ghi đè lại doc summary để các nơi khác đọc nhanh.
 */

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"
import { emptyProgressSummary, loadLocalStudyDays } from "@/lib/progress/local-store"
import { dateKeyDaysAgo, getAllStudyDays } from "@/lib/progress/study-day-service"
import type { ProgressSummary, StudyDay } from "@/lib/progress/types"

/** 1 ngày được coi là có học khi có thời gian học hoặc có bất kỳ hoạt động nào */
function isActiveDay(day: StudyDay): boolean {
  return (
    day.seconds > 0 ||
    day.xp > 0 ||
    day.wordsLearned > 0 ||
    day.phrasesLearned > 0 ||
    day.grammarCompleted > 0 ||
    day.exercisesCompleted > 0 ||
    day.lessonsCompleted > 0 ||
    day.reviews > 0
  )
}

/**
 * Tính summary từ danh sách studyDays (hàm thuần, dễ test).
 * - currentStreak: đếm lùi từ hôm nay; nếu hôm nay chưa học thì bắt đầu từ hôm qua
 *   (để ban ngày chưa học vẫn giữ được chuỗi).
 * - longestStreak: chuỗi dài nhất trong khoảng dữ liệu đang có.
 */
export function computeSummary(days: StudyDay[]): ProgressSummary {
  const active = days.filter(isActiveDay).sort((a, b) => a.date.localeCompare(b.date))
  if (active.length === 0) return emptyProgressSummary()

  const activeDates = new Set(active.map((d) => d.date))

  /* --- chuỗi hiện tại --- */
  let currentStreak = 0
  let cursor = activeDates.has(dateKeyDaysAgo(0)) ? 0 : 1
  /* nếu cả hôm nay lẫn hôm qua đều không học → chuỗi đã đứt */
  if (!activeDates.has(dateKeyDaysAgo(cursor))) {
    cursor = -1
  }
  while (cursor >= 0 && activeDates.has(dateKeyDaysAgo(cursor))) {
    currentStreak += 1
    cursor += 1
  }

  /* --- chuỗi dài nhất --- */
  let longestStreak = 1
  let run = 1
  for (let i = 1; i < active.length; i += 1) {
    const prev = new Date(`${active[i - 1].date}T00:00:00`)
    const curr = new Date(`${active[i].date}T00:00:00`)
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000)
    run = diffDays === 1 ? run + 1 : 1
    if (run > longestStreak) longestStreak = run
  }

  return {
    totalXp: active.reduce((sum, d) => sum + d.xp, 0),
    currentStreak,
    longestStreak,
    lastStudyDate: active[active.length - 1].date,
    activeDays: active.length,
    totalMinutes: active.reduce((sum, d) => sum + d.minutes, 0),
    wordsLearnedTotal: active.reduce((sum, d) => sum + d.wordsLearned, 0),
  }
}

/** Đọc summary đã lưu trên Firestore (nhanh, không tính lại). */
export async function getStoredSummary(uid: string): Promise<ProgressSummary | null> {
  try {
    const snap = await getDoc(doc(db, "users", uid, "stats", "summary"))
    if (!snap.exists()) return null
    const data = snap.data()
    return {
      totalXp: Number(data.totalXp ?? 0),
      currentStreak: Number(data.currentStreak ?? 0),
      longestStreak: Number(data.longestStreak ?? 0),
      lastStudyDate: data.lastStudyDate ?? "",
      activeDays: Number(data.activeDays ?? 0),
      totalMinutes: Number(data.totalMinutes ?? 0),
      wordsLearnedTotal: Number(data.wordsLearnedTotal ?? 0),
    }
  } catch (err) {
    console.error("[summary-service] Lỗi khi đọc summary:", err)
    return null
  }
}

/**
 * Lưu snapshot summary đã tính sẵn (tránh đọc lại studyDays).
 * Lỗi chỉ log, không chặn UI.
 */
export async function saveProgressSummary(uid: string, summary: ProgressSummary): Promise<void> {
  try {
    await setDoc(
      doc(db, "users", uid, "stats", "summary"),
      { ...summary, updatedAt: serverTimestamp() },
      { merge: true }
    )
  } catch (err) {
    console.error("[summary-service] Lỗi khi lưu summary:", err)
  }
}

/**
 * Tính lại summary từ studyDays rồi lưu vào users/{uid}/stats/summary.
 * Lỗi ghi chỉ log, không chặn UI.
 */
export async function refreshProgressSummary(uid: string | null | undefined): Promise<ProgressSummary> {
  if (!uid) return computeSummary(loadLocalStudyDays(uid))

  const days = await getAllStudyDays(uid)
  const summary = computeSummary(days)
  await saveProgressSummary(uid, summary)
  return summary
}
