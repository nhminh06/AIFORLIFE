/**
 * Tiến độ "đã học" của từng mẫu câu, lưu ở localStorage.
 * Key gồm slug bộ mẫu câu + uid (hoặc "guest") nên không lẫn giữa các user / bộ.
 * Làm theo cùng pattern với lib/vocab-progress.ts.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore"

import { db } from "@/lib/firebase"

function storageKey(slug: string, uid?: string | null): string {
  return `afl:phrase-learned:${uid || "guest"}:${slug}`
}

function readKeys(slug: string, uid?: string | null): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = window.localStorage.getItem(storageKey(slug, uid))
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((v): v is string => typeof v === "string"))
  } catch {
    return new Set()
  }
}

function writeKeys(slug: string, uid: string | null | undefined, keys: Set<string>): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(storageKey(slug, uid), JSON.stringify([...keys]))
    window.dispatchEvent(new CustomEvent("afl-phrase-progress-updated", { detail: { slug, uid } }))
  } catch {
    // localStorage đầy hoặc bị chặn → bỏ qua, tiến độ chỉ giữ trong phiên này
  }
}

/** Tải tập hợp các câu đã học (key = en.toLowerCase()) của 1 bộ mẫu câu. */
export function loadPhraseProgress(slug: string, uid?: string | null): Set<string> {
  return readKeys(slug, uid)
}

/** Đánh dấu 1 mẫu câu là đã học, trả về tập hợp mới sau khi lưu. */
export function markPhraseLearned(
  slug: string,
  uid: string | null | undefined,
  phraseKey: string
): Set<string> {
  const next = readKeys(slug, uid)
  next.add(phraseKey.toLowerCase())
  writeKeys(slug, uid, next)
  return next
}

/** Bỏ đánh dấu đã học (dùng khi muốn học lại), trả về tập hợp mới. */
export function unmarkPhraseLearned(
  slug: string,
  uid: string | null | undefined,
  phraseKey: string
): Set<string> {
  const next = readKeys(slug, uid)
  next.delete(phraseKey.toLowerCase())
  writeKeys(slug, uid, next)
  return next
}

/* ------------------------------------------------------------------ */
/*  Đồng bộ tiến độ lên Firestore — riêng cho từng user                */
/*  users/{uid}/phraseProgress/{slug} → mọi bộ (cả hệ thống lẫn cá nhân)*/
/* ------------------------------------------------------------------ */

function progressDocPath(uid: string, slug: string) {
  return doc(db, "users", uid, "phraseProgress", slug)
}

/**
 * Đọc tiến độ của 1 bộ từ Firestore (nguồn chuẩn khi đã đăng nhập).
 * Trả về null nếu chưa đăng nhập / chưa có dữ liệu / lỗi.
 */
export async function loadPhraseProgressCloud(
  slug: string,
  uid: string | null | undefined
): Promise<Set<string> | null> {
  if (!uid) return null
  try {
    const snap = await getDoc(progressDocPath(uid, slug))
    if (!snap.exists()) return null
    const raw: unknown = snap.data().learnedKeys
    if (!Array.isArray(raw)) return null
    return new Set(raw.filter((v): v is string => typeof v === "string"))
  } catch (err) {
    console.error("[phrase-progress] Lỗi khi đọc tiến độ từ Firestore:", err)
    return null
  }
}

/** Ghi toàn bộ tiến độ của 1 bộ mẫu câu lên Firestore (theo uid). */
export async function savePhraseProgressCloud(
  slug: string,
  uid: string | null | undefined,
  keys: Set<string>
): Promise<void> {
  if (!uid) return
  try {
    await setDoc(
      progressDocPath(uid, slug),
      { slug, learnedKeys: [...keys], updatedAt: serverTimestamp() },
      { merge: true }
    )
  } catch (err) {
    console.error("[phrase-progress] Lỗi khi lưu tiến độ lên Firestore:", err)
  }
}

/**
 * Đọc tiến độ của MỌI bộ mẫu câu của user một lần (dùng cho trang danh sách:
 * card hiển thị số câu đã học thật thay vì số tĩnh).
 * Trả về map: slug → mảng key các câu đã học.
 */
export async function loadAllPhraseProgress(
  uid: string | null | undefined
): Promise<Record<string, string[]>> {
  if (!uid) return {}
  try {
    const snap = await getDocs(collection(db, "users", uid, "phraseProgress"))
    const out: Record<string, string[]> = {}
    snap.forEach((d) => {
      const raw: unknown = d.data().learnedKeys
      if (Array.isArray(raw)) {
        out[d.id] = raw.filter((v): v is string => typeof v === "string")
      }
    })
    return out
  } catch (err) {
    console.error("[phrase-progress] Lỗi khi đọc toàn bộ tiến độ:", err)
    return {}
  }
}