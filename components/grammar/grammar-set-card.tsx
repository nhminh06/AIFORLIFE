"use client"

import { useEffect, useState } from "react"
import { ArrowRight, BookMarked, Loader2, Network, Trash2 } from "lucide-react"
import Link from "next/link"

import { grammarLevelClass } from "@/lib/data/grammar"
import { isGrammarLearned } from "@/lib/grammar-progress"
import { useAuth } from "@/lib/auth-context"

type GrammarSetCardProps = {
  set: {
    slug: string
    name: string
    vi: string
    desc: string
    level: string
    accent: string
    progress: number
  }
  /** chủ điểm do chính user tạo → hiện nhãn "Của tôi" + nút xóa */
  mine?: boolean
  onDelete?: () => void
  /** đang xóa chủ điểm này */
  deleting?: boolean
}

export function GrammarSetCard({ set, mine = false, onDelete, deleting = false }: GrammarSetCardProps) {
  const { user } = useAuth()
  const [learned, setLearned] = useState(false)

  useEffect(() => {
    const refresh = () => setLearned(Boolean(user) && isGrammarLearned(set.slug, user?.uid))
    refresh()
    window.addEventListener("afl-grammar-progress-updated", refresh)
    return () => window.removeEventListener("afl-grammar-progress-updated", refresh)
  }, [set.slug, set.progress, user?.uid])

  return (
    <div className="relative">
      <Link
        href={`/ngu-phap/${set.slug}`}
        className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm">
            <Network className="h-5 w-5" />
          </span>
          <div className="flex items-center gap-1.5">
            {mine && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600">
                <BookMarked className="h-3 w-3" />
                Của tôi
              </span>
            )}
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                grammarLevelClass[set.level as keyof typeof grammarLevelClass] ??
                "bg-slate-100 text-slate-600"
              }`}
            >
              {set.level}
            </span>
          </div>
        </div>

        <h3 className="mt-3 font-bold text-slate-900 group-hover:text-purple-700">
          {set.name}
        </h3>
        <p className="mt-0.5 text-sm text-slate-500">{set.vi}</p>

        <span className={`mt-4 inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${learned ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
          {learned ? "Đã học" : "Chưa học"}
        </span>

        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-purple-700">
          Học ngay
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>

      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDelete()
          }}
          disabled={deleting}
          aria-label={`Xóa chủ điểm ${set.name}`}
          title="Xóa chủ điểm này"
          className="absolute bottom-4 right-5 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-60"
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  )
}
