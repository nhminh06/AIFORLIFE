"use client"

import { useMemo, useState } from "react"
import { MessageCircleHeart } from "lucide-react"

import { SearchInput } from "@/components/dashboard/search-input"
import { phraseSets, phraseSituations } from "@/lib/data/phrases"
import { cn } from "@/lib/utils"

import { PhraseSetCard } from "./phrase-set-card"

export function PhraseExplorer() {
  const [query, setQuery] = useState("")
  const [sit, setSit] = useState("all")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return phraseSets.filter((s) => {
      if (sit !== "all" && s.situationId !== sit) return false
      if (!q) return true
      return (
        s.name.toLowerCase().includes(q) ||
        s.vi.toLowerCase().includes(q) ||
        s.items.some((i) => i.en.toLowerCase().includes(q) || i.vi.toLowerCase().includes(q))
      )
    })
  }, [query, sit])

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSit("all")}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
              sit === "all"
                ? "border-green-600 bg-green-600 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-500 hover:text-slate-800"
            )}
          >
            Tất cả
          </button>
          {phraseSituations.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSit(p.id)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                sit === p.id
                  ? p.chipClass + " border-current shadow-sm"
                  : "border-slate-200 bg-white text-slate-500 hover:text-slate-800"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Tìm mẫu câu…"
          label="Tìm mẫu câu"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
            <MessageCircleHeart className="h-6 w-6" />
          </span>
          <p className="mt-3 font-semibold text-slate-900">Không tìm thấy mẫu câu</p>
          <p className="mt-1 text-sm text-slate-500">Thử từ khóa hoặc tình huống khác nhé.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <PhraseSetCard key={s.slug} set={s} />
          ))}
        </div>
      )}
    </div>
  )
}
