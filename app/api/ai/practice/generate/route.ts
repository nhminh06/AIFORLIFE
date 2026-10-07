import { generateGrammarPractice } from "@/lib/ai/grammar-practice-ai"
import type { PracticeCategory, PracticeQuestionKind } from "@/lib/data/practice"

export const runtime = "nodejs"

const VALID_TYPES: PracticeQuestionKind[] = ["choice", "fill", "order", "reading", "listening", "writing", "true-false"]
const VALID_LEVELS = ["Cơ bản", "Trung cấp", "Nâng cao"]
const VALID_DIFFICULTIES = ["Cơ bản", "Trung cấp", "Nâng cao"]
const VALID_CATEGORIES: PracticeCategory[] = ["writing", "listening", "reading"]

function questionKindFor(category: PracticeCategory, examType: string): PracticeQuestionKind {
  if (examType === "Sắp xếp câu") return "order"
  if (examType === "Trắc nghiệm") return "choice"
  if (examType === "Nghe chọn đáp án") return "listening"
  if (category === "writing") return "writing"
  if (category === "listening") return "listening"
  if (examType === "Đọc hiểu") return "reading"
  return "fill"
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>
    const topic = typeof body.topic === "string" ? body.topic.trim().slice(0, 120) : ""
    if (!topic) return Response.json({ error: "Vui lòng nhập chủ đề luyện tập." }, { status: 400 })

    const level = VALID_LEVELS.includes(String(body.level)) ? String(body.level) : "Cơ bản"
    const difficulty = VALID_DIFFICULTIES.includes(String(body.difficulty)) ? String(body.difficulty) : "Cơ bản"
    const requestedCount = Number(body.questionCount)
    const category = VALID_CATEGORIES.includes(body.category as PracticeCategory)
      ? body.category as PracticeCategory
      : "reading"
    const examType = typeof body.examType === "string" ? body.examType.trim().slice(0, 100) : "Đọc hiểu"
    const isWritingLongForm = category === "writing" && examType !== "Sắp xếp câu"
    const questionCount = Number.isFinite(requestedCount)
      ? Math.min(Math.max(Math.trunc(requestedCount), isWritingLongForm ? 1 : 3), isWritingLongForm ? 3 : 20)
      : isWritingLongForm ? 1 : 8

    const userTypes = Array.isArray(body.questionTypes)
      ? (body.questionTypes as PracticeQuestionKind[]).filter((k) => VALID_TYPES.includes(k))
      : []
    const questionTypes: PracticeQuestionKind[] = userTypes.length > 0
      ? userTypes
      : [questionKindFor(category, examType)]

    const exercise = await generateGrammarPractice({
      topic,
      vietnameseTopic: typeof body.vietnameseTopic === "string" ? body.vietnameseTopic.trim().slice(0, 160) : topic,
      level,
      intro: typeof body.intro === "string" ? body.intro.slice(0, 1800) : "",
      formulas: typeof body.formulas === "string" ? body.formulas.slice(0, 1800) : "",
      usage: typeof body.usage === "string" ? body.usage.slice(0, 1800) : "",
      examples: typeof body.examples === "string" ? body.examples.slice(0, 1800) : "",
      questionCount,
      difficulty,
      questionTypes: questionTypes.length > 0 ? questionTypes : VALID_TYPES,
      request: typeof body.request === "string" ? body.request.trim().slice(0, 500) : "",
      category,
      examType,
    })

    return Response.json({ exercise })
  } catch (error) {
    console.error("[api/ai/practice/generate] Lỗi:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Không tạo được bài luyện tập." },
      { status: 502 }
    )
  }
}
