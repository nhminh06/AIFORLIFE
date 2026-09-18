import { generateVocabWords } from "@/lib/ai/vocab-ai"
import { normalizeVocabLevel, vocabTopics } from "@/lib/data/vocabulary"

/** Route Handler chạy trên Node.js runtime để dùng được fetch + env của server */
export const runtime = "nodejs"

/** Số lượng từ tối thiểu / tối đa cho 1 lần sinh để tránh lạm dụng API */
const MIN_COUNT = 1
const MAX_COUNT = 40

type GenerateBody = {
  topicId?: string
  topicLabel?: string
  prompt?: string
  level?: string
  count?: number
  notes?: string
}

/**
 * POST /api/ai/vocab/generate
 * Người dùng chọn số lượng + cấp độ + chủ đề → AI sinh danh sách từ tương ứng.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateBody

    /* Nhãn chủ đề: ưu tiên tên người dùng gửi lên, nếu không có thì tra theo topicId */
    const builtIn = vocabTopics.find((t) => t.id === body.topicId)
    const topic = (body.topicLabel?.trim() || builtIn?.label || "Từ vựng thông dụng").trim()

    /* Số lượng từ: chặn trong khoảng an toàn */
    const requested = Number(body.count)
    const count = Number.isFinite(requested)
      ? Math.min(Math.max(Math.trunc(requested), MIN_COUNT), MAX_COUNT)
      : 10

    const level = normalizeVocabLevel(body.level)

    const words = await generateVocabWords({
      topic,
      prompt: body.prompt,
      level,
      count,
      notes: body.notes,
    })

    return Response.json({ words, model: process.env.OpenRouter_MODEL ?? undefined })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Không sinh được từ vựng. Vui lòng thử lại."
    console.error("[api/ai/vocab/generate] Lỗi:", err)
    return Response.json({ error: message }, { status: 502 })
  }
}