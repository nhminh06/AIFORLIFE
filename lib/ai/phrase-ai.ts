/**
 * Logic sinh / bổ sung mẫu câu theo tình huống bằng AI (OpenRouter).
 *
 * File này chỉ chạy ở server (được gọi từ Route Handlers trong app/api/ai/phrases).
 */

import type { PhraseItem } from "@/lib/data/phrases"

import { openRouterChatJSON } from "./openrouter"

/* Mẫu câu dùng free router riêng để không phụ thuộc model cũ trong .env.local. */
const PHRASE_MODELS = (process.env.PHRASE_OPENROUTER_MODELS || "openrouter/free")
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean)

/* ------------------------------------------------------------------ */
/*  Chuẩn hóa dữ liệu AI trả về                                        */
/* ------------------------------------------------------------------ */

/** Bỏ khoảng trắng thừa, viết hoa chữ cái đầu */
function normalizeEn(value: unknown): string {
  if (typeof value !== "string") return ""
  const cleaned = value.replace(/\s+/g, " ").trim()
  if (!cleaned) return ""
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

/** Bỏ khoảng trắng thừa, dấu câu cuối cho nghĩa tiếng Việt */
function normalizeVi(value: unknown): string {
  if (typeof value !== "string") return ""
  return value.replace(/\s+/g, " ").trim().replace(/[.;]+$/, "")
}

type RawPhrase = {
  en?: unknown
  phrase?: unknown
  english?: unknown
  vi?: unknown
  meaning?: unknown
  vietnamese?: unknown
}

/** Đọc mảng câu AI trả về dù model bọc trong { phrases: [...] } hay trả thẳng mảng */
export function sanitizePhrases(payload: unknown): PhraseItem[] {
  let list: unknown = payload

  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>
    list = record.phrases ?? record.data ?? record.items ?? []
  }

  if (!Array.isArray(list)) return []

  return list
    .map((item): PhraseItem | null => {
      if (!item || typeof item !== "object") return null
      const raw = item as RawPhrase
      const en = normalizeEn(raw.en ?? raw.phrase ?? raw.english)
      if (!en) return null
      return { en, vi: normalizeVi(raw.vi ?? raw.meaning ?? raw.vietnamese) }
    })
    .filter((p): p is PhraseItem => p !== null)
}

/** Loại câu trùng (so sánh không phân biệt hoa/thường) */
export function dedupePhrases(items: PhraseItem[]): PhraseItem[] {
  const seen = new Set<string>()
  return items.filter((p) => {
    const key = p.en.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const SYSTEM_PROMPT = `Bạn là giáo viên tiếng Anh bản ngữ, chuyên soạn mẫu câu giao tiếp cho người Việt học tiếng Anh.
Luôn trả về DUY NHẤT một JSON hợp lệ (không markdown, không giải thích), dạng:
{"phrases":[{"en":"...","vi":"..."}]}
Mỗi phần tử gồm: "en" là mẫu câu tiếng Anh tự nhiên, thường dùng trong giao tiếp; "vi" là nghĩa tiếng Việt tự nhiên, NGẮN GỌN (1 câu dịch duy nhất, không liệt kê nhiều nghĩa).`

/* ------------------------------------------------------------------ */
/*  1. AI sinh danh sách mẫu câu theo tình huống                       */
/* ------------------------------------------------------------------ */

export type GeneratePhrasesInput = {
  /** nhãn tình huống tiếng Việt, VD "Nhà hàng" */
  situation: string
  /** yêu cầu riêng của người học */
  prompt?: string
  /** Cơ bản | Trung cấp | Nâng cao */
  level: string
  count: number
  notes?: string
}

/** Nhờ AI sinh danh sách mẫu câu theo tình huống + cấp độ + số lượng */
export async function generatePhrases(input: GeneratePhrasesInput): Promise<PhraseItem[]> {
  const count = Math.min(Math.max(1, Math.trunc(input.count)), 40)

  const userPrompt = [
    `Hãy soạn ${count} mẫu câu tiếng Anh giao tiếp thực tế cho người Việt học tiếng Anh.`,
    `- Tình huống: ${input.situation}`,
    `- Trình độ: ${input.level}. Câu từ và cấu trúc phải phù hợp đúng trình độ này.`,
    input.prompt?.trim() ? `- Yêu cầu riêng của người học: ${input.prompt.trim()}` : "",
    input.notes?.trim() ? `- Ghi chú thêm: ${input.notes.trim()}` : "",
    "Các câu phải đa dạng mục đích sử dụng trong tình huống (hỏi, đáp, lịch sự, khẩn cấp...), không trùng nhau.",
    `Trả về đúng ${count} phần tử trong mảng "phrases".`,
  ]
    .filter(Boolean)
    .join("\n")

  const payload = await openRouterChatJSON<unknown>(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    { temperature: 0.6, models: PHRASE_MODELS, reasoning: { enabled: true } }
  )

  const phrases = dedupePhrases(sanitizePhrases(payload)).filter((p) => p.vi)
  if (phrases.length === 0) {
    throw new Error("AI chưa trả về mẫu câu hợp lệ. Vui lòng thử lại.")
  }
  return phrases.slice(0, count)
}

/* ------------------------------------------------------------------ */
/*  2. AI bổ sung nghĩa tiếng Việt cho câu người dùng nhập             */
/* ------------------------------------------------------------------ */

export type PartialPhrase = {
  en: string
  vi?: string
}

export type FillPhrasesContext = {
  situation?: string
  level?: string
}

/** Bổ sung nghĩa tiếng Việt cho các mẫu câu người dùng nhập tay */
export async function fillPhrases(
  items: PartialPhrase[],
  context: FillPhrasesContext = {}
): Promise<PhraseItem[]> {
  const targets = items
    .map((p) => ({ en: normalizeEn(p.en), vi: normalizeVi(p.vi) }))
    .filter((p) => p.en.length > 0)

  if (targets.length === 0) return []

  const userPrompt = [
    "Bổ sung nghĩa tiếng Việt còn thiếu cho từng mẫu câu tiếng Anh dưới đây.",
    context.situation?.trim() ? `Tình huống sử dụng: ${context.situation.trim()}` : "",
    context.level ? `Trình độ người học: ${context.level}` : "",
    "Dịch theo CẢ CÂU (không dịch từng từ rồi ghép), nghĩa tự nhiên như người Việt nói.",
    'Giữ nguyên "en" y như đầu vào, đúng thứ tự và đúng số lượng phần tử.',
    'Nếu một câu đã có "vi" thì giữ nguyên giá trị đó.',
    "",
    "Danh sách đầu vào (JSON):",
    JSON.stringify({ phrases: targets }, null, 2),
  ]
    .filter(Boolean)
    .join("\n")

  const payload = await openRouterChatJSON<unknown>(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    { temperature: 0.2, models: PHRASE_MODELS, reasoning: { enabled: true } }
  )

  const parsed = sanitizePhrases(payload)

  /* Ghép kết quả AI với dữ liệu gốc: khớp theo "en", phần nào AI thiếu thì lấy của người dùng */
  return targets.map((target) => {
    const key = target.en.toLowerCase()
    const match = parsed.find((p) => p.en.toLowerCase() === key)
    return {
      en: target.en,
      vi: match?.vi || target.vi,
    }
  })
}

