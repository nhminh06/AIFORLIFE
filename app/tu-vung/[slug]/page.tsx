"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, ArrowRight, BookMarked, BookOpenText, CheckCircle2, Loader2 } from "lucide-react"

import { PageHeading } from "@/components/dashboard/page-heading"
import { SiteShell } from "@/components/dashboard/site-shell"
import { StudyStatsCard } from "@/components/dashboard/study-stats-card"
import { VocabWordRow } from "@/components/vocab/vocab-word-row"
import { useAuth } from "@/lib/auth-context"
import { getSetIcon } from "@/lib/data/set-icons"
import { getVocabTopicForSet, levelClass, type VocabSet } from "@/lib/data/vocabulary"
import { getVocabSetBySlug } from "@/lib/vocab-service"

export default function TuVungDetailPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  const { user } = useAuth()

  const [set, setSet] = useState<VocabSet | null>(null)
  const [loading, setLoading] = useState(true)

  const uid = user?.uid

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        // Ưu tiên bộ từ cá nhân của user đang đăng nhập
        const data = await getVocabSetBySlug(slug, uid)
        if (!cancelled) setSet(data)
      } catch {
        // fallback handled inside service
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [slug, uid])

  if (loading) {
    return (
      <SiteShell>
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="mt-4 text-sm font-medium text-slate-500">Đang tải bộ từ vựng…</p>
        </div>
      </SiteShell>
    )
  }

  if (!set) {
    return (
      <SiteShell>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <BookOpenText className="h-7 w-7" />
          </span>
          <p className="mt-4 text-lg font-bold text-slate-900">Không tìm thấy bộ từ vựng</p>
          <p className="mt-1 text-sm text-slate-500">Bộ từ này không tồn tại hoặc đã bị xóa.</p>
          <Link
            href="/tu-vung"
            className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Link>
        </div>
      </SiteShell>
    )
  }

  const topic = getVocabTopicForSet(set)
  const TopicIcon = getSetIcon(set.icon) ?? topic.icon
  const percent = set.total === 0 ? 0 : Math.round((set.learned / set.total) * 100)
  /** bộ từ này do chính user đang đăng nhập tạo */
  const isMine = Boolean(uid && set.ownerId && set.ownerId === uid)

  /* Hiển thị toàn bộ từ của bộ — phân trang chỉ ở danh sách bộ từ */
  const totalWords = set.words.length

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
          desc={`${set.vi} · ${set.words.length} từ trong bài này`}
          bubbleClass={topic.iconClass}
        >
          <div className="flex flex-wrap items-center gap-2">
            {isMine && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                <BookMarked className="h-3.5 w-3.5" />
                Bộ từ của bạn
              </span>
            )}
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${levelClass[set.level]}`}>
              {set.level}
            </span>
          </div>
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

          <div className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <p className="text-xs font-semibold text-slate-500">
                {totalWords === 0
                  ? "Bộ từ này chưa có từ vựng nào"
                  : `${totalWords} từ trong bộ`}
              </p>
            </div>

            <ul className="mt-3 space-y-3">
              {set.words.map((w, i) => (
                <VocabWordRow key={`${w.en}-${i}`} word={w} />
              ))}
            </ul>
          </div>

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
