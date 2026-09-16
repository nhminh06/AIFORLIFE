"use client"

import { ArrowRight, BookOpenText, FileText, GitBranch, PencilLine } from "lucide-react"

import type { SearchItem, SearchKind } from "@/lib/search"

export const KIND_META: Record<SearchKind, { label: string; color: string }> = {
  vocab: { label: "Bộ từ", color: "bg-blue-100 text-blue-700" },
  word: { label: "Từ", color: "bg-teal-100 text-teal-700" },
  phrase: { label: "Câu", color: "bg-green-100 text-green-700" },
  grammar: { label: "Ngữ pháp", color: "bg-purple-100 text-purple-700" },
  practice: { label: "Bài tập", color: "bg-orange-100 text-orange-700" },
}

function kindIcon(kind: SearchKind) {
  if (kind === "vocab") return BookOpenText
  if (kind === "word") return PencilLine
  if (kind === "phrase") return FileText
  if (kind === "grammar") return GitBranch
  return PencilLine
}

export function ResultRow({
  item,
  index,
  active,
  onHover,
  onSelect,
}: {
  item: SearchItem
  index: number
  active: boolean
  onHover: () => void
  onSelect: () => void
}) {
  const Icon = kindIcon(item.kind)
  return (
    <button
      type="button"
      data-index={index}
      onMouseEnter={onHover}
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors ${
        active ? "bg-blue-50 dark:bg-blue-950/40" : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
      }`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
          {item.title}
        </span>
        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{item.sub}</span>
      </span>
      <ArrowRight
        className={`h-4 w-4 shrink-0 transition-all ${
          active ? "translate-x-0 text-blue-600 opacity-100 dark:text-blue-400" : "-translate-x-1 opacity-0"
        }`}
      />
    </button>
  )
}
