"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"

import { popularSearches, searchAll } from "@/lib/search"

import { SearchBar } from "./search-bar"
import { ResultRow } from "./search-result-row"

export function SearchModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const trimmed = query.trim()
  const showPopular = trimmed === ""
  const groups = useMemo(() => searchAll(trimmed), [trimmed])
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups])
  const popular = useMemo(() => popularSearches(), [])
  const currentList = showPopular ? popular : flat

  useEffect(() => {
    inputRef.current?.focus()
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  useEffect(() => {
    setActive(0)
  }, [trimmed])

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" })
  }, [active])

  const go = (href: string) => {
    onClose()
    router.push(href)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose()
    if (currentList.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((a) => (a + 1) % currentList.length)
    }
    if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((a) => (a - 1 + currentList.length) % currentList.length)
    }
    if (e.key === "Enter" && currentList[active]) go(currentList[active].href)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 pt-20 backdrop-blur-[2px] sm:pt-28"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tìm kiếm toàn website"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700"
      >
        <SearchBar value={query} onChange={setQuery} onClose={onClose} inputRef={inputRef} />
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
          {showPopular && (
            <div className="px-2 pb-1 pt-2">
              <p className="flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Sparkles className="h-3.5 w-3.5" />
                Gợi ý cho bạn
              </p>
              <div className="mt-1.5 space-y-0.5">
                {popular.map((item, i) => (
                  <ResultRow
                    key={item.id}
                    item={item}
                    index={i}
                    active={active === i}
                    onHover={() => setActive(i)}
                    onSelect={() => go(item.href)}
                  />
                ))}
              </div>
            </div>
          )}
          {!showPopular && flat.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              Không tìm thấy kết quả cho "{trimmed}". Thử từ khóa khác nhé.
            </p>
          )}
          {!showPopular &&
            groups.map((g) => (
              <div key={g.kind} className="px-2 pb-1 pt-2">
                <p className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {g.label}
                </p>
                <div className="mt-1.5 space-y-0.5">
                  {g.items.map((item) => {
                    const idx = flat.indexOf(item)
                    return (
                      <ResultRow
                        key={item.id}
                        item={item}
                        index={idx}
                        active={active === idx}
                        onHover={() => setActive(idx)}
                        onSelect={() => go(item.href)}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
        </div>
        <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-[11px] text-slate-400 dark:border-slate-700">
          <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-sans dark:border-slate-600 dark:bg-slate-700">↑↓</kbd> di chuyển
          <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-sans dark:border-slate-600 dark:bg-slate-700">↵</kbd> mở
          <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-sans dark:border-slate-600 dark:bg-slate-700">esc</kbd> đóng
        </div>
      </div>
    </div>
  )
}
