/**
 * Bộ suy luận Lộ trình Học Cá nhân hoá (Personalized Learning Path Inference Engine) v2.0
 * Chạy 100% nội bộ trên máy trong 0ms bằng mô hình Machine Learning đã train trong ml_engine.
 *
 * Tổng hợp toàn bộ câu đúng/sai của người học trên website:
 * - Trắc nghiệm, điền từ, nghe chọn, sắp xếp câu (/luyen-tap)
 * - Tiến độ chủ điểm ngữ pháp (/ngu-phap)
 * - Từ vựng & mẫu câu (/tu-vung, /mau-cau)
 */

import modelData from "@/ml_engine/models/learning_path_model.json"
import type { PracticeResultRecord } from "@/lib/progress/practice-results-service"
import type { PracticeResult } from "@/lib/data/practice"

export type SkillStat = {
  name: string
  key: "tense" | "syntax" | "reading" | "listening" | "adv_grammar" | "vocab"
  correct: number
  incorrect: number
  total: number
  accuracy: number
  isAttempted: boolean
  priorityScore: number
  status: "Cần cải thiện khẩn cấp" | "Cần củng cố thêm" | "Nắm vững tốt" | "Chưa làm bài test"
  color: string
}

export type LessonRecommendation = {
  type: string
  slug?: string
  id?: string
  title: string
  action: string
}

export type RoadmapStage = {
  name: string
  lessons: LessonRecommendation[]
}

export type PersonalizedPathResult = {
  level: "Foundation" | "Intermediate" | "Advanced"
  levelVi: string
  levelConfidence: number
  primaryFocus: string
  primaryFocusTitle: string
  primaryFocusDesc: string
  totalAttempted: number
  totalCorrect: number
  totalIncorrect: number
  overallAccuracy: number
  skills: SkillStat[]
  stages: {
    stage1: RoadmapStage
    stage2: RoadmapStage
    stage3: RoadmapStage
  }
  generatedAt: number
}

type ModelSchema = {
  feature_keys: string[]
  scaler: {
    mean: number[]
    scale: number[]
  }
  level_classifier: {
    classes: ("Foundation" | "Intermediate" | "Advanced")[]
    coefficients: number[][]
    intercept: number[]
    cv_accuracy: number
  }
  focus_classifier: {
    classes: string[]
    coefficients: number[][]
    intercept: number[]
    cv_accuracy: number
  }
  priority_regressor: {
    targets: string[]
    coefficients: number[][]
    intercept: number[]
    r2_score: number
  }
  curriculum_roadmap: Record<
    string,
    {
      title: string
      description: string
      stage_1: RoadmapStage
      stage_2: RoadmapStage
      stage_3: RoadmapStage
    }
  >
}

const model = modelData as unknown as ModelSchema

const FOCUS_NAME_MAP: Record<string, string> = {
  tense_mastery: "Chinh phục 12 Thì căn bản",
  sentence_structure: "Cấu trúc câu & Trật tự từ",
  listening_comprehension: "Kỹ năng Nghe & Phản xạ",
  advanced_grammar: "Ngữ pháp Mở rộng & Nâng cao",
  vocabulary_expansion: "Mở rộng Vốn từ vựng",
  comprehensive_practice: "Luyện đề Tổng hợp Đa kỹ năng",
}

const LEVEL_VI_MAP: Record<string, string> = {
  Foundation: "Mất gốc / Cần xây nền tảng",
  Intermediate: "Trung cấp / Đang tích lũy",
  Advanced: "Nâng cao / Thành thạo",
}

function softmax(arr: number[]): number[] {
  const max = Math.max(...arr)
  const exp = arr.map((x) => Math.exp(x - max))
  const sum = exp.reduce((a, b) => a + b, 0)
  return exp.map((x) => x / sum)
}

/**
 * Tổng hợp toàn bộ câu đúng/sai từ kết quả làm bài của học viên
 */
export function aggregateUserPracticeData(
  practiceResults: Record<string, PracticeResultRecord | PracticeResult>
) {
  let totalCorrect = 0
  let totalQuestions = 0

  // 6 mảng kỹ năng toàn diện
  const bucket = {
    tense: { correct: 0, total: 0 },
    syntax: { correct: 0, total: 0 },
    reading: { correct: 0, total: 0 },
    listening: { correct: 0, total: 0 },
    advGrammar: { correct: 0, total: 0 },
    vocab: { correct: 0, total: 0 },
  }

  let attemptSum = 0
  let attemptCount = 0

  for (const [id, item] of Object.entries(practiceResults)) {
    const raw = item as Record<string, unknown>
    const score = Number(raw.score ?? 0)
    const total = Number(raw.total ?? 0)
    if (total <= 0) continue

    const validCorrect = Math.min(score, total)
    totalCorrect += validCorrect
    totalQuestions += total

    if ("attempts" in item && typeof item.attempts === "number" && item.attempts > 0) {
      attemptSum += item.attempts
      attemptCount += 1
    }

    const typeId = "typeId" in item ? String(item.typeId) : ""
    const name = ("name" in item ? String(item.name) : id).toLowerCase()

    // Phân loại chính xác bài tập vào 6 kỹ năng
    if (typeId === "nghe-chon" || name.includes("nghe") || name.includes("listen")) {
      bucket.listening.correct += validCorrect
      bucket.listening.total += total
    } else if (
      typeId === "sap-xep-cau" ||
      name.includes("sắp xếp") ||
      name.includes("order") ||
      id.includes("order")
    ) {
      bucket.syntax.correct += validCorrect
      bucket.syntax.total += total
    } else if (
      typeId === "dien-tu" ||
      name.includes("từ vựng") ||
      name.includes("vocab") ||
      id.includes("vocab") ||
      id.includes("fill")
    ) {
      bucket.vocab.correct += validCorrect
      bucket.vocab.total += total
    } else if (
      name.includes("thì") ||
      name.includes("tense") ||
      name.includes("present") ||
      name.includes("past") ||
      name.includes("future") ||
      id.includes("tense") ||
      id.includes("present") ||
      id.includes("past")
    ) {
      bucket.tense.correct += validCorrect
      bucket.tense.total += total
    } else if (
      name.includes("passive") ||
      name.includes("condition") ||
      name.includes("mệnh đề") ||
      name.includes("bị động") ||
      name.includes("inversion") ||
      name.includes("modal")
    ) {
      bucket.advGrammar.correct += validCorrect
      bucket.advGrammar.total += total
    } else {
      // Mọi bài trắc nghiệm đọc / đề tổng hợp khác
      bucket.reading.correct += validCorrect
      bucket.reading.total += total
    }
  }

  // QUY TẮC CHUẨN XÁC: Nếu chưa làm (total = 0) -> accuracy là 0.0 và has_attempted = 0.
  // TUYỆT ĐỐI KHÔNG FALLBACK LẤY overallAccuracy!
  const getAcc = (c: number, t: number) => (t > 0 ? c / t : 0.0)

  const overallAcc = totalQuestions > 0 ? totalCorrect / totalQuestions : 0.5
  const tenseAcc = getAcc(bucket.tense.correct, bucket.tense.total)
  const syntaxAcc = getAcc(bucket.syntax.correct, bucket.syntax.total)
  const readingAcc = getAcc(bucket.reading.correct, bucket.reading.total)
  const listeningAcc = getAcc(bucket.listening.correct, bucket.listening.total)
  const advAcc = getAcc(bucket.advGrammar.correct, bucket.advGrammar.total)
  const vocabAcc = getAcc(bucket.vocab.correct, bucket.vocab.total)
  const avgAttempts = attemptCount > 0 ? attemptSum / attemptCount : 1.2

  return {
    totalAttempted: totalQuestions,
    totalCorrect,
    totalIncorrect: totalQuestions - totalCorrect,
    overallAccuracy: overallAcc,
    tenseAccuracy: tenseAcc,
    syntaxAccuracy: syntaxAcc,
    readingAccuracy: readingAcc,
    listeningAccuracy: listeningAcc,
    advGrammarAccuracy: advAcc,
    vocabAccuracy: vocabAcc,
    tenseHasAttempted: bucket.tense.total > 0 ? 1.0 : 0.0,
    syntaxHasAttempted: bucket.syntax.total > 0 ? 1.0 : 0.0,
    readingHasAttempted: bucket.reading.total > 0 ? 1.0 : 0.0,
    listeningHasAttempted: bucket.listening.total > 0 ? 1.0 : 0.0,
    advGrammarHasAttempted: bucket.advGrammar.total > 0 ? 1.0 : 0.0,
    vocabHasAttempted: bucket.vocab.total > 0 ? 1.0 : 0.0,
    tenseErrors: bucket.tense.total - bucket.tense.correct,
    syntaxErrors: bucket.syntax.total - bucket.syntax.correct,
    readingErrors: bucket.reading.total - bucket.reading.correct,
    listeningErrors: bucket.listening.total - bucket.listening.correct,
    advGrammarErrors: bucket.advGrammar.total - bucket.advGrammar.correct,
    vocabErrors: bucket.vocab.total - bucket.vocab.correct,
    avgAttempts,
    bucket,
  }
}

/**
 * Suy luận Lộ trình Học cá nhân hoá bằng Machine Learning (0ms)
 */
export function predictPersonalizedPath(
  practiceResults: Record<string, PracticeResultRecord | PracticeResult>
): PersonalizedPathResult {
  const stats = aggregateUserPracticeData(practiceResults)

  // 1. Tạo Feature Vector 21 chiều theo đúng model v2.0
  const rawFeatures = [
    stats.totalAttempted,
    stats.overallAccuracy,
    stats.tenseAccuracy,
    stats.syntaxAccuracy,
    stats.readingAccuracy,
    stats.listeningAccuracy,
    stats.advGrammarAccuracy,
    stats.vocabAccuracy,
    stats.tenseHasAttempted,
    stats.syntaxHasAttempted,
    stats.readingHasAttempted,
    stats.listeningHasAttempted,
    stats.advGrammarHasAttempted,
    stats.vocabHasAttempted,
    stats.tenseErrors,
    stats.syntaxErrors,
    stats.readingErrors,
    stats.listeningErrors,
    stats.advGrammarErrors,
    stats.vocabErrors,
    stats.avgAttempts,
  ]

  // Chuẩn hoá StandardScaler
  const scaled = rawFeatures.map((val, i) => {
    const mean = model.scaler.mean[i] ?? 0
    const scale = model.scaler.scale[i] ?? 1
    return (val - mean) / scale
  })

  // 2. Dự đoán Cấp độ (Level Classifier)
  const lvlScores: number[] = model.level_classifier.classes.map((_, cIdx) => {
    const weights = model.level_classifier.coefficients[cIdx] || []
    const bias = model.level_classifier.intercept[cIdx] || 0
    let dot = 0
    for (let i = 0; i < scaled.length; i++) {
      dot += scaled[i] * (weights[i] || 0)
    }
    return dot + bias
  })

  const lvlProbs = softmax(lvlScores)
  let bestLvlIdx = 0
  for (let i = 1; i < lvlProbs.length; i++) {
    if (lvlProbs[i] > lvlProbs[bestLvlIdx]) bestLvlIdx = i
  }
  const predLevel = model.level_classifier.classes[bestLvlIdx] || "Foundation"
  const predLevelConf = Math.round((lvlProbs[bestLvlIdx] || 0.8) * 100)

  // 3. Dự đoán Trọng tâm then chốt (Focus Classifier)
  const focusScores: number[] = model.focus_classifier.classes.map((_, cIdx) => {
    const weights = model.focus_classifier.coefficients[cIdx] || []
    const bias = model.focus_classifier.intercept[cIdx] || 0
    let dot = 0
    for (let i = 0; i < scaled.length; i++) {
      dot += scaled[i] * (weights[i] || 0)
    }
    return dot + bias
  })

  const focusProbs = softmax(focusScores)
  let bestFocusIdx = 0
  for (let i = 1; i < focusProbs.length; i++) {
    if (focusProbs[i] > focusProbs[bestFocusIdx]) bestFocusIdx = i
  }
  const predFocus = model.focus_classifier.classes[bestFocusIdx] || "tense_mastery"

  // 4. Dự đoán Điểm ưu tiên kỹ năng (Priority Regressor)
  const priorities: Record<string, number> = {}
  model.priority_regressor.targets.forEach((target, tIdx) => {
    const weights = model.priority_regressor.coefficients[tIdx] || []
    const bias = model.priority_regressor.intercept[tIdx] || 0
    let dot = 0
    for (let i = 0; i < scaled.length; i++) {
      dot += scaled[i] * (weights[i] || 0)
    }
    const score = Math.max(0, Math.min(100, Math.round((dot + bias) * 10) / 10))
    priorities[target] = score
  })

  // 5. Cấu trúc thống kê mảng kỹ năng cho UI (Trung thực 100%)
  const getStatus = (total: number, prio: number, acc: number): SkillStat["status"] => {
    if (total === 0) return "Chưa làm bài test"
    if (prio >= 75 || acc < 0.5) return "Cần cải thiện khẩn cấp"
    if (prio >= 45 || acc < 0.75) return "Cần củng cố thêm"
    return "Nắm vững tốt"
  }

  const skills: SkillStat[] = [
    {
      name: "Cấu trúc & Sắp xếp câu",
      key: "syntax",
      correct: stats.bucket.syntax.correct,
      incorrect: stats.bucket.syntax.total - stats.bucket.syntax.correct,
      total: stats.bucket.syntax.total,
      accuracy: stats.bucket.syntax.total > 0 ? Math.round(stats.syntaxAccuracy * 100) : 0,
      isAttempted: stats.bucket.syntax.total > 0,
      priorityScore: stats.bucket.syntax.total > 0 ? (priorities["priority_syntax"] || 50) : 25,
      status: getStatus(stats.bucket.syntax.total, priorities["priority_syntax"] || 50, stats.syntaxAccuracy),
      color: "bg-purple-500",
    },
    {
      name: "12 Thì trong tiếng Anh",
      key: "tense",
      correct: stats.bucket.tense.correct,
      incorrect: stats.bucket.tense.total - stats.bucket.tense.correct,
      total: stats.bucket.tense.total,
      accuracy: stats.bucket.tense.total > 0 ? Math.round(stats.tenseAccuracy * 100) : 0,
      isAttempted: stats.bucket.tense.total > 0,
      priorityScore: stats.bucket.tense.total > 0 ? (priorities["priority_tense"] || 50) : 25,
      status: getStatus(stats.bucket.tense.total, priorities["priority_tense"] || 50, stats.tenseAccuracy),
      color: "bg-blue-500",
    },
    {
      name: "Đọc hiểu & Trắc nghiệm",
      key: "reading",
      correct: stats.bucket.reading.correct,
      incorrect: stats.bucket.reading.total - stats.bucket.reading.correct,
      total: stats.bucket.reading.total,
      accuracy: stats.bucket.reading.total > 0 ? Math.round(stats.readingAccuracy * 100) : 0,
      isAttempted: stats.bucket.reading.total > 0,
      priorityScore: stats.bucket.reading.total > 0 ? (priorities["priority_reading"] || 50) : 25,
      status: getStatus(stats.bucket.reading.total, priorities["priority_reading"] || 50, stats.readingAccuracy),
      color: "bg-sky-500",
    },
    {
      name: "Kỹ năng Nghe & Phản xạ",
      key: "listening",
      correct: stats.bucket.listening.correct,
      incorrect: stats.bucket.listening.total - stats.bucket.listening.correct,
      total: stats.bucket.listening.total,
      accuracy: stats.bucket.listening.total > 0 ? Math.round(stats.listeningAccuracy * 100) : 0,
      isAttempted: stats.bucket.listening.total > 0,
      priorityScore: stats.bucket.listening.total > 0 ? (priorities["priority_listening"] || 50) : 25,
      status: getStatus(stats.bucket.listening.total, priorities["priority_listening"] || 50, stats.listeningAccuracy),
      color: "bg-emerald-500",
    },
    {
      name: "Ngữ pháp Nâng cao",
      key: "adv_grammar",
      correct: stats.bucket.advGrammar.correct,
      incorrect: stats.bucket.advGrammar.total - stats.bucket.advGrammar.correct,
      total: stats.bucket.advGrammar.total,
      accuracy: stats.bucket.advGrammar.total > 0 ? Math.round(stats.advGrammarAccuracy * 100) : 0,
      isAttempted: stats.bucket.advGrammar.total > 0,
      priorityScore: stats.bucket.advGrammar.total > 0 ? (priorities["priority_adv_grammar"] || 50) : 25,
      status: getStatus(stats.bucket.advGrammar.total, priorities["priority_adv_grammar"] || 50, stats.advGrammarAccuracy),
      color: "bg-rose-500",
    },
    {
      name: "Từ vựng & Điền từ",
      key: "vocab",
      correct: stats.bucket.vocab.correct,
      incorrect: stats.bucket.vocab.total - stats.bucket.vocab.correct,
      total: stats.bucket.vocab.total,
      accuracy: stats.bucket.vocab.total > 0 ? Math.round(stats.vocabAccuracy * 100) : 0,
      isAttempted: stats.bucket.vocab.total > 0,
      priorityScore: stats.bucket.vocab.total > 0 ? (priorities["priority_vocab"] || 50) : 25,
      status: getStatus(stats.bucket.vocab.total, priorities["priority_vocab"] || 50, stats.vocabAccuracy),
      color: "bg-amber-500",
    },
  ]

  // Sắp xếp: Ưu tiên cao nhất lên đầu, những bài đã làm và có lỗi sai đứng trước bài chưa làm
  skills.sort((a, b) => {
    if (a.isAttempted && !b.isAttempted) return -1
    if (!a.isAttempted && b.isAttempted) return 1
    return b.priorityScore - a.priorityScore
  })

  // 6. Lấy lộ trình phù hợp từ curriculum
  const curriculum = model.curriculum_roadmap[predFocus] || model.curriculum_roadmap["tense_mastery"]

  return {
    level: predLevel,
    levelVi: LEVEL_VI_MAP[predLevel] || "Cơ bản",
    levelConfidence: predLevelConf,
    primaryFocus: predFocus,
    primaryFocusTitle: FOCUS_NAME_MAP[predFocus] || curriculum.title,
    primaryFocusDesc: curriculum.description,
    totalAttempted: stats.totalAttempted,
    totalCorrect: stats.totalCorrect,
    totalIncorrect: stats.totalIncorrect,
    overallAccuracy: Math.round(stats.overallAccuracy * 100),
    skills,
    stages: {
      stage1: curriculum.stage_1,
      stage2: curriculum.stage_2,
      stage3: curriculum.stage_3,
    },
    generatedAt: Date.now(),
  }
}
