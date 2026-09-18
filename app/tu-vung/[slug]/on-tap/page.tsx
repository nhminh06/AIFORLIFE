"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, RotateCcw, Shuffle } from "lucide-react"

import { PageHeading } from "@/components/dashboard/page-heading"
import { SiteShell } from "@/components/dashboard/site-shell"
import { VocabularyLearner } from "@/components/vocab/vocabulary-learner"
import { useAuth } from "@/lib/auth-context"
import type { VocabSet } from "@/lib/data/vocabulary"
import { loadVocabProgress } from "@/lib/vocab-progress"
import { getVocabSetBySlug } from "@/lib/vocab-service"

export default function OnTapPage() {
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
  /* Tăng mỗi lần bấm "Từ ngẫu nhiên" để remount learner ngay cả khi trùng từ */
  const [nonce, setNonce] = useState(0)

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
  }, [slug, uid])

  const queue = useMemo(() => {
    if (!set) return []
    return set.words.filter((w) => learnedKeys.has(w.en.toLowerCase()))
  }, [set, learnedKeys])

  /* index trực tiếp, không clamp: vượt quá cuối danh sách → current là
     undefined → hiện màn hình "Ôn tập xong" thay vì kẹt ở từ cuối */
  const current = queue[index]

  if (loading || !progressReady) {
    return (
      <SiteShell>
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="mt-4 text-sm font-medium text-slate-500">Đang tải bộ từ vựng...</p>
        </div>
      </SiteShell>
    )
  }

  if (!set) {
    return (
      <SiteShell>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="mt-4 text-lg font-bold text-slate-900">Không tìm thấy bộ từ vựng</p>
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

  if (queue.length === 0) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-2xl py-10 text-center">
          <h1 className="text-xl font-bold text-slate-900">Chưa có từ nào để ôn tập</h1>
          <p className="mt-1 text-sm text-slate-500">
            Học xong 1 từ ở chế độ Học thì từ đó mới xuất hiện ở đây để ôn lại.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={"/tu-vung/" + slug + "/hoc"}
              className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-600/25 transition-all hover:bg-green-700"
            >
              Học từ ngay
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

  if (!current) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-2xl py-10 text-center">
          <h1 className="text-xl font-bold text-slate-900">Ôn tập xong!</h1>
          <p className="mt-1 text-sm text-slate-500">
            Bạn đã ôn hết {queue.length} từ đã thuộc trong bộ này.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => setIndex(0)}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
            >
              Ôn lại từ đầu
            </button>
            <Link
              href={"/tu-vung/" + slug}
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700"
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
          icon={RotateCcw}
          title={"Ôn tập: " + set.name}
          desc={"Từ " + (queue.length === 0 ? 0 : Math.min(index, queue.length - 1) + 1) + "/" + queue.length + " đã thuộc"}
        />
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setIndex(Math.floor(Math.random() * queue.length))
            setNonce((n) => n + 1)
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200"
        >
          <Shuffle className="h-3.5 w-3.5" />
          Từ ngẫu nhiên
        </button>
      </div>
      <div className="mt-4">
        <VocabularyLearner
          key={current.en.toLowerCase() + "-" + index + "-" + nonce}
          word={current}
          mode="review"
          uid={uid}
          onLearned={() => {}}
          onWordDone={() => setIndex((prev) => prev + 1)}
          onBack={() => router.push("/tu-vung/" + slug)}
        />
      </div>
    </SiteShell>
  )
}
