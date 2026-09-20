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
import { normalizeVocabLevel, vocabLevels } from "@/lib/data/vocabulary"
import type { GrammarGroup, GrammarLevel } from "@/lib/data/grammar"
import type { FormulaRow, GrammarExample } from "@/lib/data/grammar"

/* ------------------------------------------------------------------ */
/*  Bộ ngữ pháp cá nhân                                               */
/*  Lưu ở subcollection: users/{uid}/grammarSets/{slug}       */
/*  → mỗi người dùng chỉ thấy & dùng được grammar do chính mình tạo. */
/* ------------------------------------------------------------------ */

export type GrammarSource = "manual" | "ai"

export type CreateGrammarInput = {
  name: string
  vi: string
  desc: string
  level: GrammarLevel
  accent: string
  intro: string
  usage: string[]
  formulas: FormulaRow[]
  examples: GrammarExample[]
  practiceId: string
  source?: GrammarSource
  group?: GrammarGroup
}

export type GrammarSet = {
  slug: string
  name: string
  vi: string
  desc: string
  level: GrammarLevel
  progress: number
  accent: string
  intro: string
  usage: string[]
  formulas: FormulaRow[]
  examples: GrammarExample[]
  practiceId: string
  ownerId: string
  source: GrammarSource
  group: GrammarGroup
}

function myGrammarCollection(uid: string) {
  return collection(db, "users", uid, "grammarSets")
}

/** "Grammar Future Simple" → "grammar-future-simple" */
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

/** Slug grammar riêng, luôn có tiền tố "myg-" để tách khỏi grammar hệ thống */
export function makeMyGrammarSlug(name: string) {
  const base = slugify(name) || "grammar"
  const rand = Math.random().toString(36).slice(2, 6)
  return `myg-${base}-${rand}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToMyGrammarSet(data: Record<string, any>): GrammarSet {
  return {
    slug: data.slug ?? "",
    name: data.name ?? "",
    vi: data.vi ?? "",
    desc: data.desc ?? "",
    level: normalizeVocabLevel(data.level) as GrammarLevel,
    progress: data.progress ?? 0,
    accent: data.accent ?? "bg-purple-600",
    intro: data.intro ?? "",
    usage: (data.usage ?? []) as string[],
    formulas: (data.formulas ?? []) as FormulaRow[],
    examples: (data.examples ?? []) as GrammarExample[],
    practiceId: data.practiceId ?? "",
    ownerId: data.ownerId ?? "",
    source: data.source ?? "manual",
    group: data.group === "other" ? "other" : "tense",
  }
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/** Lấy toàn bộ grammar do user hiện tại tạo (mới nhất lên đầu). */
export async function getMyGrammarSets(uid: string): Promise<GrammarSet[]> {
  const snapshot = await getDocs(myGrammarCollection(uid))
  return snapshot.docs
    .map((d) => docToMyGrammarSet(d.data()))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** Lấy 1 grammar cá nhân theo slug (chỉ của user đang đăng nhập). */
export async function getMyGrammarSetBySlug(
  uid: string,
  slug: string
): Promise<GrammarSet | null> {
  try {
    const snap = await getDoc(doc(myGrammarCollection(uid), slug))
    return snap.exists() ? docToMyGrammarSet(snap.data()) : null
  } catch (err) {
    console.error("[user-grammar] Lỗi khi lấy grammar cá nhân:", err)
    return null
  }
}

/** Tạo grammar cá nhân mới và trả về dữ liệu đã lưu. */
export async function createMyGrammarSet(
  uid: string,
  input: CreateGrammarInput
): Promise<GrammarSet> {
  const slug = makeMyGrammarSlug(input.name)

    const payload = {
    slug,
    name: input.name.trim(),
    vi: input.vi.trim(),
    desc: input.desc.trim(),
    level: input.level,
    progress: 0,
    accent: input.accent,
    intro: input.intro.trim(),
    usage: input.usage,
    formulas: input.formulas,
    examples: input.examples,
    practiceId: input.practiceId,
    ownerId: uid,
    source: input.source ?? "manual",
    group: input.group ?? "other",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(doc(myGrammarCollection(uid), slug), payload)

  return {
    slug,
    name: payload.name,
    vi: payload.vi,
    desc: payload.desc,
    level: payload.level,
    progress: payload.progress,
    accent: payload.accent,
    intro: payload.intro,
    usage: payload.usage,
    formulas: payload.formulas,
    examples: payload.examples,
    practiceId: payload.practiceId,
    ownerId: uid,
    source: payload.source,
    group: payload.group,
  }
}

/** Xóa 1 grammar cá nhân. */
export async function deleteMyGrammarSet(uid: string, slug: string): Promise<void> {
  await deleteDoc(doc(myGrammarCollection(uid), slug))
}
