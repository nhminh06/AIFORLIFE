"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, CheckCircle2, Loader2, MessageCircle } from "lucide-react"

import { PageHeading } from "@/components/dashboard/page-heading"
import { SiteShell } from "@/components/dashboard/site-shell"
import { StudyStatsCard } from "@/components/dashboard/study-stats-card"
import { PhraseList } from "@/components/phrases/phrase-list"
import { useAuth } from "@/lib/auth-context"
import { getPhraseSituation, levelClass, type PhraseSet } from "@/lib/data/phrases"
import {
  loadPhraseProgress,
  loadPhraseProgressCloud,
  markPhraseLearned,
  savePhraseProgressCloud,
  unmarkPhraseLearned,
} from "@/lib/phrase-progress"
import { getPhraseSetBySlug } from "@/lib/phrase-service"
import { syncMyPhraseLearned } from "@/lib/user-phrases"
import { logPhraseLearnedChange, logPhraseSetCompleted } from "@/lib/progress/study-log"
import { useStudySession } from "@/lib/study-tracker"
import { cn } from "@/lib/utils"

export default function MauCauDetailPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  const { user, openAuthModal } = useAuth()

  const [set, setSet] = useState<(PhraseSet & { ownerId?: string }) | null>(null)
  const [loading, setLoading] = useState(true)
  /** các câu đã đánh dấu "đã học" (key = en.toLowerCase()) */
  const [learnedKeys, setLearnedKeys] = useState<Set<string>>(new Set())

  const uid = user?.uid

  /* Đếm thời gian học thật của phiên này */
  useStudySession({ uid, enabled: Boolean(set) })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        /* Ưu tiên bộ mẫu câu cá nhân của user đang đăng nhập */
        const data = await getPhraseSetBySlug(slug, uid)
        if (!cancelled) setSet(data)
      } catch {
        /* fallback handled inside service */
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slug, uid])

  /* Nạp tiến độ đã học: localStorage trước (nhanh), rồi Firestore khi đăng nhập (nguồn chuẩn) */
  useEffect(() => {
    let cancelled = false
    setLearnedKeys(uid ? loadPhraseProgress(slug, uid) : new Set())
    if (!uid) return
    ;(async () => {
      const cloud = await loadPhraseProgressCloud(slug, uid)
      /* Firestore thắng localStorage để tiến độ nhất quán giữa các thiết bị */
      if (!cancelled && cloud) setLearnedKeys(cloud)
    })()
    return () => {
      cancelled = true
    }
  }, [slug, uid])

  if (loading) {
    return (
      <SiteShell>
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-green-600" />
          <p className="mt-4 text-sm font-medium text-slate-500">Đang tải bộ mẫu câu…</p>
        </div>
      </SiteShell>
    )
  }

  if (!set) {
    return (
      <SiteShell>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <MessageCircle className="h-7 w-7" />
          </span>
          <p className="mt-4 text-lg font-bold text-slate-900">Không tìm thấy bộ mẫu câu</p>
          <p className="mt-1 text-sm text-slate-500">
            {!uid && slug.startsWith("my-")
              ? "Bạn cần đăng nhập để xem bộ mẫu câu cá nhân này."
              : "Bộ mẫu câu này không tồn tại hoặc đã bị xóa."}
          </p>
          <Link
            href="/mau-cau"
            className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-600/25 transition-all hover:bg-green-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Tất cả mẫu câu
          </Link>
        </div>
      </SiteShell>
    )
  }

  const sit = getPhraseSituation(set.situationId, set.situationLabel)
  /* Tiến độ thật = số câu đã đánh dấu "đã học" trong localStorage/Firestore */
  const learnedCount = set.items.filter((p) => learnedKeys.has(p.en.trim().toLowerCase())).length
  /* Mẫu số = số câu thực tế trong bộ (số total tĩnh có thể sai) */
  const total = set.items.length || set.total
  const percent = total === 0 ? 0 : Math.round((learnedCount / total) * 100)
  /** bộ này do chính user đang đăng nhập tạo → được phép ghi tiến độ lên Firestore */
  const isMine = Boolean(uid && set.ownerId && set.ownerId === uid)

  /** Đánh dấu đã học + lưu localStorage + đồng bộ Firestore (bộ cá nhân) */
  const handleLearnedChange = (phraseKey: string, on: boolean) => {
    if (!user) {
      openAuthModal("login")
      return
    }
    const next = new Set(learnedKeys)
    if (on) next.add(phraseKey)
    else next.delete(phraseKey)
    setLearnedKeys(next)

    if (on) markPhraseLearned(slug, uid, phraseKey)
    else unmarkPhraseLearned(slug, uid, phraseKey)

    /* Lưu tiến độ riêng của user lên Firestore — áp dụng cho MỌI bộ mẫu câu */
    if (uid) void savePhraseProgressCloud(slug, uid, next)

    /* Với bộ cá nhân, cập nhật thêm số learned trên chính bộ để nơi khác đọc được */
    if (isMine && uid) {
      const count = set.items.filter((p) => next.has(p.en.trim().toLowerCase())).length
      void syncMyPhraseLearned(uid, slug, count)
    }

    /* Ghi nhận lên sổ tiến độ học tập (bộ đếm ngày + XP + lịch sử hoạt động) */
    void logPhraseLearnedChange(user.uid, { slug, title: set.name, on })
    const keyedItems = set.items.map((p) => p.en.trim().toLowerCase())
    if (on && keyedItems.length > 0 && keyedItems.every((k) => next.has(k))) {
      void logPhraseSetCompleted(user.uid, { slug, title: set.name })
    }
  }

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
          desc={`${set.vi} · ${total} mẫu câu · Tình huống: ${sit.label}`}
          bubbleClass={set.accent}
        >
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${levelClass[set.level]}`}>
            {set.level}
          </span>
        </PageHeading>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Tiến độ của bạn
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{percent}%</p>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className={`h-full rounded-full ${set.accent}`} style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Đã học {learnedCount}/{total} mẫu câu trong bộ này. Tiếp tục cố gắng nhé!
            </p>
          </div>

          <div className="mt-4">
            <PhraseList
              items={set.items}
              learnedKeys={learnedKeys}
              onLearnedChange={handleLearnedChange}
            />
          </div>
        </div>

        <aside className="space-y-6">
          {/* Card trang trí: mẹo học, nền gradient theo màu nhấn của bộ */}
          <section
            className={cn(
              "relative overflow-hidden rounded-3xl p-6 text-white shadow-lg",
              set.accent
            )}
          >
            <div className="absolute -right-3 -top-6 select-none text-[88px] leading-none opacity-20">
              💬
            </div>
            <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/15" />
            <p className="relative text-xs font-bold uppercase tracking-widest text-white/80">
              Mẹo học hiệu quả
            </p>
            <p className="relative mt-2 text-sm leading-relaxed text-white/95">
              Đọc to mẫu câu 2–3 lần, hình dung tình huống dùng nó, rồi bấm
              &nbsp;<span className="font-bold">Đánh dấu đã học</span>&nbsp;khi nói được tự nhiên.
              Quay lại lượt sau để học tiếp 8 câu mới!
            </p>
          </section>

          {/* Thông tin bộ mẫu câu */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <MessageCircle className="h-4 w-4 text-green-600" />
              Về bộ mẫu câu này
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {set.desc || "Bộ mẫu câu giúp bạn giao tiếp tự nhiên trong tình huống thực tế."}
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                <dt className="text-slate-500 dark:text-slate-400">Tình huống</dt>
                <dd className="max-w-[60%] text-right font-semibold text-slate-900 dark:text-slate-100">
                  {sit.label}
                </dd>
              </div>
              <div className="flex justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                <dt className="text-slate-500 dark:text-slate-400">Tổng số câu</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100">{total} câu</dd>
              </div>
              <div className="flex justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                <dt className="text-slate-500 dark:text-slate-400">Đã học</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100">
                  {learnedCount}/{total} câu
                </dd>
              </div>
              <div className="flex justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                <dt className="text-slate-500 dark:text-slate-400">Cấp độ</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100">{set.level}</dd>
              </div>
            </dl>
          </section>

          <StudyStatsCard />
        </aside>
      </div>
    </SiteShell>
  )
}
