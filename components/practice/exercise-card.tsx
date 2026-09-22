import { ArrowRight, Clock3, Trash2 } from "lucide-react"
import Link from "next/link"

import { getPracticeIconClass, getPracticeType, statusClass, type Exercise } from "@/lib/data/practice"

export function ExerciseCard({ ex, onDelete }: { ex: Exercise; onDelete?: () => void }) {
  const type = getPracticeType(ex.typeId)
  const TypeIcon = type.icon

  return (
    <article className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-11">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${getPracticeIconClass(ex)} text-white shadow-sm`}>
          <TypeIcon className="h-5 w-5" />
        </span>
        <div className="absolute right-0 top-0 flex max-w-[calc(100%-3.5rem)] flex-wrap justify-end gap-1">
          {ex.id.startsWith("ai-") && (
            <span className="rounded-full bg-pink-100 px-2.5 py-1 text-xs font-semibold text-pink-700">
              của bạn
            </span>
          )}
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[ex.status]}`}>
            {ex.status}
          </span>
          {ex.bestScore && <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">Đúng {ex.bestScore}</span>}
        </div>
      </div>

      <Link href={`/luyen-tap/${ex.id}`} className="mt-3 font-bold text-slate-900 group-hover:text-orange-600">{ex.name}</Link>
      <p className="mt-0.5 text-sm text-slate-500">{ex.vi}</p>
      {ex.examType && <p className="mt-1 text-xs font-semibold text-orange-600">{ex.examType}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
          <Clock3 className="h-3.5 w-3.5" />
          {ex.minutes} phút
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
          {ex.items.length} câu hỏi
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <Link href={`/luyen-tap/${ex.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600">
          {ex.status === "Chưa làm" ? "Bắt đầu làm" : ex.status === "Đang làm" ? "Tiếp tục làm" : "Làm lại"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        {onDelete && <button type="button" onClick={onDelete} aria-label={`Xóa bài ${ex.name}`} title="Xóa bài luyện đã tạo" className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>}
      </div>
    </article>
  )
}
