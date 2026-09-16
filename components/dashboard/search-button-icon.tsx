"use client"

import { Search } from "lucide-react"

export function SearchButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      aria-label="Tìm kiếm (Ctrl+K)"
      title="Tìm kiếm (Ctrl+K)"
      onClick={onOpen}
      className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
    >
      <Search className="h-5 w-5" />
    </button>
  )
}
