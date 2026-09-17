"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Tag,
  Wand2,
  X,
} from "lucide-react"

import { useAuth } from "@/lib/auth-context"
import {
  customTopicColorKeys,
  customTopicColors,
  isBuiltInVocabTopic,
  vocabLevelLabels,
  vocabLevels,
  vocabTopics,
  type CustomTopicColor,
  type VocabLevel,
  type VocabSet,
  type VocabTopic,
  type VocabWord,
} from "@/lib/data/vocabulary"
import { createMyVocabSet, makeCustomTopicId } from "@/lib/user-vocab"
import { getSetIcon, setIconOptions } from "@/lib/data/set-icons"
import { cn } from "@/lib/utils"

import { VocabWordEditor, emptyWord } from "./vocab-word-editor"

/** Màu thanh tiến độ cho bộ từ mới */
const accents = [
  "bg-blue-600",
  "bg-teal-600",
  "bg-orange-500",
  "bg-purple-600",
  "bg-green-600",
  "bg-pink-500",
  "bg-sky-500",
  "bg-indigo-600",
  "bg-rose-500",
]

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-800"

type Tab = "manual" | "ai"
/** chọn chủ đề có sẵn hay tự tạo chủ đề mới */
type TopicMode = "existing" | "new"

/** số chủ đề hiển thị mỗi trang trong phần chọn chủ đề */
const TOPICS_PER_PAGE = 9

type CreateVocabSetModalProps = {
  onClose: () => void
  /** gọi sau khi lưu thành công để danh sách bộ từ được làm mới */
  onCreated: (set: VocabSet) => void
  /** chủ đề riêng user đã tạo trước đó (để chọn lại, không phải gõ lại) */
  customTopics?: VocabTopic[]
}

export function CreateVocabSetModal({
  onClose,
  onCreated,
  customTopics = [],
}: CreateVocabSetModalProps) {
  const router = useRouter()
  const { user } = useAuth()

  const [tab, setTab] = useState<Tab>("manual")
  const [name, setName] = useState("")
  const [vi, setVi] = useState("")
  const [desc, setDesc] = useState("")
  const [topicId, setTopicId] = useState(vocabTopics[0].id)
  const [topicMode, setTopicMode] = useState<TopicMode>("existing")
  const [topicPage, setTopicPage] = useState(1)
  const [newTopicLabel, setNewTopicLabel] = useState("")
  const [newTopicColor, setNewTopicColor] = useState<CustomTopicColor>("blue")
  const [level, setLevel] = useState<VocabLevel>("A1")
  const [accent, setAccent] = useState(accents[0])
  const [setIcon, setSetIcon] = useState<string | undefined>(undefined)
  const [pickingIcon, setPickingIcon] = useState(false)
  const [words, setWords] = useState<VocabWord[]>([{ ...emptyWord }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedSet, setSavedSet] = useState<VocabSet | null>(null)

  const nameRef = useRef<HTMLInputElement>(null)

  /* Danh sách chủ đề để chọn: có sẵn + chủ đề riêng user đã tạo */
  const allTopics: VocabTopic[] = [...vocabTopics, ...customTopics]
  const topicTotalPages = Math.max(1, Math.ceil(allTopics.length / TOPICS_PER_PAGE))
  const topicPageSafe = Math.min(topicPage, topicTotalPages)
  const topicPageItems = allTopics.slice(
    (topicPageSafe - 1) * TOPICS_PER_PAGE,
    topicPageSafe * TOPICS_PER_PAGE
  )

  const switchTopicMode = (mode: TopicMode) => {
    setTopicMode(mode)
    setTopicPage(1)
    setError(null)
  }

  /* Đóng khi bấm Esc + khóa scroll nền */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [onClose])

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  const filledWords = words.filter((w) => w.en.trim().length > 0)
  const CurrentSetIcon = getSetIcon(setIcon)

  const updateWord = (i: number, next: VocabWord) =>
    setWords((prev) => prev.map((w, idx) => (idx === i ? next : w)))

  const removeWord = (i: number) =>
    setWords((prev) => prev.filter((_, idx) => idx !== i))

  const addWord = () => setWords((prev) => [...prev, { ...emptyWord }])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!user) {
      setError("Bạn cần đăng nhập để lưu bộ từ vựng cá nhân.")
      return
    }
    if (!name.trim()) {
      setError("Vui lòng nhập tên bộ từ.")
      nameRef.current?.focus()
      return
    }
    if (filledWords.length === 0) {
      setError("Vui lòng thêm ít nhất 1 từ vựng có tiếng Anh.")
      return
    }
    if (filledWords.some((w) => !w.vi.trim())) {
      setError("Vui lòng nhập nghĩa tiếng Việt cho tất cả các từ.")
      return
    }

    /* Chủ đề: có sẵn, chủ đề riêng đã tạo trước đó, hoặc chủ đề mới hoàn toàn */
    const selectedTopic = allTopics.find((t) => t.id === topicId)
    let topicField: { topicId: string; topicLabel?: string; topicColor?: CustomTopicColor }

    if (topicMode === "new") {
      if (!newTopicLabel.trim()) {
        setError("Vui lòng nhập tên chủ đề mới.")
        return
      }
      topicField = {
        topicId: makeCustomTopicId(newTopicLabel),
        topicLabel: newTopicLabel,
        topicColor: newTopicColor,
      }
    } else if (selectedTopic && !isBuiltInVocabTopic(selectedTopic.id)) {
      topicField = {
        topicId: selectedTopic.id,
        topicLabel: selectedTopic.label,
        topicColor: selectedTopic.customColor ?? "blue",
      }
    } else {
      topicField = { topicId }
    }

    setSaving(true)
    try {
      const created = await createMyVocabSet(user.uid, {
        name,
        vi,
        desc,
        ...topicField,
        level,
        accent,
        icon: setIcon,
        words: filledWords,
        source: "manual",
      })
      setSavedSet(created)
      onCreated(created)
    } catch (err) {
      console.error("[create-vocab-set] Lỗi khi lưu bộ từ:", err)
      setError("Không lưu được bộ từ. Vui lòng kiểm tra kết nối và thử lại.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 py-8 backdrop-blur-[2px] sm:py-12">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tạo bộ từ vựng"
        className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm shadow-blue-600/25">
            <Pencil className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-slate-900">Tạo bộ từ vựng</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Bộ từ này là của riêng bạn — chỉ tài khoản của bạn nhìn thấy và sử dụng được.
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
          /* ── Lưu thành công ─────────────────────────────────────── */
          <div className="px-5 py-8 text-center sm:px-6">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <p className="mt-4 text-lg font-bold text-slate-900">Đã lưu bộ từ vựng!</p>
            <p className="mt-1 text-sm text-slate-500">
              “{savedSet.name}” với {savedSet.total} từ đã được thêm vào bộ từ của bạn.
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
                  router.push(`/tu-vung/${savedSet.slug}`)
                }}
                className="group inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700"
              >
                Xem bộ từ
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs: thủ công / AI */}
            <div className="flex items-center gap-2 px-5 pt-4 sm:px-6">
              <button
                type="button"
                onClick={() => setTab("manual")}
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
                onClick={() => setTab("ai")}
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
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  Sắp ra mắt
                </span>
              </button>
            </div>

            {tab === "manual" ? (
              <form id="create-vocab-form" onSubmit={handleSubmit}>
                <div className="max-h-[70vh] space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                  {error && (
                    <p className="flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-600">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      {error}
                    </p>
                  )}

                  {/* Thông tin bộ từ */}
                  <section className="grid gap-3 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <span className="text-xs font-bold text-slate-700">Tên bộ từ *</span>
                      <input
                        ref={nameRef}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="VD: Từ vựng phỏng vấn xin việc"
                        className={`mt-1 ${inputClass}`}
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold text-slate-700">Mô tả ngắn</span>
                      <input
                        value={vi}
                        onChange={(e) => setVi(e.target.value)}
                        placeholder="VD: Từ vựng dùng khi đi phỏng vấn"
                        className={`mt-1 ${inputClass}`}
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold text-slate-700">Giới thiệu</span>
                      <input
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        placeholder="VD: Gồm các từ hay gặp ở vòng phỏng vấn HR"
                        className={`mt-1 ${inputClass}`}
                      />
                    </label>
                  </section>

                  {/* Chủ đề: có sẵn hoặc tự tạo mới */}
                  <section>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-700">Chủ đề</p>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => switchTopicMode("existing")}
                          aria-pressed={topicMode === "existing"}
                          className={cn(
                            "rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors",
                            topicMode === "existing"
                              ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                              : "border-slate-200 bg-white text-slate-500 hover:text-slate-800"
                          )}
                        >
                          Chủ đề có sẵn
                        </button>
                        <button
                          type="button"
                          onClick={() => switchTopicMode("new")}
                          aria-pressed={topicMode === "new"}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors",
                            topicMode === "new"
                              ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                              : "border-slate-200 bg-white text-slate-500 hover:text-slate-800"
                          )}
                        >
                          <Plus className="h-3 w-3" />
                          Tạo chủ đề mới
                        </button>
                      </div>
                    </div>

                    {topicMode === "existing" ? (
                      <>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {topicPageItems.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setTopicId(t.id)}
                              aria-pressed={topicId === t.id}
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                                topicId === t.id
                                  ? `${t.chipClass} border-current shadow-sm`
                                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800"
                              )}
                            >
                              {!isBuiltInVocabTopic(t.id) && <Tag className="h-3 w-3" />}
                              {t.label}
                            </button>
                          ))}
                        </div>

                        {/* 9 chủ đề mỗi trang */}
                        {topicTotalPages > 1 && (
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setTopicPage(topicPageSafe - 1)}
                              disabled={topicPageSafe <= 1}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:text-blue-600 disabled:pointer-events-none disabled:opacity-40"
                            >
                              <ChevronLeft className="h-3 w-3" />
                              Trước
                            </button>
                            <span className="text-[11px] font-semibold text-slate-500">
                              Trang {topicPageSafe}/{topicTotalPages} · {allTopics.length} chủ đề
                            </span>
                            <button
                              type="button"
                              onClick={() => setTopicPage(topicPageSafe + 1)}
                              disabled={topicPageSafe >= topicTotalPages}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:text-blue-600 disabled:pointer-events-none disabled:opacity-40"
                            >
                              Sau
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="mt-2 space-y-3">
                        <input
                          value={newTopicLabel}
                          onChange={(e) => setNewTopicLabel(e.target.value)}
                          placeholder="VD: Phỏng vấn xin việc"
                          aria-label="Tên chủ đề mới"
                          className={inputClass}
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-500">
                            Màu chủ đề:
                          </span>
                          {customTopicColorKeys.map((key) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setNewTopicColor(key)}
                              aria-label={`Chọn màu ${customTopicColors[key].label}`}
                              aria-pressed={newTopicColor === key}
                              title={customTopicColors[key].label}
                              className={cn(
                                "h-6 w-6 rounded-full transition-all",
                                customTopicColors[key].iconClass,
                                newTopicColor === key
                                  ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900"
                                  : "opacity-70 hover:opacity-100"
                              )}
                            />
                          ))}
                          {newTopicLabel.trim() && (
                            <span
                              className={cn(
                                "ml-1 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold",
                                customTopicColors[newTopicColor].chipClass
                              )}
                            >
                              <Tag className="h-3 w-3" />
                              {newTopicLabel.trim()}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Cấp độ + màu */}
                  <section className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold text-slate-700">Cấp độ (CEFR)</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {vocabLevels.map((l) => (
                          <button
                            key={l}
                            type="button"
                            onClick={() => setLevel(l)}
                            title={vocabLevelLabels[l]}
                            aria-pressed={level === l}
                            className={cn(
                              "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                              level === l
                                ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800"
                            )}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 text-[11px] text-slate-400">
                        {vocabLevelLabels[level]}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">Màu thanh tiến độ</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {accents.map((a) => (
                          <button
                            key={a}
                            type="button"
                            onClick={() => setAccent(a)}
                            aria-label={`Chọn màu ${a}`}
                            aria-pressed={accent === a}
                            className={cn(
                              "h-7 w-7 rounded-full transition-all",
                              a,
                              accent === a
                                ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900"
                                : "opacity-70 hover:opacity-100"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* Icon của bộ từ — 1 icon cho cả bộ, không phải cho từng từ */}
                  <section>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-700">Icon của bộ từ</p>
                      {setIcon && (
                        <button
                          type="button"
                          onClick={() => {
                            setSetIcon(undefined)
                            setPickingIcon(false)
                          }}
                          className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-500"
                        >
                          Bỏ icon
                        </button>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPickingIcon((v) => !v)}
                        aria-label="Chọn icon cho bộ từ"
                        aria-pressed={pickingIcon}
                        title={CurrentSetIcon ? "Đổi icon" : "Chọn icon"}
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors",
                          CurrentSetIcon
                            ? "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-900 dark:bg-blue-950/40"
                            : "border-slate-200 bg-slate-50/50 text-slate-400 hover:border-slate-300 hover:text-slate-600 dark:border-slate-700 dark:bg-slate-800/60"
                        )}
                      >
                        {CurrentSetIcon ? (
                          <CurrentSetIcon className="h-5 w-5" />
                        ) : (
                          <ImagePlus className="h-4.5 w-4.5" />
                        )}
                      </button>
                      <p className="text-[11px] text-slate-400">
                        Icon hiển thị ở danh sách bộ từ và đầu trang chi tiết.
                      </p>
                    </div>

                    {pickingIcon && (
                      <div className="mt-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-2.5 dark:border-slate-700 dark:bg-slate-800/60">
                        <div className="flex flex-wrap gap-1.5">
                          {setIconOptions.map((opt) => {
                            const OptIcon = opt.icon
                            const active = setIcon === opt.key
                            return (
                              <button
                                key={opt.key}
                                type="button"
                                onClick={() => {
                                  setSetIcon(opt.key)
                                  setPickingIcon(false)
                                }}
                                title={opt.label}
                                aria-label={`Icon ${opt.label}`}
                                aria-pressed={active}
                                className={cn(
                                  "flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
                                  active
                                    ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950/40"
                                    : "border-transparent bg-white text-slate-500 hover:border-slate-200 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                )}
                              >
                                <OptIcon className="h-4.5 w-4.5" />
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </section>

{/* Danh sách từ vựng */}
                  <section>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-700">
                        Danh sách từ vựng
                        <span className="ml-1.5 font-medium text-slate-400">
                          ({filledWords.length} từ)
                        </span>
                      </p>
                      <button
                        type="button"
                        onClick={addWord}
                        className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Thêm từ
                      </button>
                    </div>

                    <ul className="mt-2 space-y-2">
                      {words.map((w, i) => (
                        <VocabWordEditor
                          key={i}
                          word={w}
                          index={i}
                          onChange={(next) => updateWord(i, next)}
                          onRemove={() => removeWord(i)}
                          canRemove={words.length > 1}
                        />
                      ))}
                    </ul>

                    <p className="mt-2 text-[11px] text-slate-400">
                      Trang chi tiết hiển thị toàn bộ từ trong bộ, bạn có thể thêm bao nhiêu từ cũng
                      được.
                    </p>
                  </section>
                </div>
              </form>
            ) : (
              /* ── Tab AI: giao diện xem trước, tính năng sẽ bổ sung sau ── */
              <div className="max-h-[70vh] space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                <div className="flex items-start gap-3 rounded-2xl border border-purple-100 bg-purple-50 px-4 py-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white">
                    <Wand2 className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-purple-700">
                      Tạo bộ từ bằng AI đang được hoàn thiện
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-purple-600">
                      Sắp tới bạn chỉ cần mô tả chủ đề, AI sẽ tự sinh danh sách từ kèm phiên âm và
                      nghĩa tiếng Việt, rồi lưu vào bộ từ cá nhân của bạn.
                    </p>
                  </div>
                </div>

                <section className="grid gap-3 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-bold text-slate-700">Chủ đề / yêu cầu</span>
                    <input
                      disabled
                      placeholder="VD: Từ vựng tiếng Anh về phỏng vấn xin việc cho người mới"
                      className={`mt-1 cursor-not-allowed opacity-60 ${inputClass}`}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-700">Số lượng từ</span>
                    <select disabled className={`mt-1 cursor-not-allowed opacity-60 ${inputClass}`}>
                      <option>10 từ</option>
                      <option>15 từ</option>
                      <option>20 từ</option>
                      <option>30 từ</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-700">Chủ đề (topic)</span>
                    <select disabled className={`mt-1 cursor-not-allowed opacity-60 ${inputClass}`}>
                      {vocabTopics.map((t) => (
                        <option key={t.id}>{t.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-bold text-slate-700">Ghi chú thêm</span>
                    <textarea
                      rows={3}
                      disabled
                      placeholder="VD: ưu tiên từ vựng thông dụng, có ví dụ đặt câu"
                      className={`mt-1 resize-none cursor-not-allowed opacity-60 ${inputClass}`}
                    />
                  </label>
                </section>

                <p className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Lock className="h-3.5 w-3.5" />
                  Các ô nhập trên sẽ được mở khi tính năng AI ra mắt. Hiện tại bạn có thể tạo bộ từ
                  thủ công ở tab bên cạnh.
                </p>
              </div>
            )}


            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 dark:bg-slate-800/60 sm:px-6">
              <p className="text-xs text-slate-500">
                Bộ từ được lưu riêng cho tài khoản của bạn.
              </p>
              {tab === "manual" ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    form="create-vocab-form"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang lưu…
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Lưu bộ từ
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Tính năng AI sẽ ra mắt sau"
                  className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full bg-purple-600/50 px-5 py-2.5 text-sm font-semibold text-white/90"
                >
                  <Sparkles className="h-4 w-4" />
                  Tạo bằng AI — Sắp ra mắt
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

