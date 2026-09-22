"use client"

import { ChevronDown, ChevronUp, Tag } from "lucide-react"
import { useState } from "react"

import { isBuiltInVocabTopic, type VocabTopic } from "@/lib/data/vocabulary"
import { cn } from "@/lib/utils"

type VocabTopicFilterProps = {
  /** chủ đề hệ thống + chủ đề riêng do người dùng tạo */
  topics: VocabTopic[]
  active: string
  onChange: (id: string) => void
}

export function VocabTopicFilter({ topics, active, onChange }: VocabTopicFilterProps) {
  const [expanded, setExpanded] = useState(false)
  const visibleTopics = expanded ? topics : topics.slice(0, 8)
  const hasMoreTopics = topics.length > 8

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
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
      {visibleTopics.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
            active === t.id
              ? t.chipClass + " border-current shadow-sm"
              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800"
          )}
        >
          {!isBuiltInVocabTopic(t.id) && <Tag className="h-3 w-3" />}
          {t.label}
        </button>
      ))}
      {hasMoreTopics && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-900"
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {expanded ? "Thu gọn" : `Xem thêm (${topics.length - 8})`}
        </button>
      )}
    </div>
  )
}
