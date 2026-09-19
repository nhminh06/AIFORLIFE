"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import type { PhraseItem } from "@/lib/data/phrases"
import { cn } from "@/lib/utils"

import { PhraseRow } from "./phrase-row"

/** Số mẫu câu hiển thị trong mỗi lượt học */
const ITEMS_PER_ROUND = 8

type PhraseListProps = {
  items: PhraseItem[]
  /**
   * Tập hợp các câu đã học (key = en.toLowerCase()).
   * Trang gọi truyền vào để đồng bộ thanh tiến độ;
   * nếu không truyền thì từng câu tự quản lý trạng thái như trước.
   */
  learnedKeys?: Set<string>
  onLearnedChange?: (phraseKey: string, learned: boolean) => void
}

/**
 * Danh sách mẫu câu chia thành các lượt học: mỗi lượt hiển thị 8 câu.
 * Người dùng bấm "Lượt sau" để học tiếp 8 câu kế tiếp.
 */
export function PhraseList({ items, learnedKeys, onLearnedChange }: PhraseListProps) {
  const [round, setRound] = useState(0)

  /* Reset về lượt đầu khi chuyển sang bộ mẫu câu khác */
  useEffect(() => {
    setRound(0)
  }, [items])

  const totalRounds = Math.max(1, Math.ceil(items.length / ITEMS_PER_ROUND))
  const currentRound = Math.min(round, totalRounds - 1)
  const roundItems = items.slice(currentRound * ITEMS_PER_ROUND, (currentRound + 1) * ITEMS_PER_ROUND)

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
        Bộ mẫu câu này chưa có câu nào.
      </p>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-500">
          Lượt học {currentRound + 1}/{totalRounds} · {roundItems.length} câu mỗi lượt
        </p>
        <p className="text-xs font-semibold text-slate-500">
          Câu {currentRound * ITEMS_PER_ROUND + 1}–
          {Math.min((currentRound + 1) * ITEMS_PER_ROUND, items.length)}/{items.length}
        </p>
      </div>

      <ul className="mt-3 space-y-3">
        {roundItems.map((i, idx) => {
          const phraseKey = i.en.trim().toLowerCase()
          const globalIndex = currentRound * ITEMS_PER_ROUND + idx
          return (
            <PhraseRow
              key={`${phraseKey}-${globalIndex}`}
              en={i.en}
              vi={i.vi}
              learned={learnedKeys?.has(phraseKey)}
              onLearnedChange={
                onLearnedChange ? (learned) => onLearnedChange(phraseKey, learned) : undefined
              }
            />
          )
        })}
      </ul>

      {totalRounds > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setRound(currentRound - 1)}
            disabled={currentRound <= 0}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-green-300 hover:text-green-700 disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Lượt trước
          </button>

          {Array.from({ length: totalRounds }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRound(i)}
              aria-label={`Lượt học ${i + 1}`}
              aria-current={i === currentRound ? "true" : undefined}
              className={cn(
                "h-9 w-9 rounded-full border text-xs font-semibold transition-colors",
                i === currentRound
                  ? "border-green-600 bg-green-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-500 hover:border-green-300 hover:text-green-700"
              )}
            >
              {i + 1}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setRound(currentRound + 1)}
            disabled={currentRound >= totalRounds - 1}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-green-300 hover:text-green-700 disabled:pointer-events-none disabled:opacity-40"
          >
            Lượt sau
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
