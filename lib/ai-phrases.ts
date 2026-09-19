import type { PhraseItem } from "@/lib/data/phrases"

/**
 * Cầu nối giữa giao diện và API AI mẫu câu (chạy ở server, dùng OpenRouter).
 * API key nằm trong .env.local nên không bao giờ lộ ra trình duyệt.
 */

const FILL_URL = "/api/ai/phrases/fill"
const GENERATE_URL = "/api/ai/phrases/generate"

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

/** Câu người dùng nhập tay — chỉ cần "en", nghĩa tiếng Việt để AI bổ sung */
export type AiFillPhraseInput = {
  en: string
  vi?: string
}

export type AiFillPhrasesContext = {
  /** Nhãn tình huống giúp AI dịch sát ngữ cảnh */
  situation?: string
  level?: string
}

/**
 * Nhờ AI bổ sung nghĩa tiếng Việt cho các mẫu câu.
 * Kết quả trả về giữ nguyên thứ tự và "en" của danh sách đầu vào.
 */
export async function aiFillPhrases(
  phrases: AiFillPhraseInput[],
  context: AiFillPhrasesContext = {}
): Promise<PhraseItem[]> {
  const data = await postJSON<{ phrases?: PhraseItem[] }>(FILL_URL, {
    phrases,
    situation: context.situation,
    level: context.level,
  })
  return Array.isArray(data.phrases) ? data.phrases : []
}

export type AiGeneratePhrasesInput = {
  /** id tình huống (hệ thống) */
  situationId: string
  /** nhãn tình huống hiển thị, ví dụ "Nhà hàng" */
  situationLabel: string
  /** yêu cầu tự do cho AI */
  prompt?: string
  /** Cơ bản | Trung cấp | Nâng cao */
  level: string
  /** số lượng mẫu câu muốn AI sinh */
  count: number
}

/** Nhờ AI sinh danh sách mẫu câu theo số lượng + cấp độ + tình huống đã chọn */
export async function aiGeneratePhrases(
  input: AiGeneratePhrasesInput
): Promise<PhraseItem[]> {
  const data = await postJSON<{ phrases?: PhraseItem[] }>(GENERATE_URL, input)
  return Array.isArray(data.phrases) ? data.phrases : []
}
