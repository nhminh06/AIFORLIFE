import { ArrowRight, BookMarked, Loader2, Trash2 } from "lucide-react"
import Link from "next/link"

import { getSetIcon } from "@/lib/data/set-icons"
import { getVocabTopicForSet, levelClass, type VocabSet } from "@/lib/data/vocabulary"

type VocabSetCardProps = {
  set: VocabSet
  /**
   * Số từ đã thuộc thật (tính từ localStorage, đồng bộ với trang Học).
   * Không truyền sẽ fallback về set.learned tĩnh.
   */
  learnedCount?: number
  /** chỉ truyền cho bộ từ cá nhân — hiện nút xóa ở góc dưới bên phải */
  onDelete?: () => void
  /** đang xóa bộ từ này */
  deleting?: boolean
}

export function VocabSetCard({ set, learnedCount, onDelete, deleting = false }: VocabSetCardProps) {
  const topic = getVocabTopicForSet(set)
  const TopicIcon = getSetIcon(set.icon) ?? topic.icon
  const learned = learnedCount ?? set.learned
  const total = set.total || set.words.length
  const percent = total === 0 ? 0 : Math.round((learned / total) * 100)

  return (
    <div className="relative">
      <Link
        href={`/tu-vung/${set.slug}`}
        className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-3">
          <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${topic.iconClass} text-white shadow-sm`}>
            <TopicIcon className="h-5 w-5" />
          </span>
          <div className="flex items-center gap-1.5">
            {set.ownerId && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600">
                <BookMarked className="h-3 w-3" />
                Của tôi
              </span>
            )}
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${levelClass[set.level]}`}>
              {set.level}
            </span>
          </div>
        </div>

        <h3 className="mt-3 font-bold text-slate-900 group-hover:text-blue-700">{set.name}</h3>
        <p className="mt-0.5 text-sm text-slate-500">{set.vi}</p>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
            <span className="text-slate-400">
              {learned}/{total} từ
            </span>
            <span className="text-slate-700">{percent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${set.accent}`} style={{ width: `${percent}%` }} />
          </div>
        </div>

        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600">
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
          aria-label={`Xóa bộ từ ${set.name}`}
          title="Xóa bộ từ này"
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
