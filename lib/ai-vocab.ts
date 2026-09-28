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

export type AiGenerateStreamEvent = {
  type: "chunk" | "done" | "error"
  words?: VocabWord[]
  current?: number
  target?: number
  error?: string
  done?: boolean
}

/** Nhờ AI sinh danh sách từ vựng theo số lượng + cấp độ + chủ đề đã chọn */
export async function aiGenerateVocabWords(input: AiGenerateVocabInput): Promise<VocabWord[]> {
  const data = await postJSON<{ words?: VocabWord[] }>(GENERATE_URL, input)
  return Array.isArray(data.words) ? data.words : []
}

/**
 * Nhờ AI sinh danh sách từ vựng theo cơ chế STREAM thời gian thực (SSE):
 * Cứ có thêm từ mới từ server là gọi ngay `onChunk` để giao diện hiển thị ngay lập tức,
 * không cần chờ đợi toàn bộ danh sách.
 */
export async function aiGenerateVocabWordsStream(
  input: AiGenerateVocabInput,
  onChunk: (event: AiGenerateStreamEvent) => void,
  signal?: AbortSignal
): Promise<VocabWord[]> {
  let res: Response
  try {
    res = await fetch(GENERATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, stream: true }),
      signal,
    })
  } catch (err) {
    if (signal?.aborted) return []
    throw new Error("Không kết nối được tới máy chủ. Vui lòng kiểm tra mạng rồi thử lại.")
  }

  if (!res.ok) {
    const errorJson = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(errorJson?.error || `Máy chủ trả về lỗi ${res.status}`)
  }

  if (!res.body) {
    throw new Error("Máy chủ không hỗ trợ luồng dữ liệu stream.")
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let allAccumulatedWords: VocabWord[] = []

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith("data:")) continue
        const jsonStr = trimmed.slice(5).trim()
        if (!jsonStr) continue

        try {
          const event = JSON.parse(jsonStr) as AiGenerateStreamEvent
          if (event.type === "error") {
            throw new Error(event.error || "Lỗi khi sinh từ vựng từ AI.")
          }

          if (event.words && Array.isArray(event.words)) {
            allAccumulatedWords = event.words
          }

          onChunk(event)
        } catch (e) {
          if (e instanceof Error && e.message !== "Lỗi khi sinh từ vựng từ AI.") {
            console.warn("[ai-vocab-stream] Không đọc được dòng event:", trimmed, e)
          } else {
            throw e
          }
        }
      }
    }
  } catch (err) {
    if (signal?.aborted) return allAccumulatedWords
    throw err
  } finally {
    try {
      reader.releaseLock()
    } catch {
      // bỏ qua
    }
  }

  return allAccumulatedWords
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