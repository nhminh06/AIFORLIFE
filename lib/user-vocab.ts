import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore"

import { db } from "@/lib/firebase"
import { normalizeVocabLevel } from "@/lib/data/vocabulary"
import type { CustomTopicColor, VocabLevel, VocabSet, VocabWord } from "@/lib/data/vocabulary"

/* ------------------------------------------------------------------ */
/*  Bộ từ vựng cá nhân                                                 */
/*  Lưu ở subcollection: users/{uid}/vocabSets/{slug}                  */
/*  → mỗi người dùng chỉ thấy & dùng được bộ từ do chính mình tạo.     */
/* ------------------------------------------------------------------ */

/** Cách tạo bộ từ: thủ công hoặc do AI sinh ra */
export type VocabSetSource = NonNullable<VocabSet["source"]>

export type CreateVocabSetInput = {
  name: string
  vi: string
  desc: string
  /** chủ đề có sẵn (id hệ thống) hoặc id chủ đề riêng do người dùng tạo */
  topicId: string
  level: VocabLevel
  accent: string
  /** icon minh họa cho cả bộ từ — key trong setIconOptions */
  icon?: string
  words: VocabWord[]
  source?: VocabSetSource
  /** tên chủ đề riêng — chỉ truyền khi người dùng tự tạo chủ đề mới */
  topicLabel?: string
  /** màu chủ đề riêng — chỉ truyền khi người dùng tự tạo chủ đề mới */
  topicColor?: CustomTopicColor
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function myVocabCollection(uid: string) {
  return collection(db, "users", uid, "vocabSets")
}

/** "Từ vựng du lịch" → "tu-vung-du-lich" */
export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
}

/** Slug bộ từ cá nhân, luôn có tiền tố "my-" để tách khỏi bộ từ hệ thống */
export function makeMyVocabSlug(name: string) {
  const base = slugify(name) || "bo-tu"
  const rand = Math.random().toString(36).slice(2, 6)
  return `my-${base}-${rand}`
}

/** Slug chủ đề riêng do người dùng tạo, tiền tố "ct-" để tách khỏi chủ đề hệ thống */
export function makeCustomTopicId(label: string) {
  return `ct-${slugify(label) || "chu-de"}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToMyVocabSet(data: Record<string, any>): VocabSet {
  return {
    slug: data.slug ?? "",
    name: data.name ?? "",
    vi: data.vi ?? "",
    desc: data.desc ?? "",
    topicId: data.topicId ?? "",
    level: normalizeVocabLevel(data.level),
    total: data.total ?? (data.words?.length ?? 0),
    learned: data.learned ?? 0,
    accent: data.accent ?? "bg-blue-600",
    icon: data.icon ?? undefined,
    words: (data.words ?? []) as VocabWord[],
    ownerId: data.ownerId ?? "",
    source: data.source ?? "manual",
    topicLabel: data.topicLabel ?? undefined,
    topicColor: data.topicColor ?? undefined,
  }
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/** Lấy toàn bộ bộ từ vựng do user hiện tại tạo (mới nhất lên đầu). */
export async function getMyVocabSets(uid: string): Promise<VocabSet[]> {
  const snapshot = await getDocs(myVocabCollection(uid))
  return snapshot.docs
    .map((d) => docToMyVocabSet(d.data()))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** Lấy 1 bộ từ cá nhân theo slug (chỉ của user đang đăng nhập). */
export async function getMyVocabSetBySlug(uid: string, slug: string): Promise<VocabSet | null> {
  try {
    const snap = await getDoc(doc(myVocabCollection(uid), slug))
    return snap.exists() ? docToMyVocabSet(snap.data()) : null
  } catch (err) {
    console.error("[user-vocab] Lỗi khi lấy bộ từ cá nhân:", err)
    return null
  }
}

/** Tạo bộ từ vựng cá nhân mới và trả về dữ liệu đã lưu. */
export async function createMyVocabSet(
  uid: string,
  input: CreateVocabSetInput
): Promise<VocabSet> {
  const slug = makeMyVocabSlug(input.name)
  const words = input.words
  const topicLabel = input.topicLabel?.trim()
  const topicColor: CustomTopicColor = input.topicColor ?? "blue"

  const payload = {
    slug,
    name: input.name.trim(),
    vi: input.vi.trim(),
    desc: input.desc.trim(),
    topicId: input.topicId,
    level: input.level,
    total: words.length,
    learned: 0,
    accent: input.accent,
    words,
    ownerId: uid,
    source: input.source ?? "manual",
    ...(input.icon ? { icon: input.icon } : {}),
    ...(topicLabel ? { topicLabel, topicColor } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(doc(myVocabCollection(uid), slug), payload)

  return {
    slug,
    name: payload.name,
    vi: payload.vi,
    desc: payload.desc,
    topicId: payload.topicId,
    level: payload.level,
    total: payload.total,
    learned: payload.learned,
    accent: payload.accent,
    words: payload.words,
    ownerId: uid,
    source: payload.source,
    icon: input.icon,
    topicLabel: topicLabel || undefined,
    topicColor: topicLabel ? topicColor : undefined,
  }
}

/** Xóa 1 bộ từ cá nhân. */
export async function deleteMyVocabSet(uid: string, slug: string): Promise<void> {
  await deleteDoc(doc(myVocabCollection(uid), slug))
}
