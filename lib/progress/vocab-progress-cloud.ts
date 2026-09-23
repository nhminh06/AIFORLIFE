/**
 * Đồng bộ tiến độ từ vựng lên Firestore — bổ sung cho lib/vocab-progress.ts
 * (localStorage). Thiết kế giống hệt lib/phrase-progress.ts:
 *
 *   users/{uid}/vocabProgress/{setSlug} = { slug, learnedKeys, updatedDate, updatedAt }
 *
 * Nhờ vậy trang Tiến độ tính được số từ đã học thật trên mọi thiết bị.
 */

import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"
import { todayKey } from "@/lib/daily-vocab"
import { emitProgressUpdated } from "@/lib/progress/local-store"

function progressDocPath(uid: string, slug: string) {
  return doc(db, "users", uid, "vocabProgress", slug)
}

function keysToArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((v): v is string => typeof v === "string")
}

/** Đọc tiến độ 1 bộ từ từ Firestore (null nếu chưa có / lỗi). */
export async function loadVocabProgressCloud(
  slug: string,
  uid: string | null | undefined
): Promise<Set<string> | null> {
  if (!uid) return null
  try {
    const snap = await getDoc(progressDocPath(uid, slug))
    if (!snap.exists()) return null
    return new Set(keysToArray(snap.data().learnedKeys))
  } catch (err) {
    console.error("[vocab-progress-cloud] Lỗi khi đọc tiến độ:", err)
    return null
  }
}

/** Ghi toàn bộ tiến độ 1 bộ từ lên Firestore. */
export async function saveVocabProgressCloud(
  slug: string,
  uid: string | null | undefined,
  keys: Set<string>
): Promise<void> {
  if (!uid) return
  try {
    await setDoc(
      progressDocPath(uid, slug),
      {
        slug,
        learnedKeys: [...keys],
        updatedDate: todayKey(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )
    emitProgressUpdated()
  } catch (err) {
    console.error("[vocab-progress-cloud] Lỗi khi lưu tiến độ:", err)
  }
}

/**
 * Đọc tiến độ của MỌI bộ từ của user một lần (trang Tiến độ / Dashboard).
 * Trả về map: slug → mảng key các từ đã thuộc.
 */
export async function loadAllVocabProgress(
  uid: string | null | undefined
): Promise<Record<string, string[]>> {
  if (!uid) return {}
  try {
    const snap = await getDocs(collection(db, "users", uid, "vocabProgress"))
    const out: Record<string, string[]> = {}
    snap.forEach((d) => {
      const keys = keysToArray(d.data().learnedKeys)
      if (keys.length > 0) out[d.id] = keys
    })
    return out
  } catch (err) {
    console.error("[vocab-progress-cloud] Lỗi khi đọc toàn bộ tiến độ:", err)
    return {}
  }
}

/* ------------------------------------------------------------------ */
/*  Ghi gộp (debounce) — tránh gọi Firestore liên tục khi tick từng từ */
/* ------------------------------------------------------------------ */

const pendingSync = new Map<string, ReturnType<typeof setTimeout>>()

/**
 * Hẹn giờ đồng bộ tiến độ 1 bộ từ lên Firestore sau 1,5 giây.
 * Nhiều lần tick liên tiếp chỉ tạo 1 lần ghi với dữ liệu mới nhất.
 */
export function queueVocabProgressSync(
  uid: string | null | undefined,
  slug: string,
  keys: Set<string>
): void {
  if (!uid || typeof window === "undefined") return
  const key = `${uid}:${slug}`
  const existing = pendingSync.get(key)
  if (existing) clearTimeout(existing)
  const timer = setTimeout(() => {
    pendingSync.delete(key)
    void saveVocabProgressCloud(slug, uid, keys)
  }, 1500)
  pendingSync.set(key, timer)
}
