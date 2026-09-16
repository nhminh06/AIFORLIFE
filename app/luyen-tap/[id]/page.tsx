import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Clock3, ListOrdered } from "lucide-react"

import { PageHeading } from "@/components/dashboard/page-heading"
import { SiteShell } from "@/components/dashboard/site-shell"
import { QuizRunner } from "@/components/practice/quiz-runner"
import { exercises, getPracticeType, statusClass } from "@/lib/data/practice"

export function generateStaticParams() {
  return exercises.map((e) => ({ id: e.id }))
}

type Props = { params: Promise<{ id: string }> }

export default async function LuyenTapDetailPage({ params }: Props) {
  const { id } = await params
  const exercise = exercises.find((e) => e.id === id)
  if (!exercise) notFound()

  const type = getPracticeType(exercise.typeId)
  const TypeIcon = type.icon

  return (
    <SiteShell>
      <Link
        href="/luyen-tap"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-orange-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Tất cả bài tập
      </Link>

      <div className="mt-3">
        <PageHeading
          icon={TypeIcon}
          title={exercise.name}
          desc={`${exercise.vi} · ${type.label}`}
          bubbleClass={type.iconClass}
        >
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass[exercise.status]}`}
          >
            {exercise.status}
          </span>
        </PageHeading>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
        <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 shadow-sm">
          <Clock3 className="h-3.5 w-3.5" />
          Khoảng {exercise.minutes} phút
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 shadow-sm">
          <ListOrdered className="h-3.5 w-3.5" />
          {exercise.items.length} câu hỏi
        </span>
      </div>

      <div className="mt-6">
        <QuizRunner exercise={exercise} />
      </div>
    </SiteShell>
  )
}
