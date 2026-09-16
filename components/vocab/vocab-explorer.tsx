"use client"

import { useMemo, useState } from "react"
import { BookOpenText } from "lucide-react"

import { vocabSets } from "@/lib/data/vocabulary"

import { VocabSearchBar } from "./vocab-search-bar"
import { VocabSetCard } from "./vocab-set-card"
import { VocabTopicFilter } from "./vocab-topic-filter"

export function VocabExplorer() {
  const [query, setQuery] = useState("")
  const [topic, setTopic] = useState("all")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return vocabSets.filter((s) => {
      const matchTopic = topic === "all" || s.topicId === topic
      if (!matchTopic) return false
      if (!q) return true
      return (
        s.name.toLowerCase().includes(q) ||
        s.vi.toLowerCase().includes(q) ||
        s.words.some((w) => w.en.toLowerCase().includes(q) || w.vi.toLowerCase().includes(q))
      )
    })
  }, [query, topic])

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <VocabTopicFilter active={topic} onChange={setTopic} />
        <VocabSearchBar value={query} onChange={setQuery} />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <BookOpenText className="h-6 w-6" />
          </span>
          <p className="mt-3 font-semibold text-slate-900">Không tìm thấy bộ từ vựng</p>
          <p className="mt-1 text-sm text-slate-500">
            Thử từ khóa khác hoặc chọn chủ đề khác nhé.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <VocabSetCard key={s.slug} set={s} />
          ))}
        </div>
      )}
    </div>
  )
}
