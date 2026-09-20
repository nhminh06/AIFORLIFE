import { openRouterChatJSON } from "./openrouter"
import { grammarGroupLabel, type GrammarGroup, type GrammarExample, type GrammarLevel, type FormulaRow } from "@/lib/data/grammar"

export type GenerateGrammarInput = {
  topicLabel: string
  level: GrammarLevel
  prompt?: string
  notes?: string
  group?: GrammarGroup
}

export type GeneratedGrammar = {
  name: string
  vi: string
  desc: string
  level: GrammarLevel
  accent: string
  intro: string
  usage: string[]
  formulas: FormulaRow[]
  examples: GrammarExample[]
  practiceId: string
  group: GrammarGroup
}

const SYSTEM_PROMPT = `Bạn là chuyên gia ngữ pháp tiếng Anh cho người Việt học tiếng Anh.

Luôn trả về DUY NHẤT một object JSON đúng định dạng sau, không kèm giải thích hay văn bản nào khác:
{"name":"...","vi":"...","desc":"...","level":"Cơ bản","accent":"...","intro":"...","usage":["..."],"formulas":[{"use":"...","structure":"...","example":"..."}],"examples":[{"en":"...","vi":"..."}],"practiceId":"..."}

Quy tắc bắt buộc:
- "name": tên tiếng Anh của chủ điểm ngữ pháp (ví dụ: "Future Perfect Continuous").
- "vi": tên tiếng Việt (ví dụ: "Thì tương lai hoàn thành tiếp diễn").
- "desc": mô tả ngắn gọn 1 câu bằng tiếng Việt.
- "level": một trong 3 giá trị: "Cơ bản", "Trung cấp", "Nâng cao".
- "accent": màu thẻ, một trong: "bg-blue-600", "bg-teal-600", "bg-purple-600", "bg-orange-500", "bg-green-600", "bg-pink-500", "bg-sky-500", "bg-indigo-600", "bg-rose-500".
- "intro": giải thích khái niệm bằng tiếng Việt, 2-4 câu.
- "usage": mảng chuỗi, mỗi chuỗi 1 cách dùng kèm ví dụ tiếng Anh ngắn.
- "formulas": mảng object, mỗi object có đủ 3 trường riêng "use" (mô tả tiếng Việt), "structure" (cấu trúc tiếng Anh), "example" (câu ví dụ tiếng Anh). TUYỆT ĐỐI không gộp cả 3 vào một chuỗi.
- "examples": mảng object, mỗi object có đủ 2 trường riêng "en" (câu tiếng Anh, dùng **chỉ từ cần nhấn mạnh** bằng dấu **) và "vi" (nghĩa tiếng Việt). TUYỆT ĐỐI không gộp câu và nghĩa vào một chuỗi.
- "practiceId": slug thực hành tiếng Việt không dấu, ví dụ "future-perfect-continuous-quiz".
- TUYỆT ĐỐI không kèm giải thích hay văn bản nào khác ngoài object JSON.`

/* ------------------------------------------------------------------ */
/*  Chuẩn hóa dữ liệu AI trả về                                        */
/* ------------------------------------------------------------------ */

const GRAMMAR_LEVELS: GrammarLevel[] = ["Cơ bản", "Trung cấp", "Nâng cao"]

const VALID_ACCENTS = [
  "bg-blue-600",
  "bg-teal-600",
  "bg-purple-600",
  "bg-orange-500",
  "bg-green-600",
  "bg-pink-500",
  "bg-sky-500",
  "bg-indigo-600",
  "bg-rose-500",
]

/* Grammar dùng router riêng để không bị ảnh hưởng bởi model cũ trong .env.local. */
const GRAMMAR_MODELS = (process.env.GRAMMAR_OPENROUTER_MODELS || "openrouter/free")
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean)

function asTrimmedString(value: unknown): string {
  if (typeof value === "string") return value.trim()
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return ""
}

/** Mảng chuỗi: chấp nhận cả chuỗi nhiều dòng bị model gộp lại */
function asStringArray(value: unknown): string[] {
  if (typeof value === "string") {
    return value
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  if (!Array.isArray(value)) return []
  return value.map(asTrimmedString).filter(Boolean)
}

/** Map mọi cách viết cấp độ ("A1","Beginner","intermediate"…) về GrammarLevel chuẩn */
function normalizeGrammarLevel(value: unknown, fallback: GrammarLevel): GrammarLevel {
  const raw = asTrimmedString(value).toLowerCase()
  if (!raw) return fallback
  if (GRAMMAR_LEVELS.some((l) => l.toLowerCase() === raw)) return raw as GrammarLevel
  if (["basic", "beginner", "a1", "a2", "elementary"].includes(raw)) return "Cơ bản"
  if (["intermediate", "b1", "b2", "pre-intermediate"].includes(raw)) return "Trung cấp"
  if (["advanced", "c1", "c2", "proficient"].includes(raw)) return "Nâng cao"
  return fallback
}

/** "Grammar Future Simple" → "grammar-future-simple" */
function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
}

/** Chuẩn hóa bảng công thức: chấp nhận chuỗi "use | structure | example" bị gộp */
function sanitizeFormulas(value: unknown): FormulaRow[] {
  if (typeof value === "string") return sanitizeFormulas(value.split(/\n+/))
  if (!Array.isArray(value)) return []
  return value
    .map((item): FormulaRow | null => {
      if (typeof item === "string") {
        const parts = item.split("|").map((p) => p.trim())
        const row = { use: parts[0] ?? "", structure: parts[1] ?? "", example: parts[2] ?? "" }
        return row.use || row.structure || row.example ? row : null
      }
      if (!item || typeof item !== "object") return null
      const raw = item as Record<string, unknown>
      const row = {
        use: asTrimmedString(raw.use ?? raw.cachDung ?? raw.purpose),
        structure: asTrimmedString(raw.structure ?? raw.cauTruc ?? raw.form),
        example: asTrimmedString(raw.example ?? raw.viDu ?? raw.sample),
      }
      return row.use || row.structure || row.example ? row : null
    })
    .filter((row): row is FormulaRow => row !== null)
}

/** Chuẩn hóa ví dụ: chấp nhận chuỗi "en — vi" bị gộp, tách theo dấu gạch ngang dài */
function sanitizeExamples(value: unknown): GrammarExample[] {
  if (typeof value === "string") return sanitizeExamples(value.split(/\n+/))
  if (!Array.isArray(value)) return []
  return value
    .map((item): GrammarExample | null => {
      let en = ""
      let vi = ""
      if (typeof item === "string") {
        const parts = item.split(/\s+[—–]\s+|\s*\|\s*/)
        en = (parts[0] ?? "").trim()
        vi = (parts[1] ?? "").trim()
      } else if (item && typeof item === "object") {
        const raw = item as Record<string, unknown>
        en = asTrimmedString(raw.en ?? raw.english ?? raw.example)
        vi = asTrimmedString(raw.vi ?? raw.vietnamese ?? raw.meaning)
      } else {
        return null
      }
      if (!en) return null
      /* Model gộp "Câu tiếng Anh — nghĩa tiếng Việt" vào "en" → tách ra */
      if (!vi) {
        const merged = en.match(/^(.+?)\s*[—–]\s*(.+)$/)
        if (merged) {
          en = merged[1].trim()
          vi = merged[2].trim()
        }
      }
      return { en, vi }
    })
    .filter((row): row is GrammarExample => row !== null)
}

export async function generateGrammarTopic(
  input: GenerateGrammarInput
): Promise<GeneratedGrammar> {
  const { topicLabel, level, prompt, notes } = input

  const userPrompt = [
    `Tạo 1 chủ điểm ngữ pháp tiếng Anh chi tiết.`,
    `- Tên chủ điểm: ${topicLabel}`,
    `- Trình độ người học: ${level}. Nội dung phải phù hợp đúng trình độ này.`,
    prompt?.trim() ? `- Yêu cầu riêng: ${prompt.trim()}` : "",
    notes?.trim() ? `- Ghi chú: ${notes.trim()}` : "",
    "",
    "Trả về đúng object JSON có tất cả các trường: name, vi, desc, level, accent, intro, usage, formulas, examples, practiceId.",
  ]
    .filter(Boolean)
    .join("\n")

  const payload = await openRouterChatJSON<unknown>(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    { temperature: 0.5, models: GRAMMAR_MODELS, reasoning: { enabled: true } }
  )

  /* AI có thể trả thiếu / sai kiểu trường → chuẩn hóa toàn bộ trước khi dùng */
  const raw = (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>
  const name = asTrimmedString(raw.name)
  const vi = asTrimmedString(raw.vi) || name
  const intro = asTrimmedString(raw.intro)
  const usage = asStringArray(raw.usage)
  const formulas = sanitizeFormulas(raw.formulas)
  const examples = sanitizeExamples(raw.examples)

  if (!name || !vi) {
    throw new Error("AI chưa trả về ngữ pháp hợp lệ. Vui lòng thử lại.")
  }
  if (!intro && usage.length === 0 && formulas.length === 0) {
    throw new Error("AI trả về chủ điểm thiếu nội dung. Vui lòng thử lại.")
  }

    const accentCandidate = asTrimmedString(raw.accent)
  const accent = VALID_ACCENTS.includes(accentCandidate) ? accentCandidate : "bg-purple-600"
  const practiceId = asTrimmedString(raw.practiceId) || `${slugify(name) || "ngu-phap"}-quiz`

  /* Nhóm ngữ pháp: ưu tiên theo input của user → phân loại theo tên chủ đề */
  const group: GrammarGroup =
    input.group ?? inferGrammarGroup(asTrimmedString(raw.name), asTrimmedString(raw.vi), topicLabel)

  return {
    name,
    vi,
    desc: asTrimmedString(raw.desc) || vi,
    level: normalizeGrammarLevel(raw.level, level),
    accent,
    intro: intro || vi,
    usage,
    formulas,
    examples,
    practiceId,
    group,
  }
}

/* Dựa vào tên gồm từ khóa thì (simple, continuous, perfect) → nhóm tense */
function inferGrammarGroup(name: string, vi: string, label: string): GrammarGroup {
  const combined = `${name} ${vi} ${label}`.toLowerCase()
  const tenseKeywords = ["simple", "continuous", "perfect", "thì"]
  return tenseKeywords.some((kw) => combined.includes(kw)) ? "tense" : "other"
}
