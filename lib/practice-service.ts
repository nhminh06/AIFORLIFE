import { collection, deleteDoc, doc, getDoc, getDocs } from "firebase/firestore"

import { db } from "@/lib/firebase"
import { exercises as localExercises, type Exercise, type PracticeCategory, type PracticeResult, type PracticeStatus, type PracticeTypeId, type Question } from "@/lib/data/practice"

const LOCAL_RESULTS_KEY = "afl-practice-results"

function localResults(): Record<string, PracticeResult> {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem(LOCAL_RESULTS_KEY) || "{}") as Record<string, PracticeResult> } catch { return {} }
}

/** Kết quả bài luyện đã lưu ở localStorage (bản sao, không sửa trực tiếp). */
export function getLocalPracticeResults(): Record<string, PracticeResult> {
  return localResults()
}

export function saveLocalPracticeResult(id: string, result: PracticeResult) {
  if (typeof window === "undefined") return
  localStorage.setItem(LOCAL_RESULTS_KEY, JSON.stringify({ ...localResults(), [id]: result }))
}

function applyLocalResults(items: Exercise[]): Exercise[] {
  const results = localResults()
  return items.map((item) => {
    const result = results[item.id]
    return result ? { ...item, status: "Hoàn thành", bestScore: `${result.score}/${result.total}` } : item
  })
}

function isQuestion(value: unknown): value is Question {
  if (!value || typeof value !== "object") return false
  const question = value as Record<string, unknown>
  return ["choice", "listen", "fill", "order", "reading", "listening", "writing", "true-false"].includes(String(question.kind))
}

function parseExercise(value: unknown): Exercise | null {
  if (!value || typeof value !== "object") return null
  const raw = value as Record<string, unknown>
  if (typeof raw.id !== "string" || typeof raw.name !== "string" || typeof raw.vi !== "string") return null
  if (!Array.isArray(raw.items)) return null

  const items = raw.items.filter(isQuestion)
  if (items.length === 0) return null

  return {
    id: raw.id,
    name: raw.name,
    vi: raw.vi,
    desc: typeof raw.desc === "string" ? raw.desc : "",
    typeId: raw.typeId as PracticeTypeId,
    minutes: typeof raw.minutes === "number" ? raw.minutes : 5,
    status: (raw.status as PracticeStatus) || "Chưa làm",
    bestScore: typeof raw.bestScore === "string" ? raw.bestScore : undefined,
    category: raw.category as PracticeCategory | undefined,
    examType: typeof raw.examType === "string" ? raw.examType : undefined,
    items,
  }
}

/** Lấy bài luyện mặc định từ Firebase, giữ dữ liệu local làm fallback khi chưa seed hoặc mạng lỗi. */
export async function loadDefaultExercises(): Promise<Exercise[]> {
  try {
    const snapshot = await getDocs(collection(db, "practiceExercises"))
    const remote = snapshot.docs
      .map((item) => parseExercise({ id: item.id, ...item.data() }))
      .filter((item): item is Exercise => item !== null)
      .sort((a, b) => a.name.localeCompare(b.name))

    return applyLocalResults(remote.length > 0 ? remote : localExercises)
  } catch (error) {
    console.warn("[practice-service] Không đọc được bài luyện Firebase, dùng dữ liệu mặc định local.", error)
    return applyLocalResults(localExercises)
  }
}

export async function loadMyExercises(uid: string): Promise<Exercise[]> {
  try {
    const snapshot = await getDocs(collection(db, "users", uid, "practiceExercises"))
    return snapshot.docs
      .map((item) => parseExercise({ id: item.id, ...item.data() }))
      .filter((item): item is Exercise => item !== null)
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    console.warn("[practice-service] Không đọc được bài luyện cá nhân.", error)
    return []
  }
}

export async function loadDefaultExercise(id: string): Promise<Exercise | null> {
  try {
    const snapshot = await getDoc(doc(db, "practiceExercises", id))
    if (snapshot.exists()) return parseExercise({ id: snapshot.id, ...snapshot.data() })
  } catch (error) {
    console.warn("[practice-service] Không đọc được bài luyện Firebase, dùng dữ liệu local.", error)
  }
  const exercise = localExercises.find((item) => item.id === id) ?? null
  if (!exercise) return null
  const result = localResults()[id]
  return result ? { ...exercise, status: "Hoàn thành", bestScore: `${result.score}/${result.total}` } : exercise
}

export async function loadMyExercise(uid: string, id: string): Promise<Exercise | null> {
  try {
    const snapshot = await getDoc(doc(db, "users", uid, "practiceExercises", id))
    return snapshot.exists() ? parseExercise({ id: snapshot.id, ...snapshot.data() }) : null
  } catch (error) {
    console.warn("[practice-service] Không đọc được bài luyện cá nhân.", error)
    return null
  }
}

export async function deleteMyExercise(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "practiceExercises", id))
}
