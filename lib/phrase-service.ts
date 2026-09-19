import { collection, doc, getDoc, getDocs } from "firebase/firestore"

import { db } from "@/lib/firebase"
import { phraseSets as staticPhraseSets, type PhraseSet } from "@/lib/data/phrases"
import { getMyPhraseSetBySlug } from "@/lib/user-phrases"

/* ------------------------------------------------------------------ */
/*  Firestore → PhraseSet mapper                                      */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToPhraseSet(data: Record<string, any>): PhraseSet {
  return {
    slug: data.slug ?? "",
    name: data.name ?? "",
    vi: data.vi ?? "",
    desc: data.desc ?? "",
    situationId: data.situationId ?? "",
    situationLabel: data.situationLabel || undefined,
    level: data.level === "Trung cấp" || data.level === "Nâng cao" ? data.level : "Cơ bản",
    total: data.total ?? 0,
    learned: data.learned ?? 0,
    accent: data.accent ?? "bg-green-600",
    items: (data.items ?? []) as PhraseSet["items"],
  }
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/**
 * Lấy tất cả bộ mẫu câu từ Firestore.
 * Nếu Firestore chưa có dữ liệu hoặc lỗi → trả về dữ liệu tĩnh fallback.
 */
export async function getAllPhraseSets(): Promise<PhraseSet[]> {
  try {
    const colRef = collection(db, "phraseSets")
    const snapshot = await getDocs(colRef)

    if (snapshot.empty) {
      console.warn("[phrase-service] Firestore rỗng → dùng dữ liệu tĩnh")
      return staticPhraseSets
    }

    return snapshot.docs
      .map((d) => docToPhraseSet(d.data()))
      .filter((s) => s.slug)
  } catch (err) {
    console.error("[phrase-service] Lỗi khi lấy từ Firestore:", err)
    return staticPhraseSets
  }
}

/**
 * Lấy 1 bộ mẫu câu theo slug.
 * Ưu tiên bộ cá nhân của user (users/{uid}/phraseSets — slug có tiền tố "my-"),
 * rồi đến Firestore bộ hệ thống, cuối cùng fallback về static data.
 */
export async function getPhraseSetBySlug(
  slug: string,
  uid?: string | null
): Promise<PhraseSet | null> {
  /* Bộ mẫu câu cá nhân của user đang đăng nhập */
  if (uid) {
    const mine = await getMyPhraseSetBySlug(uid, slug)
    if (mine) return mine
  }

  try {
    const docRef = doc(db, "phraseSets", slug)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docToPhraseSet(docSnap.data())
    }

    return staticPhraseSets.find((s) => s.slug === slug) ?? null
  } catch (err) {
    console.error("[phrase-service] Lỗi khi lấy bộ mẫu câu:", err)
    return staticPhraseSets.find((s) => s.slug === slug) ?? null
  }
}
