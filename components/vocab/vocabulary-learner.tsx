"use client"

import { Fragment, useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  CheckCircle2,
  GraduationCap,
  Lightbulb,
  Loader2,
  LockOpen,
  Volume2,
  X,
} from "lucide-react"

import { aiVocabExample } from "@/lib/ai-vocab"
import type { VocabWord } from "@/lib/data/vocabulary"
import { speak } from "@/lib/speak"
import { getSavedVocabExample, saveVocabExample } from "@/lib/vocab-examples"
import { cn } from "@/lib/utils"

export type LearnerMode = "learn" | "review"

/** So sánh đáp án: bỏ khoảng trắng thừa, không phân biệt hoa/thường. */
function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
}

/** Số ký tự lộ ra ở mỗi mức gợi ý (mức 3 = lộ toàn bộ từ). */
function hintRevealCount(wordLength: number, level: number): number {
  if (level <= 0) return 0
  if (level === 1) return Math.max(1, Math.ceil(wordLength * 0.35))
  if (level === 2) return Math.max(2, Math.ceil(wordLength * 0.7))
  return wordLength
}

/** Chuỗi gợi ý: phần đã lộ + dấu • cho phần còn ẩn. */
function hintMask(word: string, revealedCount: number): string {
  const revealed = word.slice(0, revealedCount)
  const hidden = "•".repeat(Math.max(0, word.length - revealedCount))
  return revealed + hidden
}

/** Nhãn tiếng Việt cho từ loại — hiển thị thay vì ký hiệu viết tắt (n, v, adj...). */
const TYPE_LABELS: Record<VocabWord["type"], string> = {
  n: "Danh từ",
  v: "Động từ",
  adj: "Tính từ",
  adv: "Trạng từ",
  prep: "Giới từ",
  phr: "Cụm từ",
}

const CLOZE_BLANK = "_____"

/** Regex khớp từ cần học trong câu, kể cả dạng biến đổi cơ bản (số nhiều, quá khứ, V-ing...). */
function buildClozeRegex(word: string): RegExp | null {
  const escaped = word.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  if (!escaped) return null
  return new RegExp(`\\b${escaped}(?:s|es|ed|d|ing|'s)?\\b`, "gi")
}

/**
 * Che từ cần học trong câu ví dụ (dùng ở bước gõ lại từ).
 * Trả về các đoạn xen kẽ: đoạn văn bản + chỗ trống, hoặc null nếu từ không xuất hiện trong câu.
 */
function clozeSegments(sentence: string, word: string): string[] | null {
  const re = buildClozeRegex(word)
  if (!re) return null
  const masked = sentence.replace(re, CLOZE_BLANK)
  return masked === sentence ? null : masked.split(CLOZE_BLANK)
}

export function VocabularyLearner({
  word,
  mode,
  uid,
  onLearned,
  onWordDone,
  onBack,
}: {
  word: VocabWord
  mode: LearnerMode
  /** uid người dùng — có thì tải/lưu câu ví dụ vào Firestore, không có thì chỉ tạo tạm bằng AI */
  uid?: string | null
  onLearned: () => void
  onWordDone: () => void
  onBack: () => void
}) {
  const [phase, setPhase] = useState<"learn" | "dictate" | "done">(() =>
    mode === "review" ? "dictate" : "learn"
  )
  const [hintLevel, setHintLevel] = useState(0)
  const [userInput, setUserInput] = useState("")
  const [checked, setChecked] = useState(false)
  const [example, setExample] = useState<string | null>(null)
  const [exampleLoading, setExampleLoading] = useState(false)
  const [exampleAttempts, setExampleAttempts] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  /* Từ rỗng (dữ liệu lỗi) → hiển thị fallback thay vì crash ở các phase */
  const hasWord = (word.en ?? "").trim().length > 0

  /* Đổi từ / đổi chế độ → reset trạng thái.
     Chế độ ôn tập (review) vào thẳng kiểm tra chính tả, không xem trước. */
  useEffect(() => {
    setPhase(mode === "review" ? "dictate" : "learn")
    setHintLevel(0)
    setUserInput("")
    setChecked(false)
    setError(null)
  }, [word.en, word.vi, mode])

  /* Ví dụ AI tự tạo sẵn mỗi khi đổi từ, không cần người dùng bấm nút.
     Ưu tiên câu ví dụ đã lưu trong Firestore (users/{uid}/vocabExamples/{wordKey});
     chưa có mới gọi AI tạo mới rồi lưu lại — mỗi từ giữ đúng 1 câu ví dụ. */
  useEffect(() => {
    if (!hasWord) {
      setExample(null)
      setExampleLoading(false)
      setExampleAttempts(0)
      return
    }
    let cancelled = false
    setExample(null)
    setExampleAttempts(0)
    setError(null)
    setExampleLoading(true)
    ;(async () => {
      try {
        /* 1) Đã đăng nhập → thử câu ví dụ đã lưu trước, tiết kiệm quota AI */
        if (uid) {
          const saved = await getSavedVocabExample(uid, word.en)
          if (cancelled) return
          if (saved) {
            setExample(saved)
            return
          }
        }
        /* 2) Chưa có câu đã lưu → nhờ AI tạo mới */
        const sentence = await aiVocabExample({
          en: word.en,
          ipa: word.ipa,
          type: word.type,
          vi: word.vi,
        })
        if (cancelled) return
        if (sentence) {
          setExample(sentence)
          /* 3) Lưu lại để những lần sau mở từ là có ngay (fire-and-forget) */
          if (uid) void saveVocabExample(uid, word, sentence)
        } else {
          setError("Chưa tạo được câu ví dụ. Hãy bấm thử lại.")
        }
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Không tạo được câu ví dụ.")
      } finally {
        if (!cancelled) setExampleLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.en, word.vi, uid])

  /* Vào phase chính tả → focus ô nhập để gõ ngay */
  useEffect(() => {
    if (phase === "dictate") {
      const t = setTimeout(() => inputRef.current?.focus(), 60)
      return () => clearTimeout(t)
    }
  }, [phase, word.en])

  /* Từ rỗng (dữ liệu lỗi) → hiển thị fallback thay vì crash ở các phase */
  if (!hasWord) {
    return (
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-200/50">
        <p className="text-base font-bold text-slate-900">Từ này chưa có nội dung</p>
        <p className="mt-1 text-sm text-slate-500">Vui lòng quay lại và chọn từ khác để tiếp tục học.</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-6 inline-flex items-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm shadow-blue-600/25 transition-colors hover:bg-blue-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </button>
      </div>
    )
  }

  const loadExample = async () => {
    if (exampleLoading) return
    setExampleLoading(true)
    setError(null)
    try {
      const sentence = await aiVocabExample({
        en: word.en,
        ipa: word.ipa,
        type: word.type,
        vi: word.vi,
      })
      if (!sentence) throw new Error("AI chưa trả về câu ví dụ. Vui lòng thử lại.")
      setExample(sentence)
      setExampleAttempts(0)
      /* Tạo câu khác → ghi đè câu đã lưu (mỗi từ giữ đúng 1 câu ví dụ) */
      if (uid) void saveVocabExample(uid, word, sentence)
    } catch (err) {
      const nextAttempts = exampleAttempts + 1
      setExampleAttempts(nextAttempts)
      /* Thất bại nhiều lần liên tiếp → gợi ý học tiếp bằng nghĩa có sẵn thay vì kẹt ở nút thử lại */
      const message =
        nextAttempts >= 3
          ? "AI đang bận, bạn có thể học tiếp với nghĩa bên trên và thử lại sau."
          : err instanceof Error
            ? err.message
            : "Không tạo được câu ví dụ."
      setError(message)
    } finally {
      setExampleLoading(false)
    }
  }

  const handleConfirmLearned = () => {
    setHintLevel(0)
    setUserInput("")
    setChecked(false)
    setPhase("dictate")
  }

  const goBackToLearn = () => {
    setHintLevel(0)
    setUserInput("")
    setChecked(false)
    setPhase("learn")
  }

  const handleSubmitDictation = () => {
    if (checked || !userInput.trim()) return
    setChecked(true)
  }

  const isCorrect = checked && normalizeAnswer(userInput) === normalizeAnswer(word.en)

  const handleHint = () => {
    setHintLevel((prev) => Math.min(prev + 1, 3))
    setChecked(false)
    setTimeout(() => inputRef.current?.focus(), 60)
  }

  const handleDone = () => {
    if (!isCorrect) return
    onLearned()
    setPhase("done")
  }
  const revealedCount = hintRevealCount(word.en.length, hintLevel)
  const showFull = hintLevel >= 3
  /* Câu ví dụ đã che từ cần học — dùng ở bước gõ lại từ (null nếu từ không có trong câu) */
  const cloze = example ? clozeSegments(example, word.en) : null
  /* Bản đọc của câu ví dụ đã che từ: nối các đoạn quanh chỗ trống bằng dấu lặng,
     để nút Nghe câu ở bước ôn KHÔNG đọc ra từ cần tìm (tránh lộ đáp án). */
  const clozeSpeech = cloze ? cloze.join(" ... ") : null

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            if (phase === "dictate") goBackToLearn()
            else onBack()
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          {phase === "dictate" ? "Quay lại học" : "Quay lại"}
        </button>
        <span className="text-sm font-semibold text-slate-500">
          {phase === "learn" && (mode === "review" ? "Ôn tập – Học từ" : "Bước 1 – Học từ")}
          {phase === "dictate" && (mode === "review" ? "Ôn tập – Viết lại từ" : "Bước 2 – Viết lại từ")}
          {phase === "done" && "Hoàn thành"}
        </span>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
        {phase === "learn" && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5">
              <GraduationCap className="h-4 w-4 shrink-0 text-blue-600" />
              <p className="text-xs font-semibold text-blue-700">
                Xem từ → nghe phát âm → đọc câu ví dụ → xác nhận đã thuộc
              </p>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="text-3xl font-bold text-slate-900">{word.en}</h2>
                  {word.ipa ? (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-0.5 text-sm font-bold text-slate-600">
                      {word.ipa}
                    </span>
                  ) : null}
                  <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-bold text-blue-700">
                    {TYPE_LABELS[word.type] ?? word.type}
                  </span>
                </div>
                <p className="mt-2 text-base text-slate-600">{word.vi}</p>
              </div>
              <button
                type="button"
                onClick={() => speak(word.en, "en-US")}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100"
                aria-label={"Nghe phát âm " + word.en}
              >
                <Volume2 className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={loadExample}
                disabled={exampleLoading}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                  exampleLoading
                    ? "cursor-wait bg-slate-100 text-slate-400"
                    : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                )}
              >
                {exampleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <AudioLines className="h-4 w-4" />
                )}
                {exampleLoading ? "Đang tạo..." : example ? "Tạo câu ví dụ khác" : "AI tạo câu ví dụ"}
              </button>
              {error ? <p className="text-sm text-red-500">{error}</p> : null}
            </div>
            {example ? (
              <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">Câu ví dụ</p>
                <p className="mt-1 text-base font-medium text-slate-900">“{example}”</p>
                <button
                  type="button"
                  onClick={() => speak(example, "en-US")}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-purple-600 transition-colors hover:bg-purple-50"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  Nghe câu
                </button>
              </div>
            ) : null}
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-sm leading-relaxed text-amber-800">
                <span className="font-bold">Mẹo nhớ lâu:</span> đọc to từ và câu ví dụ 2–3 lần,
                tự đặt 1 tình huống với từ này, rồi gõ lại từ ở bước kiểm tra bên dưới.
              </p>
            </div>
            <button
              type="button"
              onClick={handleConfirmLearned}
              className="inline-flex w-full items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white shadow-sm shadow-green-600/25 transition-colors hover:bg-green-700"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Xác nhận đã thuộc – Bắt đầu kiểm tra
            </button>
          </div>
        )}

        {phase === "dictate" && (
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Viết lại từ tiếng Anh. Nếu sai, nhấn Gợi ý để lộ dần từ.
            </p>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Nghĩa tiếng Việt:</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{word.vi}</p>
              {/* Ẩn phiên âm ở bước viết lại từ — nhìn IPA là đoán ra từ cần tìm */}
            </div>
            {exampleLoading ? (
              <div className="flex items-center gap-2 rounded-2xl border border-purple-100 bg-purple-50/60 p-4 text-sm font-medium text-purple-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang chuẩn bị câu ví dụ điền từ...
              </div>
            ) : example && cloze ? (
              <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                  Điền từ vào chỗ trống
                </p>
                <p className="mt-1 text-base leading-relaxed text-slate-900">
                  {cloze.map((seg, i) => (
                    <Fragment key={i}>
                      {seg}
                      {i < cloze.length - 1 ? (
                        <span
                          aria-label="Chỗ trống cần điền từ"
                          className="mx-1 inline-block min-w-[6rem] border-b-2 border-dashed border-purple-400 align-baseline"
                        >
                          {"\u00A0"}
                        </span>
                      ) : null}
                    </Fragment>
                  ))}
                </p>
                {clozeSpeech ? (
                  <button
                    type="button"
                    onClick={() => speak(clozeSpeech, "en-US")}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-purple-600 transition-colors hover:bg-purple-50"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    Nghe câu
                  </button>
                ) : null}
              </div>
            ) : example && !cloze ? (
              /* Câu ví dụ có nhưng KHÔNG chứa từ cần tìm → không hiện nguyên văn để tránh lộ đáp án */
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Câu ví dụ này không dùng trực tiếp từ cần tìm nên tạm ẩn để không lộ đáp án. Bạn có
                thể tạo câu khác ở bước học.
              </div>
            ) : null}
            <div
              className={cn(
                "rounded-2xl border p-4",
                hintLevel > 0 ? "border-orange-200 bg-orange-50" : "border-slate-200 bg-white"
              )}
            >
              <p
                className={cn(
                  "text-xs font-semibold uppercase tracking-wide",
                  hintLevel > 0 ? "text-orange-600" : "text-slate-500"
                )}
              >
                {hintLevel > 0 ? `Gợi ý mức ${hintLevel}/3` : "Từ cần tìm"}
              </p>
              <p className="mt-1 font-mono text-xl font-bold tracking-widest text-slate-900">
                {showFull ? word.en : hintMask(word.en, revealedCount)}
              </p>
            </div>
            <div>
              <label htmlFor="dictation-input" className="text-sm font-semibold text-slate-600">
                Viết từ:
              </label>
              <input
                id="dictation-input"
                ref={inputRef}
                type="text"
                value={userInput}
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => {
                  setUserInput(e.target.value)
                  if (checked) setChecked(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmitDictation()
                }}
                disabled={showFull}
                placeholder={showFull ? word.en : "Gõ từ tiếng Anh..."}
                className={cn(
                  "mt-2 w-full rounded-xl border-2 px-4 py-3 text-lg font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-300 focus:outline-none",
                  checked && isCorrect && "border-green-400 bg-green-50",
                  checked && !isCorrect && "border-red-300 bg-red-50",
                  !checked && "border-slate-200 focus:border-orange-500"
                )}
              />
            </div>
            

            <div className="flex flex-wrap gap-3">
              {!checked ? (
                <button
                  type="button"
                  onClick={handleSubmitDictation}
                  disabled={!userInput.trim()}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-40"
                >
                  Kiểm tra
                </button>
              ) : null}
              {checked && isCorrect ? (
                <button
                  type="button"
                  onClick={handleDone}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white shadow-sm shadow-green-600/25 transition-colors hover:bg-green-700"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Đúng rồi - Từ tiếp theo
                </button>
              ) : null}
              {(!checked || !isCorrect) && hintLevel < 3 ? (
                <button
                  type="button"
                  onClick={handleHint}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-amber-600"
                >
                  <Lightbulb className="mr-2 h-4 w-4" />
                  {hintLevel === 0 && "Gợi ý 1 (lộ một số ký tự)"}
                  {hintLevel === 1 && "Gợi ý 2 (lộ thêm)"}
                  {hintLevel === 2 && "Gợi ý 3 (hiện toàn bộ)"}
                </button>
              ) : null}
            </div>
            {checked && !isCorrect ? (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
                <p className="flex items-center gap-2 font-bold">
                  <X className="h-5 w-5 shrink-0 text-red-500" />
                  Chưa đúng.
                </p>
                {hintLevel < 3 ? (
                  <p className="mt-1">Nhấn Gợi ý để lộ dần từ hoặc quay lại học.</p>
                ) : (
                  <p className="mt-1 font-semibold">
                    Đáp án đúng: <span className="text-slate-900">{word.en}</span>
                  </p>
                )}
              </div>
            ) : null}
            {checked && isCorrect ? (
              <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
                <p className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                  Chính xác!
                </p>
                <p className="mt-1">
                  {mode === "learn"
                    ? "Từ này đã được ghi nhận là đã học."
                    : "Ôn tập thành công — giữ vững phong độ nhé."}
                </p>
              </div>
            ) : null}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={goBackToLearn}
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                <LockOpen className="mr-2 h-4 w-4" />
                Học lại từ này
              </button>
            </div>
          </div>
        )}

        {phase === "done" && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">
              Từ “{word.en}” đã hoàn thành
            </h3>
            <p className="mt-1 text-sm text-slate-500">Từ này đã được ghi nhận là đã học.</p>
            <button
              type="button"
              onClick={onWordDone}
              className="mt-6 inline-flex items-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm shadow-blue-600/25 transition-colors hover:bg-blue-700"
            >
              Từ tiếp theo
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

