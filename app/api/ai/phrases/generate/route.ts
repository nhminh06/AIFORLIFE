import { generatePhrases } from "@/lib/ai/phrase-ai"
import { phraseSituations } from "@/lib/data/phrases"

/** Route Handler chạy trên Node.js runtime để dùng được fetch + env của server */
export const runtime = "nodejs"

/** Số lượng câu tối thiểu / tối đa cho 1 lần sinh để tránh lạm dụng API */
const MIN_COUNT = 1
const MAX_COUNT = 40

type GenerateBody = {
  situationId?: string
  situationLabel?: string
  prompt?: string
  level?: string
  count?: number
  notes?: string
}

/**
 * POST /api/ai/phrases/generate
 * Người dùng chọn số lượng + cấp độ + tình huống → AI sinh danh sách mẫu câu tương ứng.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateBody

    /* Nhãn tình huống: ưu tiên tên người dùng gửi lên, nếu không có thì tra theo situationId */
    const builtIn = phraseSituations.find((s) => s.id === body.situationId)
    const situation = (
      body.situationLabel?.trim() ||
      builtIn?.label ||
      "Giao tiếp hàng ngày"
    ).trim()

    /* Số lượng câu: chặn trong khoảng an toàn */
    const requested = Number(body.count)
    const count = Number.isFinite(requested)
      ? Math.min(Math.max(Math.trunc(requested), MIN_COUNT), MAX_COUNT)
      : 12

    const level = ["Cơ bản", "Trung cấp", "Nâng cao"].includes(body.level ?? "")
      ? (body.level as string)
      : "Cơ bản"

    const phrases = await generatePhrases({
      situation,
      prompt: body.prompt,
      level,
      count,
      notes: body.notes,
    })

    return Response.json({ phrases, model: process.env.OpenRouter_MODEL ?? undefined })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Không sinh được mẫu câu. Vui lòng thử lại."
    console.error("[api/ai/phrases/generate] Lỗi:", err)
    return Response.json({ error: message }, { status: 502 })
  }
}
