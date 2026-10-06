import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"
import type { GrammarTopic } from "@/lib/data/grammar"
import type { Exercise, PracticeResult } from "@/lib/data/practice"
import { loadDefaultExercise, saveLocalPracticeResult } from "@/lib/practice-service"
import { recordPracticeCompletion } from "@/lib/progress/study-log"
import { saveMyExercise, updateMyExerciseResult } from "@/lib/user-practice"

const LOCAL_STORAGE_PREFIX = "afl-grammar-practice"

function getStorageKey(slug: string, uid?: string | null): string {
  return `${LOCAL_STORAGE_PREFIX}:${slug}:${uid || "guest"}`
}

/**
 * Đọc bài tập ngữ pháp đã lưu từ LocalStorage (0ms phản hồi).
 */
export function getLocalGrammarExercise(slug: string, uid?: string | null): Exercise | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(getStorageKey(slug, uid))
    if (!raw) {
      // Fallback: Thử đọc key của guest nếu đang đăng nhập nhưng chưa có dữ liệu user
      if (uid) {
        const guestRaw = localStorage.getItem(getStorageKey(slug, "guest"))
        if (guestRaw) return JSON.parse(guestRaw) as Exercise
      }
      return null
    }
    return JSON.parse(raw) as Exercise
  } catch {
    return null
  }
}

/**
 * Lưu bài tập ngữ pháp vào LocalStorage.
 */
export function saveLocalGrammarExercise(slug: string, exercise: Exercise, uid?: string | null): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(getStorageKey(slug, uid), JSON.stringify(exercise))
    window.dispatchEvent(
      new CustomEvent("afl-grammar-exercise-saved", { detail: { slug, exercise } })
    )
  } catch (err) {
    console.error("[grammar-practice-service] Lỗi lưu local exercise:", err)
  }
}

/**
 * Xóa bài tập ngữ pháp khỏi LocalStorage.
 */
export function removeLocalGrammarExercise(slug: string, uid?: string | null): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(getStorageKey(slug, uid))
    localStorage.removeItem(getStorageKey(slug, "guest"))
    window.dispatchEvent(
      new CustomEvent("afl-grammar-exercise-saved", { detail: { slug, exercise: null } })
    )
  } catch (err) {
    console.error("[grammar-practice-service] Lỗi xóa local exercise:", err)
  }
}

/**
 * Đọc bài tập ngữ pháp từ Cloud Firestore: users/{uid}/grammarPractices/{slug}.
 */
export async function getCloudGrammarExercise(slug: string, uid: string): Promise<Exercise | null> {
  try {
    const snap = await getDoc(doc(db, "users", uid, "grammarPractices", slug))
    if (snap.exists()) {
      const data = snap.data()
      if (Array.isArray(data.items) && data.items.length > 0) {
        return {
          id: data.id || `gp-${slug}`,
          name: data.name || `Luyện tập: ${slug}`,
          vi: data.vi || slug,
          desc: data.desc || "",
          typeId: data.typeId || "trac-nghiem",
          minutes: typeof data.minutes === "number" ? data.minutes : 5,
          status: data.status || "Chưa làm",
          bestScore: typeof data.bestScore === "string" ? data.bestScore : undefined,
          category: data.category,
          examType: data.examType,
          grammarSlug: slug,
          items: data.items,
        } as Exercise
      }
    }
    return null
  } catch (err) {
    console.warn("[grammar-practice-service] Không đọc được cloud grammar exercise:", err)
    return null
  }
}

/**
 * Lưu bài tập ngữ pháp lên Cloud Firestore.
 */
export async function saveCloudGrammarExercise(
  slug: string,
  exercise: Exercise,
  uid: string
): Promise<void> {
  try {
    const payload = {
      ...exercise,
      grammarSlug: slug,
      updatedAt: serverTimestamp(),
    }
    // 1. Lưu theo chủ điểm ngữ pháp: users/{uid}/grammarPractices/{slug}
    await setDoc(doc(db, "users", uid, "grammarPractices", slug), payload, { merge: true })

    // 2. Lưu vào kho bài tập của người dùng: users/{uid}/practiceExercises/{id}
    await saveMyExercise(uid, { ...exercise, grammarSlug: slug })
  } catch (err) {
    console.error("[grammar-practice-service] Lỗi lưu cloud grammar exercise:", err)
  }
}

/**
 * Xóa bài tập ngữ pháp trên Cloud Firestore.
 */
export async function deleteCloudGrammarExercise(
  slug: string,
  exerciseId: string,
  uid: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, "users", uid, "grammarPractices", slug))
    if (exerciseId && exerciseId.startsWith("ai-")) {
      await deleteDoc(doc(db, "users", uid, "practiceExercises", exerciseId))
    }
  } catch (err) {
    console.error("[grammar-practice-service] Lỗi xóa cloud grammar exercise:", err)
  }
}

/**
 * Tải bài tập đã lưu cho một chủ điểm ngữ pháp:
 * 1. Ưu tiên bài tập trong LocalStorage (0ms).
 * 2. Nếu đăng nhập, kiểm tra trên Cloud Firestore.
 * 3. Nếu chưa có bài AI, kiểm tra bài tập mặc định theo topic.practiceId.
 */
export async function loadGrammarPractice(
  topic: GrammarTopic,
  uid?: string | null
): Promise<Exercise | null> {
  // 1. LocalStorage
  const local = getLocalGrammarExercise(topic.slug, uid)
  if (local) return local

  // 2. Cloud Firestore
  if (uid) {
    const cloud = await getCloudGrammarExercise(topic.slug, uid)
    if (cloud) {
      saveLocalGrammarExercise(topic.slug, cloud, uid)
      return cloud
    }
  }

  // 3. Fallback bài mặc định theo practiceId (nếu có sẵn trong hệ thống)
  if (topic.practiceId) {
    try {
      const defaultEx = await loadDefaultExercise(topic.practiceId, uid)
      if (defaultEx && defaultEx.items && defaultEx.items.length > 0) {
        return {
          ...defaultEx,
          grammarSlug: topic.slug,
        }
      }
    } catch {
      // Bỏ qua lỗi
    }
  }

  return null
}

/**
 * Lưu bài tập mới được tạo cho chủ điểm ngữ pháp.
 */
export async function saveGrammarPractice(
  topicSlug: string,
  exercise: Exercise,
  uid?: string | null
): Promise<Exercise> {
  const updatedEx: Exercise = {
    ...exercise,
    grammarSlug: topicSlug,
  }

  // Luôn lưu local
  saveLocalGrammarExercise(topicSlug, updatedEx, uid)

  // Nếu đã đăng nhập, lưu cloud
  if (uid) {
    await saveCloudGrammarExercise(topicSlug, updatedEx, uid)
  }

  return updatedEx
}

/**
 * Lưu kết quả làm bài tập ngữ pháp:
 * - Cập nhật điểm số cao nhất và trạng thái 'Hoàn thành'
 * - Lưu vào Firestore (grammarPractices + practiceExercises + practiceResults)
 * - Ghi nhận vào sổ tiến độ học (XP, bộ đếm bài làm, sự kiện hoạt động)
 * - Đồng bộ về LocalStorage
 * - Bắn event hệ thống để cập nhật header / tiến độ / lộ trình AI
 */
export async function completeGrammarPractice(
  topic: GrammarTopic,
  exercise: Exercise,
  result: PracticeResult,
  uid?: string | null
): Promise<Exercise> {
  const isBetter =
    !exercise.bestScore ||
    (() => {
      const [prevScore] = (exercise.bestScore || "0/0").split("/").map(Number)
      return result.score >= prevScore
    })()

  const bestScoreStr = isBetter
    ? `${result.score}/${result.total}`
    : exercise.bestScore || `${result.score}/${result.total}`

  const updatedEx: Exercise = {
    ...exercise,
    status: "Hoàn thành",
    bestScore: bestScoreStr,
    grammarSlug: topic.slug,
  }

  // 1. Lưu LocalStorage
  saveLocalGrammarExercise(topic.slug, updatedEx, uid)
  saveLocalPracticeResult(exercise.id, result)

  // 2. Lưu Cloud nếu có tài khoản
  if (uid) {
    try {
      // Cập nhật users/{uid}/grammarPractices/{slug}
      await setDoc(
        doc(db, "users", uid, "grammarPractices", topic.slug),
        {
          ...updatedEx,
          lastScore: result.score,
          lastTotal: result.total,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      // Cập nhật users/{uid}/practiceExercises/{exerciseId}
      await updateMyExerciseResult(uid, exercise.id, result)

      // Ghi nhận lên sổ tiến độ học tập (XP + Bài hoàn thành + Lịch sử)
      await recordPracticeCompletion(uid, {
        exerciseId: exercise.id,
        name: exercise.name,
        vi: topic.name,
        typeId: exercise.typeId,
        kindLabel: "Bài tập · Ngữ pháp",
        score: result.score,
        total: result.total,
      })
    } catch (err) {
      console.error("[grammar-practice-service] Lỗi lưu kết quả lên cloud:", err)
    }
  }

  // 3. Dispatch sự kiện hệ thống
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("afl-practice-completed", {
        detail: { id: exercise.id, result },
      })
    )
    window.dispatchEvent(new CustomEvent("afl-grammar-progress-updated"))
  }

  return updatedEx
}

/**
 * Xóa bài tập đã lưu của chủ điểm ngữ pháp để tạo lại bài mới.
 */
export async function deleteGrammarPractice(
  topicSlug: string,
  exerciseId: string,
  uid?: string | null
): Promise<void> {
  removeLocalGrammarExercise(topicSlug, uid)
  if (uid) {
    await deleteCloudGrammarExercise(topicSlug, exerciseId, uid)
  }
}
