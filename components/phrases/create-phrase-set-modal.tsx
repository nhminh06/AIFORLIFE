"use client"

import { useState, type Dispatch, type SetStateAction } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  Languages,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react"

import { useAuth } from "@/lib/auth-context"
import { aiFillPhrases, aiGeneratePhrases } from "@/lib/ai-phrases"
import {
  phraseSituations,
  type PhraseItem,
  type PhraseSet,
} from "@/lib/data/phrases"
import { createMyPhraseSet } from "@/lib/user-phrases"
import { cn } from "@/lib/utils"

/** Màu thanh tiến độ cho bộ mẫu câu mới */
const accents = [
  "bg-green-600",
  "bg-teal-600",
  "bg-blue-600",
  "bg-purple-600",
  "bg-orange-500",
  "bg-pink-500",
  "bg-sky-500",
  "bg-indigo-600",
]

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-800"

type Tab = "manual" | "ai"

/** các mức số lượng câu cho phép chọn khi nhờ AI sinh */
const AI_COUNT_OPTIONS = [8, 12, 16, 24]

/** giá trị sentinel trong select tình huống: người dùng tự nhập tình huống mới */
const CUSTOM_SITUATION = "__custom__"

/** id tình huống lưu xuống Firestore khi người dùng tự nhập tình huống */
const CUSTOM_SITUATION_ID = "custom"

const LEVELS: PhraseSet["level"][] = ["Cơ bản", "Trung cấp", "Nâng cao"]

const emptyItem: PhraseItem = { en: "", vi: "" }

type CreatePhraseSetModalProps = {
  onClose: () => void
  /** gọi sau khi lưu thành công để danh sách bộ mẫu câu được làm mới */
  onCreated: (set: PhraseSet) => void
}

export function CreatePhraseSetModal({ onClose, onCreated }: CreatePhraseSetModalProps) {
  const router = useRouter()
  const { user } = useAuth()

  const [tab, setTab] = useState<Tab>("manual")
  const [name, setName] = useState("")
  const [vi, setVi] = useState("")
  const [desc, setDesc] = useState("")
  const [situationId, setSituationId] = useState(phraseSituations[0].id)
  const [customSituation, setCustomSituation] = useState("")
  const [level, setLevel] = useState<PhraseSet["level"]>("Cơ bản")
  const [accent, setAccent] = useState(accents[0])

  /* tab thủ công: danh sách câu người dùng nhập */
  const [items, setItems] = useState<PhraseItem[]>([{ ...emptyItem }])
  const [filling, setFilling] = useState(false)

  /* tab AI */
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiCount, setAiCount] = useState(12)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiPreview, setAiPreview] = useState<PhraseItem[] | null>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* đang ở chế độ "tự nhập tình huống" hay không */
  const isCustomSituation = situationId === CUSTOM_SITUATION

  /* nhãn tình huống: danh sách có sẵn, hoặc nội dung người dùng gõ vào */
  const situationLabel = isCustomSituation
    ? customSituation.trim()
    : (phraseSituations.find((s) => s.id === situationId)?.label ??
      "Giao tiếp hàng ngày")

  /* validate tình huống tùy chỉnh — dùng chung cho AI sinh + AI điền nghĩa + lưu */
  const validateCustomSituation = (): boolean => {
    if (isCustomSituation && situationLabel.length === 0) {
      setError("Hãy nhập tình huống bạn muốn (VD: Đi phỏng vấn xin việc, Gọi xe công nghệ…).")
      return false
    }
    return true
  }

  /* ── helpers cho danh sách câu ── */
  const updateItem = (index: number, patch: Partial<PhraseItem>) => {
    if (tab === "manual") {
      setItems((prev) => {
        const next = [...prev]
        next[index] = { ...next[index], ...patch }
        return next
      })
    } else {
      setAiPreview((prev) => {
        if (!prev) return prev
        const next = [...prev]
        next[index] = { ...next[index], ...patch }
        return next
      })
    }
  }

  const removeItem = (index: number) => {
    if (tab === "manual") {
      setItems((prev) => {
        const next = prev.filter((_, i) => i !== index)
        return next.length > 0 ? next : [{ ...emptyItem }]
      })
    } else {
      setAiPreview((prev) => {
        if (!prev) return prev
        const next = prev.filter((_, i) => i !== index)
        return next.length > 0 ? next : [{ ...emptyItem }]
      })
    }
  }

  /* ── AI điền nghĩa tiếng Việt còn thiếu (tab thủ công) ── */
  const handleFillVi = async () => {
    if (!validateCustomSituation()) return
    const targets = items.filter((p) => p.en.trim().length > 0)
    if (targets.length === 0) {
      setError("Hãy nhập ít nhất 1 câu tiếng Anh trước khi nhờ AI điền nghĩa.")
      return
    }
    setFilling(true)
    setError(null)
    try {
      const filled = await aiFillPhrases(
        targets.map((p) => ({ en: p.en, vi: p.vi || undefined })),
        { situation: situationLabel, level }
      )
      const byEn = new Map(filled.map((p) => [p.en.toLowerCase(), p.vi]))
      setItems((prev) =>
        prev.map((p) => {
          const key = p.en.trim().toLowerCase()
          const aiVi = key ? byEn.get(key) : undefined
          return { ...p, vi: p.vi.trim() || aiVi || p.vi }
        })
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không điền được nghĩa. Vui lòng thử lại.")
    } finally {
      setFilling(false)
    }
  }

  /* ── AI sinh danh sách mẫu câu (tab AI) ── */
  const handleGenerate = async () => {
    if (!validateCustomSituation()) return
    setAiLoading(true)
    setError(null)
    setAiPreview(null)
    try {
      const phrases = await aiGeneratePhrases({
        situationId,
        situationLabel,
        prompt: aiPrompt,
        level,
        count: aiCount,
      })
      if (phrases.length === 0) {
        setError("AI chưa trả về mẫu câu nào. Vui lòng thử lại.")
        return
      }
      setAiPreview(phrases)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không sinh được mẫu câu. Vui lòng thử lại.")
    } finally {
      setAiLoading(false)
    }
  }

  /* ── Lưu bộ mẫu câu ── */
  const handleSave = async () => {
    if (!validateCustomSituation()) return
    if (!user) {
      setError("Bạn cần đăng nhập để lưu bộ mẫu câu.")
      return
    }
    const source = tab === "ai" ? aiPreview : items
    const validItems = (source ?? []).filter((p) => p.en.trim().length > 0)
    if (validItems.length === 0) {
      setError("Bộ mẫu câu cần ít nhất 1 câu tiếng Anh.")
      return
    }
    if (!name.trim()) {
      setError("Hãy đặt tên cho bộ mẫu câu.")
      return
    }

    setSaving(true)
    setError(null)
    try {
      const created = await createMyPhraseSet(user.uid, {
        name,
        vi,
        desc,
        situationId: isCustomSituation ? CUSTOM_SITUATION_ID : situationId,
        /* tình huống tự nhập → kèm nhãn để card + trang chi tiết hiển thị đúng */
        situationLabel: isCustomSituation ? situationLabel : undefined,
        level,
        accent,
        items: validItems,
        source: tab === "ai" ? "ai" : "manual",
      })
      onCreated(created)
      onClose()
      router.push(`/mau-cau/${created.slug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được bộ mẫu câu. Vui lòng thử lại.")
    } finally {
      setSaving(false)
    }
  }

  /* ── danh sách câu đang hiển thị theo tab ── */
  const listItems: PhraseItem[] = tab === "manual" ? items : (aiPreview ?? [])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl dark:border-slate-800 dark:bg-slate-900">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Tạo bộ mẫu câu mới
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Bộ mẫu câu thuộc về riêng bạn — lưu an toàn trong tài khoản
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1.5 px-5 pt-4 sm:px-6">
          <button
            type="button"
            onClick={() => {
              setTab("manual")
              setError(null)
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors",
              tab === "manual"
                ? "bg-green-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-500 hover:text-slate-800 dark:bg-slate-800 dark:text-slate-400"
            )}
          >
            <Languages className="h-3.5 w-3.5" />
            Tự nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("ai")
              setError(null)
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors",
              tab === "ai"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-500 hover:text-slate-800 dark:bg-slate-800 dark:text-slate-400"
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI tạo theo yêu cầu
          </button>
        </div>

        {error && (
          <p className="mx-5 mt-3 flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-600 sm:mx-6">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        {/* ── Body ── */}
        <div className="max-h-[62vh] space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          <section className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tên bộ mẫu câu *
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Tiếng Anh khi đi khám bệnh"
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tên tiếng Việt / mô tả ngắn
              </span>
              <input
                value={vi}
                onChange={(e) => setVi(e.target.value)}
                placeholder="VD: Khám bệnh và mua thuốc"
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Mô tả</span>
              <input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Mô tả ngắn về bộ mẫu câu này"
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tình huống</span>
              <select
                value={situationId}
                onChange={(e) => setSituationId(e.target.value)}
                className={`mt-1 ${inputClass}`}
              >
                {phraseSituations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
                <option value={CUSTOM_SITUATION}>Tình huống khác (tự nhập)…</option>
              </select>
              {isCustomSituation && (
                <input
                  value={customSituation}
                  onChange={(e) => setCustomSituation(e.target.value)}
                  placeholder="VD: Gọi xe công nghệ, Khám bệnh viện, Đi cà phê với bạn bè…"
                  className={`mt-2 ${inputClass}`}
                />
              )}
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Cấp độ</span>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as PhraseSet["level"])}
                className={`mt-1 ${inputClass}`}
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Màu nhấn</span>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {accents.map((a) => (
                  <button
                    key={a}
                    type="button"
                    aria-label={`Chọn màu ${a}`}
                    onClick={() => setAccent(a)}
                    className={cn(
                      "h-7 w-7 rounded-full transition-all",
                      a,
                      accent === a ? "ring-2 ring-slate-900 ring-offset-2 dark:ring-white dark:ring-offset-slate-900" : "opacity-70 hover:opacity-100"
                    )}
                  />
                ))}
              </div>
            </div>
          </section>

          {tab === "manual" ? (
            /* ── Tab thủ công: nhập câu + nút AI điền nghĩa ── */
            <section>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Danh sách mẫu câu ({items.filter((p) => p.en.trim()).length} câu)
                </span>
                <button
                  type="button"
                  onClick={handleFillVi}
                  disabled={filling}
                  className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 transition-colors hover:bg-purple-100 disabled:opacity-60 dark:bg-purple-950/50 dark:text-purple-300"
                >
                  {filling ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="h-3.5 w-3.5" />
                  )}
                  {filling ? "AI đang dịch…" : "AI điền nghĩa tiếng Việt"}
                </button>
              </div>

              <div className="mt-2 space-y-2">
                {items.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50/50 p-2.5 dark:border-slate-700 dark:bg-slate-800/60"
                  >
                    <div className="grid min-w-0 flex-1 gap-1.5">
                      <input
                        value={p.en}
                        onChange={(e) => updateItem(i, { en: e.target.value })}
                        placeholder="Mẫu câu tiếng Anh…"
                        className={inputClass}
                      />
                      <input
                        value={p.vi}
                        onChange={(e) => updateItem(i, { vi: e.target.value })}
                        placeholder="Nghĩa tiếng Việt (để trống để AI điền)…"
                        className={inputClass}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      aria-label="Xóa câu này"
                      className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setItems((prev) => [...prev, { ...emptyItem }])}
                  className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-4 py-2 text-xs font-bold text-slate-500 transition-colors hover:border-green-500 hover:text-green-600 dark:border-slate-600 dark:text-slate-400"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Thêm câu
                </button>
              </div>
            </section>
          ) : (
            /* ── Tab AI: yêu cầu + số lượng → xem trước danh sách câu ── */
            <section>
              <div className="flex items-start gap-3 rounded-2xl border border-purple-100 bg-purple-50 px-4 py-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white">
                  <Wand2 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-purple-700 dark:text-purple-300">
                    AI tự soạn mẫu câu cho bạn
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-purple-600 dark:text-purple-400">
                    Chọn số lượng, cấp độ và tình huống ở trên — AI sinh mẫu câu kèm nghĩa tiếng
                    Việt. Bạn xem trước, chỉnh sửa rồi lưu.
                  </p>
                </div>
              </div>

              <label className="mt-3 block">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Yêu cầu cho AI
                </span>
                <textarea
                  rows={2}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="VD: Các câu lịch sự khi đổi phòng ở khách sạn, ưu tiên câu ngắn dễ nhớ"
                  className={`mt-1 resize-none ${inputClass}`}
                />
              </label>

              <label className="mt-3 block">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Số lượng câu
                </span>
                <select
                  value={aiCount}
                  onChange={(e) => setAiCount(Number(e.target.value))}
                  className={`mt-1 ${inputClass}`}
                >
                  {AI_COUNT_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n} câu
                    </option>
                  ))}
                </select>
              </label>

              {aiLoading ? (
                <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-purple-100 bg-purple-50/60 py-8 text-sm font-semibold text-purple-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  AI đang soạn {aiCount} mẫu câu…
                </div>
              ) : aiPreview ? (
                <div className="mt-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Xem trước ({aiPreview.length} câu — bấm vào để sửa)
                    </span>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 transition-colors hover:bg-purple-100 dark:bg-purple-950/50 dark:text-purple-300"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Tạo lại
                    </button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {aiPreview.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 rounded-2xl border border-purple-100 bg-purple-50/40 p-2.5 dark:border-purple-900/60 dark:bg-purple-950/20"
                      >
                        <div className="grid min-w-0 flex-1 gap-1.5">
                          <input
                            value={p.en}
                            onChange={(e) => updateItem(i, { en: e.target.value })}
                            className={inputClass}
                          />
                          <input
                            value={p.vi}
                            onChange={(e) => updateItem(i, { vi: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(i)}
                          aria-label="Xóa câu này"
                          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-600/25 transition-all hover:bg-purple-700"
                >
                  <Sparkles className="h-4 w-4" />
                  Dùng AI soạn {aiCount} mẫu câu
                </button>
              )}
            </section>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:px-6 dark:border-slate-800">
          <p className="hidden text-xs text-slate-400 sm:block">
            {listItems.filter((p) => p.en.trim()).length} câu sẵn sàng
          </p>
          <div className="flex flex-1 gap-2 sm:flex-none">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200 sm:flex-none dark:bg-slate-800 dark:text-slate-300"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-green-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-green-600/25 transition-all hover:bg-green-700 disabled:opacity-60 sm:flex-none"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang lưu…
                </>
              ) : (
                "Lưu bộ mẫu câu"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

