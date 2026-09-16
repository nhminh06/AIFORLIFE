import { ArrowRight, Clock3 } from "lucide-react"
import Link from "next/link"

import { getPracticeType, statusClass, type Exercise } from "@/lib/data/practice"

export function ExerciseCard({ ex }: { ex: Exercise }) {
  const type = getPracticeType(ex.typeId)
  const TypeIcon = type.icon

  return (
    <Link
      href={`/luyen-tap/${ex.id}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${type.iconClass} text-white shadow-sm`}>
          <TypeIcon className="h-5 w-5" />
        </span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[ex.status]}`}>
          {ex.status}
        </span>
      </div>

      <h3 className="mt-3 font-bold text-slate-900 group-hover:text-orange-600">{ex.name}</h3>
      <p className="mt-0.5 text-sm text-slate-500">{ex.vi}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
          <Clock3 className="h-3.5 w-3.5" />
          {ex.minutes} phút
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
          {ex.items.length} câu hỏi
        </span>
        {ex.bestScore && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-green-700">
            Cao nhất: {ex.bestScore}
          </span>
        )}
      </div>

      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-orange-600">
        {ex.status === "Chưa làm" ? "Bắt đầu làm" : ex.status === "Đang làm" ? "Tiếp tục làm" : "Làm lại"}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}
