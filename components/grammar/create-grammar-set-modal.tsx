"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Pencil,
  Save,
  Sparkles,
  Wand2,
  X,
} from "lucide-react"

import { useAuth } from "@/lib/auth-context"
import {
  grammarGroupLabel,
  type GrammarGroup,
  type GrammarLevel,
  type FormulaRow,
  type GrammarExample,
} from "@/lib/data/grammar"
import { createMyGrammarSet, type GrammarSet } from "@/lib/user-grammar"
import { aiGenerateGrammar } from "@/lib/ai-grammar"
import type { GeneratedGrammar } from "@/lib/ai/grammar-ai"
import { cn } from "@/lib/utils"

/** Màu thanh tiến độ cho chủ điểm mới */
const accents = [
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

/* Mọi ô input/textarea đều hỗ trợ dark mode bằng class dark:* */
const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-800"

const grammarLevels: GrammarLevel[] = ["Cơ bản", "Trung cấp", "Nâng cao"]

/* Các nhóm chủ điểm người dùng chọn để AI sinh (dành cho cả 2 phương pháp) */
const GRAMMAR_GROUPS: { id: GrammarGroup; label: string; desc: string }[] = [
  {
    id: "tense",
    label: "12 thì",
    desc: "Các thì (thời) trong tiếng Anh: Present, Past, Future…",
  },
  {
    id: "other",
    label: "Ngữ pháp mở rộng",
    desc: "Câu bị động, câu điều kiện, Reported Speech, so sánh…",
  },
]

type Tab = "manual" | "ai"

type CreateGrammarModalProps = {
  onClose: () => void
  /** gọi sau khi lưu thành công để danh sách chủ điểm được làm mới */
  onCreated: (set: GrammarSet) => void
}

export function CreateGrammarModal({ onClose, onCreated }: CreateGrammarModalProps) {
  const router = useRouter()
  const { user, openAuthModal } = useAuth()

  const [tab, setTab] = useState<Tab>("manual")
  const [name, setName] = useState("")
  const [vi, setVi] = useState("")
  const [desc, setDesc] = useState("")
  const [group, setGroup] = useState<GrammarGroup>("tense")
  const [level, setLevel] = useState<GrammarLevel>("Cơ bản")
  const [accent, setAccent] = useState(accents[2])
  const [intro, setIntro] = useState("")
  const [usageText, setUsageText] = useState("")
  const [formulasText, setFormulasText] = useState("")
  const [examplesText, setExamplesText] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedSet, setSavedSet] = useState<GrammarSet | null>(null)

  /* Tab AI */
  const [aiTopicLabel, setAiTopicLabel] = useState("")
  const [aiNotes, setAiNotes] = useState("")
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiGenerated, setAiGenerated] = useState<GeneratedGrammar | null>(null)
  const [aiSaving, setAiSaving] = useState(false)

  const nameRef = useRef<HTMLInputElement>(null)
  const aiTopicRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    nameRef.current?.focus()
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  /* ── Tab thủ công: parse textarea inputs ── */
  function parseFormulas(text: string): FormulaRow[] {
    return text
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => {
        const parts = l.split("|").map((p) => p.trim())
        return { use: parts[0] ?? "", structure: parts[1] ?? "", example: parts[2] ?? "" }
      })
      .filter((f) => f.use || f.structure || f.example)
  }

  function parseExamples(text: string): GrammarExample[] {
    return text
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => {
        const parts = l.split("|").map((p) => p.trim())
        return { en: parts[0] ?? "", vi: parts[1] ?? "" }
      })
      .filter((e) => e.en)
  }

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!user) {
      setError("Bạn cần đăng nhập để lưu chủ điểm ngữ pháp.")
      openAuthModal("login")
      return
    }
    if (!name.trim() || !vi.trim()) {
      setError("Vui lòng nhập tên tiếng Anh và tên tiếng Việt.")
      nameRef.current?.focus()
      return
    }
    const usage = usageText
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => l.trim())
    const formulas = parseFormulas(formulasText)
    const examples = parseExamples(examplesText)
    if (!intro.trim() && usage.length === 0 && formulas.length === 0) {
      setError("Vui lòng nhập khái niệm, cách dùng hoặc công thức cho chủ điểm.")
      return
    }

        void saveGrammar({
      name: name.trim(),
      vi: vi.trim(),
      desc: desc.trim() || vi.trim(),
      level,
      accent,
      group,
      intro: intro.trim() || vi.trim(),
      usage,
      formulas,
      examples,
      practiceId: "",
      source: "manual",
    })
  }

  /* ── Tab AI: sinh chủ điểm qua API server (không gọi OpenRouter trực tiếp) ── */
  async function handleAIGenerate() {
    if (!aiTopicLabel.trim()) {
      setError("Vui lòng nhập tên chủ điểm ngữ pháp.")
      aiTopicRef.current?.focus()
      return
    }
    setAiGenerating(true)
    setError(null)
    try {
            const result = await aiGenerateGrammar({
        topicLabel: aiTopicLabel.trim(),
        level,
        notes: aiNotes.trim() || undefined,
        group,
      })
      setAiGenerated(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không sinh được chủ điểm. Vui lòng thử lại.")
    } finally {
      setAiGenerating(false)
    }
  }

  /* ── Lưu chủ điểm do AI soạn (đã xem trước) ── */
  async function handleSaveAI() {
    if (!user) {
      setError("Bạn cần đăng nhập để lưu chủ điểm ngữ pháp.")
      openAuthModal("login")
      return
    }
    if (!aiGenerated) return
    setAiSaving(true)
    setError(null)
    try {
            const created = await createMyGrammarSet(user.uid, {
        name: aiGenerated.name,
        vi: aiGenerated.vi,
        desc: aiGenerated.desc,
        level: aiGenerated.level,
        accent: aiGenerated.accent,
        group: aiGenerated.group,
        intro: aiGenerated.intro,
        usage: aiGenerated.usage,
        formulas: aiGenerated.formulas,
        examples: aiGenerated.examples,
        practiceId: aiGenerated.practiceId,
        source: "ai",
      })
      setSavedSet(created)
      onCreated(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được chủ điểm. Vui lòng thử lại.")
    } finally {
      setAiSaving(false)
    }
  }

  /* ── Lưu chủ điểm nhập tay ── */
    async function saveGrammar(input: {
    name: string
    vi: string
    desc: string
    level: GrammarLevel
    accent: string
    group: GrammarGroup
    intro: string
    usage: string[]
    formulas: FormulaRow[]
    examples: GrammarExample[]
    practiceId: string
    source: "manual" | "ai"
  }) {
    if (!user) {
      setError("Bạn cần đăng nhập để lưu chủ điểm ngữ pháp.")
      openAuthModal("login")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const created = await createMyGrammarSet(user.uid, input)
      setSavedSet(created)
      onCreated(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được chủ điểm. Vui lòng thử lại.")
    } finally {
      setSaving(false)
    }
  }

  const switchTab = (next: Tab) => {
    setTab(next)
    setError(null)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px] sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tạo chủ điểm ngữ pháp"
        className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* Header — giống modal tạo bộ từ vựng */}
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-sm shadow-purple-600/25">
            <Pencil className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-slate-900">Tạo chủ điểm ngữ pháp</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Chủ điểm này là của riêng bạn — chỉ tài khoản của bạn nhìn thấy và sử dụng được.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {savedSet ? (
          /* ── Lưu thành công ── */
          <div className="px-5 py-8 text-center sm:px-6">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <p className="mt-4 text-lg font-bold text-slate-900">Đã lưu chủ điểm ngữ pháp!</p>
            <p className="mt-1 text-sm text-slate-500">
              “{savedSet.name}” — {savedSet.vi} đã được thêm vào bộ ngữ pháp của bạn.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  router.push(`/ngu-phap/${savedSet.slug}`)
                }}
                className="group inline-flex items-center gap-1.5 rounded-full bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 transition-all hover:bg-purple-700"
              >
                Xem chủ điểm
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs — pill "Thủ công" / "Tạo bằng AI" như từ vựng */}
            <div className="flex items-center gap-2 px-5 pt-4 sm:px-6">
              <button
                type="button"
                onClick={() => switchTab("manual")}
                aria-pressed={tab === "manual"}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  tab === "manual"
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800"
                )}
              >
                <Pencil className="h-3.5 w-3.5" />
                Thủ công
              </button>
              <button
                type="button"
                onClick={() => switchTab("ai")}
                aria-pressed={tab === "ai"}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  tab === "ai"
                    ? "border-purple-600 bg-purple-600 text-white shadow-sm shadow-purple-600/25"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800"
                )}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Tạo bằng AI
              </button>
            </div>

            {tab === "manual" ? (
              /* ── Tab Thủ công ── */
              <form id="create-grammar-form" onSubmit={handleSubmitManual}>
                <div className="max-h-[70vh] space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                  {error && (
                    <p className="flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-600">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      {error}
                    </p>
                  )}

                  <section className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-bold text-slate-700">Tên tiếng Anh *</span>
                      <input
                        ref={nameRef}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="VD: Future Perfect Continuous"
                        className={`mt-1 ${inputClass}`}
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold text-slate-700">Tên tiếng Việt *</span>
                      <input
                        value={vi}
                        onChange={(e) => setVi(e.target.value)}
                        placeholder="VD: Thì tương lai hoàn thành tiếp diễn"
                        className={`mt-1 ${inputClass}`}
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="text-xs font-bold text-slate-700">Mô tả ngắn</span>
                      <input
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        placeholder="VD: Cách dùng và công thức của thì tương lai hoàn thành tiếp diễn"
                        className={`mt-1 ${inputClass}`}
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold text-slate-700">Cấp độ</span>
                      <select
                        value={level}
                        onChange={(e) => setLevel(e.target.value as GrammarLevel)}
                        className={`mt-1 ${inputClass}`}
                      >
                        {grammarLevels.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                                          </select>
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold text-slate-700">Nhóm chủ điểm</span>
                      <select
                        value={group}
                        onChange={(e) => setGroup(e.target.value as GrammarGroup)}
                        className={`mt-1 ${inputClass}`}
                      >
                        {GRAMMAR_GROUPS.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        {GRAMMAR_GROUPS.find((g) => g.id === group)?.desc}
                      </p>
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold text-slate-700">Màu thẻ</span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {accents.map((c) => (
                          <button
                            key={c}
                            type="button"
                            aria-label={`Chọn màu ${c}`}
                            onClick={() => setAccent(c)}
                            className={cn(
                              "h-7 w-7 rounded-full transition-transform",
                              c,
                              accent === c
                                ? "scale-110 ring-2 ring-slate-900/20 ring-offset-1"
                                : "opacity-70 hover:opacity-100"
                            )}
                          />
                        ))}
                      </div>
                    </label>
                  </section>

                  <section className="space-y-3">
                    <label className="block">
                      <span className="text-xs font-bold text-slate-700">Khái niệm</span>
                      <textarea
                        rows={3}
                        value={intro}
                        onChange={(e) => setIntro(e.target.value)}
                        placeholder="Giải thích ngắn gọn chủ điểm này là gì, dùng khi nào…"
                        className={`mt-1 resize-none ${inputClass}`}
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold text-slate-700">
                        Khi nào dùng (mỗi dòng 1 cách dùng)
                      </span>
                      <textarea
                        rows={3}
                        value={usageText}
                        onChange={(e) => setUsageText(e.target.value)}
                        placeholder="VD: Diễn tả hành động đang diễn ra tại thời điểm nói…"
                        className={`mt-1 resize-none ${inputClass}`}
                      />
                    </label>
                  </section>
                </div>
              </form>
            ) : (
              /* ── Tab Tạo bằng AI ── */
              <div className="max-h-[70vh] space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                {error && (
                  <p className="flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-600">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {error}
                  </p>
                )}

                <div className="flex items-start gap-3 rounded-2xl border border-purple-100 bg-purple-50 px-4 py-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white">
                    <Wand2 className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-purple-700">
                      AI soạn bài học theo yêu cầu của bạn
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-purple-600">
                      Nhập tên chủ điểm (tiếng Anh hoặc tiếng Việt) — AI soạn khái niệm, cách dùng,
                      bảng công thức và ví dụ minh họa. Bạn xem trước rồi lưu vào bộ ngữ pháp.
                    </p>
                  </div>
                </div>

                <section className="grid gap-3 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-bold text-slate-700">Tên chủ điểm *</span>
                    <input
                      ref={aiTopicRef}
                      value={aiTopicLabel}
                      onChange={(e) => setAiTopicLabel(e.target.value)}
                      placeholder="VD: Quá khứ hoàn thành cho người mất gốc, Reported Speech cơ bản…"
                      className={`mt-1 ${inputClass}`}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-700">Cấp độ</span>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value as GrammarLevel)}
                      className={`mt-1 ${inputClass}`}
                    >
                      {grammarLevels.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                                        </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-700">Nhóm chủ điểm</span>
                    <select
                      value={group}
                      onChange={(e) => setGroup(e.target.value as GrammarGroup)}
                      className={`mt-1 ${inputClass}`}
                    >
                      {GRAMMAR_GROUPS.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-700">Ghi chú thêm</span>
                    <input
                      value={aiNotes}
                      onChange={(e) => setAiNotes(e.target.value)}
                      placeholder="VD: Tập trung vào lỗi hay gặp…"
                      className={`mt-1 ${inputClass}`}
                    />
                  </label>
                </section>

                <button
                  type="button"
                  onClick={handleAIGenerate}
                  disabled={aiGenerating}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 transition-all hover:bg-purple-700 disabled:opacity-60"
                >
                  {aiGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang soạn chủ điểm… (khoảng 1–2 phút)
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Sinh chủ điểm với AI
                    </>
                  )}
                </button>

                {aiGenerated && (
                  <section className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">{aiGenerated.name}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {aiGenerated.vi} · {aiGenerated.level}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-[11px] font-semibold text-purple-700">
                        <Sparkles className="h-3 w-3" />
                        AI soạn sẵn
                      </span>
                    </div>
                    {aiGenerated.intro && (
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600">
                        {aiGenerated.intro}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-purple-700">
                      <span className="rounded-full bg-white px-2.5 py-1">
                        {aiGenerated.usage.length} cách dùng
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1">
                        {aiGenerated.formulas.length} công thức
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1">
                        {aiGenerated.examples.length} ví dụ
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">
                      Nội dung sẽ được lưu nguyên vào chủ điểm của bạn khi bấm “Lưu chủ điểm”.
                    </p>
                  </section>
                )}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
              <p className="text-xs text-slate-500">
                Chủ điểm được lưu riêng cho tài khoản của bạn.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
                >
                  Hủy
                </button>
                {tab === "manual" ? (
                  <button
                    type="submit"
                    form="create-grammar-form"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-full bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 transition-all hover:bg-purple-700 disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang lưu…
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Lưu chủ điểm
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveAI}
                    disabled={aiSaving || aiGenerating || !aiGenerated}
                    title={
                      !aiGenerated
                        ? "Hãy nhờ AI soạn chủ điểm trước khi lưu"
                        : "Lưu chủ điểm vào tài khoản của bạn"
                    }
                    className="inline-flex items-center gap-1.5 rounded-full bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 transition-all hover:bg-purple-700 disabled:opacity-60"
                  >
                    {aiSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang lưu…
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Lưu chủ điểm
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
