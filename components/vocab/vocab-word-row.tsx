"use client"

import { useState } from "react"
import { Check, Heart, Volume2 } from "lucide-react"

import type { VocabWord } from "@/lib/data/vocabulary"
import { speak } from "@/lib/speak"
import { cn } from "@/lib/utils"

const typeClass: Record<VocabWord["type"], string> = {
  n: "bg-blue-100 text-blue-700",
  v: "bg-green-100 text-green-700",
  adj: "bg-purple-100 text-purple-700",
  adv: "bg-orange-100 text-orange-700",
  prep: "bg-teal-100 text-teal-700",
  phr: "bg-pink-100 text-pink-700",
}

type VocabWordRowProps = {
  word: VocabWord
  /**
   * Trạng thái "đã thuộc" / "yêu thích".
   * Trang gọi có thể truyền vào để giữ nguyên dấu khi phân trang;
   * nếu không truyền thì component tự quản lý như trước.
   */
  learned?: boolean
  onLearnedChange?: (learned: boolean) => void
  liked?: boolean
  onLikedChange?: (liked: boolean) => void
}

export function VocabWordRow({
  word,
  learned: learnedProp,
  onLearnedChange,
  liked: likedProp,
  onLikedChange,
}: VocabWordRowProps) {
  const [learnedLocal, setLearnedLocal] = useState(false)
  const [likedLocal, setLikedLocal] = useState(false)

  const learned = learnedProp ?? learnedLocal
  const liked = likedProp ?? likedLocal

  const toggleLearned = () => {
    const next = !learned
    setLearnedLocal(next)
    onLearnedChange?.(next)
  }

  const toggleLiked = () => {
    const next = !liked
    setLikedLocal(next)
    onLikedChange?.(next)
  }

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 transition-colors sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-base font-bold text-slate-900">{word.en}</span>
          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", typeClass[word.type])}>
            {word.type}
          </span>
          <span className="text-sm text-slate-400">{word.ipa}</span>
        </p>
        <p className="mt-1 text-sm text-slate-600">{word.vi}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => speak(word.en)}
          aria-label={`Phát âm từ ${word.en}`}
          className="flex h-9 w-9 items-center justify-center rounded-full text-blue-600 transition-colors hover:bg-blue-50"
        >
          <Volume2 className="h-4.5 w-4.5" />
        </button>
        <button
          type="button"
          onClick={toggleLiked}
          aria-label={liked ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
          aria-pressed={liked}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
            liked ? "bg-rose-50 text-rose-500" : "text-slate-400 hover:bg-slate-100 hover:text-rose-500"
          )}
        >
          <Heart className={cn("h-4.5 w-4.5", liked && "fill-current")} />
        </button>
        <button
          type="button"
          onClick={toggleLearned}
          aria-pressed={learned}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors",
            learned
              ? "bg-green-600 text-white shadow-sm shadow-green-600/25"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          <Check className="h-3.5 w-3.5" />
          {learned ? "Đã thuộc" : "Đánh dấu thuộc"}
        </button>
      </div>
    </li>
  )
}
