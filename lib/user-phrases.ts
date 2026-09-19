import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore"

import { db } from "@/lib/firebase"
import type { PhraseItem, PhraseSet } from "@/lib/data/phrases"
import { slugify } from "@/lib/user-vocab"

/* ------------------------------------------------------------------ */
/*  Bộ mẫu câu cá nhân                                                 */
/*  Lưu ở subcollection: users/{uid}/phraseSets/{slug}                 */
/*  → mỗi người dùng chỉ thấy & dùng được bộ mẫu câu do chính mình tạo. */
/* ------------------------------------------------------------------ */

/** Cách tạo bộ mẫu câu: thủ công hoặc do AI sinh ra */
export type PhraseSetSource = "manual" | "ai"

export type MyPhraseSet = PhraseSet & {
  ownerId: string
  source: PhraseSetSource
}

export type CreatePhraseSetInput = {
  name: string
  vi: string
  desc: string
  situationId: string
  /** nhãn tình huống tùy chỉnh khi người dùng tự nhập tình huống mới */
  situationLabel?: string
  level: PhraseSet["level"]
  accent: string
  items: PhraseItem[]
  source?: PhraseSetSource
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function myPhraseCollection(uid: string) {
  return collection(db, "users", uid, "phraseSets")
}

/** Slug bộ mẫu câu cá nhân, tiền tố "my-" để tách khỏi bộ hệ thống */
export function makeMyPhraseSlug(name: string) {
  const base = slugify(name) || "bo-mau-cau"
  const rand = Math.random().toString(36).slice(2, 6)
  return `my-${base}-${rand}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToMyPhraseSet(data: Record<string, any>): MyPhraseSet {
  return {
    slug: data.slug ?? "",
    name: data.name ?? "",
    vi: data.vi ?? "",
    desc: data.desc ?? "",
    situationId: data.situationId ?? "",
    situationLabel: data.situationLabel || undefined,
    level:
      data.level === "Trung cấp" || data.level === "Nâng cao" ? data.level : "Cơ bản",
    total: data.total ?? (data.items?.length ?? 0),
    learned: data.learned ?? 0,
    accent: data.accent ?? "bg-green-600",
    items: (data.items ?? []) as PhraseItem[],
    ownerId: data.ownerId ?? "",
    source: data.source === "ai" ? "ai" : "manual",
  }
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/** Lấy toàn bộ bộ mẫu câu do user hiện tại tạo (mới nhất lên đầu). */
export async function getMyPhraseSets(uid: string): Promise<MyPhraseSet[]> {
  const snapshot = await getDocs(myPhraseCollection(uid))
  return snapshot.docs
    .map((d) => docToMyPhraseSet(d.data()))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** Lấy 1 bộ mẫu câu cá nhân theo slug (chỉ của user đang đăng nhập). */
export async function getMyPhraseSetBySlug(
  uid: string,
  slug: string
): Promise<MyPhraseSet | null> {
  try {
    const snap = await getDoc(doc(myPhraseCollection(uid), slug))
    return snap.exists() ? docToMyPhraseSet(snap.data()) : null
  } catch (err) {
    console.error("[user-phrases] Lỗi khi lấy bộ mẫu câu cá nhân:", err)
    return null
  }
}

/** Tạo bộ mẫu câu cá nhân mới và trả về dữ liệu đã lưu. */
export async function createMyPhraseSet(
  uid: string,
  input: CreatePhraseSetInput
): Promise<MyPhraseSet> {
  const slug = makeMyPhraseSlug(input.name)
  const items = input.items

  const payload = {
    slug,
    name: input.name.trim(),
    vi: input.vi.trim(),
    desc: input.desc.trim(),
    situationId: input.situationId,
    /* Firestore không nhận field undefined → chỉ thêm khi có nhãn tùy chỉnh */
    ...(input.situationLabel?.trim()
      ? { situationLabel: input.situationLabel.trim() }
      : {}),
    level: input.level,
    total: items.length,
    learned: 0,
    accent: input.accent,
    items,
    ownerId: uid,
    source: input.source ?? "manual",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(doc(myPhraseCollection(uid), slug), payload)

  return {
    slug,
    name: payload.name,
    vi: payload.vi,
    desc: payload.desc,
    situationId: payload.situationId,
    situationLabel: input.situationLabel?.trim() || undefined,
    level: payload.level,
    total: payload.total,
    learned: payload.learned,
    accent: payload.accent,
    items: payload.items,
    ownerId: uid,
    source: payload.source,
  }
}

/** Xóa 1 bộ mẫu câu cá nhân. */
export async function deleteMyPhraseSet(uid: string, slug: string): Promise<void> {
  await deleteDoc(doc(myPhraseCollection(uid), slug))
}

/**
 * Đồng bộ số câu đã học của bộ mẫu câu cá nhân lên Firestore.
 * Nhờ vậy thanh tiến độ trên card ở trang danh sách luôn khớp với
 * tiến độ thật trên trang chi tiết. Lỗi chỉ log, không làm gián đoạn UI.
 */
export async function syncMyPhraseLearned(
  uid: string,
  slug: string,
  learned: number
): Promise<void> {
  try {
    await updateDoc(doc(myPhraseCollection(uid), slug), {
      learned: Math.max(0, Math.trunc(learned)),
      updatedAt: serverTimestamp(),
    })
  } catch (err) {
    console.error("[user-phrases] Lỗi khi đồng bộ tiến độ mẫu câu:", err)
  }
}
