"use client"

import { useEffect, useState } from "react"
import { ArrowRight, RefreshCw, Sparkles, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { SectionHeading } from "./section-heading"
import { getAllVocabSets } from "@/lib/vocab-service"
import { getVocabTopicForSet, vocabLevelLabels } from "@/lib/data/vocabulary"
import { getSetIcon } from "@/lib/data/set-icons"

export function FeaturedLessons() {
  const [allLessons, setAllLessons] = useState<{ slug: string; title: string; meta: string; icon: LucideIcon; iconClass: string }[]>([])
  const [page, setPage] = useState(0)

  useEffect(() => {
    getAllVocabSets().then((sets) => setAllLessons(sets.map((set) => {
      const topic = getVocabTopicForSet(set)
      return {
        slug: set.slug,
        title: set.name,
        meta: `${set.total} từ · ${vocabLevelLabels[set.level]}`,
        icon: getSetIcon(set.icon) ?? topic.icon,
        iconClass: topic.iconClass,
      }
    })))
  }, [])

  const totalPages = Math.max(1, Math.ceil(allLessons.length / 4))
  const lessons = allLessons.slice(page * 4, page * 4 + 4)
  const nextPage = () => setPage((current) => (current + 1) % totalPages)

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <SectionHeading icon={Sparkles} title="Bài học nổi bật" action="Xem tất cả" actionHref="/tu-vung" />
        <button type="button" onClick={nextPage} disabled={totalPages <= 1} aria-label="Đổi bài học nổi bật" title="Đổi bài học nổi bật" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"><RefreshCw className="h-4 w-4" /></button>
      </div>
      <div className="mt-4 space-y-3">
        {lessons.map((l) => {
          const Icon = l.icon
          return <Link
            key={l.title}
            href={`/tu-vung/${l.slug}`}
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/50 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
          >
            <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl ${l.iconClass} text-white`}><Icon className="h-6 w-6" /></span>
            <div className="min-w-0 flex-1">
              <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">Từ vựng</span>
              <h3 className="mt-1.5 truncate font-bold text-slate-900 dark:text-white">
                {l.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{l.meta}</p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300" />
          </Link>
        })}
      </div>
    </section>
  )
}
