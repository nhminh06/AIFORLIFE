import { ArrowRight, MessageCircle, UserRound } from "lucide-react"
import Link from "next/link"

import { getPhraseSituation, levelClass, type PhraseSet } from "@/lib/data/phrases"

function pct(learned: number, total: number) {
  return total === 0 ? 0 : Math.round((learned / total) * 100)
}

export function PhraseSetCard({
  set,
  mine = false,
  realLearned,
}: {
  set: PhraseSet
  mine?: boolean
  /** số câu đã học thật của user (từ Firestore) — có thì ưu tiên hơn số tĩnh */
  realLearned?: number
}) {
  const sit = getPhraseSituation(set.situationId, set.situationLabel)
  /* Tổng = số câu thực tế trong bộ (số tĩnh có thể sai) */
  const total = set.items.length || set.total
  const learnedCount = realLearned ?? set.learned
  const percent = pct(learnedCount, total)
  return (
    <Link
      href={`/mau-cau/${set.slug}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${set.accent} text-white shadow-sm`}>
          <MessageCircle className="h-5 w-5" />
        </span>
        <div className="flex items-center gap-1.5">
          {mine && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase text-amber-700">
              <UserRound className="h-3 w-3" />
              Của tôi
            </span>
          )}
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${levelClass[set.level]}`}>
            {set.level}
          </span>
        </div>
      </div>
      <h3 className="mt-3 font-bold text-slate-900 group-hover:text-green-700">{set.name}</h3>
      <p className="mt-0.5 text-sm text-slate-500">{set.vi}</p>
      <p className="mt-1 inline-flex w-fit rounded-full border px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
        {sit.label}
      </p>
      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
          <span className="text-slate-400">
            {learnedCount}/{total} câu
          </span>
          <span className="text-slate-700">{percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full ${set.accent}`} style={{ width: `${percent}%` }} />
        </div>
      </div>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-green-700">
        Xem mẫu câu
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}
