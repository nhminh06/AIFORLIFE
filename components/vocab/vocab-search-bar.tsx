"use client"

import { Search } from "lucide-react"

type VocabSearchBarProps = {
  value: string
  onChange: (value: string) => void
}

export function VocabSearchBar({ value, onChange }: VocabSearchBarProps) {
  return (
    <div className="relative w-full sm:max-w-sm">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="search"
        placeholder="Tìm từ hoặc bộ từ vựng…"
        aria-label="Tìm từ hoặc bộ từ vựng"
        className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
    </div>
  )
}
