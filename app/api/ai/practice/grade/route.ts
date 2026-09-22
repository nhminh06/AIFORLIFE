import { openRouterChatJSON } from "@/lib/ai/openrouter"

export const runtime = "nodejs"

type GradeResult = {
  score: number
  level: "Chưa đạt" | "Đạt" | "Tốt" | "Xuất sắc"
  feedback: string
  strengths: string[]
  corrections: string[]
}

const SYSTEM_PROMPT = `Bạn là giáo viên tiếng Anh chấm bài viết cho người Việt.
Trả về DUY NHẤT JSON hợp lệ theo dạng:
{"score":78,"level":"Tốt","feedback":"...","strengths":["..."],"corrections":["..."]}
Quy tắc:
- score là số nguyên từ 0 đến 100.
- Chấm dựa trên mức độ hoàn thành yêu cầu, ngữ pháp, từ vựng, mạch lạc và độ tự nhiên.
- feedback, strengths, corrections viết bằng tiếng Việt, ngắn gọn và cụ thể.
- Không bịa lỗi nếu bài viết đúng.
- Không trả markdown hoặc trường nào khác.`

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>
    const prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, 2000) : ""
    const answer = typeof body.answer === "string" ? body.answer.trim().slice(0, 6000) : ""
    const minWords = Number(body.minWords) || 50
    if (!prompt || !answer) return Response.json({ error: "Thiếu đề bài hoặc bài viết." }, { status: 400 })

    const result = await openRouterChatJSON<GradeResult>([
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          `Đề bài: ${prompt}`,
          `Số từ tối thiểu: ${minWords}`,
          `Bài viết của người học:`,
          answer,
          "Hãy chấm bài và đưa ra góp ý có thể áp dụng ngay.",
        ].join("\n\n"),
      },
    ], { temperature: 0.2, reasoning: { enabled: false }, maxAttempts: 2 })

    return Response.json({
      score: Math.min(100, Math.max(0, Math.round(Number(result.score) || 0))),
      level: result.level || "Đạt",
      feedback: result.feedback || "Bài viết đã được chấm.",
      strengths: Array.isArray(result.strengths) ? result.strengths.slice(0, 4) : [],
      corrections: Array.isArray(result.corrections) ? result.corrections.slice(0, 5) : [],
    } satisfies GradeResult)
  } catch (error) {
    console.error("[api/ai/practice/grade] Lỗi:", error)
    return Response.json({ error: error instanceof Error ? error.message : "Không chấm được bài viết." }, { status: 502 })
  }
}
