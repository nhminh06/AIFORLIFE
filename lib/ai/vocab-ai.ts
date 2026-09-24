/**
 * Logic sinh / bổ sung từ vựng bằng AI (OpenRouter).
 *
 * File này chỉ chạy ở server (được gọi từ Route Handlers trong app/api/ai/vocab).
 */

import {
  vocabLevelLabels,
  type VocabLevel,
  type VocabWord,
} from "@/lib/data/vocabulary"

import { getOpenRouterApiKeys, getOpenRouterModels, openRouterChatJSON, OpenRouterError } from "./openrouter"

/**
 * Model dùng cho tính năng từ vựng: ưu tiên `VOCAB_OPENROUTER_MODELS` nếu có, luôn kèm các
 * model dự phòng của app để model free đang bận vẫn tự chuyển sang model khác thay vì lỗi.
 */
const VOCAB_MODELS = [
  ...new Set([
    ...(process.env.VOCAB_OPENROUTER_MODELS || "")
      .split(",")
      .map((model) => model.trim())
      .filter(Boolean),
    ...getOpenRouterModels(),
  ]),
]

/* ------------------------------------------------------------------ */
/*  Chuẩn hóa dữ liệu AI trả về                                        */
/* ------------------------------------------------------------------ */

const WORD_TYPES: VocabWord["type"][] = ["n", "v", "adj", "adv", "prep", "phr"]

/** Các cách viết từ loại khác nhau → giá trị chuẩn của VocabWord["type"] */
const TYPE_ALIASES: Record<string, VocabWord["type"]> = {
  n: "n",
  noun: "n",
  "danh từ": "n",
  danhtu: "n",
  v: "v",
  verb: "v",
  "động từ": "v",
  dongtu: "v",
  adj: "adj",
  adjective: "adj",
  "tính từ": "adj",
  tinhtu: "adj",
  adv: "adv",
  adverb: "adv",
  "trạng từ": "adv",
  trattu: "adv",
  prep: "prep",
  preposition: "prep",
  "giới từ": "prep",
  gioitu: "prep",
  phr: "phr",
  phrase: "phr",
  "cụm từ": "phr",
  cumtu: "phr",
  "phrasal verb": "phr",
  phrasal: "phr",
  idiom: "phr",
  expression: "phr",
}

/** Chuẩn hóa từ loại: "noun" → "n", "verb" → "v", … */
export function normalizeWordType(value: unknown): VocabWord["type"] {
  if (typeof value !== "string") return "n"
  const raw = value.trim().toLowerCase().replace(/\.$/, "")
  if ((WORD_TYPES as string[]).includes(raw)) return raw as VocabWord["type"]
  return TYPE_ALIASES[raw] ?? "n"
}

/** Chuẩn hóa phiên âm IPA: luôn có 2 dấu gạch chéo bao quanh */
export function normalizeIpa(value: unknown): string {
  if (typeof value !== "string") return ""
  const trimmed = value
    .trim()
    .replace(/^\[|\]$/g, "")
    .replace(/^\/|\/$/g, "")
    .trim()
  return trimmed ? `/${trimmed}/` : ""
}

/** Chuẩn hóa từ tiếng Anh: bỏ khoảng trắng thừa */
function normalizeEn(value: unknown): string {
  if (typeof value !== "string") return ""
  return value.replace(/\s+/g, " ").trim()
}

/** Chuẩn hóa nghĩa tiếng Việt: bỏ khoảng trắng thừa, dấu câu cuối, và CHỈ giữ 1 nghĩa đầu tiên */
function normalizeVi(value: unknown): string {
  if (typeof value !== "string") return ""
  /* Nếu AI vẫn trả nhiều nghĩa ("a; b", "a / b", "1. a 2. b") → chỉ lấy nghĩa đầu */
  const first = value
    .split(/[;／/]/)[0]
    .replace(/^\s*\d+\s*[.)\-:：]\s*/, "")
  return first
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.;]+$/, "")
}

/** Từ vựng tiếng Anh không được chứa ký tự Hán do model đôi khi trộn tiếng Trung. */
function containsHan(value: string): boolean {
  return /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u.test(value)
}

type RawWord = {
  en?: unknown
  word?: unknown
  english?: unknown
  ipa?: unknown
  pronunciation?: unknown
  type?: unknown
  partOfSpeech?: unknown
  part_of_speech?: unknown
  vi?: unknown
  meaning?: unknown
  meaningVi?: unknown
  translation?: unknown
  definition?: unknown
}

/** Đọc mảng từ AI trả về dù model bọc trong { words: [...] } hay trả thẳng mảng */
export function sanitizeWords(payload: unknown): VocabWord[] {
  let list: unknown = payload

  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>
    list = record.words ?? record.vocabulary ?? record.vocab ?? record.data ?? record.items
    if (list === undefined && (record.en || record.word || record.english)) list = [record]
    if (list === undefined) list = []
  }

  if (!Array.isArray(list)) return []

  return list
    .map((item): VocabWord | null => {
      if (!item || typeof item !== "object") return null
      const raw = item as RawWord
      const en = normalizeEn(raw.en ?? raw.word ?? raw.english)
      if (!en) return null
      const vi = normalizeVi(raw.vi ?? raw.meaning ?? raw.meaningVi ?? raw.translation ?? raw.definition)
      if (containsHan(en) || containsHan(vi)) return null
      return {
        en,
        ipa: normalizeIpa(raw.ipa ?? raw.pronunciation),
        type: normalizeWordType(raw.type ?? raw.partOfSpeech ?? raw.part_of_speech),
        vi,
      }
    })
    .filter((w): w is VocabWord => w !== null)
}

/** Loại bỏ từ trùng nhau, kể cả khác hoa thường, khoảng trắng hoặc dấu gạch nối. */
function dedupeWords(words: VocabWord[]): VocabWord[] {
  const seen = new Set<string>()
  const result: VocabWord[] = []
  for (const w of words) {
    const key = w.en.normalize("NFKC").toLowerCase().replace(/[\s\-_]+/g, "")
    if (seen.has(key)) continue
    seen.add(key)
    result.push(w)
  }
  return result
}

/* ------------------------------------------------------------------ */
/*  Prompt dùng chung                                                  */
/* ------------------------------------------------------------------ */

const SYSTEM_PROMPT = `Bạn là chuyên gia biên soạn từ vựng tiếng Anh cho người Việt học tiếng Anh.

Luôn trả về DUY NHẤT một object JSON đúng định dạng sau, không kèm giải thích hay văn bản nào khác:
{"words":[{"en":"...","ipa":"...","type":"...","vi":"..."}]}

Quy tắc bắt buộc cho mỗi phần tử:
- "en": một từ hoặc cụm từ tiếng Anh ngắn gọn (tối đa 4 từ), không trùng lặp.
- "ipa": phiên âm IPA chuẩn của "en" dành cho người học, luôn được bao quanh bởi hai dấu gạch chéo. Ví dụ: /ˈæp.əl/, /rʌn/, /ˈteɪ.bəl/.
- "type": CHỈ nhận một trong sáu giá trị sau: "n" (danh từ), "v" (động từ), "adj" (tính từ), "adv" (trạng từ), "prep" (giới từ), "phr" (cụm từ / thành ngữ). Tuyệt đối không viết "noun", "verb", "adjective"…
- "vi": CHỈ 1 nghĩa tiếng Việt duy nhất, phổ biến nhất trong từ điển cho ĐÚNG từ loại đã ghi ở "type", theo cách dịch chuẩn cho người Việt học tiếng Anh (kiểu Cambridge/Oxford), ngắn gọn 1–4 từ, tiếng Việt tự nhiên và đúng dấu. TUYỆT ĐỐI không liệt kê nhiều nghĩa, không dùng dấu ";" hay "/". Ví dụ: "n" → cụm danh từ ("quả táo"), "v" → động từ ("chạy", "ăn sáng"), "adj" → tính từ ("xinh đẹp"), "adv" → trạng từ ("rất nhanh"), "prep" → nghĩa giới từ ("ở trên").
- Với "phr" (cụm động từ / thành ngữ): dịch nghĩa thuần Việt theo CẢ CỤM, TUYỆT ĐỐI không dịch từng từ một rồi ghép lại. Ví dụ "give up" → "từ bỏ" (không phải "đưa lên"), "look after" → "chăm sóc".
- Nếu "en" đa nghĩa: chỉ lấy 1 nghĩa duy nhất sát nhất với chủ đề và trình độ đang xét, bỏ mọi nghĩa khác.
- "vi" không chứa từ tiếng Anh (trừ tên riêng), không kèm ví dụ, phiên âm hay giải thích thêm.
- Mọi giá trị đều là chuỗi; không trả về null, không thêm trường khác ngoài bốn trường trên.`

/* ------------------------------------------------------------------ */
/*  1. AI ra từ mới theo số lượng + cấp độ + chủ đề                    */
/* ------------------------------------------------------------------ */

export type GenerateVocabInput = {
  /** Nhãn chủ đề người dùng đã chọn, ví dụ "Du lịch" */
  topic: string
  /** Yêu cầu tự do của người dùng, ví dụ "từ vựng phỏng vấn cho người mới" */
  prompt?: string
  level: VocabLevel
  /** Số lượng từ cần sinh (đã được chặn trong khoảng an toàn) */
  count: number
  /** Ghi chú thêm, ví dụ "ưu tiên từ thông dụng, có ví dụ đặt câu" */
  notes?: string
}

/** Số vòng gọi bù tối đa khi model trả về thiếu từ so với yêu cầu */
const MAX_TOP_UP_ROUNDS = 4

/** Tổng thời gian tối đa cho các vòng gọi bù (ms) — quá hạn thì trả về số từ đã có, không bắt chờ thêm */
const TOP_UP_TIME_BUDGET_MS = 90_000

/** Ghi log các batch lỗi để chẩn đoán vì sao thiếu từ (hết hạn mức, timeout, model bận…) */
function logBatchFailures(results: PromiseSettledResult<unknown>[], label: string): void {
  const failures = results.filter((result): result is PromiseRejectedResult => result.status === "rejected")
  if (failures.length === 0) return
  const detail = failures
    .map((failure) => (failure.reason instanceof Error ? failure.reason.message : String(failure.reason)))
    .join(" | ")
  console.warn(`[vocab-ai] ${label}: ${failures.length}/${results.length} batch lỗi → ${detail}`)
}

/** Chia `total` từ thành các phần gần bằng nhau để nhiều API key chạy song song */
function splitCount(total: number, maxParts: number): number[] {
  const parts = Math.max(1, Math.min(maxParts, total))
  const base = Math.floor(total / parts)
  const remainder = total % parts
  return Array.from({ length: parts }, (_, index) => base + (index < remainder ? 1 : 0))
}

/** Gộp nhiều danh sách từ: bỏ trùng và loại từ thiếu "en"/"vi" (model đôi khi bỏ nghĩa) */
function mergeWords(lists: VocabWord[][]): VocabWord[] {
  return dedupeWords(lists.flat()).filter((w) => w.en && w.vi)
}

/** Gom kết quả nhiều lần gọi AI thành danh sách từ sạch: bỏ lượt lỗi, bỏ trùng, loại từ thiếu nghĩa */
function collectWords(results: PromiseSettledResult<unknown>[]): VocabWord[] {
  return mergeWords(
    results.map((result) => (result.status === "fulfilled" ? sanitizeWords(result.value) : []))
  )
}

/** Sinh danh sách từ vựng mới bằng AI, tự gọi bù nếu model trả thiếu so với `count` */
export async function generateVocabWords(input: GenerateVocabInput): Promise<VocabWord[]> {
  const { topic, prompt, level, count, notes } = input

  const startedAt = Date.now()
  const apiKeys = getOpenRouterApiKeys()

  /** Prompt cho 1 lượt gọi: `existing` là các từ đã có để AI không lặp lại */
  const buildUserPrompt = (batchSize: number, existing: string[]) =>
    [
      `Hãy tạo danh sách ${batchSize} từ/cụm từ tiếng Anh cho người Việt học tiếng Anh.`,
      `- Chủ đề: ${topic}`,
      `- Trình độ CEFR: ${level} (${vocabLevelLabels[level]}). Chỉ chọn những từ vựng phù hợp đúng trình độ này.`,
      prompt?.trim() ? `- Yêu cầu riêng của người học: ${prompt.trim()}` : "",
      notes?.trim() ? `- Ghi chú thêm: ${notes.trim()}` : "",
      existing.length > 0
        ? `- Các từ sau ĐÃ CÓ trong danh sách, tuyệt đối không lặp lại: ${existing.join(", ")}`
        : "",
      `Trả về đúng ${batchSize} phần tử trong mảng "words", không trùng nhau và chỉ dùng từ/cụm từ tiếng Anh. Tuyệt đối không dùng tiếng Trung hoặc ký tự Hán trong "en" hay "vi".`,
    ]
      .filter(Boolean)
      .join("\n")

  const requestBatch = (
    batchSize: number,
    existing: string[],
    keyIndex: number,
    reasoning: { enabled: false } | null = { enabled: false }
  ) =>
    openRouterChatJSON<unknown>(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(batchSize, existing) },
      ],
      {
        temperature: 0.6,
        models: VOCAB_MODELS,
        reasoning,
        apiKey: apiKeys[keyIndex],
        /* Có nhiều key: mỗi key chỉ thử 1 lần rồi để hàm bọc đổi ngay sang key khác */
        ...(apiKeys.length > 1 ? { maxAttempts: 1 } : {}),
      }
    )

  /** Gọi 1 batch trên 1 key — provider bắt buộc bật reasoning thì thử lại ở chế độ để provider tự quyết */
  const requestBatchOnKey = async (batchSize: number, existing: string[], keyIndex: number) => {
    try {
      return await requestBatch(batchSize, existing, keyIndex)
    } catch (err) {
      const message = err instanceof Error ? err.message.toLowerCase() : ""
      if (!message.includes("reasoning")) throw err
      console.warn("[vocab-ai] Provider yêu cầu bật reasoning → thử lại không tắt reasoning.")
      return await requestBatch(batchSize, existing, keyIndex, null)
    }
  }

  /** Thử 1 batch trên tối đa 3 key khác nhau — key hết hạn mức/quá tải thì đổi key, không bỏ cả batch */
  const requestBatchWithFallback = async (batchSize: number, existing: string[], startKeyIndex: number) => {
    let lastError: unknown = null
    const attempts = Math.min(3, apiKeys.length)
    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        return await requestBatchOnKey(batchSize, existing, (startKeyIndex + attempt) % apiKeys.length)
      } catch (err) {
        lastError = err
        if (!(err instanceof OpenRouterError) || !err.retryable) break
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError))
  }

  /* Vòng 1: xin dư ~50% (tối đa +10 từ) vì model free hay trả thiếu, phần dư sẽ bị cắt khi đủ `count` */
  const firstRoundTarget = Math.min(count + 10, Math.ceil(count * 1.5))
  const firstResults = await Promise.allSettled(
    splitCount(firstRoundTarget, apiKeys.length).map((batchSize, index) =>
      requestBatchWithFallback(batchSize, [], index)
    )
  )
  logBatchFailures(firstResults, "Vòng 1")
  let words = collectWords(firstResults)
  console.log(`[vocab-ai] Vòng 1: ${words.length}/${count} từ (${apiKeys.length} key, model: ${VOCAB_MODELS[0]}).`)

  /* Model free thường trả thiếu từ so với yêu cầu → gọi bù thêm vài vòng, mỗi vòng chỉ xin
     đúng số từ còn thiếu và liệt kê từ đã có để AI sinh từ mới, cho tới khi đủ `count`. */
  for (let round = 1; round <= MAX_TOP_UP_ROUNDS && words.length < count; round++) {
    /* Đã chờ quá lâu → dừng gọi bù để không bắt người dùng đợi thêm */
    if (Date.now() - startedAt > TOP_UP_TIME_BUDGET_MS) {
      console.warn(`[vocab-ai] Đã chờ ${Math.round((Date.now() - startedAt) / 1000)}s → dừng gọi bù.`)
      break
    }
    const existing = words.map((w) => w.en)
    const missing = count - words.length
    const topUpResults = await Promise.allSettled(
      splitCount(missing, apiKeys.length).map((batchSize, index) =>
        /* đổi key mỗi vòng để tránh dồn vào key vừa lỗi hoặc chậm ở vòng trước */
        requestBatchWithFallback(batchSize, existing, (index + round) % apiKeys.length)
      )
    )
    logBatchFailures(topUpResults, `Vòng bù ${round}`)
    const added = collectWords(topUpResults)
    if (added.length === 0) {
      console.warn(`[vocab-ai] Vòng bù ${round}: AI không trả thêm từ mới → dừng sớm.`)
      break /* AI không trả thêm được từ mới → dừng sớm, khỏi chờ vô ích */
    }
    words = mergeWords([words, added])
    console.log(`[vocab-ai] Vòng bù ${round}: +${added.length} từ → ${words.length}/${count}.`)
  }

  if (words.length === 0) {
    throw new Error("AI chưa trả về từ vựng hợp lệ. Vui lòng thử lại.")
  }
  if (words.length < count) {
    console.warn(`[vocab-ai] Chỉ tạo được ${words.length}/${count} từ sau ${Math.round((Date.now() - startedAt) / 1000)}s.`)
  }
  return words.slice(0, count)
}

/* ------------------------------------------------------------------ */
/*  2. AI bổ sung phiên âm / từ loại / nghĩa cho từ người dùng nhập    */
/* ------------------------------------------------------------------ */

/** Từ người dùng đã nhập — chỉ "en" là bắt buộc, các phần còn lại có thể thiếu */
export type PartialVocabWord = {
  en: string
  ipa?: string
  vi?: string
}

export type FillVocabContext = {
  /** Nhãn chủ đề để AI chọn nghĩa sát ngữ cảnh hơn */
  topic?: string
  level?: VocabLevel
}

/** Bổ sung phiên âm, từ loại và nghĩa tiếng Việt cho các từ người dùng nhập tay */
export async function fillVocabWords(
  words: PartialVocabWord[],
  context: FillVocabContext = {}
): Promise<VocabWord[]> {
  const targets = words
    .map((w) => ({
      en: normalizeEn(w.en),
      ipa: normalizeIpa(w.ipa),
      vi: normalizeVi(w.vi),
    }))
    .filter((w) => w.en.length > 0)

  if (targets.length === 0) return []

  const hasContext = Boolean(context.topic?.trim() || context.level)

  const apiKeys = getOpenRouterApiKeys()
  const batchCount = Math.max(1, Math.min(apiKeys.length, targets.length))
  const batches = Array.from({ length: batchCount }, (_, index) =>
    targets.filter((_, targetIndex) => targetIndex % batchCount === index)
  )
  const results = await Promise.allSettled(
    batches.map((batch, index) => {
      const userPrompt = [
        "Bổ sung thông tin còn thiếu cho từng từ tiếng Anh dưới đây.",
        context.topic?.trim() ? `Chủ đề: ${context.topic.trim()}` : "",
        context.level ? `Trình độ người học: ${context.level}` : "",
        hasContext
          ? "Chọn nghĩa tiếng Việt PHỔ BIẾN NHẤT trong từ điển, sát với chủ đề và trình độ trên; bỏ nghĩa hiếm gặp."
          : "Chọn nghĩa tiếng Việt PHỔ BIẾN NHẤT trong từ điển cho mỗi từ.",
        "Nghĩa phải tương ứng đúng với từ loại đã xác định, dịch theo CẢ CỤM với cụm từ/thành ngữ (không dịch từng từ rồi ghép).",
        'Giữ nguyên "en" y như đầu vào, đúng thứ tự và đúng số lượng phần tử.',
        'Nếu một từ đã có "ipa" hoặc "vi" thì giữ nguyên giá trị đó, chỉ điền phần còn thiếu.',
        'Với "type", hãy xác định đúng từ loại của từ đó trong ngữ cảnh chủ đề.',
        "",
        "Danh sách đầu vào (JSON):",
        JSON.stringify({ words: batch }, null, 2),
      ]
        .filter(Boolean)
        .join("\n")

      return openRouterChatJSON<unknown>(
        [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        { temperature: 0.2, models: VOCAB_MODELS, reasoning: { enabled: false }, apiKey: apiKeys[index] }
      )
    })
  )

  const parsed = results.flatMap((result) => (result.status === "fulfilled" ? sanitizeWords(result.value) : []))

  /* Ghép kết quả AI với dữ liệu gốc: khớp theo "en", phần nào AI thiếu thì lấy của người dùng */
  return dedupeWords(targets.map((target) => {
    const key = target.en.toLowerCase()
    const match = parsed.find((w) => w.en.toLowerCase() === key)
    const fallbackVi = containsHan(target.vi) ? "" : target.vi
    return {
      en: target.en,
      ipa: match?.ipa || target.ipa,
      type: match?.type ?? "n",
      vi: match?.vi && !containsHan(match.vi) ? match.vi : fallbackVi,
    }
  }).filter((word) => !containsHan(word.vi)))
}