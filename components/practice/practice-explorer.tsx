"use client"

import { useMemo, useState } from "react"
import { ClipboardList } from "lucide-react"

import { SearchInput } from "@/components/dashboard/search-input"
import { exercises, practiceTypes, type PracticeTypeId } from "@/lib/data/practice"
import { cn } from "@/lib/utils"

import { ExerciseCard } from "./exercise-card"

export function PracticeExplorer() {
  const [tab, setTab] = useState<PracticeTypeId | "all">("all")
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return exercises.filter((e) => {
      if (tab !== "all" && e.typeId !== tab) return false
      if (!q) return true
      return (
        e.name.toLowerCase().includes(q) ||
        e.vi.toLowerCase().includes(q) ||
        e.desc.toLowerCase().includes(q)
      )
    })
  }, [tab, query])

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Loại bài tập">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "all"}
            onClick={() => setTab("all")}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
              tab === "all"
                ? "border-orange-500 bg-orange-500 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-500 hover:text-slate-800"
            )}
          >
            Tất cả
          </button>
          {practiceTypes.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                tab === t.id
                  ? t.chipClass + " border-current shadow-sm"
                  : "border-slate-200 bg-white text-slate-500 hover:text-slate-800"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Tìm bài tập…"
          label="Tìm bài tập"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
            <ClipboardList className="h-6 w-6" />
          </span>
          <p className="mt-3 font-semibold text-slate-900">Không tìm thấy bài tập</p>
          <p className="mt-1 text-sm text-slate-500">Thử từ khóa hoặc loại bài khác nhé.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((e) => (
            <ExerciseCard key={e.id} ex={e} />
          ))}
        </div>
      )}
    </div>
  )
}
