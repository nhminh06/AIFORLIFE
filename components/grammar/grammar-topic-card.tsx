"use client"

import { useEffect, useState } from "react"
import { ArrowRight, Network } from "lucide-react"
import Link from "next/link"

import { grammarLevelClass, type GrammarTopic } from "@/lib/data/grammar"
import { isGrammarLearned } from "@/lib/grammar-progress"
import { useAuth } from "@/lib/auth-context"

export function GrammarTopicCard({ topic }: { topic: GrammarTopic }) {
  const { user } = useAuth()
  const [learned, setLearned] = useState(false)

  useEffect(() => {
    const refresh = () => setLearned(isGrammarLearned(topic.slug, user?.uid) || topic.progress >= 100)
    refresh()
    window.addEventListener("afl-grammar-progress-updated", refresh)
    return () => window.removeEventListener("afl-grammar-progress-updated", refresh)
  }, [topic.slug, topic.progress, user?.uid])

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
      <span className={`mt-4 inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${learned ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
        {learned ? "Đã học" : "Chưa học"}
      </span>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-purple-700">
        Học ngay
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}
