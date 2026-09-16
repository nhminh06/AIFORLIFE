import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CheckCircle2, MessageCircle } from "lucide-react"

import { PageHeading } from "@/components/dashboard/page-heading"
import { SiteShell } from "@/components/dashboard/site-shell"
import { PhraseRow } from "@/components/phrases/phrase-row"
import { getPhraseSituation, levelClass, phraseSets } from "@/lib/data/phrases"

export function generateStaticParams() {
  return phraseSets.map((s) => ({ slug: s.slug }))
}

type Props = { params: Promise<{ slug: string }> }

export default async function MauCauDetailPage({ params }: Props) {
  const { slug } = await params
  const set = phraseSets.find((s) => s.slug === slug)
  if (!set) notFound()

  const sit = getPhraseSituation(set.situationId)
  const percent = set.total === 0 ? 0 : Math.round((set.learned / set.total) * 100)

  return (
    <SiteShell>
      <Link
        href="/mau-cau"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-green-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Tất cả mẫu câu
      </Link>

      <div className="mt-3">
        <PageHeading
          icon={MessageCircle}
          title={set.name}
          desc={`${set.vi} · ${set.total} mẫu câu · Tình huống: ${sit.label}`}
          bubbleClass="bg-green-600"
        >
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${levelClass[set.level]}`}>
            {set.level}
          </span>
        </PageHeading>
      </div>

      <div className="mt-6 max-w-4xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Tiến độ của bạn
            </p>
            <p className="text-sm font-bold text-slate-900">{percent}%</p>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-green-600" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-2 text-sm text-slate-500">{set.desc}</p>
        </div>

        <ul className="mt-4 space-y-3">
          {set.items.map((i) => (
            <PhraseRow key={i.en} en={i.en} vi={i.vi} />
          ))}
        </ul>
      </div>
    </SiteShell>
  )
}
