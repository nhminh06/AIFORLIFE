import { ArrowRight, MessageCircle } from "lucide-react"
import Link from "next/link"

import { getPhraseSituation, levelClass, type PhraseSet } from "@/lib/data/phrases"

function pct(s: PhraseSet) {
  return s.total === 0 ? 0 : Math.round((s.learned / s.total) * 100)
}

export function PhraseSetCard({ set }: { set: PhraseSet }) {
  const sit = getPhraseSituation(set.situationId)
  const percent = pct(set)
  return (
    <Link
      href={`/mau-cau/${set.slug}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-600 text-white shadow-sm">
          <MessageCircle className="h-5 w-5" />
        </span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${levelClass[set.level]}`}>
          {set.level}
        </span>
      </div>
      <h3 className="mt-3 font-bold text-slate-900 group-hover:text-green-700">{set.name}</h3>
      <p className="mt-0.5 text-sm text-slate-500">{set.vi}</p>
      <p className="mt-1 inline-flex w-fit rounded-full border px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
        {sit.label}
      </p>
      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
          <span className="text-slate-400">
            {set.learned}/{set.total} câu
          </span>
          <span className="text-slate-700">{percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-green-600" style={{ width: `${percent}%` }} />
        </div>
      </div>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-green-700">
        Xem mẫu câu
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}
