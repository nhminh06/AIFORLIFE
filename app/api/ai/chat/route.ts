import {
  processLocalDynamicQuery,
  extractComparingWords,
  isPredefinedVocabDiff,
} from "@/lib/ai/local-dynamic-tutor"
import { openRouterChatText, getOpenRouterApiKeys } from "@/lib/ai/openrouter"

export const runtime = "nodejs"

type ChatRequestBody = {
  messages?: { role: string; content: string; category?: string }[]
  category?: string
}

/**
 * POST /api/ai/chat
 * Trợ lý AI Hỏi Đáp Tiếng Anh — Kiến trúc Kết hợp (Hybrid Engine):
 * 1. Các cặp từ phổ biến & ngữ pháp chuẩn: Xử lý 100% nội bộ trên máy, phản hồi 0ms.
 * 2. Cặp từ tùy ý người dùng nhập bất kỳ (ngoài danh bạ nạp sẵn):
 *    - Ưu tiên gọi mô hình AI suy luận trực tiếp để sinh phân tích chuyên sâu cho bất kỳ cặp từ nào trong tiếng Anh.
 *    - Tự động chuyển về Bộ giải mã Ngữ nghĩa & Hình thái học Nội bộ (Offline Semantic Lexicon) nếu mất mạng hoặc quá thời gian.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return Response.json(
        { error: "Vui lòng gửi kèm ít nhất một câu hỏi hoặc tin nhắn." },
        { status: 400 }
      )
    }

    const lastMessage = body.messages[body.messages.length - 1]
    const userPrompt = lastMessage?.content || ""
    const category = body.category || lastMessage?.category || "auto"

    // 1. Kiểm tra nếu là yêu cầu phân biệt từ vựng bất kỳ
    const isVocabDiffRequest =
      category === "vocab_diff" ||
      /(?:phân\s*biệt|so\s*sánh|sự\s*khác\s*nhau|khác\s*nhau\s*như|vs|\/)\s*/i.test(userPrompt)

    if (isVocabDiffRequest) {
      const extracted = extractComparingWords(userPrompt)

      if (extracted) {
        const { word1, word2, extraWord } = extracted
        const isPredefined = isPredefinedVocabDiff(word1, word2, extraWord)

        // Nếu KHÔNG nằm trong danh bạ biên soạn sẵn và có cấu hình AI:
        // Gọi AI tạo phân tích chi tiết cho bất kỳ 2 từ nào trên thế giới
        if (!isPredefined && getOpenRouterApiKeys().length > 0) {
          const startTime = Date.now()
          const cap1 = word1.charAt(0).toUpperCase() + word1.slice(1)
          const cap2 = word2.charAt(0).toUpperCase() + word2.slice(1)
          const capExtra = extraWord ? extraWord.charAt(0).toUpperCase() + extraWord.slice(1) : ""
          const extraHeader = extraWord ? ` | **${capExtra}**` : ""
          const extraSep = extraWord ? " | :---" : ""
          const extraCell = extraWord ? " | ..." : ""

          const prompt = `Bạn là chuyên gia ngôn ngữ học Tiếng Anh hàng đầu. Học viên yêu cầu phân biệt sự khác nhau giữa các từ: "${word1}" và "${word2}"${extraWord ? ` và "${extraWord}"` : ""}.

Hãy viết câu trả lời chi tiết, chuyên nghiệp và sư phạm bằng Tiếng Việt theo cấu trúc sau:
### 💡 Phân biệt "${cap1}" và "${cap2}"${extraWord ? ` và "${capExtra}"` : ""}

1. **Bản chất cốt lõi & Sự khác biệt mấu chốt:**
   - Định nghĩa chính xác và bản chất ngữ nghĩa của từng từ.
   - Nêu rõ sự khác biệt quan trọng nhất (về mức độ trang trọng/register, phạm vi bao quát, đối tượng áp dụng hay sắc thái tâm lý).

2. **Bảng so sánh chi tiết:**
| Tiêu chí | **${cap1}** | **${cap2}**${extraHeader} |
| :--- | :--- | :---${extraSep} |
| **Nghĩa tiếng Việt** | ... | ...${extraCell} |
| **Loại từ & Ngữ pháp** | ... | ...${extraCell} |
| **Sắc thái & Văn phong** | ... | ...${extraCell} |
| **Ngữ cảnh sử dụng** | ... | ...${extraCell} |
| **Cụm từ đi kèm (Collocations)** | ... | ...${extraCell} |
| **Ví dụ minh họa (kèm dịch)** | ... | ...${extraCell} |

3. **Mẹo ghi nhớ siêu tốc & Lỗi sai kinh điển:**
   - Mẹo nhớ nhanh để không bao giờ nhầm lẫn.
   - Chỉ ra ít nhất một lỗi sai phổ biến người học hay mắc kèm ví dụ đúng/sai.

4. **Thử thách luyện tập:**
   - Mời học viên đặt 1 câu với mỗi từ và gửi vào khung chat để được sửa lỗi trực tiếp.

Trình bày định dạng Markdown rõ ràng, bảng biểu chuẩn đẹp, ví dụ tự nhiên chuẩn bản ngữ.`

          try {
            const aiReply = await openRouterChatText(
              [
                {
                  role: "system",
                  content:
                    "Bạn là trợ lý AI ngôn ngữ học Tiếng Anh xuất sắc. Luôn phân biệt các từ vựng chính xác, giàu thông tin thực tế, có ví dụ tự nhiên và bảng đối chiếu rõ ràng.",
                },
                { role: "user", content: prompt },
              ],
              {
                timeoutMs: 12000,
                maxAttempts: 1,
                models: ["openrouter/free", "qwen/qwen3-4b:free"],
              }
            )

            if (aiReply && aiReply.length > 50) {
              return Response.json({
                reply: `${aiReply}\n\n---\n*(Phân tích chuyên sâu từ vựng động bằng AI, ${Date.now() - startTime}ms).*`,
                model: `AI Đa Năng (Phân biệt từ: ${word1}/${word2})`,
                category,
                executionTimeMs: Date.now() - startTime,
                timestamp: Date.now(),
              })
            }
          } catch (openRouterErr) {
            console.warn(
              "[api/ai/chat] OpenRouter timeout hoặc không phản hồi, tự động dùng Bộ phân tích Ngữ nghĩa Nội bộ:",
              openRouterErr
            )
          }
        }
      }
    }

    // 2. Phân tích bằng Bộ xử lý Ngữ pháp & Cú pháp Nội bộ (có sẵn Kho từ vựng ngữ nghĩa mở rộng)
    const result = processLocalDynamicQuery(userPrompt, body.messages, category)

    return Response.json({
      reply: result.reply,
      model: result.model,
      category,
      executionTimeMs: result.executionTimeMs,
      timestamp: Date.now(),
    })
  } catch (err) {
    console.error("[api/ai/chat] Lỗi xử lý:", err)
    const message =
      err instanceof Error
        ? err.message
        : "Đã có lỗi xảy ra trong quá trình phân tích cú pháp nội bộ."
    return Response.json({ error: message }, { status: 500 })
  }
}
