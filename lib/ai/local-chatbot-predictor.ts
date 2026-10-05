/**
 * Local Chatbot Intent Inference Engine (TypeScript)
 * Nạp trọng số mô hình đã huấn luyện từ ml_engine/chatbot_model.json
 * và thực hiện suy luận TF-IDF + Logistic Regression trong mili-giây.
 */

import modelData from "@/ml_engine/models/chatbot_model.json"

export type PredictedIntentResult = {
  intent: string
  confidence: number
  allProbs: Record<string, number>
}

export type ChatbotModelSchema = {
  model_type: string
  classes: string[]
  vocabulary: Record<string, number>
  idf: number[]
  coefficients: number[][]
  intercept: number[]
}

const rawModel = modelData as unknown as ChatbotModelSchema
const { classes, vocabulary, idf, coefficients, intercept } = rawModel

/**
 * Trích xuất unigrams và bigrams từ chuỗi đầu vào
 */
function extractNgrams(text: string): string[] {
  const words = text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .split(/\s+/)
    .filter(Boolean)

  const tokens: string[] = [...words]
  for (let i = 0; i < words.length - 1; i++) {
    tokens.push(`${words[i]} ${words[i + 1]}`)
  }
  return tokens
}

/**
 * Dự đoán ý định của câu hỏi bằng mô hình đã train trong ml_engine
 */
export function predictChatbotIntent(text: string): PredictedIntentResult {
  const tokens = extractNgrams(text)
  const numFeatures = Object.keys(vocabulary).length
  const vocabMap = vocabulary as Record<string, number>

  // Đếm tần suất từ (Sparse Term Frequency)
  const counts: Record<number, number> = {}
  for (const token of tokens) {
    const idx = vocabMap[token]
    if (idx !== undefined && idx < numFeatures) {
      counts[idx] = (counts[idx] || 0) + 1
    }
  }

  // Sublinear TF: 1 + ln(count) nếu count > 0
  const activeIndices: number[] = []
  const activeValues: number[] = []
  let normSq = 0
  for (const [idxStr, count] of Object.entries(counts)) {
    const idx = Number(idxStr)
    const val = (1 + Math.log(count)) * (idf[idx] || 1)
    activeIndices.push(idx)
    activeValues.push(val)
    normSq += val * val
  }

  // Chuẩn hóa L2 norm
  const norm = Math.sqrt(normSq)
  if (norm > 0) {
    for (let k = 0; k < activeValues.length; k++) {
      activeValues[k] /= norm
    }
  }

  // Tính điểm phân loại cho từng class: z_c = intercept_c + sum(w_ci * tfidf_i)
  const numClasses = classes.length
  const rawScores = new Float32Array(numClasses)
  let maxScore = -Infinity

  for (let c = 0; c < numClasses; c++) {
    let score = intercept[c] ?? 0
    const classWeights = coefficients[c]
    if (classWeights) {
      for (let k = 0; k < activeIndices.length; k++) {
        const idx = activeIndices[k]
        score += (classWeights[idx] ?? 0) * activeValues[k]
      }
    }
    rawScores[c] = score
    if (score > maxScore) maxScore = score
  }

  // Softmax
  let sumExp = 0
  const probs = new Float32Array(numClasses)
  for (let c = 0; c < numClasses; c++) {
    const rawVal = rawScores[c] ?? 0
    const expVal = Math.exp(rawVal - maxScore)
    probs[c] = expVal
    sumExp += expVal
  }

  let bestIdx = 0
  let bestProb = 0
  const allProbs: Record<string, number> = {}

  for (let c = 0; c < numClasses; c++) {
    const p = sumExp > 0 ? (probs[c] ?? 0) / sumExp : 0
    const rounded = Math.round(p * 1000) / 1000
    const className = classes[c]
    if (className && rounded >= 0.05) {
      allProbs[className] = rounded
    }
    if (p > bestProb) {
      bestProb = p
      bestIdx = c
    }
  }

  return {
    intent: classes[bestIdx] || "unknown",
    confidence: Math.round(bestProb * 1000) / 1000,
    allProbs,
  }
}
