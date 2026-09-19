import { fillPhrases } from "@/lib/ai/phrase-ai"

/** Route Handler chạy trên Node.js runtime để dùng được fetch + env của server */
export const runtime = "nodejs"

/** Số câu tối đa cho 1 lần bổ sung nghĩa */
const MAX_ITEMS = 40

type FillBody = {
  phrases?: { en?: string; vi?: string }[]
  situation?: string
  level?: string
}

/**
 * POST /api/ai/phrases/fill
 * Người dùng nhập câu tiếng Anh (thiếu nghĩa tiếng Việt) → AI điền nghĩa còn thiếu.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FillBody

    const phrases = (body.phrases ?? [])
      .slice(0, MAX_ITEMS)
      .map((p) => ({ en: String(p?.en ?? ""), vi: p?.vi ? String(p.vi) : undefined }))
      .filter((p) => p.en.trim().length > 0)

    if (phrases.length === 0) {
      return Response.json({ error: "Chưa có mẫu câu nào để xử lý." }, { status: 400 })
    }

    const filled = await fillPhrases(phrases, {
      situation: body.situation,
      level: body.level,
    })

    return Response.json({ phrases: filled, model: process.env.OpenRouter_MODEL ?? undefined })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Không điền được nghĩa. Vui lòng thử lại."
    console.error("[api/ai/phrases/fill] Lỗi:", err)
    return Response.json({ error: message }, { status: 502 })
  }
}
