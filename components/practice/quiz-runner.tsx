"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, XCircle } from "lucide-react"

import { getPracticeType, type Exercise } from "@/lib/data/practice"
import { cn } from "@/lib/utils"

import { ChoiceQuestion } from "./choice-question"
import { FillQuestion } from "./fill-question"
import { OrderQuestion } from "./order-question"

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ")
}
export function QuizRunner({ exercise }: { exercise: Exercise }) {
  const type = getPracticeType(exercise.typeId)
  const total = exercise.items.length
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | string)[]>([])
  const [checked, setChecked] = useState(false)
  const [input, setInput] = useState("")
  const [picked, setPicked] = useState<number[]>([])
  const [finished, setFinished] = useState(false)

  const current = exercise.items[index]

  const correctText =
    current.kind === "choice" || current.kind === "listen"
      ? current.options[current.correctIndex]
      : current.kind === "fill"
        ? current.answer
        : current.sentence

  const answered = answers[index]
  const isCorrect =
    checked &&
    answered !== undefined &&
    (current.kind === "choice" || current.kind === "listen"
      ? answered === current.correctIndex
      : current.kind === "fill"
        ? norm(String(answered)) === norm(current.answer)
        : norm(String(answered)) === norm(current.sentence))

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

  const goNext = () => {
    if (index + 1 >= total) {
      setFinished(true)
      return
    }
    setIndex((v) => v + 1)
    setChecked(false)
    setInput("")
    setPicked([])
  }

  const restart = () => {
    setIndex(0)
    setAnswers([])
    setChecked(false)
    setInput("")
    setPicked([])
    setFinished(false)
  }
  const score = exercise.items.filter((q, i) => {
    const a = answers[i]
    if (a === undefined) return false
    if (q.kind === "choice" || q.kind === "listen") return a === q.correctIndex
    if (q.kind === "fill") return norm(String(a)) === norm(q.answer)
    return norm(String(a)) === norm(q.sentence)
  }).length

  if (finished) {
    const pctScore = total === 0 ? 0 : Math.round((score / total) * 100)
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-200/50">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h2 className="mt-4 text-2xl font-bold text-slate-900">Hoàn thành!</h2>
        <p className="mt-2 text-slate-500">
          Bạn đúng {score}/{total} câu ({pctScore}%).
          {pctScore >= 80 ? " Xuất sắc, giữ vững phong độ nhé!" : " Cố gắng thêm chút nữa nhé!"}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={restart}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
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
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/50">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-500">
            Câu {index + 1}/{total}
          </span>
          <span className="text-slate-700">{Math.round((done / total) * 100)}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-orange-500 transition-all"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-8">
        {(current.kind === "choice" || current.kind === "listen") && (
          <ChoiceQuestion
            prompt={current.prompt}
            options={current.options}
            correctIndex={current.correctIndex}
            selected={typeof answered === "number" ? answered : undefined}
            checked={checked}
            onSelect={choose}
            listenMode={current.kind === "listen"}
          />
        )}
        {current.kind === "fill" && (
          <FillQuestion
            prompt={current.prompt}
            hint={current.hint}
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

        {checked && (
          <div
            className={cn(
              "mt-4 flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-medium",
              isCorrect ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
            )}
            role="status"
          >
            {isCorrect ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            ) : (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            )}
            <div>
              <p className="font-bold">{isCorrect ? "Chính xác! 🎉" : "Chưa đúng, cố lên!"}</p>
              {!isCorrect && <p className="mt-0.5">Đáp án đúng: {correctText}</p>}
            </div>
          </div>
        )}

        {checked && (
          <button
            type="button"
            onClick={goNext}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-700"
          >
            {index + 1 >= total ? "Xem kết quả" : "Câu tiếp theo"}
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
