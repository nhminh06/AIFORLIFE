import { NextResponse } from "next/server"
import { predictPersonalizedPath } from "@/lib/ai/personalized-path-engine"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const practiceResults = body.practiceResults || {}
    const uid = typeof body.uid === "string" ? body.uid : undefined

    const result = predictPersonalizedPath(practiceResults, uid)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[api/ai/learning-path] Lỗi xử lý:", error)
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi tạo lộ trình học cá nhân hoá." },
      { status: 500 }
    )
  }
}
