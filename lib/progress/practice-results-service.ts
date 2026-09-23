/**
 * Kết quả bài luyện tập (users/{uid}/practiceResults/{exerciseId}) — áp dụng
 * cho MỌI bài (cả bài hệ thống lẫn bài AI), khác với
 * users/{uid}/practiceExercises chỉ lưu nội dung bài do AI tạo.
 *
 * Nhờ vậy trang Tiến độ tính được "Bài hoàn thành" và huy hiệu "Perfect 10"
 * trên mọi thiết bị.
 */

import { collection, doc, getDocs, runTransaction, serverTimestamp } from "firebase/firestore"

import { db } from "@/lib/firebase"
import { todayKey } from "@/lib/daily-vocab"

export type PracticeResultRecord = {
  exerciseId: string
  name: string
  vi: string
  typeId: string
  /** nhãn loại bài luyện, VD "Nghe – chọn đáp án" */
  kindLabel: string
  /** điểm cao nhất từng đạt */
  bestScore: number
  bestTotal: number
  /** lần làm gần nhất */
  score: number
  total: number
  attempts: number
  /** thời điểm lần cuối (ms) */
  lastAt: number
}

export type PracticeCompletionInput = {
  exerciseId: string
  name: string
  vi: string
  typeId: string
  kindLabel: string
  score: number
  total: number
}

function resultRef(uid: string, exerciseId: string) {
  return doc(db, "users", uid, "practiceResults", exerciseId)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToResult(exerciseId: string, data: Record<string, any>): PracticeResultRecord {
  return {
    exerciseId,
    name: data.name ?? "",
    vi: data.vi ?? "",
    typeId: data.typeId ?? "",
    kindLabel: data.kindLabel ?? "",
    bestScore: Number(data.bestScore ?? 0),
    bestTotal: Number(data.bestTotal ?? 0),
    score: Number(data.score ?? 0),
    total: Number(data.total ?? 0),
    attempts: Number(data.attempts ?? 0),
    lastAt: data.lastAt?.toMillis?.() ?? 0,
  }
}

/** Lưu kết quả 1 lần hoàn thành bài luyện (điểm cao nhất được giữ lại). */
export async function savePracticeResult(
  uid: string | null | undefined,
  input: PracticeCompletionInput
): Promise<void> {
  if (!uid) return
  try {
    const ref = resultRef(uid, input.exerciseId)
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref)
      const prev = snap.exists() ? snap.data() : null
      const prevBest = Number(prev?.bestScore ?? -1)
      const prevBestTotal = Number(prev?.bestTotal ?? 0)
      /* so sánh theo điểm thô; nếu bằng nhau thì giữ bản có nhiều câu hỏi hơn */
      const isBetter =
        prevBest < 0 ||
        input.score > prevBest ||
        (input.score === prevBest && input.total > prevBestTotal)

      tx.set(
        ref,
        {
          exerciseId: input.exerciseId,
          name: input.name,
          vi: input.vi,
          typeId: input.typeId,
          kindLabel: input.kindLabel,
          score: input.score,
          total: input.total,
          bestScore: isBetter ? input.score : prevBest,
          bestTotal: isBetter ? input.total : prevBestTotal,
          attempts: (Number(prev?.attempts ?? 0) || 0) + 1,
          lastDate: todayKey(),
          lastAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
    })
  } catch (err) {
    console.error("[practice-results-service] Lỗi khi lưu kết quả bài luyện:", err)
  }
}

/** Đọc toàn bộ kết quả bài luyện của user (map exerciseId → record). */
export async function getAllPracticeResults(
  uid: string | null | undefined
): Promise<Record<string, PracticeResultRecord>> {
  if (!uid) return {}
  try {
    const snap = await getDocs(collection(db, "users", uid, "practiceResults"))
    const out: Record<string, PracticeResultRecord> = {}
    snap.forEach((d) => {
      out[d.id] = docToResult(d.id, d.data())
    })
    return out
  } catch (err) {
    console.error("[practice-results-service] Lỗi khi đọc kết quả bài luyện:", err)
    return {}
  }
}
