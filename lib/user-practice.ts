import { doc, serverTimestamp, setDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"
import type { Exercise } from "@/lib/data/practice"

function makeId() {
  return `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export async function saveMyExercise(uid: string, exercise: Exercise): Promise<Exercise> {
  const id = exercise.id.startsWith("ai-") ? exercise.id : makeId()
  const saved = { ...exercise, id, source: "ai", createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
  await setDoc(doc(db, "users", uid, "practiceExercises", id), saved)
  return { ...exercise, id }
}

export async function updateMyExerciseResult(uid: string, id: string, result: { score: number; total: number }) {
  await setDoc(doc(db, "users", uid, "practiceExercises", id), {
    status: "Hoàn thành",
    bestScore: `${result.score}/${result.total}`,
    updatedAt: serverTimestamp(),
  }, { merge: true })
}
