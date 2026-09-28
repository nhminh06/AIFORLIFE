import { generateVocabWords } from "@/lib/ai/vocab-ai"
import { normalizeVocabLevel, vocabTopics } from "@/lib/data/vocabulary"

/** Route Handler chạy trên Node.js runtime để dùng được fetch + env của server */
export const runtime = "nodejs"

/** Số lượng từ tối thiểu / tối đa cho 1 lần sinh để tránh lạm dụng API */
const MIN_COUNT = 1
const MAX_COUNT = 40

type GenerateBody = {
  topicId?: string
  topicLabel?: string
  prompt?: string
  level?: string
  count?: number
  notes?: string
  stream?: boolean
}

/**
 * POST /api/ai/vocab/generate
 * Người dùng chọn số lượng + cấp độ + chủ đề → AI sinh danh sách từ tương ứng.
 * Hỗ trợ `stream: true` để truyền về từng đợt từ ngay khi có kết quả.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateBody

    /* Nhãn chủ đề: ưu tiên tên người dùng gửi lên, nếu không có thì tra theo topicId */
    const builtIn = vocabTopics.find((t) => t.id === body.topicId)
    const topic = (body.topicLabel?.trim() || builtIn?.label || "Từ vựng thông dụng").trim()

    /* Số lượng từ: chặn trong khoảng an toàn */
    const requested = Number(body.count)
    const count = Number.isFinite(requested)
      ? Math.min(Math.max(Math.trunc(requested), MIN_COUNT), MAX_COUNT)
      : 10

    const level = normalizeVocabLevel(body.level)

    /* Chế độ Streaming: trả về từng đợt từ ngay khi xong từng batch */
    if (body.stream) {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          const sendEvent = (payload: Record<string, unknown>) => {
            try {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
            } catch {
              // client ngắt kết nối
            }
          }

          try {
            const finalWords = await generateVocabWords(
              {
                topic,
                prompt: body.prompt,
                level,
                count,
                notes: body.notes,
              },
              (newWords, allWords) => {
                sendEvent({
                  type: "chunk",
                  words: newWords,
                  current: allWords.length,
                  target: count,
                  done: false,
                })
              }
            )
            sendEvent({
              type: "done",
              words: finalWords,
              current: finalWords.length,
              target: count,
              done: true,
            })
          } catch (err) {
            const message = err instanceof Error ? err.message : "Không sinh được từ vựng. Vui lòng thử lại."
            console.error("[api/ai/vocab/generate] Lỗi stream:", err)
            sendEvent({
              type: "error",
              error: message,
              done: true,
            })
          } finally {
            try {
              controller.close()
            } catch {
              // đã đóng
            }
          }
        },
      })

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      })
    }

    const words = await generateVocabWords({
      topic,
      prompt: body.prompt,
      level,
      count,
      notes: body.notes,
    })

    return Response.json({ words, model: process.env.OpenRouter_MODEL ?? undefined })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Không sinh được từ vựng. Vui lòng thử lại."
    console.error("[api/ai/vocab/generate] Lỗi:", err)
    return Response.json({ error: message }, { status: 502 })
  }
}