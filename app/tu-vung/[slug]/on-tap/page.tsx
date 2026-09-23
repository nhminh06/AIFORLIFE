"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, RefreshCw, RotateCcw, Shuffle } from "lucide-react"

import { PageHeading } from "@/components/dashboard/page-heading"
import { SiteShell } from "@/components/dashboard/site-shell"
import { VocabularyLearner } from "@/components/vocab/vocabulary-learner"
import { useAuth } from "@/lib/auth-context"
import type { VocabSet } from "@/lib/data/vocabulary"
import { loadVocabProgress } from "@/lib/vocab-progress"
import { getVocabSetBySlug } from "@/lib/vocab-service"
import { recordReviewRound } from "@/lib/progress/study-log"
import { useStudySession } from "@/lib/study-tracker"

/* Xáo trộn mảng bằng thuật toán Fisher–Yates (không đổi mảng gốc) */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* Key lưu lựa chọn "ôn ngẫu nhiên" theo user + bộ từ, giống quy ước vocab-progress */
function shuffleStorageKey(slug: string, uid?: string | null): string {
  return `afl:vocab-review-shuffle:${uid || "guest"}:${slug}`
}

function loadShuffleMode(slug: string, uid?: string | null): boolean {
  if (typeof window === "undefined") return false
  try {
    return window.localStorage.getItem(shuffleStorageKey(slug, uid)) === "1"
  } catch {
    return false
  }
}

function saveShuffleMode(slug: string, uid: string | null | undefined, on: boolean): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(shuffleStorageKey(slug, uid), on ? "1" : "0")
  } catch {
    // localStorage bị chặn → chỉ giữ lựa chọn trong phiên này
  }
}

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

  /* Đếm thời gian học thật của phiên ôn tập */
  useStudySession({ uid, enabled: progressReady })
  const [index, setIndex] = useState(0)
  /* Tăng mỗi lần bấm "Từ ngẫu nhiên" để remount learner ngay cả khi trùng từ */
  const [nonce, setNonce] = useState(0)
  /* Chế độ ôn ngẫu nhiên: bật → các từ xuất hiện theo thứ tự đã xáo trộn */
  const [shuffleMode, setShuffleMode] = useState(false)
  /* Bản sao đã xáo trộn của hàng đợi (chỉ dùng khi shuffleMode bật) */
  const [shuffledQueue, setShuffledQueue] = useState<VocabSet["words"]>([])
  /* Tăng để yêu cầu xáo trộn lại thứ tự mà không bật/tắt chế độ */
  const [shuffleSeed, setShuffleSeed] = useState(0)
  /* Cờ: lần xáo trộn kế tiếp đưa về từ đầu tiên thay vì giữ từ đang xem */
  const resetToFirstRef = useRef(false)

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
    setShuffleMode(loadShuffleMode(slug, uid))
    setProgressReady(true)
    setIndex(0)
  }, [slug, uid])

  /* Ghi nhận 1 lượt ôn tập cho ngày hôm nay (mỗi lần vào trang tính 1 lượt) */
  useEffect(() => {
    if (!progressReady || !set) return
    void recordReviewRound(uid, { slug })
  }, [progressReady, set, slug, uid])

  const queue = useMemo(() => {
    if (!set) return []
    return set.words.filter((w) => learnedKeys.has(w.en.toLowerCase()))
  }, [set, learnedKeys])

  /* Khi bật/tắt chế độ ngẫu nhiên hoặc xáo trộn lại: tạo thứ tự mới.
     Mặc định giữ nguyên từ đang xem (nếu nó có trong thứ tự mới),
     trừ khi resetToFirstRef được đặt → quay về từ đầu tiên. */
  useEffect(() => {
    if (!shuffleMode || queue.length === 0) return
    const next = shuffleArray(queue)
    let idx = 0
    if (!resetToFirstRef.current) {
      const curKey = queue[index]?.en.toLowerCase()
      if (curKey) {
        const found = next.findIndex((w) => w.en.toLowerCase() === curKey)
        if (found >= 0) idx = found
      }
    }
    resetToFirstRef.current = false
    setShuffledQueue(next)
    setIndex(idx)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy khi đổi bộ từ / chế độ / yêu cầu xáo trộn lại
  }, [queue, shuffleMode, shuffleSeed])

  /* index trực tiếp, không clamp: vượt quá cuối danh sách → current là
     undefined → hiện màn hình "Ôn tập xong" thay vì kẹt ở từ cuối.
     Fallback về queue khi shuffledQueue chưa kịp tạo/chưa đồng bộ độ dài
     để tránh nháy màn hình "Ôn tập xong" trong 1 frame. */
  const displayQueue = shuffleMode && shuffledQueue.length === queue.length ? shuffledQueue : queue
  const current = displayQueue[index]

  /* Bật/tắt chế độ ngẫu nhiên và lưu lựa chọn lại cho lần sau */
  const toggleShuffle = () => {
    const next = !shuffleMode
    setShuffleMode(next)
    setNonce((n) => n + 1)
    saveShuffleMode(slug, uid, next)
    if (!next) {
      /* Về thứ tự gốc: giữ từ đang xem nếu nó còn trong danh sách */
      const curKey = current?.en.toLowerCase()
      const idx = curKey ? queue.findIndex((w) => w.en.toLowerCase() === curKey) : -1
      setIndex(idx >= 0 ? idx : 0)
    }
    /* Khi bật: effect phía trên sẽ xáo trộn và giữ từ đang xem */
  }

  /* Xáo trộn lại thứ tự và quay về từ đầu tiên */
  const reshuffle = () => {
    resetToFirstRef.current = true
    setShuffleSeed((s) => s + 1)
    setNonce((n) => n + 1)
  }

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
              onClick={() => {
                if (shuffleMode) {
                  reshuffle()
                } else {
                  setIndex(0)
                }
              }}
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
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        {shuffleMode ? (
          <button
            type="button"
            onClick={reshuffle}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Xáo trộn lại
          </button>
        ) : (
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
        )}
        <button
          type="button"
          role="switch"
          aria-checked={shuffleMode}
          title={shuffleMode ? "Đang ôn ngẫu nhiên — bấm để về thứ tự tuần tự" : "Đang ôn tuần tự — bấm để ôn ngẫu nhiên"}
          onClick={toggleShuffle}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
            shuffleMode
              ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Shuffle className="h-3.5 w-3.5" />
          Ôn ngẫu nhiên
          <span
            className={`relative h-4 w-8 shrink-0 rounded-full transition-colors ${
              shuffleMode ? "bg-white/30" : "bg-slate-200"
            }`}
          >
            <span
              className={`absolute top-0.5 h-3 w-3 rounded-full transition-all ${
                shuffleMode ? "left-[1.125rem] bg-white" : "left-0.5 bg-slate-500"
              }`}
            />
          </span>
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
