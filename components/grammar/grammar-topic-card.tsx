import { ArrowRight, Network } from "lucide-react"
import Link from "next/link"

import { grammarLevelClass, type GrammarTopic } from "@/lib/data/grammar"

export function GrammarTopicCard({ topic }: { topic: GrammarTopic }) {
  return (
    <Link
      href={`/ngu-phap/${topic.slug}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm">
          <Network className="h-5 w-5" />
        </span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${grammarLevelClass[topic.level]}`}>
          {topic.level}
        </span>
      </div>
      <h3 className="mt-3 font-bold text-slate-900 group-hover:text-purple-700">{topic.name}</h3>
      <p className="mt-0.5 text-sm text-slate-500">{topic.vi}</p>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">{topic.desc}</p>
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
          <span className="text-slate-400">Đã học</span>
          <span className="text-slate-700">{topic.progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-purple-600" style={{ width: `${topic.progress}%` }} />
        </div>
      </div>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-purple-700">
        Học ngay
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}
