import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore"

import { db } from "@/lib/firebase"
import type { VocabWord } from "@/lib/data/vocabulary"

/* ------------------------------------------------------------------ */
/*  Câu ví dụ AI cho từng từ vựng                                      */
/*  Lưu ở subcollection: users/{uid}/vocabExamples/{wordKey}           */
/*  → mỗi từ giữ đúng 1 câu ví dụ, lần sau mở lại không cần gọi AI.    */
/* ------------------------------------------------------------------ */

function examplesCollection(uid: string) {
  return collection(db, "users", uid, "vocabExamples")
}

/** Khóa document của 1 từ — luôn viết thường để không phân biệt hoa/thường. */
function wordKey(en: string): string {
  return en.trim().toLowerCase()
}

/** Đọc câu ví dụ đã lưu của 1 từ. Không có / lỗi → null (sẽ gọi AI tạo mới). */
export async function getSavedVocabExample(uid: string, en: string): Promise<string | null> {
  try {
    const snap = await getDoc(doc(examplesCollection(uid), wordKey(en)))
    if (!snap.exists()) return null
    const data = snap.data() as { example?: unknown }
    return typeof data.example === "string" && data.example.trim() ? data.example.trim() : null
  } catch (err) {
    console.error("[vocab-examples] Lỗi khi đọc câu ví dụ đã lưu:", err)
    return null
  }
}

/** Lưu/cập nhật câu ví dụ của 1 từ (mỗi từ chỉ giữ 1 câu — ghi đè câu cũ). */
export async function saveVocabExample(
  uid: string,
  word: VocabWord,
  example: string
): Promise<void> {
  const trimmed = example.trim()
  if (!word.en.trim() || !trimmed) return
  try {
    await setDoc(doc(examplesCollection(uid), wordKey(word.en)), {
      en: word.en.trim(),
      ipa: word.ipa ?? "",
      type: word.type,
      vi: word.vi ?? "",
      example: trimmed,
      updatedAt: serverTimestamp(),
    })
  } catch (err) {
    // Lưu thất bại không ảnh hưởng trải nghiệm — câu vẫn hiện từ kết quả AI
    console.error("[vocab-examples] Lỗi khi lưu câu ví dụ:", err)
  }
}
