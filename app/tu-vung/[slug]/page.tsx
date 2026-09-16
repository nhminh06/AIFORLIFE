import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, BookOpenText, CheckCircle2 } from "lucide-react"

import { PageHeading } from "@/components/dashboard/page-heading"
import { SiteShell } from "@/components/dashboard/site-shell"
import { StudyStatsCard } from "@/components/dashboard/study-stats-card"
import { VocabWordRow } from "@/components/vocab/vocab-word-row"
import { getVocabTopic, levelClass, vocabSets } from "@/lib/data/vocabulary"

export function generateStaticParams() {
  return vocabSets.map((s) => ({ slug: s.slug }))
}

type Props = { params: Promise<{ slug: string }> }

export default async function TuVungDetailPage({ params }: Props) {
  const { slug } = await params
  const set = vocabSets.find((s) => s.slug === slug)
  if (!set) notFound()

  const topic = getVocabTopic(set.topicId)
  const TopicIcon = topic.icon
  const percent = set.total === 0 ? 0 : Math.round((set.learned / set.total) * 100)

  return (
    <SiteShell>
      <Link
        href="/tu-vung"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Tất cả bộ từ vựng
      </Link>

      <div className="mt-3">
        <PageHeading
          icon={TopicIcon}
          title={set.name}
          desc={`${set.vi} · ${set.words.length} từ mẫu trong bài này`}
          bubbleClass={topic.iconClass}
        >
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${levelClass[set.level]}`}>
            {set.level}
          </span>
        </PageHeading>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Tiến độ của bạn
              </p>
              <p className="text-sm font-bold text-slate-900">{percent}%</p>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${set.accent}`} style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Đã học {set.learned}/{set.total} từ trong bộ này. Tiếp tục cố gắng nhé!
            </p>
          </div>

          <ul className="mt-4 space-y-3">
            {set.words.map((w) => (
              <VocabWordRow key={w.en} word={w} />
            ))}
          </ul>

          <Link
            href="/luyen-tap"
            className="group mt-6 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700"
          >
            Ôn tập với bài trắc nghiệm
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <BookOpenText className="h-4 w-4 text-blue-600" />
              Về bộ từ này
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{set.desc}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between rounded-xl bg-slate-50 px-3 py-2">
                <dt className="text-slate-500">Chủ đề</dt>
                <dd className="font-semibold text-slate-900">{topic.label}</dd>
              </div>
              <div className="flex justify-between rounded-xl bg-slate-50 px-3 py-2">
                <dt className="text-slate-500">Tổng số từ</dt>
                <dd className="font-semibold text-slate-900">{set.total} từ</dd>
              </div>
              <div className="flex justify-between rounded-xl bg-slate-50 px-3 py-2">
                <dt className="text-slate-500">Cấp độ</dt>
                <dd className="font-semibold text-slate-900">{set.level}</dd>
              </div>
            </dl>
          </section>
          <StudyStatsCard />
        </aside>
      </div>
    </SiteShell>
  )
}
