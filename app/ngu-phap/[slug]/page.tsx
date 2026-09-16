import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, Lightbulb, Network, Table2 } from "lucide-react"

import { PageHeading } from "@/components/dashboard/page-heading"
import { SiteShell } from "@/components/dashboard/site-shell"
import { Highlighted } from "@/components/grammar/highlighted"
import { grammarLevelClass, grammarTopics } from "@/lib/data/grammar"

export function generateStaticParams() {
  return grammarTopics.map((t) => ({ slug: t.slug }))
}

type Props = { params: Promise<{ slug: string }> }

export default async function NguPhapDetailPage({ params }: Props) {
  const { slug } = await params
  const topic = grammarTopics.find((t) => t.slug === slug)
  if (!topic) notFound()

  return (
    <SiteShell>
      <Link
        href="/ngu-phap"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-purple-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Tất cả chủ điểm ngữ pháp
      </Link>

      <div className="mt-3">
        <PageHeading
          icon={Network}
          title={topic.name}
          desc={topic.vi}
          bubbleClass="bg-purple-600"
        >
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${grammarLevelClass[topic.level]}`}>
            {topic.level} · {topic.progress}%
          </span>
        </PageHeading>
      </div>

      <div className="mt-6 max-w-4xl space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <h2 className="text-lg font-bold text-slate-900">1. Khái niệm</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">{topic.intro}</p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            2. Khi nào dùng?
          </h2>
          <ul className="mt-3 space-y-2.5">
            {topic.usage.map((u) => (
              <li key={u} className="flex gap-2.5 rounded-xl bg-purple-50/70 px-4 py-3 text-sm leading-relaxed text-slate-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />
                {u}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Table2 className="h-5 w-5 text-purple-600" />
            3. Bảng công thức
          </h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="bg-purple-600 text-white">
                  <th className="px-4 py-3 font-semibold">Cách dùng</th>
                  <th className="px-4 py-3 font-semibold">Cấu trúc</th>
                  <th className="px-4 py-3 font-semibold">Ví dụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topic.formulas.map((f) => (
                  <tr key={f.use} className="transition-colors hover:bg-purple-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{f.use}</td>
                    <td className="px-4 py-3 font-mono text-[13px] text-purple-700">{f.structure}</td>
                    <td className="px-4 py-3 italic text-slate-600">{f.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <h2 className="text-lg font-bold text-slate-900">4. Ví dụ minh họa</h2>
          <ul className="mt-3 space-y-3">
            {topic.examples.map((e) => (
              <li key={e.en} className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold leading-relaxed text-slate-900 sm:text-base">
                  <Highlighted text={e.en} />
                </p>
                <p className="mt-1 text-sm text-slate-500">{e.vi}</p>
              </li>
            ))}
          </ul>
        </section>

        <Link
          href={`/luyen-tap/${topic.practiceId}`}
          className="group inline-flex items-center gap-2 rounded-full bg-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 transition-all hover:bg-purple-700"
        >
          Làm bài tập ngay
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </SiteShell>
  )
}
