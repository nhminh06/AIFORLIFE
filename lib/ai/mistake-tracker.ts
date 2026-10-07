/**
 * Hệ thống Ghi nhận & Phân tích Lỗi Toàn site (Mistake Tracker)
 * AFL AI Adaptive Pathway v2.1
 *
 * 100% an toàn (không throw, không chặn UI), lưu LocalStorage (500 bản ghi)
 * và tự động đồng bộ Cloud Firestore khi có đăng nhập.
 */

import type { Exercise, Question } from "@/lib/data/practice"
import { countAllLearnedVocabWords } from "@/lib/vocab-progress"

export type MistakeSkill = "tense" | "syntax" | "listening" | "reading" | "adv_grammar" | "vocab"

export type MistakeRecord = {
  key: string // source:questionId
  skill: MistakeSkill
  source: string // URL hoặc mã bài tập
  prompt: string
  userAnswer: string
  correctAnswer: string
  word?: string // Từ vựng liên quan nếu có
  topic: string // Chủ điểm ngữ pháp hoặc chủ đề từ vựng
  wrongCount: number
  correctStreak: number
  firstAt: number
  lastAt: number
  isMastered: boolean // Đạt khi correctStreak >= 2
  questionData?: {
    kind: string
    options?: string[]
    hint?: string
    passage?: string
    transcript?: string
    words?: string[]
  }
}

export type LogAnswerEvent = {
  key?: string
  source: string
  questionId: string
  skill: MistakeSkill
  topic: string
  prompt: string
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  word?: string
  questionData?: MistakeRecord["questionData"]
}

export type MistakeInsights = {
  skillWeights: Record<MistakeSkill, number>
  skillMistakeCounts: Record<MistakeSkill, number>
  skillCorrectCounts: Record<MistakeSkill, number>
  recentTotalMistakes: number
  masteredCount: number
  topMistakeWords: Array<{
    word: string
    wrongCount: number
    correctStreak: number
    lastAt: number
    isMastered: boolean
    topic: string
    prompt: string
  }>
  topRepeatQuestions: MistakeRecord[]
  topTopics: Array<{
    topic: string
    skill: MistakeSkill
    wrongCount: number
    weight: number
  }>
  primaryWeaknessInsight: string
}

const STORAGE_KEY = "afl_mistakes_v1"
const MAX_RECORDS = 500
const HALF_LIFE_MS = 14 * 24 * 60 * 60 * 1000 // 14 ngày

// Debounce timer cho Cloud sync
let cloudSyncTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Sinh questionId ổn định từ chuỗi prompt / nội dung câu hỏi
 */
export function createQuestionId(source: string, prompt: string, extra?: string): string {
  const normStr = `${source}:${prompt.trim().toLowerCase()}:${(extra || "").trim().toLowerCase()}`
  let hash = 0
  for (let i = 0; i < normStr.length; i++) {
    hash = (hash << 5) - hash + normStr.charCodeAt(i)
    hash |= 0
  }
  return `q_${Math.abs(hash).toString(36)}`
}

/**
 * Đọc toàn bộ danh sách lỗi từ LocalStorage (An toàn SSR)
 */
export function getMistakes(): MistakeRecord[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.warn("[mistake-tracker] Lỗi đọc mistakes:", err)
    return []
  }
}

/**
 * Lưu danh sách lỗi vào LocalStorage, tự động dọn dẹp nếu vượt 500 bản ghi
 */
function saveMistakes(records: MistakeRecord[]): void {
  if (typeof window === "undefined") return
  try {
    let cleanRecords = records

    // Nếu vượt quá MAX_RECORDS (500), ưu tiên xóa:
    // 1. Bản ghi đã nắm (isMastered === true)
    // 2. Bản ghi cũ nhất (lastAt nhỏ nhất)
    if (cleanRecords.length > MAX_RECORDS) {
      cleanRecords.sort((a, b) => {
        if (a.isMastered !== b.isMastered) {
          return a.isMastered ? 1 : -1 // master xuống cuối để pop
        }
        return b.lastAt - a.lastAt // mới nhất lên đầu
      })
      cleanRecords = cleanRecords.slice(0, MAX_RECORDS)
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanRecords))

    // Bắn event để UI tự động cập nhật
    window.dispatchEvent(new CustomEvent("mistakes-updated"))
  } catch (err) {
    console.warn("[mistake-tracker] Lỗi ghi mistakes:", err)
  }
}

/**
 * Tính trọng số suy giảm theo thời gian (Exponential Decay với half-life 14 ngày)
 */
export function calculateMistakeWeight(record: MistakeRecord, now = Date.now()): number {
  const dt = Math.max(0, now - record.lastAt)
  const decay = Math.pow(0.5, dt / HALF_LIFE_MS)
  const masterFactor = record.isMastered ? 0.2 : 1.0
  return record.wrongCount * decay * masterFactor
}

/**
 * Ghi nhận một lượt trả lời câu hỏi (Đúng hoặc Sai)
 * TUYỆT ĐỐI KHÔNG THROW, KHÔNG CHẶN UI
 */
export function logAnswer(event: LogAnswerEvent, uid?: string | null): void {
  if (typeof window === "undefined") return

  try {
    const key = event.key || `${event.source}:${event.questionId}`
    const records = getMistakes()
    let existingIndex = records.findIndex((r) => r.key === key)

    // Fallback: Tìm theo prompt hoặc theo word nếu key không khớp chính xác
    if (existingIndex < 0) {
      if (event.prompt && event.prompt.trim()) {
        const pTrim = event.prompt.trim()
        existingIndex = records.findIndex((r) => r.prompt && r.prompt.trim() === pTrim)
      }
      if (existingIndex < 0 && event.word && event.word.trim()) {
        const wNorm = event.word.trim().toLowerCase()
        existingIndex = records.findIndex((r) => r.word && r.word.trim().toLowerCase() === wNorm)
      }
    }

    const now = Date.now()

    if (!event.isCorrect) {
      // TRƯỜNG HỢP: TRẢ LỜI SAI
      if (existingIndex >= 0) {
        // Sai lại câu đã từng sai
        const current = records[existingIndex]
        records[existingIndex] = {
          ...current,
          wrongCount: current.wrongCount + 1,
          correctStreak: 0,
          isMastered: false,
          lastAt: now,
          userAnswer: event.userAnswer,
          correctAnswer: event.correctAnswer,
          questionData: event.questionData || current.questionData,
        }
      } else {
        // Sai lần đầu: Tạo bản ghi mới
        records.unshift({
          key,
          skill: event.skill,
          source: event.source,
          prompt: event.prompt,
          userAnswer: event.userAnswer,
          correctAnswer: event.correctAnswer,
          word: event.word,
          topic: event.topic,
          wrongCount: 1,
          correctStreak: 0,
          firstAt: now,
          lastAt: now,
          isMastered: false,
          questionData: event.questionData,
        })
      }
      saveMistakes(records)
      queueCloudSync(uid)
    } else {
      // TRƯỜNG HỢP: TRẢ LỜI ĐÚNG
      if (existingIndex >= 0) {
        // Đúng mà đã từng sai trước đó
        const current = records[existingIndex]
        const newStreak = current.correctStreak + 1
        const mastered = newStreak >= 2

        records[existingIndex] = {
          ...current,
          correctStreak: newStreak,
          isMastered: mastered,
          lastAt: now,
        }
        saveMistakes(records)
        queueCloudSync(uid)
      }
      // Đúng mà chưa từng sai: KHÔNG LƯU GÌ
    }
  } catch (err) {
    console.warn("[mistake-tracker] Ngoại lệ logAnswer:", err)
  }
}

/**
 * Đồng bộ Cloud với Debounce 3s (Gộp nhiều lần sai thành 1 request)
 */
function queueCloudSync(uid?: string | null): void {
  if (!uid || typeof window === "undefined") return
  if (cloudSyncTimer) clearTimeout(cloudSyncTimer)

  cloudSyncTimer = setTimeout(() => {
    void syncMistakesWithCloud(uid)
  }, 3000)
}

/**
 * Gửi dữ liệu lỗi lên endpoint /api/mistakes và gộp với dữ liệu Cloud
 */
export async function syncMistakesWithCloud(uid: string): Promise<void> {
  if (!uid || typeof window === "undefined") return
  if (!navigator.onLine) return // Offline thì bỏ qua, lần sau gửi lại

  try {
    const localRecords = getMistakes()
    const res = await fetch("/api/mistakes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, mistakes: localRecords }),
    })

    if (!res.ok) return
    const data = (await res.json()) as { mistakes?: MistakeRecord[] }

    if (data.mistakes && Array.isArray(data.mistakes)) {
      // Cập nhật lại local với bản merge từ server
      saveMistakes(data.mistakes)
    }
  } catch (err) {
    console.warn("[mistake-tracker] Đồng bộ cloud thất bại (sẽ thử lại sau):", err)
  }
}

/**
 * Phân tích chuyên sâu từ nhật ký lỗi (Insights)
 */
export function getInsights(uid?: string | null): MistakeInsights {
  const records = getMistakes()
  const now = Date.now()

  const skillWeights: Record<MistakeSkill, number> = {
    tense: 0,
    syntax: 0,
    reading: 0,
    listening: 0,
    adv_grammar: 0,
    vocab: 0,
  }

  const skillMistakeCounts: Record<MistakeSkill, number> = {
    tense: 0,
    syntax: 0,
    reading: 0,
    listening: 0,
    adv_grammar: 0,
    vocab: 0,
  }

  const skillCorrectCounts: Record<MistakeSkill, number> = {
    tense: 0,
    syntax: 0,
    reading: 0,
    listening: 0,
    adv_grammar: 0,
    vocab: 0,
  }

  const wordMap = new Map<string, MistakeRecord>()
  const topicMap = new Map<string, { topic: string; skill: MistakeSkill; wrongCount: number; weight: number }>()

  let recentTotalMistakes = 0
  let masteredCount = 0
  const recentThreshold = now - 14 * 24 * 60 * 60 * 1000

  for (const r of records) {
    const weight = calculateMistakeWeight(r, now)
    if (r.skill in skillWeights) {
      skillWeights[r.skill] += weight
      if (!r.isMastered) {
        skillMistakeCounts[r.skill] += r.wrongCount
      }
    }

    if (r.isMastered) {
      masteredCount += 1
      if (r.skill in skillCorrectCounts) {
        // Đã nắm tương đương với việc đã trả lời đúng ít nhất 2 lần liên tiếp
        skillCorrectCounts[r.skill] += Math.max(2, r.correctStreak || 0)
      }
    } else if (r.correctStreak > 0) {
      // Đang trong tiến trình ôn tập và có chuỗi đúng
      if (r.skill in skillCorrectCounts) {
        skillCorrectCounts[r.skill] += r.correctStreak
      }
    }

    if (r.lastAt >= recentThreshold && !r.isMastered) {
      recentTotalMistakes += r.wrongCount
    }

    // Gom nhóm từ vựng:
    // Ưu tiên bản ghi chưa nắm để đưa vào danh sách cần củng cố; nếu cả hai đều chưa nắm thì lấy câu sai nhiều hơn
    if (r.word && r.word.trim()) {
      const wKey = r.word.trim().toLowerCase()
      const prev = wordMap.get(wKey)
      if (!prev || (prev.isMastered && !r.isMastered) || (!r.isMastered && r.wrongCount > prev.wrongCount)) {
        wordMap.set(wKey, r)
      } else if (!prev) {
        wordMap.set(wKey, r)
      }
    }

    // Gom nhóm chủ điểm (ưu tiên các chủ điểm chưa được khắc phục)
    if (r.topic && r.topic.trim() && !r.isMastered) {
      const tKey = r.topic.trim().toLowerCase()
      const existing = topicMap.get(tKey) || {
        topic: r.topic,
        skill: r.skill,
        wrongCount: 0,
        weight: 0,
      }
      existing.wrongCount += r.wrongCount
      existing.weight += weight
      topicMap.set(tKey, existing)
    }
  }

  // Cộng thêm số từ vựng người dùng đã học thuộc trên toàn site (/tu-vung)
  const vocabLearnedCount = countAllLearnedVocabWords(uid)
  skillCorrectCounts.vocab += vocabLearnedCount

  // Top từ vựng sai nhiều nhất CHƯA nắm vững (loại bỏ hoàn toàn các từ đã sửa xong)
  const topMistakeWords = Array.from(wordMap.values())
    .filter((r) => !r.isMastered)
    .map((r) => ({
      word: r.word!,
      wrongCount: r.wrongCount,
      correctStreak: r.correctStreak,
      lastAt: r.lastAt,
      isMastered: r.isMastered,
      topic: r.topic,
      prompt: r.prompt,
    }))
    .sort((a, b) => b.wrongCount - a.wrongCount)
    .slice(0, 10)

  // Top câu sai lặp lại (wrongCount >= 2 và chưa mastered)
  const topRepeatQuestions = records
    .filter((r) => r.wrongCount >= 2 && !r.isMastered)
    .sort((a, b) => calculateMistakeWeight(b, now) - calculateMistakeWeight(a, now))
    .slice(0, 10)

  // Top chủ điểm yếu
  const topTopics = Array.from(topicMap.values())
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)

  // Tạo câu lý giải điểm yếu thực tế
  let primaryWeaknessInsight = ""
  if (topTopics.length > 0 && topTopics[0].wrongCount > 0) {
    const topT = topTopics[0]
    primaryWeaknessInsight = `Bạn đã sai ${topT.wrongCount} lần các câu về "${topT.topic}" gần đây.`
  } else if (topMistakeWords.length > 0) {
    primaryWeaknessInsight = `Bạn hay nhầm lẫn các từ vựng như "${topMistakeWords.slice(0, 3).map((w) => w.word).join(", ")}".`
  }

  return {
    skillWeights,
    skillMistakeCounts,
    skillCorrectCounts,
    recentTotalMistakes,
    masteredCount,
    topMistakeWords,
    topRepeatQuestions,
    topTopics,
    primaryWeaknessInsight,
  }
}

/**
 * Hiệu chỉnh điểm ưu tiên kỹ năng từ mô hình ML bằng dữ liệu lỗi thực tế
 * Công thức: finalPriority = min(100, modelPriority + min(25, weight * 4))
 */
export function applyMistakeBoost(
  priorities: Record<string, number>,
  uid?: string | null
): Record<string, number> {
  const insights = getInsights(uid)
  const boosted: Record<string, number> = { ...priorities }

  const skillKeyMap: Record<string, MistakeSkill> = {
    priority_tense: "tense",
    priority_syntax: "syntax",
    priority_reading: "reading",
    priority_listening: "listening",
    priority_adv_grammar: "adv_grammar",
    priority_vocab: "vocab",
  }

  for (const [targetKey, skillKey] of Object.entries(skillKeyMap)) {
    const baseScore = priorities[targetKey] ?? 50
    const weight = insights.skillWeights[skillKey] ?? 0
    const boost = Math.min(25, Math.round(weight * 4))
    boosted[targetKey] = Math.min(100, baseScore + boost)
  }

  return boosted
}

/**
 * Xóa toàn bộ lịch sử lỗi (phục vụ quyền riêng tư)
 */
export async function clearMistakes(uid?: string | null): Promise<void> {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new CustomEvent("mistakes-updated"))

    if (uid) {
      await fetch(`/api/mistakes?uid=${encodeURIComponent(uid)}`, {
        method: "DELETE",
      })
    }
  } catch (err) {
    console.warn("[mistake-tracker] Lỗi clearMistakes:", err)
  }
}

/**
 * Tự động phân loại skill & topic từ thông tin bài tập và câu hỏi (Dùng chung cho QuizRunner)
 */
export function resolveExerciseSkillAndTopic(
  exercise: Exercise,
  question: Question
): { skill: MistakeSkill; topic: string; word?: string } {
  const typeId = exercise.typeId || ""
  const name = (exercise.name || "").toLowerCase()
  const vi = (exercise.vi || "").toLowerCase()
  const desc = (exercise.desc || "").toLowerCase()
  const gSlug = (exercise.grammarSlug || "").toLowerCase()

  // 1. Kỹ năng Nghe
  if (
    typeId === "nghe-chon" ||
    exercise.category === "listening" ||
    question.kind === "listen" ||
    question.kind === "listening" ||
    name.includes("nghe") ||
    vi.includes("nghe") ||
    name.includes("listen")
  ) {
    return {
      skill: "listening",
      topic: exercise.vi || exercise.name || "Kỹ năng nghe hiểu",
    }
  }

  // 2. Kỹ năng Cấu trúc câu & Trật tự từ
  if (
    typeId === "sap-xep-cau" ||
    question.kind === "order" ||
    name.includes("sắp xếp") ||
    name.includes("order") ||
    name.includes("gerund") ||
    name.includes("infinitive")
  ) {
    return {
      skill: "syntax",
      topic: exercise.vi || exercise.name || "Cấu trúc & Sắp xếp câu",
    }
  }

  // 3. Từ vựng & Điền từ
  if (
    typeId === "dien-tu" ||
    question.kind === "fill" ||
    name.includes("từ vựng") ||
    name.includes("vocab") ||
    name.includes("fill")
  ) {
    const wordAns = "answer" in question && typeof question.answer === "string" ? question.answer.trim() : undefined
    return {
      skill: "vocab",
      topic: exercise.vi || exercise.name || "Từ vựng & Điền từ",
      word: wordAns,
    }
  }

  // 4. Ngữ pháp Nâng cao
  if (
    name.includes("passive") ||
    name.includes("bị động") ||
    name.includes("condition") ||
    name.includes("điều kiện") ||
    name.includes("relative") ||
    name.includes("mệnh đề quan hệ") ||
    name.includes("inversion") ||
    name.includes("đảo ngữ") ||
    name.includes("modal") ||
    name.includes("reported") ||
    gSlug.includes("passive") ||
    gSlug.includes("condition") ||
    gSlug.includes("inversion") ||
    gSlug.includes("relative")
  ) {
    return {
      skill: "adv_grammar",
      topic: exercise.vi || exercise.name || "Ngữ pháp mở rộng",
    }
  }

  // 5. 12 Thì tiếng Anh
  if (
    name.includes("thì") ||
    vi.includes("thì") ||
    name.includes("tense") ||
    name.includes("present") ||
    name.includes("past") ||
    name.includes("future") ||
    gSlug.includes("simple") ||
    gSlug.includes("continuous") ||
    gSlug.includes("perfect")
  ) {
    return {
      skill: "tense",
      topic: exercise.vi || exercise.name || "12 Thì trong tiếng Anh",
    }
  }

  // 6. Đọc hiểu & Trắc nghiệm khác
  return {
    skill: "reading",
    topic: exercise.vi || exercise.name || "Đọc hiểu & Trắc nghiệm",
  }
}

/**
 * Sinh một bài luyện tập Spaced Repetition trực tiếp từ các câu/từ hay sai
 */
export function generateMistakeReviewExercise(specificWord?: string): Exercise | null {
  let records = getMistakes().filter((r) => !r.isMastered && r.wrongCount > 0)
  if (specificWord) {
    records = records.filter((r) => r.word?.toLowerCase() === specificWord.toLowerCase())
  }
  if (records.length === 0) return null

  // Sắp xếp theo trọng số cao nhất (sai nhiều + gần đây)
  const now = Date.now()
  records.sort((a, b) => calculateMistakeWeight(b, now) - calculateMistakeWeight(a, now))
  const selected = records.slice(0, 10)

  const items: Question[] = selected.map((r) => {
    let q: Question

    if (r.questionData) {
      if (r.questionData.kind === "fill") {
        q = {
          kind: "fill",
          prompt: r.prompt,
          answer: r.correctAnswer,
          hint: r.questionData.hint,
        }
      } else if (r.questionData.kind === "order" && r.questionData.words) {
        q = {
          kind: "order",
          sentence: r.correctAnswer,
          words: r.questionData.words,
        }
      } else if (r.questionData.options && r.questionData.options.length === 4) {
        const correctIdx = r.questionData.options.findIndex((opt) => opt.trim() === r.correctAnswer.trim())
        q = {
          kind: "choice",
          prompt: r.prompt,
          options: r.questionData.options as [string, string, string, string],
          correctIndex: correctIdx >= 0 ? correctIdx : 0,
        }
      } else {
        q = {
          kind: "fill",
          prompt: r.prompt,
          answer: r.correctAnswer,
          hint: r.questionData.hint || `Đáp án có ${r.correctAnswer.length} ký tự`,
        }
      }
    } else if (r.word) {
      // Nếu là từ vựng: tạo câu điền từ
      q = {
        kind: "fill",
        prompt: r.prompt ? r.prompt : `Nhập đúng từ vựng có nghĩa là: "${r.topic}"`,
        answer: r.word,
        hint: `Bắt đầu bằng chữ "${r.word[0]}"`,
      }
    } else {
      // Mặc định câu điền đáp án
      q = {
        kind: "fill",
        prompt: r.prompt,
        answer: r.correctAnswer,
        hint: `Đáp án có ${r.correctAnswer.length} ký tự`,
      }
    }

    // Gắn metadata gốc của bản ghi lỗi để khi làm lại QuizRunner nhận diện đúng
    Object.assign(q, {
      mistakeKey: r.key,
      mistakeSource: r.source,
      mistakeQuestionId: r.key.includes(":") ? r.key.slice(r.source.length + 1) : r.key,
      skill: r.skill,
      topic: r.topic,
      word: r.word,
    })

    return q
  })

  return {
    id: `mistake-review-${Date.now()}`,
    name: specificWord ? `Ôn tập từ vựng: ${specificWord}` : "Ôn tập Lỗ hổng: Các câu hay sai",
    vi: "Luyện tập các câu hỏi bạn từng làm sai",
    desc: `Tự động tạo từ ${items.length} câu bạn hay nhầm lẫn nhất`,
    typeId: "dien-tu",
    minutes: Math.max(3, items.length),
    status: "Chưa làm",
    category: "reading",
    items,
  }
}
