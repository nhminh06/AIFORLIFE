"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, GraduationCap, Loader2, RotateCcw } from "lucide-react"

import { PageHeading } from "@/components/dashboard/page-heading"
import { SiteShell } from "@/components/dashboard/site-shell"
import { VocabularyLearner } from "@/components/vocab/vocabulary-learner"
import { useAuth } from "@/lib/auth-context"
import type { VocabSet, VocabWord } from "@/lib/data/vocabulary"
import { loadVocabProgress, markVocabLearned } from "@/lib/vocab-progress"
import { getVocabSetBySlug } from "@/lib/vocab-service"
import { logVocabLearnedChange, logVocabSetCompleted } from "@/lib/progress/study-log"
import { queueVocabProgressSync } from "@/lib/progress/vocab-progress-cloud"
import { useStudySession } from "@/lib/study-tracker"

export default function HocTuPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  const router = useRouter()
  const { user } = useAuth()
  const uid = user?.uid ?? null

  const [set, setSet] = useState<VocabSet | null>(null)
  const [loading, setLoading] = useState(true)
  const [learnedKeys, setLearnedKeys] = useState<Set<string>>(new Set())
  const [progressReady, setProgressReady] = useState(false)
  const [index, setIndex] = useState(0)
  /**
   * Danh sách từ của phiên học này, chụp nhanh 1 lần lúc vào trang.
   * Không lọc trực tiếp từ learnedKeys để màn hình "done" của 1 từ
   * không bị unmount ngay khi từ đó vừa được đánh dấu đã thuộc.
   */
  const [sessionWords, setSessionWords] = useState<VocabWord[] | null>(null)

  /* Đếm thời gian học thật của phiên này (nguồn cho biểu đồ "Thời gian học theo ngày") */
  useStudySession({ uid, enabled: Boolean(set) })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const data = await getVocabSetBySlug(slug, uid ?? undefined)
        if (!cancelled) setSet(data)
      } catch {
        if (!cancelled) setSet(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slug, uid])

  useEffect(() => {
    setLearnedKeys(loadVocabProgress(slug, uid))
    setProgressReady(true)
    setIndex(0)
    setSessionWords(null)
  }, [slug, uid])

  /* Có bộ từ + tiến độ → chụp nhanh danh sách từ cần học cho phiên này */
  useEffect(() => {
    if (!set || !progressReady) return
    const learned = loadVocabProgress(slug, uid)
    setSessionWords(set.words.filter((w) => !learned.has(w.en.toLowerCase())))
    setIndex(0)
  }, [set, progressReady, slug, uid])

  const queue = sessionWords ?? []

  /* index trực tiếp, không clamp: khi vượt quá cuối danh sách thì current
     là undefined → hiện màn hình "đã học hết" */
  const current = queue[index]
  const displayPos = queue.length === 0 ? 0 : Math.min(index, queue.length - 1) + 1
  const total = set?.words.length ?? 0
  /* Tiến độ live (kể cả từ vừa thuộc trong phiên) cho thanh progress */
  const learnedCount = set ? set.words.filter((w) => learnedKeys.has(w.en.toLowerCase())).length : 0
  const percent = total === 0 ? 0 : Math.round((learnedCount / total) * 100)

  const handleLearned = () => {
    if (!current || !set) return
    const next = markVocabLearned(slug, uid, current.en.toLowerCase())
    setLearnedKeys(next)
    /* Ghi nhận lên sổ tiến độ: số từ mới + XP + sự kiện trong ngày */
    void logVocabLearnedChange(uid, { slug, title: set.name, on: true })
    queueVocabProgressSync(uid, slug, next)
    if (set.words.length > 0 && set.words.every((w) => next.has(w.en.toLowerCase()))) {
      void logVocabSetCompleted(uid, { slug, title: set.name })
    }
  }

  const handleWordDone = () => {
    setIndex((prev) => prev + 1)
  }

  if (loading || !progressReady || (!!set && sessionWords === null)) {
    return (
      <SiteShell>
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="mt-4 text-sm font-medium text-slate-500">Đang tải bộ từ vựng...</p>
        </div>
      </SiteShell>
    )
  }

  /* Học lại từ đầu → chụp nhanh lại danh sách từ phiên mới (bỏ từ đã thuộc trước đó) */
  const handleRestart = () => {
    if (!set) return
    setSessionWords(set.words.filter((w) => !loadVocabProgress(slug, uid).has(w.en.toLowerCase())))
    setIndex(0)
  }

  if (!set || total === 0) {
    return (
      <SiteShell>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="mt-4 text-lg font-bold text-slate-900">Không tìm thấy bộ từ vựng</p>
          <p className="mt-1 text-sm text-slate-500">Bộ từ này không tồn tại hoặc chưa có từ nào.</p>
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

  if (!current) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-2xl py-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Bạn đã học hết bộ từ này!</h1>
          <p className="mt-1 text-sm text-slate-500">
            Đã thuộc {learnedCount}/{total} từ. Hãy ôn tập để ghi nhớ lâu hơn.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={handleRestart}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
            >
              <RotateCcw className="h-4 w-4" />
              Học lại từ đầu
            </button>
            <Link
              href={"/tu-vung/" + slug + "/on-tap"}
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700"
            >
              Ôn tập từ đã thuộc
            </Link>
            <Link
              href={"/tu-vung/" + slug}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Về bộ từ
            </Link>
          </div>
        </div>
      </SiteShell>
    )
  }

  return (
    <SiteShell>
      <Link
        href={"/tu-vung/" + slug}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {set.name}
      </Link>
      <div className="mt-3">
        <PageHeading
          icon={GraduationCap}
          title={"Học từ: " + set.name}
          desc={"Từ " + displayPos + "/" + queue.length + " cần học – Đã thuộc " + learnedCount + "/" + total + " từ"}
        />
      </div>
      <div className="mt-4 overflow-hidden rounded-full bg-slate-200">
        <div className="h-2.5 rounded-full bg-green-500 transition-all" style={{ width: percent + "%" }} />
      </div>
      <div className="mt-6">
        <VocabularyLearner
          key={current.en.toLowerCase() + "-" + index}
          word={current}
          mode="learn"
          uid={uid}
          onLearned={handleLearned}
          onWordDone={handleWordDone}
          onBack={() => router.push("/tu-vung/" + slug)}
        />
      </div>
    </SiteShell>
  )
}
