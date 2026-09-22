"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, XCircle } from "lucide-react"

import { getPracticeType, type Exercise, type PracticeResult } from "@/lib/data/practice"
import { cn } from "@/lib/utils"

import { ChoiceQuestion } from "./choice-question"
import { FillQuestion } from "./fill-question"
import { OrderQuestion } from "./order-question"

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ")
}

type WritingGrade = {
  score: number
  level: string
  feedback: string
  strengths: string[]
  corrections: string[]
}

export function QuizRunner({ exercise, onCompleted }: { exercise: Exercise; onCompleted?: (result: PracticeResult) => void }) {
  const type = getPracticeType(exercise.typeId)
  const total = exercise.items.length
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | string | boolean)[]>([])
  const [checked, setChecked] = useState(false)
  const [input, setInput] = useState("")
  const [picked, setPicked] = useState<number[]>([])
  const [showHint, setShowHint] = useState(false)
  const [finished, setFinished] = useState(false)
  const [grading, setGrading] = useState(false)
  const [writingGrade, setWritingGrade] = useState<WritingGrade | null>(null)

  const current = exercise.items[index]

  const correctText =
    current.kind === "choice" || current.kind === "listen" || current.kind === "reading" || current.kind === "listening"
      ? current.options[current.correctIndex]
      : current.kind === "fill"
        ? current.answer
        : current.kind === "order"
          ? current.sentence
          : current.kind === "true-false"
            ? current.answer ? "Đúng" : "Sai"
            : "Bài viết đã nộp"

  const answered = answers[index]
  const isCorrect =
    checked &&
    answered !== undefined &&
    (current.kind === "choice" || current.kind === "listen" || current.kind === "reading" || current.kind === "listening"
      ? answered === current.correctIndex
      : current.kind === "fill"
        ? norm(String(answered)) === norm(current.answer)
        : current.kind === "order"
          ? norm(String(answered)) === norm(current.sentence)
          : current.kind === "true-false"
            ? answered === current.answer
            : String(answered).trim().length > 0)

  const choose = (i: number) => {
    if (checked) return
    setAnswers((p) => {
      const n = [...p]
      n[index] = i
      return n
    })
    setChecked(true)
  }

  const submitInput = () => {
    if (checked || !input.trim()) return
    setAnswers((p) => {
      const n = [...p]
      n[index] = input
      return n
    })
    setChecked(true)
  }

  const toggleWord = (i: number) => {
    if (checked || current.kind !== "order") return
    setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]))
  }

  const submitOrder = () => {
    if (checked || current.kind !== "order" || picked.length === 0) return
    const built = picked.map((w) => current.words[w]).join(" ")
    setAnswers((p) => {
      const n = [...p]
      n[index] = built
      return n
    })
    setChecked(true)
  }

  const chooseTrueFalse = (value: boolean) => {
    if (checked || current.kind !== "true-false") return
    setAnswers((p) => { const next = [...p]; next[index] = value; return next })
    setChecked(true)
  }

  const gradeWriting = async () => {
    if (current.kind !== "writing" || typeof answered !== "string") return
    setGrading(true)
    try {
      const response = await fetch("/api/ai/practice/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: current.prompt, answer: answered, minWords: current.minWords }),
      })
      const data = (await response.json()) as WritingGrade & { error?: string }
      if (!response.ok) throw new Error(data.error || "Không chấm được bài viết.")
      setWritingGrade(data)
    } catch (error) {
      setWritingGrade({ score: 0, level: "Chưa chấm được", feedback: error instanceof Error ? error.message : "Không chấm được bài viết.", strengths: [], corrections: [] })
    } finally {
      setGrading(false)
    }
  }

  const goNext = async () => {
    if (current.kind === "writing" && !writingGrade) await gradeWriting()
    if (current.kind === "writing" && !writingGrade && grading) return
    if (index + 1 >= total) {
      onCompleted?.({ score, total })
      setFinished(true)
      return
    }
    setIndex((v) => v + 1)
    setChecked(false)
    setInput("")
    setPicked([])
    setShowHint(false)
    setWritingGrade(null)
  }

  const restart = () => {
    setIndex(0)
    setAnswers([])
    setChecked(false)
    setInput("")
    setPicked([])
    setShowHint(false)
    setFinished(false)
    setWritingGrade(null)
  }
  const score = exercise.items.filter((q, i) => {
    const a = answers[i]
    if (a === undefined) return false
    if (q.kind === "choice" || q.kind === "listen" || q.kind === "reading" || q.kind === "listening") return a === q.correctIndex
    if (q.kind === "fill") return norm(String(a)) === norm(q.answer)
    if (q.kind === "order") return norm(String(a)) === norm(q.sentence)
    if (q.kind === "true-false") return a === q.answer
    return String(a).trim().length > 0
  }).length

  if (finished) {
    const pctScore = total === 0 ? 0 : Math.round((score / total) * 100)
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h2 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Hoàn thành!</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Bạn đúng {score}/{total} câu ({pctScore}%).
          {pctScore >= 80 ? " Xuất sắc, giữ vững phong độ nhé!" : " Cố gắng thêm chút nữa nhé!"}
        </p>
        {writingGrade && (
          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-left dark:border-blue-900/50 dark:bg-blue-950/30">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold text-blue-900 dark:text-blue-200">AI chấm bài viết</h3>
              <span className="rounded-full bg-blue-600 px-3 py-1 text-sm font-bold text-white">{writingGrade.score}/100 · {writingGrade.level}</span>
            </div>
            <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">{writingGrade.feedback}</p>
            {writingGrade.strengths.length > 0 && <p className="mt-3 text-sm text-green-700 dark:text-green-300"><strong>Điểm tốt:</strong> {writingGrade.strengths.join("; ")}</p>}
            {writingGrade.corrections.length > 0 && <p className="mt-2 text-sm text-amber-700 dark:text-amber-300"><strong>Cần cải thiện:</strong> {writingGrade.corrections.join("; ")}</p>}
          </div>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={restart}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RotateCcw className="h-4 w-4" />
            Làm lại
          </button>
          <Link
            href="/luyen-tap"
            className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-colors hover:bg-orange-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Về danh sách bài tập
          </Link>
        </div>
      </div>
    )
  }

  const done = index + (checked ? 1 : 0)
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-500">
            Câu {index + 1}/{total}
          </span>
          <span className="text-slate-700 dark:text-slate-300">{Math.round((done / total) * 100)}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-orange-500 transition-all"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none sm:p-8">
        {current.kind === "reading" && <div className="mb-5 rounded-2xl bg-blue-50 p-4 text-sm leading-relaxed text-slate-700">{current.passage}</div>}
        {(current.kind === "choice" || current.kind === "listen" || current.kind === "reading" || current.kind === "listening") && (
          <ChoiceQuestion
            prompt={current.prompt}
            options={current.options}
            correctIndex={current.correctIndex}
            selected={typeof answered === "number" ? answered : undefined}
            checked={checked}
            onSelect={choose}
            listenMode={current.kind === "listen" || current.kind === "listening"}
            listenText={current.kind === "listening" ? current.transcript : undefined}
          />
        )}
        {current.kind === "fill" && (
          <FillQuestion
            prompt={current.prompt}
            hint={current.hint}
            showHint={showHint}
            onToggleHint={() => setShowHint((v) => !v)}
            value={input}
            checked={checked}
            onChange={setInput}
            onSubmit={submitInput}
          />
        )}
        {current.kind === "order" && (
          <OrderQuestion
            words={current.words}
            picked={picked}
            checked={checked}
            onToggle={toggleWord}
            onClear={() => setPicked([])}
            onSubmit={submitOrder}
          />
        )}
        {current.kind === "writing" && (
          <>
            <p className="text-lg font-bold leading-relaxed text-slate-900 dark:text-white">{current.prompt}</p>
            <p className="mt-2 text-xs text-slate-500">Viết ít nhất {current.minWords ?? 50} từ bằng tiếng Anh.</p>
            <textarea value={input} disabled={checked} onChange={(event) => setInput(event.target.value)} rows={7} placeholder="Viết đoạn văn của bạn…" className="mt-4 w-full resize-y rounded-xl border-2 border-slate-200 px-4 py-3 text-sm leading-relaxed outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            {!checked && <button type="button" onClick={submitInput} disabled={!input.trim()} className="mt-3 w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-40">Nộp bài viết</button>}
          </>
        )}
        {current.kind === "true-false" && (
          <>
            <p className="text-lg font-bold leading-relaxed text-slate-900 dark:text-white">{current.statement}</p>
            {!checked && <div className="mt-5 grid grid-cols-2 gap-3"><button type="button" onClick={() => chooseTrueFalse(true)} className="rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-bold hover:border-green-500 hover:bg-green-50">Đúng</button><button type="button" onClick={() => chooseTrueFalse(false)} className="rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-bold hover:border-red-500 hover:bg-red-50">Sai</button></div>}
          </>
        )}

        {checked && (
          <div
            className={cn(
              "mt-4 flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-medium",
              isCorrect
                ? "bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-300"
                : "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300"
            )}
            role="status"
          >
            {isCorrect ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            ) : (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            )}
            <div>
              <p className="font-bold">{current.kind === "writing" ? "Đã nộp" : isCorrect ? "Chính xác! 🎉" : "Chưa đúng, cố lên!"}</p>
              {!isCorrect && <p className="mt-0.5">Đáp án đúng: {correctText}</p>}
            </div>
          </div>
        )}

        {checked && (
          <button
            type="button"
            onClick={goNext}
            disabled={grading}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-700"
          >
            {grading ? "AI đang chấm…" : index + 1 >= total ? "Xem kết quả" : "Câu tiếp theo"}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="mt-3 text-center text-xs text-slate-400">
        Bài: {exercise.name} · {type.label}
      </p>
    </div>
  )
}
