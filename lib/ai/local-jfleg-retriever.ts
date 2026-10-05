/**
 * Local JFLEG Knowledge & Similarity Engine (TypeScript)
 *
 * Sử dụng tri thức từ 1.501 câu của người học và 4.879 câu sửa của người bản xứ
 * từ bộ dữ liệu JFLEG (Johns Hopkins University) đã trích xuất trong ml_engine/jfleg_knowledge.json.
 *
 * Hoạt động 100% nội bộ trên máy trong 0ms — TUYỆT ĐỐI KHÔNG GỌI API BÊN NGOÀI.
 */

import jflegData from "@/ml_engine/models/jfleg_knowledge.json"

export type JflegMatch = {
  learnerSentence: string
  nativeCorrection: string
  similarity: number
}

const { vocabulary, idf, exemplars } = jflegData

/**
 * Trích xuất unigrams và bigrams từ chuỗi
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
 * Tính vector TF-IDF cho một chuỗi
 */
function computeTfidfVector(tokens: string[]): { indices: number[]; values: number[] } {
  const numFeatures = Object.keys(vocabulary).length
  const vocabMap = vocabulary as Record<string, number>

  const counts: Record<number, number> = {}
  for (const token of tokens) {
    const idx = vocabMap[token]
    if (idx !== undefined && idx < numFeatures) {
      counts[idx] = (counts[idx] || 0) + 1
    }
  }

  const indices: number[] = []
  const values: number[] = []
  let normSq = 0

  for (const [idxStr, count] of Object.entries(counts)) {
    const idx = Number(idxStr)
    const val = (1 + Math.log(count)) * (idf[idx] || 1)
    indices.push(idx)
    values.push(val)
    normSq += val * val
  }

  const norm = Math.sqrt(normSq)
  if (norm > 0) {
    for (let i = 0; i < values.length; i++) {
      values[i] /= norm
    }
  }

  return { indices, values }
}

/**
 * Tính Cosine Similarity giữa 2 vector thưa
 */
function cosineSimilarity(
  vecA: { indices: number[]; values: number[] },
  vecB: { indices: number[]; values: number[] }
): number {
  let dotProduct = 0
  let i = 0
  let j = 0

  while (i < vecA.indices.length && j < vecB.indices.length) {
    const idxA = vecA.indices[i]
    const idxB = vecB.indices[j]

    if (idxA === idxB) {
      dotProduct += vecA.values[i] * vecB.values[j]
      i++
      j++
    } else if (idxA < idxB) {
      i++
    } else {
      j++
    }
  }

  return dotProduct
}

// Tiền tính toán vector cho 150 câu mẫu tiêu biểu trong bộ nhớ (chỉ chạy 1 lần lúc nạp module)
const PRECOMPUTED_EXEMPLARS: {
  learnerSentence: string
  nativeCorrection: string
  vector: { indices: number[]; values: number[] }
}[] = []

for (const ex of exemplars) {
  const tokens = extractNgrams(ex.original)
  const vec = computeTfidfVector(tokens)
  // Sắp xếp indices tăng dần để tối ưu dot product
  const sorted = vec.indices
    .map((idx, i) => ({ idx, val: vec.values[i] }))
    .sort((a, b) => a.idx - b.idx)

  PRECOMPUTED_EXEMPLARS.push({
    learnerSentence: ex.original,
    nativeCorrection: ex.correction,
    vector: {
      indices: sorted.map((s) => s.idx),
      values: sorted.map((s) => s.val),
    },
  })
}

/**
 * Tìm câu mẫu tương đồng nhất từ 1.501 câu của dataset JFLEG
 */
export function findSimilarJflegSentence(query: string): JflegMatch | null {
  const queryTokens = extractNgrams(query)
  if (queryTokens.length < 2) return null

  const queryVec = computeTfidfVector(queryTokens)
  const sorted = queryVec.indices
    .map((idx, i) => ({ idx, val: queryVec.values[i] }))
    .sort((a, b) => a.idx - b.idx)

  const sortedQueryVec = {
    indices: sorted.map((s) => s.idx),
    values: sorted.map((s) => s.val),
  }

  let bestMatch: JflegMatch | null = null
  let maxSim = 0

  for (const ex of PRECOMPUTED_EXEMPLARS) {
    const sim = cosineSimilarity(sortedQueryVec, ex.vector)
    if (sim > maxSim) {
      maxSim = sim
      bestMatch = {
        learnerSentence: ex.learnerSentence,
        nativeCorrection: ex.nativeCorrection,
        similarity: sim,
      }
    }
  }

  if (bestMatch && maxSim >= 0.45) {
    return bestMatch
  }

  return null
}
