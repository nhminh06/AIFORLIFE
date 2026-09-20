import { openRouterChatJSON } from "@/lib/ai/openrouter"
import type { VocabWord } from "@/lib/data/vocabulary"

const VOCAB_MODELS = (process.env.VOCAB_OPENROUTER_MODELS || "openrouter/free")
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean)

/** Route Handler chạy trên Node.js runtime để dùng được fetch + env của server */
export const runtime = "nodejs"

/* ------------------------------------------------------------------ */
/*  Ý tưởng: dùng LLM tạo câu ví dụ cho 1 từ cụ thể                   */
/*  Prompt yêu cầu: trả về JSON với trường "example" ( câu tiếng Anh )   */
/* ------------------------------------------------------------------ */

const SYSTEM_PROMPT = `You are an assistant that writes one short natural English example sentence using a given vocabulary word for Vietnamese learners of English.

Always respond with ONLY a JSON object in exactly this shape, no explanation or extra text:
{"example":"..."}

Rules for "example":
- One single natural English sentence using the target word with the given meaning.
- Short and easy to understand (under 20 words when possible).
- The target word must appear in a grammatically correct form.`

export type ExampleRequest = {
  en: string
  ipa: string
  type: VocabWord["type"]
  vi: string
}

export type ExampleResponse = {
  example: string
}

async function generateExample(req: ExampleRequest): Promise<string> {
  const userPrompt = [
    `Word: "${req.en}"${req.ipa ? ` (${req.ipa})` : ""}`,
    `Part of speech: ${req.type ?? "n"}`,
    `Vietnamese meaning: "${req.vi ?? ""}"`,
    "Write 1 English example sentence illustrating this word.",
  ].join("\n")

  const payload = await openRouterChatJSON<{ example?: string }>(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    { temperature: 0.7, models: VOCAB_MODELS, reasoning: { enabled: true } }
  )

  return payload.example?.trim() || ""
}

/**
 * POST /api/ai/vocab/example
 * Nhờ AI tạo 1 câu ví dụ minh hoạ cho từ vựng cụ thể.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ExampleRequest

    if (!body.en?.trim()) {
      return Response.json({ error: "Thiếu từ tiếng Anh." }, { status: 400 })
    }

    const example = await generateExample({
      en: body.en.trim(),
      ipa: body.ipa?.trim() ?? "",
      type: body.type ?? "n",
      vi: body.vi?.trim() ?? "",
    })

    if (!example) {
      return Response.json({ error: "Không thể sinh câu ví dụ. Vui lòng thử lại." }, { status: 502 })
    }

    return Response.json({ example })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi khi tạo câu ví dụ."
    console.error("[api/ai/vocab/example] Lỗi:", err)
    return Response.json({ error: message }, { status: 502 })
  }
}