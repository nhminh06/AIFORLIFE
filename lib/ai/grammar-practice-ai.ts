import { type Exercise, type PracticeCategory, type PracticeQuestionKind, type Question } from "@/lib/data/practice"

import { getOpenRouterApiKeys, openRouterChatJSON } from "./openrouter"

const PRACTICE_MODELS = (process.env.GRAMMAR_PRACTICE_OPENROUTER_MODELS || "openrouter/free")
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean)

/** Số câu xin thêm ở mỗi batch để bù cho câu AI trả về không hợp lệ */
const SPARE_QUESTIONS = 1

/** Model free bật "suy luận ẩn" sẽ chậm hơn nhiều → mặc định tắt, bật lại bằng GRAMMAR_PRACTICE_REASONING=true */
const USE_REASONING = process.env.GRAMMAR_PRACTICE_REASONING === "true"

/** 1 batch chỉ chờ tối đa 45s và thử 2 lần → không treo lâu khi provider free bị kẹt */
const BATCH_TIMEOUT_MS = 45_000
const BATCH_MAX_ATTEMPTS = 2

type GenerateGrammarPracticeInput = {
  topic: string
  vietnameseTopic: string
  level: string
  intro: string
  formulas: string
  usage: string
  examples: string
  questionCount: number
  difficulty: string
  questionTypes?: PracticeQuestionKind[]
  request?: string
  category?: PracticeCategory
  examType?: string
}

const SYSTEM_PROMPT = `Bạn là giáo viên tiếng Anh tạo bài luyện tập cho người Việt.
Trả về DUY NHẤT một object JSON theo định dạng:
{"items":[{"kind":"choice","prompt":"...","options":["...","...","...","..."],"correctIndex":2},{"kind":"fill","prompt":"... ___ ...","answer":"...","hint":"..."},{"kind":"order","sentence":"...","words":["..."]},{"kind":"reading","passage":"...","prompt":"...","options":["...","...","...","..."],"correctIndex":1},{"kind":"listening","transcript":"...","prompt":"...","options":["...","...","...","..."],"correctIndex":0},{"kind":"writing","prompt":"...","minWords":60},{"kind":"true-false","statement":"...","answer":true}]}
Quy tắc:
- Tạo đúng số lượng câu được yêu cầu, chỉ dùng các kind được chỉ định trong yêu cầu.
- CHỦ ĐIỂM HIỆN TẠI LÀ BẮT BUỘC: mọi câu hỏi và mọi đáp án phải kiểm tra đúng chủ điểm này, không được chuyển sang chủ điểm ngữ pháp khác.
- Nếu yêu cầu của người học mơ hồ hoặc lệch chủ điểm, vẫn chỉ tạo câu hỏi về CHỦ ĐIỂM HIỆN TẠI; chỉ dùng yêu cầu đó để chọn ngữ cảnh, dạng câu hoặc mức độ khó.
- Ví dụ: nếu chủ điểm hiện tại là Comparatives and Superlatives, tất cả câu phải kiểm tra so sánh hơn, so sánh nhất hoặc cấu trúc liên quan được nêu trong công thức; không tạo câu về thì, câu điều kiện hay chủ điểm khác.
- Mỗi câu phải phù hợp trình độ.
- choice phải có đúng 4 options (mảng 4 chuỗi), correctIndex là SỐ từ 0 đến 3 và chỉ có một đáp án đúng.
- Vị trí đáp án đúng (correctIndex) phải PHÂN BỐ NGẪU NHIÊN giữa 0-3, KHÔNG được dồn về một vị trí cố định và KHÔNG được luôn đặt đáp án đúng ở options đầu tiên.
- fill phải có đúng một chỗ trống viết bằng ba dấu gạch dưới ___, answer là đáp án tiếng Anh ngắn gọn.
- order phải có sentence là câu hoàn chỉnh và words là các từ của câu bị xáo trộn, không thiếu hoặc lặp từ.
- reading phải có passage ngắn 40-100 từ, câu hỏi đọc hiểu và đúng 4 đáp án.
- listening phải có transcript tiếng Anh, câu hỏi nghe hiểu và đúng 4 đáp án.
- writing phải yêu cầu viết đoạn văn tiếng Anh, có minWords từ 30-150.
- true-false phải có statement và answer là boolean true hoặc false.
- Mỗi câu hỏi phải khác nhau, không trùng câu hỏi hay trùng đáp án đúng.
- Không lặp lại nguyên văn ví dụ trong phần lý thuyết.
- prompt và options bằng tiếng Anh; hint bằng tiếng Việt nếu có.
- Không thêm markdown, giải thích hay trường nào ngoài items.`

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

/** Model hay viết kind theo nhiều kiểu khác nhau → quy về 2 dạng dùng được */
function normalizeKind(value: unknown): PracticeQuestionKind | null {
  const kind = text(value).toLowerCase().replace(/[\s_]+/g, "-")
  if (!kind) return null
  if (kind.includes("choice") || kind.includes("mcq") || kind.includes("multiple") || kind.includes("trac-nghiem")) {
    return "choice"
  }
  if (
    kind.includes("fill") ||
    kind.includes("gap") ||
    kind.includes("blank") ||
    kind.includes("dien-tu") ||
    kind.includes("complete")
  ) {
    return "fill"
  }
  if (kind.includes("order") || kind.includes("arrange") || kind.includes("sap-xep")) return "order"
  if (kind.includes("reading") || kind.includes("read") || kind.includes("doc-hieu")) return "reading"
  if (kind.includes("listening") || kind.includes("listen") || kind.includes("nghe")) return "listening"
  if (kind.includes("writing") || kind.includes("write") || kind.includes("viet")) return "writing"
  if (kind.includes("true-false") || kind.includes("truefalse") || kind.includes("dung-sai")) return "true-false"
  return null
}

/** Chỗ trống có thể được viết ___, ____, [ ] hoặc ( ) → chuẩn hóa về ___ */
function normalizePrompt(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/_{2,}/g, "___")
    .replace(/\[\s*\]/g, "___")
    .replace(/\(\s*\)/g, "___")
    .trim()
}

/** Vị trí đáp án đúng: nhận correctIndex, answerIndex, chữ cái "B" hoặc đúng nguyên văn option */
function resolveCorrectIndex(raw: Record<string, unknown>, options: string[]): number {
  const numeric = Number(raw.correctIndex ?? raw.correct_index ?? raw.answerIndex ?? raw.answer_index)
  if (Number.isInteger(numeric) && numeric >= 0 && numeric < options.length) return numeric

  const answer = text(raw.correctAnswer ?? raw.correct_answer ?? raw.answer ?? raw.correct)
  if (!answer) return -1

  const letter = answer.toUpperCase()
  if (/^[A-D]$/.test(letter)) {
    const index = letter.charCodeAt(0) - 65
    if (index < options.length) return index
  }
  return options.findIndex((option) => option.toLowerCase() === answer.toLowerCase())
}

function sanitizeItem(value: unknown): Question | null {
  if (!value || typeof value !== "object") return null
  const raw = value as Record<string, unknown>
  const kind = normalizeKind(raw.kind ?? raw.type)
  const prompt = normalizePrompt(text(raw.prompt ?? raw.question ?? raw.sentence))

  if (kind === "choice" && prompt && Array.isArray(raw.options)) {
    const options = raw.options.map(text).filter(Boolean)
    const correctIndex = options.length === 4 ? resolveCorrectIndex(raw, options) : -1
    if (correctIndex >= 0) {
      return { kind: "choice", prompt, options: options as [string, string, string, string], correctIndex }
    }
  }

  if (kind === "fill" && prompt.includes("___")) {
    const answer = text(raw.answer ?? raw.correctAnswer ?? raw.correct_answer)
    if (answer) {
      return { kind: "fill", prompt, answer, hint: text(raw.hint ?? raw.explanation) || undefined }
    }
  }

  if (kind === "order") {
    const sentence = text(raw.sentence ?? raw.answer ?? raw.correctSentence ?? raw.prompt)
    const words = Array.isArray(raw.words) ? raw.words.map(text).filter(Boolean) : []
    if (sentence && words.length >= 2) return { kind: "order", sentence, words }
  }

  if ((kind === "reading" || kind === "listening") && prompt && Array.isArray(raw.options)) {
    const options = raw.options.map(text).filter(Boolean)
    const correctIndex = options.length === 4 ? resolveCorrectIndex(raw, options) : -1
    const source = text(raw.passage ?? raw.transcript)
    if (source && correctIndex >= 0) {
      return kind === "reading"
        ? { kind, passage: source, prompt, options: options as [string, string, string, string], correctIndex }
        : { kind, transcript: source, prompt, options: options as [string, string, string, string], correctIndex }
    }
  }

  if (kind === "writing" && prompt) {
    const minWords = Math.min(Math.max(Number(raw.minWords) || 50, 30), 150)
    return { kind, prompt, minWords, sampleAnswer: text(raw.sampleAnswer ?? raw.example) || undefined }
  }

  if (kind === "true-false") {
    const statement = text(raw.statement ?? raw.prompt)
    const answer = raw.answer ?? raw.correct
    if (statement && typeof answer === "boolean") {
      return { kind, statement, answer, explanation: text(raw.explanation) || undefined }
    }
  }

  return null
}

/** Danh sách câu hỏi có thể nằm trực tiếp trong payload hoặc bọc trong { items | questions | exercise } */
function extractItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== "object") return []

  const raw = payload as Record<string, unknown>
  for (const key of ["items", "questions", "exercises"]) {
    if (Array.isArray(raw[key])) return raw[key] as unknown[]
  }
  for (const key of ["exercise", "quiz", "data", "result"]) {
    const nested = raw[key]
    if (nested && typeof nested === "object") {
      const found = extractItems(nested)
      if (found.length > 0) return found
    }
  }
  return []
}

/** Khóa để so trùng: câu hỏi nào cũng có phần đề bài */
function itemKey(item: Question): string {
  const text = item.kind === "order"
    ? item.sentence
    : item.kind === "true-false"
      ? item.statement
      : item.kind === "reading" || item.kind === "listening"
        ? item.prompt
        : item.prompt
  return text.trim().toLowerCase()
}

/** Bỏ câu bị lặp — AI có thể trả thừa, hoặc 2 batch chạy song song trả trùng nhau */
function dedupeItems(items: Question[]): Question[] {
  const seen = new Set<string>()
  const result: Question[] = []

  for (const item of items) {
    const key = itemKey(item)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(item)
  }

  return result
}

/** AI thường đặt đáp án đúng ở đầu mảng → xáo trộn options để vị trí đáp án luôn ngẫu nhiên */
function shuffleChoiceOptions(item: Question): Question {
  if (item.kind !== "choice") return item
  const correct = item.options[item.correctIndex]
  const shuffled = [...item.options]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return {
    ...item,
    options: shuffled as [string, string, string, string],
    correctIndex: shuffled.findIndex((option) => option === correct),
  }
}

/** Chuẩn hóa dữ liệu AI trả về: chỉ giữ câu hợp lệ, bỏ câu lỗi và câu trùng */
function sanitizeItems(payload: unknown): Question[] {
  return dedupeItems(
    extractItems(payload)
      .map(sanitizeItem)
      .filter((item): item is Question => item !== null)
  ).map(shuffleChoiceOptions)
}

/** Chia số câu cho từng key để chạy song song — các phần lệch nhau tối đa 1 câu */
function splitQuestionCount(total: number, parts: number): number[] {
  const base = Math.floor(total / parts)
  const remainder = total % parts
  return Array.from({ length: parts }, (_, index) => base + (index < remainder ? 1 : 0))
}

/** Câu lệnh gửi AI: bắt buộc bám đúng chủ điểm đang mở */
function buildUserPrompt(
  input: GenerateGrammarPracticeInput,
  questionCount: number,
  exclude: string[] = []
): string {
  const lines = [
    "=== NGỮ CẢNH BẮT BUỘC CỦA TRANG ĐANG MỞ ===",
    `Chủ điểm tiếng Anh: ${input.topic}`,
    `Tên tiếng Việt: ${input.vietnameseTopic}`,
    `Trình độ chủ điểm: ${input.level}`,
    `Độ khó bài tập: ${input.difficulty}`,
    `Dạng câu bắt buộc: ${(input.questionTypes?.length ? input.questionTypes : ["choice", "fill"]).join(", ")}`,
    input.category ? `Nhóm kỹ năng: ${input.category}` : "",
    input.examType ? `Dạng bài cần tạo: ${input.examType}` : "",
    `Giải thích: ${input.intro}`,
    `Công thức: ${input.formulas}`,
    `Cách dùng: ${input.usage}`,
    `Ví dụ tham khảo: ${input.examples}`,
    "=== KẾT THÚC NGỮ CẢNH BẮT BUỘC ===",
    `Số lượng câu cần có: ${questionCount} câu (tạo thêm ${SPARE_QUESTIONS} câu dự phòng, tổng cộng ${
      questionCount + SPARE_QUESTIONS
    } câu, không trùng nhau).`,
  ]

  if (input.request?.trim()) lines.push(`Yêu cầu riêng của người học: ${input.request.trim()}`)

  if (exclude.length > 0) {
    lines.push(`Không được lặp lại các câu hỏi sau: ${exclude.slice(0, 12).join(" | ")}`)
  }

  lines.push("Chỉ tạo câu hỏi thuộc chủ điểm hiện tại và trả về JSON.")
  return lines.join("\n")
}

/** Gọi AI tạo 1 batch câu hỏi bằng 1 key riêng — nhiều batch chạy song song với nhiều key */
async function requestBatch(
  input: GenerateGrammarPracticeInput,
  questionCount: number,
  apiKey: string,
  exclude: string[],
  reasoning: { enabled: boolean } | null,
  questionTypes?: PracticeQuestionKind[]
): Promise<Question[]> {
  const payload = await openRouterChatJSON<unknown>(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt({ ...input, questionTypes }, questionCount, exclude) },
    ],
    {
      temperature: 0.6,
      models: PRACTICE_MODELS,
      reasoning,
      apiKey,
      timeoutMs: BATCH_TIMEOUT_MS,
      maxAttempts: BATCH_MAX_ATTEMPTS,
    }
  )

  return sanitizeItems(payload)
}

async function generateBatch(
  input: GenerateGrammarPracticeInput,
  questionCount: number,
  apiKey: string,
  exclude: string[] = [],
  questionTypes?: PracticeQuestionKind[]
): Promise<Question[]> {
  const reasoning = USE_REASONING ? { enabled: true } : { enabled: false }

  try {
    return await requestBatch(input, questionCount, apiKey, exclude, reasoning, questionTypes)
  } catch (err) {
    /* Một số provider free bắt buộc bật reasoning → thử lại ở chế độ để provider tự quyết */
    const message = err instanceof Error ? err.message.toLowerCase() : ""
    if (USE_REASONING || !message.includes("reasoning")) throw err
    console.warn("[grammar-practice-ai] Provider yêu cầu bật reasoning → thử lại không tắt reasoning.")
    return await requestBatch(input, questionCount, apiKey, exclude, null, questionTypes)
  }
}

export async function generateGrammarPractice(
  input: GenerateGrammarPracticeInput
): Promise<Exercise> {
  /* Càng nhiều key trong .env.local → càng nhiều batch chạy song song → càng nhanh */
  const apiKeys = getOpenRouterApiKeys()
  const batchCount = Math.max(1, Math.min(apiKeys.length, input.questionCount))
  const shares = splitQuestionCount(input.questionCount, batchCount)
  if (batchCount > 1) {
    console.info(`[grammar-practice-ai] Tạo ${input.questionCount} câu bằng ${batchCount} key OpenRouter song song.`)
  }

  const questionTypes: PracticeQuestionKind[] = input.questionTypes?.length
    ? input.questionTypes
    : ["choice", "fill"]
  const results = await Promise.allSettled(
    shares.map((share, index) => generateBatch(input, share, apiKeys[index], [], [questionTypes[index % questionTypes.length]]))
  )

  const items: Question[] = []
  const seen = new Set<string>()
  const collect = (candidates: Question[]) => {
    for (const item of candidates) {
      if (items.length >= input.questionCount) return
      const key = itemKey(item)
      if (seen.has(key)) continue
      seen.add(key)
      items.push(item)
    }
  }

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      collect(result.value)
      return
    }
    console.warn(`[grammar-practice-ai] Batch ${index + 1}/${batchCount} lỗi:`, result.reason)
  })

  if (items.length === 0) {
    /* Tất cả batch đều lỗi → trả về lỗi thật để người dùng biết nguyên nhân */
    const failed = results.find((result): result is PromiseRejectedResult => result.status === "rejected")
    if (failed) throw failed.reason
    throw new Error("AI chưa tạo được câu hỏi hợp lệ. Vui lòng thử lại.")
  }

  /* Batch nào lỗi/thiếu câu thì gọi bù 1 lần bằng key vừa chạy được → đủ số câu yêu cầu */
  if (items.length < input.questionCount) {
    const successIndex = results.findIndex((result) => result.status === "fulfilled")
    const spareKey = apiKeys[(successIndex >= 0 ? successIndex : 0) % apiKeys.length]
    try {
      collect(
        await generateBatch(input, input.questionCount - items.length, spareKey, items.map(itemKey), questionTypes)
      )
    } catch (err) {
      console.warn("[grammar-practice-ai] Lần gọi bù không thành công:", err)
    }
  }

  if (items.length < input.questionCount) {
    console.warn(
      `[grammar-practice-ai] AI chỉ tạo được ${items.length}/${input.questionCount} câu hợp lệ cho chủ điểm "${input.topic}".`
    )
  }

  return {
    id: `ai-${Date.now()}`,
    name: `AI luyện tập: ${input.topic}`,
    vi: input.topic,
    desc: `${input.difficulty} · ${items.length} câu`,
    typeId: questionTypes.length === 1
      ? questionTypes[0] === "fill" ? "dien-tu" : questionTypes[0] === "order" ? "sap-xep-cau" : "trac-nghiem"
      : "trac-nghiem",
    minutes: Math.max(3, items.length),
    status: "Chưa làm",
    category: input.category ?? (questionTypes.includes("writing") ? "writing" : questionTypes.includes("listening") ? "listening" : "reading"),
    examType: input.examType,
    items: items.slice(0, input.questionCount),
  }
}