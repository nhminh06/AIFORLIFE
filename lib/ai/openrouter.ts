/**
 * OpenRouter API client — CHỈ dùng ở phía server (Route Handlers).
 *
 * Không import file này từ component client vì API key là thông tin bí mật.
 *
 * Biến môi trường cần có trong .env.local:
 *   OpenRouter.api.key = sk-or-...                             (bắt buộc)
 *   OpenRouter.api.key1 = sk-or-...                            (tuỳ chọn — key thứ 2 để chạy song song)
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
  /**
   * `{ enabled: false }` (mặc định) = tắt suy luận ẩn → trả kết quả nhanh.
   * `null` = không gửi trường này để provider tự quyết (một số provider free bắt buộc bật reasoning).
   */
  reasoning?: { enabled: boolean } | null
  /** Dùng key cụ thể cho request này (mặc định lấy key đầu tiên trong .env.local) */
  apiKey?: string
  /** Thời gian chờ tối đa cho 1 lần gọi (mặc định REQUEST_TIMEOUT_MS) */
  timeoutMs?: number
  /** Số lần thử tối đa cho request này (mặc định MAX_ATTEMPTS) */
  maxAttempts?: number
}

/** Số key phụ tối đa đọc thêm từ .env.local: OpenRouter.api.key1 → key5 */
const MAX_EXTRA_API_KEYS = 5

/* Phân phối request mới đều giữa các key trong cùng process server. */
let nextApiKeyIndex = 0

/**
 * Lấy TẤT CẢ API key OpenRouter đang cấu hình.
 * Hỗ trợ `OpenRouter.api.key` + `OpenRouter.api.key1`, `key2`… và `OPENROUTER_API_KEY` + `OPENROUTER_API_KEY1`…
 * Có nhiều key thì chạy được nhiều yêu cầu AI song song → giảm thời gian chờ.
 */
export function getOpenRouterApiKeys(): string[] {
  const keys: string[] = []
  const push = (value: string | undefined) => {
    const key = value?.trim()
    if (key && !keys.includes(key)) keys.push(key)
  }

  push(process.env["OpenRouter.api.key"])
  push(process.env.OPENROUTER_API_KEY)
  for (let index = 1; index <= MAX_EXTRA_API_KEYS; index++) {
    push(process.env[`OpenRouter.api.key${index}`])
    push(process.env[`OPENROUTER_API_KEY${index}`])
  }

  if (keys.length === 0) {
    throw new Error(
      "Chưa cấu hình API key OpenRouter. Hãy thêm `OpenRouter.api.key=sk-or-...` vào file .env.local rồi khởi động lại server."
    )
  }

  return keys
}

/**
 * Lấy API key OpenRouter theo thứ tự (0 = key chính, 1 = key phụ…).
 * Hỗ trợ cả tên có dấu chấm theo .env.local (`OpenRouter.api.key`) và `OPENROUTER_API_KEY`.
 */
export function getOpenRouterApiKey(index = 0): string {
  const keys = getOpenRouterApiKeys()
  const safeIndex = ((index % keys.length) + keys.length) % keys.length
  return keys[safeIndex]
}

/** Lấy key kế tiếp theo kiểu round-robin để các tác vụ độc lập không dồn vào key đầu tiên. */
export function getNextOpenRouterApiKey(): string {
  const keys = getOpenRouterApiKeys()
  const key = keys[nextApiKeyIndex % keys.length]
  nextApiKeyIndex = (nextApiKeyIndex + 1) % keys.length
  return key
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
export class OpenRouterError extends Error {
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
  const apiKey = options.apiKey?.trim() || getOpenRouterApiKey()
  const reasoning = options.reasoning === undefined ? { enabled: false } : options.reasoning

  let data: { choices?: { message?: { content?: string } }[] }
  try {
    const res = await fetch(OPENROUTER_CHAT_URL, {
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
        ...(reasoning ? { reasoning } : {}),
      }),
      signal: AbortSignal.timeout(options.timeoutMs ?? REQUEST_TIMEOUT_MS),
      cache: "no-store",
    })

    if (!res.ok) {
      /* Đổi key khi bị giới hạn, key lỗi hoặc provider tạm thời không sẵn sàng. */
      const retryable = res.status === 401 || res.status === 402 || res.status === 403 || res.status === 429 || res.status >= 500
      throw new OpenRouterError(await readErrorMessage(res), retryable)
    }

    /* Đọc body cũng nằm trong try: model free trả chậm có thể timeout giữa chừng */
    data = (await res.json()) as typeof data
  } catch (err) {
    if (err instanceof OpenRouterError) throw err
    /* Timeout / mất mạng / body không đọc được đều là lỗi tạm thời → thử lại */
    const detail = err instanceof Error ? err.message : String(err)
    throw new OpenRouterError(`Không kết nối được tới OpenRouter: ${detail}`, true)
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
 * Tự động thử lại với các lỗi tạm thời (quá tải, timeout, mạng, JSON lỗi).
 * Số lần thử đổi được qua `options.maxAttempts` (ví dụ 2 lần cho tính năng cần trả kết quả nhanh).
 */
export async function openRouterChatJSON<T>(
  messages: OpenRouterMessage[],
  options: OpenRouterRequestOptions = {}
): Promise<T> {
  const maxAttempts = Math.max(1, options.maxAttempts ?? MAX_ATTEMPTS)
  const apiKeys = options.apiKey ? [options.apiKey] : getOpenRouterApiKeys()
  const firstKeyIndex = options.apiKey ? 0 : (nextApiKeyIndex++ % apiKeys.length)
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const apiKey = apiKeys[(firstKeyIndex + attempt - 1) % apiKeys.length]
      return await requestOpenRouterJSON<T>(messages, { ...options, apiKey })
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      const retryable = err instanceof OpenRouterError ? err.retryable : false
      if (!retryable || attempt === maxAttempts) break
      /* Chuyển key ngay ở lần thử tiếp theo; chỉ nghỉ ngắn để tránh dồn request. */
      await sleep(250 * attempt)
    }
  }

  throw lastError ?? new Error("Yêu cầu AI thất bại. Vui lòng thử lại.")
}
