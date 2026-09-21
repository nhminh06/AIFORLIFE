"use client"

import { useState } from "react"
import { Loader2, Sparkles, WandSparkles } from "lucide-react"

import { QuizRunner } from "@/components/practice/quiz-runner"
import type { Exercise } from "@/lib/data/practice"
import type { GrammarTopic } from "@/lib/data/grammar"

export function GrammarAiPractice({ topic }: { topic: GrammarTopic }) {
  const [questionCount, setQuestionCount] = useState(5)
  const [difficulty, setDifficulty] = useState("Cơ bản")
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const createPractice = async () => {
    if (loading) return
    setLoading(true)
    setError("")
    setExercise(null)
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
      if (!response.ok || !data.exercise) throw new Error(data.error || "Không tạo được bài luyện tập.")
      setExercise(data.exercise)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được bài luyện tập. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 shadow-sm shadow-orange-100/70 dark:border-orange-900/60 dark:from-orange-950/30 dark:via-slate-900 dark:to-amber-950/20 dark:shadow-none">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/25">
          <WandSparkles className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Luyện tập</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Chọn số lượng và độ khó. AI chỉ tạo câu hỏi về chủ điểm đang mở.
          </p>
        </div>
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
          onClick={createPractice}
          disabled={loading}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50 sm:self-end"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Đang tạo..." : "Tạo bài tập"}
        </button>
      </div>

      {error && <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      {exercise && (
        <div className="mt-6 border-t border-orange-200 pt-6 dark:border-orange-900/60">
          <QuizRunner exercise={exercise} />
        </div>
      )}
    </section>
  )
}