"use client"

import { Headphones } from "lucide-react"

import { speak } from "@/lib/speak"
import { cn } from "@/lib/utils"

type Props = {
  prompt: string
  options: [string, string, string, string]
  correctIndex: number
  selected?: number
  checked: boolean
  onSelect: (i: number) => void
  listenMode?: boolean
}

export function ChoiceQuestion({
  prompt,
  options,
  correctIndex,
  selected,
  checked,
  onSelect,
  listenMode = false,
}: Props) {
  return (
    <>
      {listenMode ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-purple-50 px-4 py-6 text-center">
          <button
            type="button"
            onClick={() => speak(prompt)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg shadow-purple-600/30 transition-transform hover:scale-105"
            aria-label="Nghe lại"
          >
            <Headphones className="h-6 w-6" />
          </button>
          <p className="text-sm font-medium text-purple-900">
            Nghe phát âm rồi chọn nghĩa đúng
          </p>
        </div>
      ) : (
        <p className="text-lg font-bold leading-relaxed text-slate-900 dark:text-white">{prompt}</p>
      )}
      <div className="mt-5 grid gap-2.5">
        {options.map((opt, i) => {
          const letter = ["A", "B", "C", "D"][i]
          const isRight = checked && i === correctIndex
          const isWrong = checked && selected === i && i !== correctIndex
          return (
            <button
              key={`${letter}-${i}`}
              type="button"
              disabled={checked}
              onClick={() => onSelect(i)}
              className={cn(
                "flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-all",
                isRight
                  ? "border-green-500 bg-green-50 text-green-800"
                  : isWrong
                    ? "border-red-500 bg-red-50 text-red-800"
                    : checked
                      ? "border-slate-200 bg-white opacity-60 dark:border-slate-700 dark:bg-slate-800"
                      : "border-slate-200 bg-white hover:border-orange-400 hover:bg-orange-50/50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-orange-950/30"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  isRight
                    ? "bg-green-600 text-white"
                    : isWrong
                      ? "bg-red-500 text-white"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                )}
              >
                {letter}
              </span>
              {opt}
            </button>
          )
        })}
      </div>
    </>
  )
}
