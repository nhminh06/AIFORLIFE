"use client"

import { useEffect, useState } from "react"
import {
  CheckCircle2,
  Clock3,
  ListOrdered,
  Loader2,
  Play,
  RotateCcw,
  Sparkles,
  Trash2,
  WandSparkles,
  X,
} from "lucide-react"

import { QuizRunner } from "@/components/practice/quiz-runner"
import { useAuth } from "@/lib/auth-context"
import type { GrammarTopic } from "@/lib/data/grammar"
import type { Exercise, PracticeResult } from "@/lib/data/practice"
import {
  completeGrammarPractice,
  deleteGrammarPractice,
  loadGrammarPractice,
  saveGrammarPractice,
} from "@/lib/grammar-practice-service"

export function GrammarAiPractice({ topic }: { topic: GrammarTopic }) {
  const { user } = useAuth()

  const [questionCount, setQuestionCount] = useState(5)
  const [difficulty, setDifficulty] = useState("Cơ bản")
  const [savedExercise, setSavedExercise] = useState<Exercise | null>(null)
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null)
  const [loadingSaved, setLoadingSaved] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  // Tải bài tập đã lưu cho chủ điểm này (từ local/cloud)
  useEffect(() => {
    let cancelled = false
    setLoadingSaved(true)

    loadGrammarPractice(topic, user?.uid)
      .then((ex) => {
        if (!cancelled) {
          setSavedExercise(ex)
        }
      })
      .catch((err) => {
        console.warn("[GrammarAiPractice] Không tải được bài tập đã lưu:", err)
      })
      .finally(() => {
        if (!cancelled) setLoadingSaved(false)
      })

    return () => {
      cancelled = true
    }
  }, [topic, user?.uid])

  // Lắng nghe sự kiện lưu bài tập từ tab khác hoặc subcomponent
  useEffect(() => {
    const handleSavedEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ slug: string; exercise: Exercise | null }>).detail
      if (detail && detail.slug === topic.slug) {
        setSavedExercise(detail.exercise)
      }
    }
    window.addEventListener("afl-grammar-exercise-saved", handleSavedEvent)
    return () => window.removeEventListener("afl-grammar-exercise-saved", handleSavedEvent)
  }, [topic.slug])

  // Tạo bài tập mới bằng AI và tự động lưu
  const handleCreatePractice = async () => {
    if (creating) return
    setCreating(true)
    setError("")
    setSuccessMsg("")

    try {
      const response = await fetch("/api/ai/grammar/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.name,
          vietnameseTopic: topic.vi,
          level: topic.level,
          intro: topic.intro,
          formulas: topic.formulas
            .map((formula) => `${formula.use}: ${formula.structure} Ví dụ: ${formula.example}`)
            .join("; "),
          usage: topic.usage.join("; "),
          examples: topic.examples.map((example) => `${example.en} - ${example.vi}`).join("; "),
          questionCount,
          difficulty,
        }),
      })

      const data = (await response.json()) as { exercise?: Exercise; error?: string }
      if (!response.ok || !data.exercise) {
        throw new Error(data.error || "Không tạo được bài luyện tập.")
      }

      // Lưu ngay vào hệ thống (Local & Cloud nếu đã đăng nhập)
      const saved = await saveGrammarPractice(topic.slug, data.exercise, user?.uid)
      setSavedExercise(saved)
      setActiveExercise(saved)
      setShowCreateForm(false)
      setSuccessMsg("Đã tạo và lưu bài tập mới vào hệ thống!")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được bài luyện tập. Vui lòng thử lại.")
    } finally {
      setCreating(false)
    }
  }

  // Lưu kết quả khi hoàn thành bài quiz
  const handleCompleted = async (result: PracticeResult) => {
    if (!activeExercise) return

    try {
      const updated = await completeGrammarPractice(topic, activeExercise, result, user?.uid)
      setSavedExercise(updated)
      setActiveExercise(updated)
      setSuccessMsg(
        `Đã lưu kết quả thành công: Đúng ${result.score}/${result.total} câu (${Math.round((result.score / result.total) * 100)}%)!`
      )
    } catch (err) {
      console.error("[GrammarAiPractice] Lỗi khi lưu kết quả bài tập:", err)
      setError("Không thể lưu kết quả lên hệ thống. Vui lòng thử lại.")
    }
  }

  // Xóa bài tập đã lưu
  const handleDeleteExercise = async () => {
    if (!savedExercise) return
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài tập đã lưu của chủ điểm này?")) return

    try {
      await deleteGrammarPractice(topic.slug, savedExercise.id, user?.uid)
      setSavedExercise(null)
      setActiveExercise(null)
      setShowCreateForm(true)
      setSuccessMsg("Đã xóa bài tập đã lưu.")
    } catch (err) {
      console.error("[GrammarAiPractice] Lỗi khi xóa bài tập:", err)
      setError("Không xóa được bài tập. Vui lòng thử lại.")
    }
  }

  return (
    <section className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 shadow-sm shadow-orange-100/70 dark:border-orange-900/60 dark:from-orange-950/30 dark:via-slate-900 dark:to-amber-950/20 dark:shadow-none sm:p-7">
      {/* Header section */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/25">
            <WandSparkles className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Luyện tập & Thực hành</h2>
              {savedExercise && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" />
                  Đã có bài tập lưu
                </span>
              )}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Bài tập được lưu lại tự động để bạn có thể ôn tập bất cứ lúc nào và tính điểm vào tiến độ học.
            </p>
          </div>
        </div>

        {/* Nút thao tác nhanh khi đã có bài lưu */}
        {savedExercise && !activeExercise && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-white px-3.5 py-2 text-xs font-semibold text-orange-700 shadow-sm transition hover:bg-orange-50 dark:border-orange-900/60 dark:bg-slate-800 dark:text-orange-300 dark:hover:bg-slate-700"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {showCreateForm ? "Ẩn tạo bài mới" : "Tạo bài mới với AI"}
            </button>
            <button
              type="button"
              onClick={handleDeleteExercise}
              title="Xóa bài tập này"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-500 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Thông báo phản hồi */}
      {successMsg && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg("")}
            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-red-50 px-4 py-3 text-xs font-medium text-red-700 dark:bg-red-950/50 dark:text-red-300">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="text-red-600 hover:text-red-800">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Trạng thái đang tải ban đầu */}
      {loadingSaved && !savedExercise && !activeExercise && (
        <div className="mt-6 flex items-center justify-center gap-2 py-8 text-sm font-medium text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
          <span>Đang kiểm tra bài tập đã lưu...</span>
        </div>
      )}

      {/* KHỐI 1: THẺ BÀI TẬP ĐÃ LƯU (Hiển thị khi chưa bấm làm bài) */}
      {savedExercise && !activeExercise && (
        <div className="mt-5 rounded-2xl border border-orange-200/90 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-800/80">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white sm:text-base">
                  {savedExercise.name}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    savedExercise.status === "Hoàn thành"
                      ? "bg-green-100 text-green-700 dark:bg-green-950/70 dark:text-green-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300"
                  }`}
                >
                  {savedExercise.status === "Hoàn thành" ? "Đã hoàn thành" : "Chưa làm"}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <ListOrdered className="h-3.5 w-3.5" />
                  {savedExercise.items.length} câu hỏi
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-3.5 w-3.5" />
                  Khoảng {savedExercise.minutes} phút
                </span>
                {savedExercise.bestScore && (
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Điểm cao nhất: {savedExercise.bestScore}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveExercise(savedExercise)
                  setShowCreateForm(false)
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/25 transition hover:bg-orange-600"
              >
                {savedExercise.status === "Hoàn thành" ? (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    Làm lại bài này
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Làm bài ngay
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KHỐI 2: FORM TẠO BÀI TẬP BẰNG AI (Hiển thị nếu chưa có bài hoặc người dùng bấm "Tạo bài mới") */}
      {(!savedExercise || showCreateForm) && !activeExercise && (
        <div className="mt-5 rounded-2xl border border-dashed border-orange-300/80 bg-orange-50/50 p-5 dark:border-orange-900/60 dark:bg-slate-800/40">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {savedExercise ? "Tạo bộ câu hỏi mới với AI (Ghi đè bài cũ)" : "Tạo bài tập cho chủ điểm này"}
            </h3>
            {savedExercise && (
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Hủy bỏ
              </button>
            )}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Số câu
              <select
                value={questionCount}
                onChange={(event) => setQuestionCount(Number(event.target.value))}
                className="mt-1.5 w-full rounded-xl border border-orange-200 bg-white px-3 py-3 text-sm font-medium text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value={5}>5 câu</option>
                <option value={8}>8 câu</option>
                <option value={10}>10 câu</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Độ khó
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-orange-200 bg-white px-3 py-3 text-sm font-medium text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option>Cơ bản</option>
                <option>Trung cấp</option>
                <option>Nâng cao</option>
              </select>
            </label>
            <button
              type="button"
              onClick={handleCreatePractice}
              disabled={creating}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50 sm:self-end"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {creating ? "Đang tạo & lưu..." : "Tạo bài tập"}
            </button>
          </div>
        </div>
      )}

      {/* KHỐI 3: GIAO DIỆN LÀM BÀI QUIZ (QuizRunner) */}
      {activeExercise && (
        <div className="mt-6 border-t border-orange-200 pt-6 dark:border-orange-900/60">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-orange-100/60 px-4 py-2.5 text-xs font-semibold text-orange-900 dark:bg-orange-950/40 dark:text-orange-200">
            <span>Đang làm bài: {activeExercise.name}</span>
            <button
              type="button"
              onClick={() => setActiveExercise(null)}
              className="rounded-lg bg-white px-3 py-1 text-slate-700 shadow-xs transition hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Thu gọn bài tập
            </button>
          </div>

          <QuizRunner exercise={activeExercise} onCompleted={handleCompleted} />
        </div>
      )}
    </section>
  )
}