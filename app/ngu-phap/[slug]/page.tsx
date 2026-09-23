"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  BookMarked,
  Check,
  Lightbulb,
  Loader2,
  Network,
  Table2,
} from "lucide-react"

import { PageHeading } from "@/components/dashboard/page-heading"
import { SiteShell } from "@/components/dashboard/site-shell"
import { Highlighted } from "@/components/grammar/highlighted"
import { GrammarAiPractice } from "@/components/grammar/grammar-ai-practice"
import { useAuth } from "@/lib/auth-context"
import {
  getGrammarTopic,
  grammarLevelClass,
  type GrammarTopic,
} from "@/lib/data/grammar"
import { getMyGrammarSetBySlug } from "@/lib/user-grammar"
import { isGrammarLearned, setGrammarLearned } from "@/lib/grammar-progress"
import { saveGrammarLearnedCloud } from "@/lib/progress/grammar-progress-cloud"
import { logGrammarLearnedChange } from "@/lib/progress/study-log"
import { useStudySession } from "@/lib/study-tracker"

export default function NguPhapDetailPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  const { user, loading: authLoading, openAuthModal } = useAuth()

  const [topic, setTopic] = useState<GrammarTopic | null>(null)
  /** chủ điểm do chính user tạo (myg-*) → hiện nhãn "Của tôi" */
  const [mine, setMine] = useState(false)
  const [loading, setLoading] = useState(true)
  const [learned, setLearned] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      /* Đang chờ biết user đăng nhập hay chưa → chưa kết luận được */
      if (authLoading) return
      setLoading(true)
      try {
        /* Ưu tiên chủ điểm cá nhân, sau đó tới chủ điểm hệ thống */
        if (user) {
          const mySet = await getMyGrammarSetBySlug(user.uid, slug)
          if (mySet) {
            if (!cancelled) {
              setTopic(mySet)
              setMine(true)
            }
            return
          }
        }
        if (!cancelled) {
          setTopic(getGrammarTopic(slug) ?? null)
          setMine(false)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slug, user, authLoading])

  useEffect(() => {
    setLearned(isGrammarLearned(slug, user?.uid))
  }, [slug, user?.uid])

  /* Đếm thời gian học thật của phiên này */
  useStudySession({ uid: user?.uid, enabled: Boolean(topic) })

  if (loading || authLoading) {
    return (
      <SiteShell>
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
          <p className="mt-4 text-sm font-medium text-slate-500">Đang tải chủ điểm ngữ pháp…</p>
        </div>
      </SiteShell>
    )
  }

  if (!topic) {
    return (
      <SiteShell>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Network className="h-7 w-7" />
          </span>
          <p className="mt-4 text-lg font-bold text-slate-900">Không tìm thấy chủ điểm ngữ pháp</p>
          <p className="mt-1 text-sm text-slate-500">
            Chủ điểm này không tồn tại hoặc đã bị xóa.
          </p>
          <Link
            href="/ngu-phap"
            className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 transition-all hover:bg-purple-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Về trang ngữ pháp
          </Link>
        </div>
      </SiteShell>
    )
  }
  /** Đánh dấu / bỏ đánh dấu chủ điểm đã học + ghi nhận lên sổ tiến độ */
  const handleToggleLearned = () => {
    if (!user) {
      openAuthModal("login")
      return
    }
    const next = !learned
    setLearned(setGrammarLearned(topic.slug, user.uid, next))
    void logGrammarLearnedChange(user.uid, { slug: topic.slug, title: topic.name, on: next })
    void saveGrammarLearnedCloud(user.uid, topic.slug, next)
  }

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
          <span className="flex items-center gap-1.5">
            {mine && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                <BookMarked className="h-3 w-3" />
                Của tôi
              </span>
            )}
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${grammarLevelClass[topic.level]}`}
            >
              {topic.level}
            </span>
          </span>
        </PageHeading>
      </div>

      <button
        type="button"
        onClick={handleToggleLearned}
        className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${learned ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-purple-600 text-white hover:bg-purple-700"}`}
      >
        <Check className="h-4 w-4" />
        {learned ? "Đã học" : "Đánh dấu đã học"}
      </button>

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
          {topic.usage.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">Chưa có nội dung phần này.</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {topic.usage.map((u) => (
                <li
                  key={u}
                  className="flex gap-2.5 rounded-xl bg-purple-50/70 px-4 py-3 text-sm leading-relaxed text-slate-700"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />
                  {u}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Table2 className="h-5 w-5 text-purple-600" />
            3. Bảng công thức
          </h2>
          {topic.formulas.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">Chưa có nội dung phần này.</p>
          ) : (
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
                    <tr key={f.use + f.structure} className="transition-colors hover:bg-purple-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{f.use}</td>
                      <td className="px-4 py-3 font-mono text-[13px] text-purple-700">{f.structure}</td>
                      <td className="px-4 py-3 italic text-slate-600">{f.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <h2 className="text-lg font-bold text-slate-900">4. Ví dụ minh họa</h2>
          {topic.examples.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">Chưa có nội dung phần này.</p>
          ) : (
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
          )}
        </section>

        <GrammarAiPractice topic={topic} />
      </div>
    </SiteShell>
  )
}