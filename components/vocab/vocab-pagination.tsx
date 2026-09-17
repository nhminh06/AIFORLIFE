"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

type VocabPaginationProps = {
  /** trang hiện tại, bắt đầu từ 1 */
  page: number
  totalPages: number
  onChange: (page: number) => void
}

/** Danh sách số trang hiển thị, rút gọn bằng "…" khi có quá nhiều trang */
function pageItems(page: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const items: (number | "ellipsis")[] = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)

  if (start > 2) items.push("ellipsis")
  for (let p = start; p <= end; p++) items.push(p)
  if (end < totalPages - 1) items.push("ellipsis")
  items.push(totalPages)

  return items
}

export function VocabPagination({ page, totalPages, onChange }: VocabPaginationProps) {
  if (totalPages <= 1) return null

  const items = pageItems(page, totalPages)

  return (
    <nav aria-label="Phân trang từ vựng" className="mt-4 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Trang trước"
        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-200 hover:text-blue-600 disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Trước
      </button>

      {items.map((item, i) =>
        item === "ellipsis" ? (
          <span key={`ellipsis-${i}`} className="px-1 text-xs font-semibold text-slate-400">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-label={`Trang ${item}`}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              "h-9 w-9 rounded-full border text-xs font-semibold transition-colors",
              item === page
                ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                : "border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-600"
            )}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Trang sau"
        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-200 hover:text-blue-600 disabled:pointer-events-none disabled:opacity-40"
      >
        Sau
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </nav>
  )
}
