"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import {
  Sparkles,
  TrendingUp,
  Target,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Headphones,
  Award,
  Layers,
  ChevronRight,
} from "lucide-react"

import {
  predictPersonalizedPath,
  type PersonalizedPathResult,
  type SkillStat,
} from "@/lib/ai/personalized-path-engine"
import { getLocalPracticeResults } from "@/lib/practice-service"
import { getAllPracticeResults } from "@/lib/progress/practice-results-service"

type Props = {
  uid?: string | null
}

export function AiLearningPathCard({ uid }: Props) {
  const [data, setData] = useState<PersonalizedPathResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const loadPath = async () => {
    setLoading(true)
    try {
      // Đọc kết quả từ cloud nếu đã đăng nhập, ngược lại lấy local
      const results = uid ? await getAllPracticeResults(uid) : getLocalPracticeResults()
      const path = predictPersonalizedPath(results)
      setData(path)
    } catch (err) {
      console.error("[AiLearningPathCard] Lỗi khi tạo lộ trình:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPath()
  }, [uid])

  const handleRefresh = () => {
    startTransition(() => {
      loadPath()
    })
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Đang phân tích dữ liệu làm bài với Machine Learning...
            </h3>
            <p className="text-xs text-slate-500">
              Tổng hợp câu sai, câu đúng trên toàn hệ thống để lập lộ trình cá nhân hoá
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const hasPracticeHistory = data.totalAttempted > 0

  return (
    <div className="relative overflow-hidden rounded-3xl border border-indigo-100/80 bg-gradient-to-b from-white via-slate-50/50 to-indigo-50/30 p-6 shadow-sm shadow-indigo-100/30 dark:border-indigo-900/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/20 sm:p-8">
      {/* Decorative gradient blur */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

      {/* Header bar */}
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
                <Target className="h-3 w-3" />
                AI Adaptive Pathway
              </span>
              <span className="text-xs text-slate-500">Mô hình Offline scikit-learn</span>
            </div>
            <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Lộ trình Học Cá nhân hoá từ AI
            </h2>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <RotateCcw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
          {isPending ? "Đang cập nhật..." : "Cập nhật lộ trình"}
        </button>
      </div>

      {/* Overview Diagnostic Cards */}
      <div className="relative mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Trình độ ước tính */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-xs backdrop-blur-sm dark:border-slate-800 dark:bg-slate-800/80">
          <div className="text-xs font-medium text-slate-500">Trình độ ước tính</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {data.levelVi}
            </span>
          </div>
          <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400">
            Độ tin cậy mô hình: {data.levelConfidence}%
          </div>
        </div>

        {/* Card 2: Tỷ lệ chính xác chung */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-xs backdrop-blur-sm dark:border-slate-800 dark:bg-slate-800/80">
          <div className="text-xs font-medium text-slate-500">Tỷ lệ chính xác tổng thể</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {data.overallAccuracy}%
            </span>
            <span className="text-xs text-slate-500">
              ({data.totalCorrect}/{data.totalAttempted} câu)
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> {data.totalCorrect} đúng
            </span>
            <span className="inline-flex items-center gap-1 text-rose-500">
              <XCircle className="h-3 w-3" /> {data.totalIncorrect} sai
            </span>
          </div>
        </div>

        {/* Card 3: Trọng tâm then chốt */}
        <div className="col-span-1 rounded-2xl border border-indigo-200/80 bg-indigo-50/70 p-4 shadow-xs backdrop-blur-sm dark:border-indigo-900/50 dark:bg-indigo-950/40 sm:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              Trọng tâm cần cải thiện nhất
            </span>
            <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
              Ưu tiên số 1
            </span>
          </div>
          <div className="mt-1 text-base font-bold text-indigo-950 dark:text-indigo-100">
            {data.primaryFocusTitle}
          </div>
          <p className="mt-1 text-xs text-indigo-900/80 dark:text-indigo-200/80">
            {data.primaryFocusDesc}
          </p>
        </div>
      </div>

      {!hasPracticeHistory && (
        <div className="relative mt-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <span className="font-bold">Chưa có đủ lịch sử làm bài:</span> AI đang gợi ý lộ trình
              chuẩn hóa nền tảng. Bạn hãy vào mục{" "}
              <Link href="/luyen-tap" className="font-bold underline hover:text-amber-700">
                Luyện tập
              </Link>{" "}
              làm 1-2 bài trắc nghiệm hoặc điền từ để AI thu thập câu đúng/sai và cá nhân hóa sâu
              hơn!
            </div>
          </div>
        </div>
      )}

      {/* Skill Diagnostic Breakdown */}
      <div className="relative mt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            📊 Phân tích Chi tiết Lỗ hổng Kỹ năng (Skill Mastery Breakdown)
          </h3>
          <span className="text-xs text-slate-500">Sắp xếp theo độ cấp thiết</span>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.skills.map((skill) => (
            <div
              key={skill.key}
              className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/60"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {skill.name}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    !skill.isAttempted
                      ? "bg-slate-100 text-slate-500 dark:bg-slate-700/70 dark:text-slate-400"
                      : skill.status === "Cần cải thiện khẩn cấp"
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                      : skill.status === "Cần củng cố thêm"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                  }`}
                >
                  {skill.status}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-500">
                  {skill.isAttempted ? (
                    <>
                      <span>Chính xác: {skill.accuracy}%</span>
                      <span>
                        {skill.correct} đúng / {skill.incorrect} sai
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="italic text-slate-400">Chưa làm bài test</span>
                      <span className="text-slate-400">0 câu đã làm</span>
                    </>
                  )}
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      skill.isAttempted ? skill.color : "bg-transparent"
                    }`}
                    style={{ width: skill.isAttempted ? `${Math.max(5, skill.accuracy)}%` : "0%" }}
                  />
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                <span>Điểm cấp thiết AI:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {skill.isAttempted ? `${skill.priorityScore} / 100` : "Chờ làm test"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3-Stage Recommended Action Roadmap */}
      <div className="relative mt-8">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          🗺️ Lộ trình Đề xuất 3 Giai đoạn (Actionable Learning Steps)
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Lộ trình được mô hình AI tự động xây dựng dựa trên kết quả các câu bạn làm sai nhiều nhất.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {/* Stage 1 */}
          <div className="relative flex flex-col rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm dark:border-indigo-900/60 dark:bg-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-black text-white">
                1
              </span>
              Giai đoạn 1 (Ưu tiên cao nhất)
            </div>
            <h4 className="mt-2 text-base font-bold text-slate-900 dark:text-white">
              {data.stages.stage1.name}
            </h4>
            <div className="mt-3 flex-1 space-y-2">
              {data.stages.stage1.lessons.map((lesson, idx) => (
                <Link
                  key={idx}
                  href={lesson.action}
                  className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-xs font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <div className="flex items-center gap-2 truncate">
                    <BookOpen className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                    <span className="truncate">{lesson.title}</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600" />
                </Link>
              ))}
            </div>
          </div>

          {/* Stage 2 */}
          <div className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[11px] font-black text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                2
              </span>
              Giai đoạn 2 (Củng cố mở rộng)
            </div>
            <h4 className="mt-2 text-base font-bold text-slate-900 dark:text-white">
              {data.stages.stage2.name}
            </h4>
            <div className="mt-3 flex-1 space-y-2">
              {data.stages.stage2.lessons.map((lesson, idx) => (
                <Link
                  key={idx}
                  href={lesson.action}
                  className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-xs font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Layers className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                    <span className="truncate">{lesson.title}</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
                </Link>
              ))}
            </div>
          </div>

          {/* Stage 3 */}
          <div className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[11px] font-black text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                3
              </span>
              Giai đoạn 3 (Thành thạo & Bứt phá)
            </div>
            <h4 className="mt-2 text-base font-bold text-slate-900 dark:text-white">
              {data.stages.stage3.name}
            </h4>
            <div className="mt-3 flex-1 space-y-2">
              {data.stages.stage3.lessons.map((lesson, idx) => (
                <Link
                  key={idx}
                  href={lesson.action}
                  className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-xs font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-700 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Award className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    <span className="truncate">{lesson.title}</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-600" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
