import { generateGrammarTopic } from "@/lib/ai/grammar-ai"

/** Route Handler chạy trên Node.js runtime để dùng được fetch + env của server */
export const runtime = "nodejs"

type GenerateBody = {
  topicLabel?: string
  level?: string
  prompt?: string
  notes?: string
  group?: string
}

const VALID_LEVELS: string[] = ["Cơ bản", "Trung cấp", "Nâng cao"]

/**
 * POST /api/ai/grammar/generate
 * AI sinh chủ điểm ngữ pháp theo cấp độ + yêu cầu.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateBody

    const topicLabel = (body.topicLabel?.trim() || "Chủ đề ngữ pháp").trim()

    const level = VALID_LEVELS.includes(body.level ?? "")
      ? (body.level as "Cơ bản" | "Trung cấp" | "Nâng cao")
      : "Cơ bản"

    const grammar = await generateGrammarTopic({
      topicLabel,
      level,
      prompt: body.prompt,
      notes: body.notes,
      group: body.group === "tense" || body.group === "other" ? body.group : undefined,
    })

    return Response.json({ grammar, model: process.env.OpenRouter_MODEL ?? undefined })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Không sinh được ngữ pháp. Vui lòng thử lại."
    console.error("[api/ai/grammar/generate] Lỗi:", err)
    return Response.json({ error: message }, { status: 502 })
  }
}
