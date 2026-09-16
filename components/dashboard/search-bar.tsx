"use client"

import { Search, X } from "lucide-react"

type Props = {
  value: string
  onChange: (v: string) => void
  onClose: () => void
  inputRef: React.RefObject<HTMLInputElement | null>
}

export function SearchBar({ value, onChange, onClose, inputRef }: Props) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 px-4">
      <Search className="h-4 w-4 shrink-0 text-slate-400" />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tìm từ vựng, mẫu câu, ngữ pháp, bài tập…"
        aria-label="Tìm kiếm toàn website"
        className="w-full bg-transparent py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng tìm kiếm"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
