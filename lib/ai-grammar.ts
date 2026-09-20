import type { GeneratedGrammar } from "@/lib/ai/grammar-ai"
import type { GrammarGroup, GrammarLevel } from "@/lib/data/grammar"

/**
 * Cầu nối giữa giao diện và API AI ngữ pháp (chạy ở server, dùng OpenRouter).
 * API key nằm trong .env.local nên không bao giờ lộ ra trình duyệt.
 * — tương tự lib/ai-vocab.ts của phần từ vựng.
 */

const GENERATE_URL = "/api/ai/grammar/generate"

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

export type AiGenerateGrammarInput = {
  /** tên chủ điểm người học muốn học, VD "Past Perfect Continuous" */
  topicLabel: string
  level: GrammarLevel
  /** yêu cầu riêng của người học */
  prompt?: string
  notes?: string
  group?: GrammarGroup
}

/** Nhờ AI soạn 1 chủ điểm ngữ pháp hoàn chỉnh theo yêu cầu */
export async function aiGenerateGrammar(input: AiGenerateGrammarInput): Promise<GeneratedGrammar> {
  const data = await postJSON<{ grammar?: GeneratedGrammar }>(GENERATE_URL, input)
  if (!data.grammar) {
    throw new Error("AI chưa trả về chủ điểm nào. Vui lòng thử lại.")
  }
  return data.grammar
}
