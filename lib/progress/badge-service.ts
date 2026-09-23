/**
 * Huy hiệu thành tích — xét điều kiện, lưu huy hiệu đã đạt và ghi sự kiện.
 *
 * - Đã đăng nhập: users/{uid}/badges/{badgeId} = { id, earnedAt, date }
 * - Khách: lưu ở localStorage (afl:badges:guest)
 *
 * evaluateBadges() là hàm thuần nên có thể test trực tiếp.
 */

import { collection, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"
import { badgeThresholds } from "@/lib/progress/progress-config"
import { loadLocalBadges, addLocalBadges } from "@/lib/progress/local-store"
import { recordStudyEvent } from "@/lib/progress/study-event-service"
import type { BadgeMetrics } from "@/lib/progress/types"

/** Điều kiện mở khoá từng huy hiệu (id khớp với lib/data/progress.ts) */
export const badgeCriteria: Record<string, (m: BadgeMetrics) => boolean> = {
  "first-steps": (m) => m.wordsLearnedTotal >= badgeThresholds.firstWord,
  "week-streak": (m) => m.longestStreak >= badgeThresholds.streakWeek,
  "word-100": (m) => m.wordsLearnedTotal >= badgeThresholds.words100,
  "perfect-score": (m) => m.perfectScores >= 1,
  speaker: (m) => m.phrasesLearnedTotal >= badgeThresholds.phrasesToSpeak,
  "word-1000": (m) => m.wordsLearnedTotal >= badgeThresholds.words1000,
  "grammar-master": (m) => m.grammarTotal > 0 && m.grammarLearned >= m.grammarTotal,
  "month-streak": (m) => m.longestStreak >= badgeThresholds.streakMonth,
}

/** Danh sách id huy hiệu vừa đủ điều kiện và chưa từng đạt. */
export function evaluateBadges(metrics: BadgeMetrics, earnedIds: Iterable<string>): string[] {
  const earned = new Set(earnedIds)
  return Object.entries(badgeCriteria)
    .filter(([id, ok]) => !earned.has(id) && ok(metrics))
    .map(([id]) => id)
}

/** Đọc map id → thời điểm đạt (ISO) của các huy hiệu đã mở khoá. */
export async function getEarnedBadges(uid: string | null | undefined): Promise<Record<string, string>> {
  if (!uid) return loadLocalBadges(uid)
  try {
    const snap = await getDocs(collection(db, "users", uid, "badges"))
    const out: Record<string, string> = {}
    snap.forEach((d) => {
      const data = d.data()
      const at = data.earnedAt?.toDate?.() as Date | undefined
      out[d.id] = (at ?? new Date()).toISOString()
    })
    return out
  } catch (err) {
    console.error("[badge-service] Lỗi khi đọc huy hiệu:", err)
    return {}
  }
}

/**
 * Xét & lưu các huy hiệu mới đạt được.
 * Trả về danh sách id huy hiệu vừa được mở khoá trong lần gọi này.
 */
export async function syncEarnedBadges(
  uid: string | null | undefined,
  metrics: BadgeMetrics,
  badgeTitles: Record<string, string> = {}
): Promise<string[]> {
  const earned = await getEarnedBadges(uid)
  const newIds = evaluateBadges(metrics, Object.keys(earned))
  if (newIds.length === 0) return []

  if (!uid) {
    addLocalBadges(uid, newIds)
    newIds.forEach((id) => {
      void recordStudyEvent(uid, { type: "badge", refId: id, title: badgeTitles[id] ?? id, xp: 0 })
    })
    return newIds
  }

  for (const id of newIds) {
    try {
      await setDoc(
        doc(db, "users", uid, "badges", id),
        { id, earnedAt: serverTimestamp(), date: new Date().toISOString().slice(0, 10) },
        { merge: true }
      )
      void recordStudyEvent(uid, { type: "badge", refId: id, title: badgeTitles[id] ?? id, xp: 0 })
    } catch (err) {
      console.error("[badge-service] Lỗi khi lưu huy hiệu:", err)
    }
  }

  return newIds
}
