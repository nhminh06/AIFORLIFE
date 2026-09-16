"use client"

import { vocabTopics } from "@/lib/data/vocabulary"
import { cn } from "@/lib/utils"

type VocabTopicFilterProps = {
  active: string
  onChange: (id: string) => void
}

export function VocabTopicFilter({ active, onChange }: VocabTopicFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onChange("all")}
        className={cn(
          "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
          active === "all"
            ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/25"
            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800"
        )}
      >
        Tất cả
      </button>
      {vocabTopics.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
            active === t.id
              ? t.chipClass + " border-current shadow-sm"
              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
