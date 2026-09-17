import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore"

import { db } from "@/lib/firebase"
import {
  normalizeVocabLevel,
  vocabSets as staticVocabSets,
  type VocabSet,
  type VocabWord,
} from "@/lib/data/vocabulary"
import { getMyVocabSetBySlug } from "@/lib/user-vocab"

/* ------------------------------------------------------------------ */
/*  Firestore → VocabSet mapper                                       */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToVocabSet(data: Record<string, any>): VocabSet {
  return {
    slug: data.slug ?? "",
    name: data.name ?? "",
    vi: data.vi ?? "",
    desc: data.desc ?? "",
    topicId: data.topicId ?? "",
    level: normalizeVocabLevel(data.level),
    total: data.total ?? 0,
    learned: data.learned ?? 0,
    accent: data.accent ?? "bg-slate-500",
    icon: data.icon ?? undefined,
    words: (data.words ?? []) as VocabWord[],
  }
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/**
 * Lấy tất cả bộ từ vựng từ Firestore.
 * Nếu Firestore chưa có dữ liệu hoặc lỗi → trả về dữ liệu tĩnh fallback.
 */
export async function getAllVocabSets(): Promise<VocabSet[]> {
  try {
    const colRef = collection(db, "vocabSets")
    const snapshot = await getDocs(colRef)

    if (snapshot.empty) {
      console.warn("[vocab-service] Firestore rỗng → dùng dữ liệu tĩnh")
      return staticVocabSets
    }

    return snapshot.docs.map((d) => docToVocabSet(d.data()))
  } catch (err) {
    console.error("[vocab-service] Lỗi khi lấy từ Firestore:", err)
    return staticVocabSets
  }
}

/**
 * Lấy 1 bộ từ vựng theo slug.
 * Ưu tiên bộ từ cá nhân của user đang đăng nhập (nếu có uid),
 * sau đó tới Firestore (bộ từ hệ thống), cuối cùng là static data.
 */
export async function getVocabSetBySlug(slug: string, uid?: string): Promise<VocabSet | null> {
  // Bộ từ do chính user tạo — nằm ở users/{uid}/vocabSets
  if (uid) {
    const own = await getMyVocabSetBySlug(uid, slug)
    if (own) return own
  }

  try {
    const docRef = doc(db, "vocabSets", slug)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docToVocabSet(docSnap.data())
    }

    // Fallback: tìm trong static
    return staticVocabSets.find((s) => s.slug === slug) ?? null
  } catch (err) {
    console.error("[vocab-service] Lỗi khi lấy bộ từ:", err)
    return staticVocabSets.find((s) => s.slug === slug) ?? null
  }
}

/**
 * Lấy các bộ từ vựng theo topicId.
 */
export async function getVocabSetsByTopic(topicId: string): Promise<VocabSet[]> {
  try {
    const colRef = collection(db, "vocabSets")
    const q = query(colRef, where("topicId", "==", topicId))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return staticVocabSets.filter((s) => s.topicId === topicId)
    }

    return snapshot.docs.map((d) => docToVocabSet(d.data()))
  } catch (err) {
    console.error("[vocab-service] Lỗi khi lấy theo topic:", err)
    return staticVocabSets.filter((s) => s.topicId === topicId)
  }
}
