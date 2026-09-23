/**
 * Đồng bộ tiến độ ngữ pháp lên Firestore — bổ sung cho
 * lib/grammar-progress.ts (localStorage).
 *
 *   users/{uid}/grammarProgress/{topicSlug} = { slug, learned, updatedDate, updatedAt }
 */

import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"
import { todayKey } from "@/lib/daily-vocab"
import { emitProgressUpdated } from "@/lib/progress/local-store"

function grammarProgressRef(uid: string, slug: string) {
  return doc(db, "users", uid, "grammarProgress", slug)
}

/** Đọc tập slug các chủ điểm ngữ pháp đã hoàn thành của user. */
export async function loadAllGrammarProgress(uid: string | null | undefined): Promise<Set<string>> {
  if (!uid) return new Set()
  try {
    const snap = await getDocs(collection(db, "users", uid, "grammarProgress"))
    const out = new Set<string>()
    snap.forEach((d) => {
      if (d.data().learned !== false) out.add(d.id)
    })
    return out
  } catch (err) {
    console.error("[grammar-progress-cloud] Lỗi khi đọc tiến độ ngữ pháp:", err)
    return new Set()
  }
}

/** Lưu / xoá trạng thái hoàn thành 1 chủ điểm ngữ pháp. */
export async function saveGrammarLearnedCloud(
  uid: string | null | undefined,
  slug: string,
  learned: boolean
): Promise<void> {
  if (!uid) return
  try {
    if (learned) {
      await setDoc(
        grammarProgressRef(uid, slug),
        { slug, learned: true, updatedDate: todayKey(), updatedAt: serverTimestamp() },
        { merge: true }
      )
    } else {
      await deleteDoc(grammarProgressRef(uid, slug))
    }
    emitProgressUpdated()
  } catch (err) {
    console.error("[grammar-progress-cloud] Lỗi khi lưu tiến độ ngữ pháp:", err)
  }
}
