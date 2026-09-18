import { fillVocabWords, type PartialVocabWord } from "@/lib/ai/vocab-ai"
import { normalizeVocabLevel } from "@/lib/data/vocabulary"

/** Route Handler chạy trên Node.js runtime để dùng được fetch + env của server */
export const runtime = "nodejs"

/** Số từ tối đa xử lý trong 1 lần gọi để tránh prompt quá dài */
const MAX_WORDS = 60

type FillBody = {
  words?: PartialVocabWord[]
  topic?: string
  level?: string
}

/**
 * POST /api/ai/vocab/fill
 * Người dùng chỉ nhập từ tiếng Anh → AI bổ sung phiên âm, từ loại và nghĩa tiếng Việt.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FillBody

    if (!Array.isArray(body.words) || body.words.length === 0) {
      return Response.json({ error: "Không có từ nào cần bổ sung." }, { status: 400 })
    }

    const words = body.words
      .filter((w) => w && typeof w.en === "string" && w.en.trim().length > 0)
      .slice(0, MAX_WORDS)

    if (words.length === 0) {
      return Response.json({ error: "Không có từ nào cần bổ sung." }, { status: 400 })
    }

    const filled = await fillVocabWords(words, {
      topic: body.topic,
      level: body.level ? normalizeVocabLevel(body.level) : undefined,
    })

    return Response.json({ words: filled })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Không bổ sung được từ vựng. Vui lòng thử lại."
    console.error("[api/ai/vocab/fill] Lỗi:", err)
    return Response.json({ error: message }, { status: 502 })
  }
}