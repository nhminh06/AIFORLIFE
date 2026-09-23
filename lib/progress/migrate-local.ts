/**
 * Di trú dữ liệu học tập của KHÁCH lên Firestore khi vừa đăng nhập.
 *
 * Nguyên tắc an toàn:
 * - Chỉ chạy 1 lần cho mỗi tài khoản (cờ afl:migrated:{uid}).
 * - Dữ liệu đã có trên cloud LUÔN thắng, chỉ bổ sung phần còn thiếu.
 * - Lỗi từng phần chỉ log, không chặn người dùng.
 */

import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"
import { exercises as staticExercises } from "@/lib/data/practice"
import { loadLocalBadges, loadLocalStudyDays, loadLocalStudyEvents } from "@/lib/progress/local-store"
import { savePracticeResult } from "@/lib/progress/practice-results-service"
import { saveVocabProgressCloud } from "@/lib/progress/vocab-progress-cloud"
import { saveGrammarLearnedCloud } from "@/lib/progress/grammar-progress-cloud"

const VOCAB_PREFIX = "afl:vocab-learned:guest:"
const GRAMMAR_KEY = "afl-grammar-learned:guest"
const PRACTICE_KEY = "afl-practice-results"

function migrationFlag(uid: string): string {
  return `afl:migrated:${uid}`
}

function readGuestVocabulary(): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  if (typeof window === "undefined") return out
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i)
      if (!key || !key.startsWith(VOCAB_PREFIX)) continue
      const slug = key.slice(VOCAB_PREFIX.length)
      const parsed: unknown = JSON.parse(window.localStorage.getItem(key) || "[]")
      if (Array.isArray(parsed)) {
        out[slug] = parsed.filter((v): v is string => typeof v === "string")
      }
    }
  } catch {
    /* localStorage lỗi → bỏ qua phần này */
  }
  return out
}

function readGuestGrammar(): string[] {
  if (typeof window === "undefined") return []
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(GRAMMAR_KEY) || "[]")
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : []
  } catch {
    return []
  }
}

/* ------------------------------------------------------------------ */
/*  Từng phần di trú                                                   */
/* ------------------------------------------------------------------ */

async function migrateVocab(uid: string): Promise<void> {
  const guest = readGuestVocabulary()
  for (const [slug, keys] of Object.entries(guest)) {
    if (keys.length === 0) continue
    const snap = await getDoc(doc(db, "users", uid, "vocabProgress", slug))
    const existing =
      snap.exists() && Array.isArray(snap.data().learnedKeys)
        ? (snap.data().learnedKeys as string[])
        : []
    const merged = new Set([...existing, ...keys])
    await saveVocabProgressCloud(slug, uid, merged)
  }
}

async function migrateGrammar(uid: string): Promise<void> {
  const slugs = readGuestGrammar()
  for (const slug of slugs) {
    await saveGrammarLearnedCloud(uid, slug, true)
  }
}

async function migratePractice(uid: string): Promise<void> {
  if (typeof window === "undefined") return
  let results: Record<string, { score: number; total: number }> = {}
  try {
    results = JSON.parse(window.localStorage.getItem(PRACTICE_KEY) || "{}")
  } catch {
    return
  }
  for (const [id, result] of Object.entries(results)) {
    const exercise = staticExercises.find((e) => e.id === id)
    if (!exercise) continue
    const snap = await getDoc(doc(db, "users", uid, "practiceResults", id))
    if (snap.exists()) continue
    await savePracticeResult(uid, {
      exerciseId: id,
      name: exercise.name,
      vi: exercise.vi,
      typeId: exercise.typeId,
      kindLabel: "",
      score: result.score,
      total: result.total,
    })
  }
}

async function migrateDaysAndEvents(uid: string): Promise<void> {
  /* --- studyDays: chỉ thêm ngày cloud chưa có --- */
  const localDays = loadLocalStudyDays("guest")
  const cloudDays = await getDocs(collection(db, "users", uid, "studyDays"))
  const existingDates = new Set(cloudDays.docs.map((d) => d.id))
  for (const day of localDays) {
    if (existingDates.has(day.date)) continue
    await setDoc(
      doc(db, "users", uid, "studyDays", day.date),
      { ...day, updatedAt: serverTimestamp() },
      { merge: true }
    )
  }

  /* --- studyEvents: chỉ thêm sự kiện cloud chưa có --- */
  const localEvents = loadLocalStudyEvents("guest", 200)
  const cloudEvents = await getDocs(collection(db, "users", uid, "studyEvents"))
  const existingIds = new Set(cloudEvents.docs.map((d) => d.id))
  for (const event of localEvents) {
    if (existingIds.has(event.id)) continue
    await setDoc(
      doc(db, "users", uid, "studyEvents", event.id),
      {
        id: event.id,
        type: event.type,
        refId: event.refId,
        title: event.title,
        date: event.date,
        count: event.count,
        xp: event.xp,
        ...(event.score != null ? { score: event.score } : {}),
        ...(event.total != null ? { total: event.total } : {}),
        ...(event.detail ? { detail: event.detail } : {}),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )
  }

  /* --- badges: bổ sung huy hiệu khách đã mở khoá --- */
  const localBadges = loadLocalBadges("guest")
  for (const id of Object.keys(localBadges)) {
    await setDoc(
      doc(db, "users", uid, "badges", id),
      { id, earnedAt: serverTimestamp(), date: new Date().toISOString().slice(0, 10) },
      { merge: true }
    )
  }
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Đẩy toàn bộ dữ liệu học tập của khách lên tài khoản vừa đăng nhập.
 * Trả về true nếu có chạy di trú, false nếu đã chạy trước đó.
 */
export async function migrateGuestProgress(uid: string | null | undefined): Promise<boolean> {
  if (!uid || typeof window === "undefined") return false

  try {
    if (window.localStorage.getItem(migrationFlag(uid)) === "1") return false
  } catch {
    return false
  }

  try {
    await migrateVocab(uid)
    await migrateGrammar(uid)
    await migratePractice(uid)
    await migrateDaysAndEvents(uid)
  } catch (err) {
    console.error("[migrate-local] Lỗi khi di trú dữ liệu khách:", err)
  }

  try {
    window.localStorage.setItem(migrationFlag(uid), "1")
  } catch {
    /* bỏ qua */
  }

  return true
}
