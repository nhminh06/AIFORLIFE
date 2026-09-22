"use client"

import { useEffect, useState } from "react"
import { BookText, Play } from "lucide-react"
import Link from "next/link"
import { SectionHeading } from "./section-heading"
import { getAllVocabSets } from "@/lib/vocab-service"
import { loadVocabProgress } from "@/lib/vocab-progress"
import { useAuth } from "@/lib/auth-context"
import { getMyVocabSets } from "@/lib/user-vocab"

export function ContinueLearning() {
  const { user } = useAuth()
  const [lessons, setLessons] = useState<{ slug: string; title: string; desc: string; progress: number }[]>([])

  useEffect(() => {
    const load = () => Promise.all([getAllVocabSets(), user ? getMyVocabSets(user.uid) : Promise.resolve([])]).then(([systemSets, mySets]) => {
      const sets = [...mySets, ...systemSets]
      const items = sets.map((set) => ({
        slug: set.slug,
        title: set.name,
        desc: set.desc || set.vi,
        progress: set.total ? Math.round((loadVocabProgress(set.slug, user?.uid).size / set.total) * 100) : 0,
      })).filter((set) => set.progress > 0).sort((a, b) => b.progress - a.progress).slice(0, 3)
      setLessons(items)
    })
    load()
    const refresh = () => { load() }
    window.addEventListener("afl-vocab-progress-updated", refresh)
    window.addEventListener("focus", refresh)
    return () => {
      window.removeEventListener("afl-vocab-progress-updated", refresh)
      window.removeEventListener("focus", refresh)
    }
  }, [user?.uid])

  return (
    <section>
      <SectionHeading icon={Play} title="Tiếp tục học" action="Xem tất cả" actionHref="/tu-vung" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {lessons.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">Bạn chưa có bài đang học. Hãy bắt đầu với một bộ từ vựng.</p> : lessons.map((l) => {
          return (
            <Link
              key={l.slug}
              href={`/tu-vung/${l.slug}`}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">Từ vựng</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><BookText className="h-4.5 w-4.5" /></span>
              </div>
              <h3 className="mt-3 font-bold text-slate-900 dark:text-white">{l.title}</h3>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{l.desc}</p>
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-400 dark:text-slate-500">Hoàn thành</span>
                  <span className="text-slate-700 dark:text-slate-300">{l.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${l.progress}%` }}
                  />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
