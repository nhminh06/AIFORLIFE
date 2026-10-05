/**
 * Local Machine Learning Essay Scorer (AES) Inference Engine
 * Chấm điểm bài viết tiếng Anh bằng mô hình Ridge Regression đã được huấn luyện bởi scikit-learn (ml_engine/).
 * Không phụ thuộc vào API bên ngoài, suy luận trực tiếp trong mili-giây.
 */

import cefrVocabData from "@/ml_engine/datasets/cefr_vocab.json"
import modelWeights from "@/ml_engine/models/model_weights.json"

export type EssayFeatures = {
  word_count: number
  avg_sentence_length: number
  lexical_diversity: number
  advanced_vocab_ratio: number
  flesch_reading_ease: number
  cohesive_density: number
}

export type ScorePredictionResult = {
  score: number
  level: "Chưa đạt" | "Đạt" | "Tốt" | "Xuất sắc"
  feedback: string
  features: EssayFeatures
  featureContributions: Record<string, number>
  metrics: {
    r2_score: number
    rmse: number
    pearson_r: number
  }
  strengths: string[]
  suggestions: string[]
}

const b1Set = new Set(cefrVocabData.levels.B1.map((w: string) => w.toLowerCase()))
const c1Set = new Set(cefrVocabData.levels.C1.map((w: string) => w.toLowerCase()))
const cohesiveDevices = cefrVocabData.cohesive_devices.map((c: string) => c.toLowerCase())

function countSyllables(word: string): number {
  const w = word.toLowerCase().trim()
  if (!w) return 0
  if (w.length <= 3) return 1
  const clean = w.replace(/(?:[^laeiouy]|ed|es|e)$/, "").replace(/^y/, "")
  const matches = clean.match(/[aeiouy]{1,2}/g)
  return Math.max(1, matches ? matches.length : 1)
}

export function extractNLPFeatures(text: string): EssayFeatures {
  const textClean = text.trim()
  if (!textClean) {
    return {
      word_count: 0,
      avg_sentence_length: 0,
      lexical_diversity: 0,
      advanced_vocab_ratio: 0,
      flesch_reading_ease: 0,
      cohesive_density: 0,
    }
  }

  // 1. Tách câu
  const sentences = textClean.split(/[.!?]+/).map(s => s.trim()).filter(Boolean)
  const sentenceCount = Math.max(1, sentences.length)

  // 2. Tách từ
  const words = (textClean.match(/\b[a-zA-Z']+\b/g) || []).map(w => w.toLowerCase())
  const totalWords = Math.max(1, words.length)

  // 3. Độ dài câu trung bình
  const avgSentenceLength = totalWords / sentenceCount

  // 4. Lexical diversity (TTR)
  const uniqueWords = new Set(words)
  const lexicalDiversity = uniqueWords.size / totalWords

  // 5. Tỷ lệ từ vựng B1 - C1
  const advancedCount = words.filter(w => b1Set.has(w) || c1Set.has(w)).length
  const advancedVocabRatio = advancedCount / totalWords

  // 6. Flesch Reading Ease
  const totalSyllables = words.reduce((acc, w) => acc + countSyllables(w), 0)
  const asw = totalSyllables / totalWords
  const fleschScore = 206.835 - 1.015 * avgSentenceLength - 84.6 * asw
  const fleschReadingEase = Math.max(0, Math.min(100, fleschScore))

  // 7. Mật độ liên từ (cohesive density per 100 words)
  const lowerText = textClean.toLowerCase()
  let cohesiveCount = 0
  for (const device of cohesiveDevices) {
    const escaped = device.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const matches = lowerText.match(new RegExp(`\\b${escaped}\\b`, "g"))
    if (matches) cohesiveCount += matches.length
  }
  const cohesiveDensity = (cohesiveCount / totalWords) * 100

  return {
    word_count: totalWords,
    avg_sentence_length: Math.round(avgSentenceLength * 100) / 100,
    lexical_diversity: Math.round(lexicalDiversity * 10000) / 10000,
    advanced_vocab_ratio: Math.round(advancedVocabRatio * 10000) / 10000,
    flesch_reading_ease: Math.round(fleschReadingEase * 100) / 100,
    cohesive_density: Math.round(cohesiveDensity * 100) / 100,
  }
}

export function scoreEssayML(text: string, minWords = 50): ScorePredictionResult {
  const features = extractNLPFeatures(text)
  const { feature_names, scaler, intercept, coefficients, metrics } = modelWeights

  let predictedScore = intercept
  const contributions: Record<string, number> = {}

  feature_names.forEach((name, idx) => {
    const val = features[name as keyof EssayFeatures]
    const mean = scaler.mean[idx]
    const scale = scaler.scale[idx]
    const coef = coefficients[idx]

    const z = scale !== 0 ? (val - mean) / scale : 0
    const contrib = coef * z
    predictedScore += contrib
    contributions[name] = Math.round(contrib * 100) / 100
  })

  // Áp dụng phạt nếu bài viết quá ngắn so với yêu cầu
  if (minWords > 0 && features.word_count < minWords) {
    const lengthRatio = Math.max(0.2, features.word_count / minWords)
    predictedScore = predictedScore * lengthRatio
  }

  // Chuẩn hóa điểm 0 - 100
  const finalScore = Math.min(100, Math.max(0, Math.round(predictedScore)))

  let level: "Chưa đạt" | "Đạt" | "Tốt" | "Xuất sắc" = "Chưa đạt"
  if (finalScore >= 85) level = "Xuất sắc"
  else if (finalScore >= 70) level = "Tốt"
  else if (finalScore >= 50) level = "Đạt"

  // Sinh phản hồi Explainable AI (XAI) dựa trên các chỉ số khoa học thuần túy
  const strengths: string[] = []
  const suggestions: string[] = []

  // 1. Đánh giá số từ
  if (features.word_count >= minWords) {
    strengths.push(`Độ dài đạt chuẩn: ${features.word_count} từ (vượt mức tối thiểu ${minWords} từ).`)
  } else {
    suggestions.push(`Dung lượng còn thiếu (${features.word_count}/${minWords} từ); hãy mở rộng thêm ý và ví dụ minh họa.`)
  }

  // 2. Đánh giá từ vựng nâng cao CEFR B1-C1
  if (features.advanced_vocab_ratio >= 0.25) {
    strengths.push(`Vốn từ học thuật phong phú: ${(features.advanced_vocab_ratio * 100).toFixed(1)}% từ vựng thuộc cấp độ B1 - C1.`)
  } else if (features.advanced_vocab_ratio >= 0.12) {
    strengths.push(`Sử dụng được một số từ vựng trung cấp B1 (${(features.advanced_vocab_ratio * 100).toFixed(1)}%).`)
    suggestions.push("Nên nâng cấp một số từ cơ bản sang từ đồng nghĩa học thuật (academic collocations) để tăng sức thuyết phục.")
  } else {
    suggestions.push("Tỷ lệ từ học thuật còn thấp; hãy thử dùng các từ vựng tương đương ở cấp độ B2/C1.")
  }

  // 3. Đánh giá tính liên kết & liên từ (Cohesion)
  if (features.cohesive_density >= 1.5) {
    strengths.push(`Tính liên kết tốt (${features.cohesive_density}%): Dùng đa dạng các liên từ chuyển ý giúp bài viết mạch lạc.`)
  } else {
    suggestions.push("Nên sử dụng thêm các liên từ nối ý (Furthermore, Consequently, On the other hand, Ultimately) để tăng tính gắn kết.")
  }

  // 4. Đánh giá độ dài và cấu trúc câu
  if (features.avg_sentence_length >= 13 && features.avg_sentence_length <= 24) {
    strengths.push(`Độ dài câu lý tưởng (${features.avg_sentence_length} từ/câu), kết hợp cân đối giữa câu ghép và mệnh đề phức.`)
  } else if (features.avg_sentence_length < 11) {
    suggestions.push("Các câu văn còn hơi ngắn và đơn giản; hãy thử ghép câu bằng mệnh đề quan hệ hoặc liên từ phụ thuộc.")
  } else if (features.avg_sentence_length > 28) {
    suggestions.push("Một số câu quá dài có thể gây khó theo dõi; nên ngắt bớt thành 2 câu để ý tưởng sáng sủa hơn.")
  }

  // 5. Đánh giá đa dạng từ vựng (TTR)
  if (features.lexical_diversity >= 0.75) {
    strengths.push(`Độ phong phú từ vựng cao (TTR: ${(features.lexical_diversity * 100).toFixed(0)}%), hầu như không bị lặp từ.`)
  } else if (features.lexical_diversity < 0.55) {
    suggestions.push("Có hiện tượng lặp lại nhiều từ ngữ giống nhau; hãy tìm từ đồng nghĩa thay thế.")
  }

  // Tổng hợp nhận xét chung
  let feedback = ""
  if (finalScore >= 85) {
    feedback = `Bài viết xuất sắc (${finalScore}/100) theo mô hình Machine Learning AES. Văn phong học thuật chuẩn mực, từ vựng phong phú (${(features.advanced_vocab_ratio * 100).toFixed(0)}% B1-C1) và cấu trúc liên kết chặt chẽ.`
  } else if (finalScore >= 70) {
    feedback = `Bài viết đạt mức tốt (${finalScore}/100). Tư duy logic rõ ràng và ngữ pháp vững. Phát triển thêm tính đa dạng của từ vựng và câu phức sẽ giúp bài viết đạt điểm tối đa.`
  } else if (finalScore >= 50) {
    feedback = `Bài viết đạt yêu cầu cơ bản (${finalScore}/100). Ý tưởng dễ hiểu nhưng còn dùng nhiều từ vựng và cấu trúc câu cơ bản.`
  } else {
    feedback = `Bài viết chưa đạt yêu cầu (${finalScore}/100). Hãy bổ sung thêm dung lượng bài viết, kiểm tra lại ngữ pháp và chèn thêm các liên từ kết nối câu.`
  }

  return {
    score: finalScore,
    level,
    feedback,
    features,
    featureContributions: contributions,
    metrics: {
      r2_score: metrics.r2_score,
      rmse: metrics.rmse,
      pearson_r: metrics.pearson_r,
    },
    strengths: strengths.slice(0, 4),
    suggestions: suggestions.slice(0, 4),
  }
}
