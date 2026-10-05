import { scoreEssayML, type EssayFeatures } from "@/lib/ai/local-scorer"

export const runtime = "nodejs"

type GradeResult = {
  score: number
  level: "Chưa đạt" | "Đạt" | "Tốt" | "Xuất sắc"
  feedback: string
  strengths: string[]
  corrections: string[]
  features?: EssayFeatures
  featureContributions?: Record<string, number>
  modelInfo?: {
    modelType: string
    r2Score: number
    rmse: number
    pearsonR: number
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>
    const prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, 2000) : ""
    const answer = typeof body.answer === "string" ? body.answer.trim().slice(0, 6000) : ""
    const minWords = Number(body.minWords) || 50
    if (!prompt || !answer) return Response.json({ error: "Thiếu đề bài hoặc bài viết." }, { status: 400 })

    // Chấm điểm 100% bằng mô hình Machine Learning nội bộ (Ridge Regression trained on 1,000 ASAP essays)
    // Hoàn toàn không gọi API bên ngoài (OpenRouter)
    const mlResult = scoreEssayML(answer, minWords)

    return Response.json({
      score: mlResult.score,
      level: mlResult.level,
      feedback: mlResult.feedback,
      strengths: mlResult.strengths,
      corrections: mlResult.suggestions,
      features: mlResult.features,
      featureContributions: mlResult.featureContributions,
      modelInfo: {
        modelType: "Ridge Regression (AES - 3.000 Essays)",
        r2Score: mlResult.metrics.r2_score,
        rmse: mlResult.metrics.rmse,
        pearsonR: mlResult.metrics.pearson_r,
      },
    } satisfies GradeResult)
  } catch (error) {
    console.error("[api/ai/practice/grade] Lỗi:", error)
    return Response.json({ error: error instanceof Error ? error.message : "Không chấm được bài viết." }, { status: 500 })
  }
}
