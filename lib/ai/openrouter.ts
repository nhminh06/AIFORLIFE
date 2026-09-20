/**
 * OpenRouter API client — CHỈ dùng ở phía server (Route Handlers).
 *
 * Không import file này từ component client vì API key là thông tin bí mật.
 *
 * Biến môi trường cần có trong .env.local:
 *   OpenRouter.api.key = sk-or-...                             (bắt buộc)
 *   OpenRouter_MODEL   = qwen/qwen3-next-80b-a3b-instruct:free (tuỳ chọn, mặc định bên dưới)
 */

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions"

/** Model OpenRouter mặc định dùng cho tính năng từ vựng AI */
export const OPENROUTER_DEFAULT_MODEL = "qwen/qwen3-4b:free"

/** Thời gian chờ tối đa cho 1 lần gọi AI (ms) */
const REQUEST_TIMEOUT_MS = 60_000

export type OpenRouterRole = "system" | "user" | "assistant"

export type OpenRouterMessage = {
  role: OpenRouterRole
  content: string
}

export type OpenRouterRequestOptions = {
  temperature?: number
  models?: string[]
  reasoning?: { enabled: boolean }
}

/**
 * Lấy API key OpenRouter.
 * Hỗ trợ cả tên có dấu chấm theo .env.local (`OpenRouter.api.key`) và `OPENROUTER_API_KEY`.
 */
export function getOpenRouterApiKey(): string {
  const key = process.env["OpenRouter.api.key"] ?? process.env.OPENROUTER_API_KEY
  if (!key || !key.trim()) {
    throw new Error(
      "Chưa cấu hình API key OpenRouter. Hãy thêm `OpenRouter.api.key=sk-or-...` vào file .env.local rồi khởi động lại server."
    )
  }
  return key.trim()
}

/** Model đang dùng — đổi được qua biến môi trường OpenRouter_MODEL */
export function getOpenRouterModel(): string {
  return (process.env.OpenRouter_MODEL || OPENROUTER_DEFAULT_MODEL).trim()
}

/**
 * Danh sách model dự phòng khi model chính bận/lỗi (OpenRouter tự chuyển).
 * Đổi được qua `OpenRouter_FALLBACK_MODELS`, các model cách nhau bằng dấu phẩy.
 */
const DEFAULT_FALLBACK_MODELS = ["deepseek/deepseek-v4-flash-0731:free", "z-ai/glm-5.2:free"]

export function getOpenRouterModels(): string[] {
  const fallback = (process.env.OpenRouter_FALLBACK_MODELS || "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean)
  const list = [getOpenRouterModel(), ...(fallback.length > 0 ? fallback : DEFAULT_FALLBACK_MODELS)]
  return [...new Set(list)]
}

/** Lỗi khi gọi OpenRouter — `retryable` cho biết có nên thử lại hay không */
class OpenRouterError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean
  ) {
    super(message)
    this.name = "OpenRouterError"
  }
}

/** Cắt bỏ markdown code fence nếu model bọc JSON trong ```json ... ``` */
function stripCodeFence(text: string): string {
  const trimmed = text.trim()
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return fence ? fence[1].trim() : trimmed
}

/** Cắt lấy object JSON đầu tiên (phòng khi model thêm chữ giải thích bên ngoài) */
function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start === -1 || end === -1 || end <= start) return null
  return text.slice(start, end + 1)
}

/** Đọc thông báo lỗi mà OpenRouter trả về (nếu có) để hiển thị cho người dùng */
async function readErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: { message?: string } }
    if (data?.error?.message) return data.error.message
  } catch {
    // bỏ qua — dùng thông báo mặc định bên dưới
  }
  return `OpenRouter trả về lỗi ${res.status}`
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Gọi OpenRouter 1 lần và bắt buộc trả về JSON object */
async function requestOpenRouterJSON<T>(
  messages: OpenRouterMessage[],
  options: OpenRouterRequestOptions
): Promise<T> {
  const apiKey = getOpenRouterApiKey()

  let res: Response
  try {
    res = await fetch(OPENROUTER_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_APP_NAME || "AFL Vocab",
      },
      body: JSON.stringify({
        models: options.models?.length ? options.models : getOpenRouterModels(),
        messages,
        temperature: options.temperature ?? 0.4,
        response_format: { type: "json_object" },
        /* Chỉ dùng provider nhanh nhất trong danh sách cho phép → giảm chờ */
        provider: { sort: "throughput", allow_fallbacks: true },
        /* Cắt token suy luận ẩn của model reasoning (deepseek) → trả kết quả nhanh hơn */
        reasoning: options.reasoning ?? { enabled: false },
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    throw new OpenRouterError(`Không kết nối được tới OpenRouter: ${detail}`, true)
  }

  if (!res.ok) {
    /* 429 (quá nhiều yêu cầu) và 5xx là lỗi tạm thời → có thể thử lại */
    const retryable = res.status === 429 || res.status >= 500
    throw new OpenRouterError(await readErrorMessage(res), retryable)
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }

  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) {
    throw new OpenRouterError("OpenRouter không trả về nội dung nào. Vui lòng thử lại.", true)
  }

  const raw = stripCodeFence(content)
  const candidate = raw.startsWith("{") ? raw : extractJsonObject(raw)

  if (!candidate) {
    throw new OpenRouterError("AI trả về dữ liệu không đúng định dạng JSON. Vui lòng thử lại.", true)
  }

  try {
    return JSON.parse(candidate) as T
  } catch {
    throw new OpenRouterError("Không đọc được JSON do AI trả về. Vui lòng thử lại.", true)
  }
}

/** Số lần thử tối đa cho mỗi yêu cầu AI */
const MAX_ATTEMPTS = 3

/**
 * Gọi OpenRouter Chat Completions và bắt buộc trả về JSON object.
 * Tự động thử lại tối đa 3 lần với các lỗi tạm thời (quá tải, mạng, JSON lỗi).
 */
export async function openRouterChatJSON<T>(
  messages: OpenRouterMessage[],
  options: OpenRouterRequestOptions = {}
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await requestOpenRouterJSON<T>(messages, options)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      const retryable = err instanceof OpenRouterError ? err.retryable : false
      if (!retryable || attempt === MAX_ATTEMPTS) break
      /* model free hay rate-limit 429 → chờ 5s rồi 10s cho provider hồi, thay vì fail ngay */
      await sleep(5000 * attempt)
    }
  }

  throw lastError ?? new Error("Yêu cầu AI thất bại. Vui lòng thử lại.")
}
