import { generateGrammarPractice } from "@/lib/ai/grammar-practice-ai"

export const runtime = "nodejs"

type PracticeBody = {
  topic?: string
  vietnameseTopic?: string
  level?: string
  intro?: string
  formulas?: string
  usage?: string
  examples?: string
  questionCount?: number
  difficulty?: string
}

const QUESTION_COUNTS = [5, 8, 10]
const DIFFICULTIES = ["Cơ bản", "Trung cấp", "Nâng cao"]

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PracticeBody
    const topic = body.topic?.trim()
    const questionCount = QUESTION_COUNTS.includes(body.questionCount ?? 0) ? body.questionCount! : 5
    const difficulty = DIFFICULTIES.includes(body.difficulty ?? "") ? body.difficulty! : "Cơ bản"

    if (!topic) return Response.json({ error: "Thiếu chủ điểm ngữ pháp." }, { status: 400 })

    const exercise = await generateGrammarPractice({
      topic,
      vietnameseTopic: body.vietnameseTopic?.trim() || topic,
      level: body.level?.trim() || "Cơ bản",
      intro: body.intro?.trim().slice(0, 2000) || "",
      formulas: body.formulas?.trim().slice(0, 2000) || "",
      usage: body.usage?.trim().slice(0, 2000) || "",
      examples: body.examples?.trim().slice(0, 2000) || "",
      questionCount,
      difficulty,
    })

    return Response.json({ exercise })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Không tạo được bài luyện tập. Vui lòng thử lại."
    console.error("[api/ai/grammar/practice] Lỗi:", err)
    return Response.json({ error: message }, { status: 502 })
  }
}