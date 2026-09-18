import type { VocabLevel, VocabWord } from "@/lib/data/vocabulary"

/**
 * Cầu nối giữa giao diện và API AI từ vựng (chạy ở server, dùng OpenRouter).
 * API key nằm trong .env.local nên không bao giờ lộ ra trình duyệt.
 */

const FILL_URL = "/api/ai/vocab/fill"
const GENERATE_URL = "/api/ai/vocab/generate"
const EXAMPLE_URL = "/api/ai/vocab/example"

async function postJSON<T>(url: string, payload: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error("Không kết nối được tới máy chủ. Vui lòng kiểm tra mạng rồi thử lại.")
  }

  const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null

  if (!res.ok) {
    throw new Error(data?.error || "Yêu cầu AI thất bại. Vui lòng thử lại.")
  }
  if (!data) {
    throw new Error("Máy chủ trả về dữ liệu rỗng. Vui lòng thử lại.")
  }
  return data
}

/** Từ người dùng nhập tay — chỉ cần "en", các phần khác để AI bổ sung */
export type AiFillWordInput = {
  en: string
  ipa?: string
  vi?: string
}

export type AiFillContext = {
  /** Nhãn chủ đề (tiếng Việt) giúp AI chọn nghĩa sát ngữ cảnh */
  topic?: string
  level?: VocabLevel
}

/**
 * Nhờ AI bổ sung phiên âm, từ loại và nghĩa tiếng Việt.
 * Kết quả trả về giữ nguyên thứ tự và "en" của danh sách đầu vào.
 */
export async function aiFillVocabWords(
  words: AiFillWordInput[],
  context: AiFillContext = {}
): Promise<VocabWord[]> {
  const data = await postJSON<{ words?: VocabWord[] }>(FILL_URL, {
    words,
    topic: context.topic,
    level: context.level,
  })
  return Array.isArray(data.words) ? data.words : []
}

export type AiGenerateVocabInput = {
  /** id chủ đề (chủ đề hệ thống hoặc chủ đề riêng của người dùng) */
  topicId: string
  /** nhãn chủ đề hiển thị, ví dụ "Du lịch" */
  topicLabel: string
  /** yêu cầu tự do cho AI */
  prompt?: string
  level: VocabLevel
  /** số lượng từ muốn AI sinh */
  count: number
  /** ghi chú thêm */
  notes?: string
}

/** Nhờ AI sinh danh sách từ vựng theo số lượng + cấp độ + chủ đề đã chọn */
export async function aiGenerateVocabWords(input: AiGenerateVocabInput): Promise<VocabWord[]> {
  const data = await postJSON<{ words?: VocabWord[] }>(GENERATE_URL, input)
  return Array.isArray(data.words) ? data.words : []
}

export type AiVocabExampleInput = {
  en: string
  ipa?: string
  type?: VocabWord["type"]
  vi?: string
}

/** Nhờ AI tạo 1 câu ví dụ minh hoạ cho 1 từ cụ thể. */
export async function aiVocabExample(input: AiVocabExampleInput): Promise<string> {
  const data = await postJSON<{ example?: string }>(EXAMPLE_URL, input)
  return typeof data.example === "string" ? data.example.trim() : ""
}