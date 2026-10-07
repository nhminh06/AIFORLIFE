"use client"

import { useEffect, useRef, useState, useTransition } from "react"
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
  Play,
  X,
  History,
  Clock,
  HelpCircle,
  Compass,
} from "lucide-react"

import {
  predictPersonalizedPath,
  type PersonalizedPathResult,
  type SkillStat,
  type LessonRecommendation,
} from "@/lib/ai/personalized-path-engine"
import { getLocalPracticeResults } from "@/lib/practice-service"
import { getAllPracticeResults } from "@/lib/progress/practice-results-service"
import { generateMistakeReviewExercise } from "@/lib/ai/mistake-tracker"
import { loadGrammarLearned } from "@/lib/grammar-progress"
import { QuizRunner } from "@/components/practice/quiz-runner"
import type { Exercise } from "@/lib/data/practice"

type Props = {
  uid?: string | null
}

export type TaskProgressInfo = {
  type: "grammar" | "practice" | "recovery"
  isCompleted: boolean
  hasAttempted?: boolean
  pct?: number
  bestScore?: number
  bestTotal?: number
  statusLabel: string
  scoreText: string
  criteria: string
  goal: string
}

export function getTaskProgress(
  lesson: LessonRecommendation,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  practiceResults: Record<string, any>,
  learnedGrammar: Set<string>
): TaskProgressInfo {
  const isGrammar = lesson.type === "grammar" || lesson.action.startsWith("/ngu-phap/")
  if (isGrammar) {
    const slug = lesson.slug || lesson.action.replace(/^\/ngu-phap\//, "").replace(/\/$/, "")
    const isCompleted = learnedGrammar.has(slug)
    return {
      type: "grammar",
      isCompleted,
      statusLabel: isCompleted ? "Đã học" : "Chưa học",
      scoreText: isCompleted ? "Đã đánh dấu hoàn thành bài học" : "Chưa đánh dấu đã học",
      criteria: "Đọc kỹ lý thuyết, quy tắc & dấu hiệu nhận biết, sau đó bấm nút 'Đánh dấu đã học' (hoặc hoàn thành bài tập AI ở chân trang).",
      goal: "Củng cố bản chất ngữ pháp để xóa bỏ các lỗ hổng và câu sai nhầm lẫn.",
    }
  }

  const isGeneralPractice = lesson.action === "/luyen-tap"
  if (isGeneralPractice) {
    return {
      type: "recovery",
      isCompleted: false,
      statusLabel: "Khắc phục lỗi",
      scoreText: "Bài tập theo chủ điểm yếu",
      criteria: "Luyện tập các câu hỏi thuộc chủ điểm này và trả lời đúng 2 lần liên tiếp trong bài ôn tập để hệ thống ghi nhận 'Đã nắm'.",
      goal: "Lấp lỗ hổng kiến thức bạn đang làm sai nhiều nhất trong thời gian qua.",
    }
  }

  // Bài tập luyện tập cụ thể (/luyen-tap/[id])
  const exId = lesson.id || lesson.action.replace(/^\/luyen-tap\//, "").replace(/\/$/, "")
  const record = practiceResults[exId]
  const bestScore = record ? Number(record.bestScore ?? 0) : 0
  const bestTotal = record ? Number(record.bestTotal ?? 0) : 0
  const pct = bestTotal > 0 ? Math.round((bestScore / bestTotal) * 100) : 0
  const hasAttempted = bestTotal > 0
  const isCompleted = hasAttempted && pct >= 80

  return {
    type: "practice",
    isCompleted,
    hasAttempted,
    pct,
    bestScore,
    bestTotal,
    statusLabel: isCompleted
      ? `Đạt ${pct}%`
      : hasAttempted
        ? `${pct}% (cần ≥ 80%)`
        : "Cần ≥ 80%",
    scoreText: hasAttempted ? `Điểm cao nhất: ${bestScore}/${bestTotal} (${pct}%)` : "Chưa làm bài test",
    criteria: "Làm bài kiểm tra và đạt điểm số từ 80% trở lên (ví dụ: đúng tối thiểu 8/10 câu). Mức 80% là chuẩn Mastery của AI để công nhận bạn đã vững kiến thức.",
    goal: "Rèn phản xạ nhanh và chứng minh bạn đã làm chủ hoàn toàn kỹ năng này.",
  }
}

export function AiLearningPathCard({ uid }: Props) {
  const [data, setData] = useState<PersonalizedPathResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [reviewExercise, setReviewExercise] = useState<Exercise | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const showReviewModalRef = useRef(false)
  showReviewModalRef.current = showReviewModal

  // Lưu trữ kết quả luyện tập & tiến độ ngữ pháp để hiển thị trực quan
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [practiceResults, setPracticeResults] = useState<Record<string, any>>({})
  const [learnedGrammar, setLearnedGrammar] = useState<Set<string>>(new Set())

  // Nhiệm vụ đang được bấm mở xem hướng dẫn chi tiết
  const [selectedGuideTask, setSelectedGuideTask] = useState<{
    stageNumber: number
    stageName: string
    lesson: LessonRecommendation
  } | null>(null)

  const loadPath = async (silent = false) => {
    if (!silent && !data) {
      setLoading(true)
    }
    try {
      // Đọc kết quả từ cloud nếu đã đăng nhập, ngược lại lấy local
      const results = uid ? await getAllPracticeResults(uid) : getLocalPracticeResults()
      setPracticeResults(results || {})
      setLearnedGrammar(loadGrammarLearned(uid))
      const path = predictPersonalizedPath(results, uid)
      setData(path)
    } catch (err) {
      console.error("[AiLearningPathCard] Lỗi khi tạo lộ trình:", err)
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    loadPath()

    // Lắng nghe sự kiện cập nhật lỗi, tiến độ ngữ pháp và bài luyện tập
    const onProgressUpdated = () => {
      // Chỉ cập nhật khi KHÔNG đang mở modal ôn tập, để tránh re-render gián đoạn bài test
      if (!showReviewModalRef.current) {
        loadPath(true)
      }
    }
    window.addEventListener("mistakes-updated", onProgressUpdated)
    window.addEventListener("afl-grammar-progress-updated", onProgressUpdated)
    window.addEventListener("afl-practice-completed", onProgressUpdated)
    return () => {
      window.removeEventListener("mistakes-updated", onProgressUpdated)
      window.removeEventListener("afl-grammar-progress-updated", onProgressUpdated)
      window.removeEventListener("afl-practice-completed", onProgressUpdated)
    }
  }, [uid])

  const handleRefresh = () => {
    startTransition(() => {
      loadPath(true)
    })
  }

  const handleStartMistakeReview = (specificWord?: string) => {
    const ex = generateMistakeReviewExercise(specificWord)
    if (ex) {
      setReviewExercise(ex)
      setShowReviewModal(true)
    } else {
      window.alert("Tuyệt vời! Hiện tại bạn không có câu hỏi nào bị sai cần ôn tập.")
    }
  }

  const handleCloseReviewModal = () => {
    setShowReviewModal(false)
    setReviewExercise(null)
    // Cập nhật lại lộ trình để áp dụng các câu/từ vừa được ôn tập thành công
    void loadPath(true)
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Đang phân tích dữ liệu làm bài & nhật ký lỗi...
            </h3>
            <p className="text-xs text-slate-500">
              Tổng hợp câu sai, từ vựng hay nhầm lẫn trên toàn hệ thống để lập lộ trình thích ứng
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const hasPracticeHistory = data.totalAttempted > 0
  const insights = data.insights
  const hasMistakes = (insights?.recentTotalMistakes ?? 0) > 0 || (insights?.masteredCount ?? 0) > 0

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
              <span className="text-xs text-slate-500">Tự thích ứng theo lỗi sai</span>
            </div>
            <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Lộ trình Học Cá nhân hoá từ AI
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasMistakes && (
            <button
              type="button"
              onClick={() => handleStartMistakeReview()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-indigo-600/25 transition hover:bg-indigo-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Ôn lại câu & từ hay sai
            </button>
          )}

          <button
            onClick={handleRefresh}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
            {isPending ? "Đang cập nhật..." : "Cập nhật lộ trình"}
          </button>
        </div>
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
            Độ tin cậy: {data.levelConfidence}%
          </div>
        </div>

        {/* Card 2: Tỷ lệ chính xác chung & Lỗi */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-xs backdrop-blur-sm dark:border-slate-800 dark:bg-slate-800/80">
          <div className="text-xs font-medium text-slate-500">Hiệu suất học tập</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {data.overallAccuracy}%
            </span>
            <span className="text-xs text-slate-500">
              ({data.totalCorrect}/{data.totalAttempted} câu test)
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> {data.totalCorrect} đúng
            </span>
            {hasMistakes && (
              <span className="inline-flex items-center gap-1 font-semibold text-rose-500">
                <History className="h-3 w-3" /> {insights?.recentTotalMistakes} lỗi gần đây
              </span>
            )}
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
          <p className="mt-1 text-xs leading-relaxed text-indigo-900/80 dark:text-indigo-200/80">
            {data.primaryFocusDesc}
          </p>
        </div>
      </div>

      {!hasPracticeHistory && (
        <div className="relative mt-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              {data.hasMistakeData ? (
                <span>
                  <strong className="font-bold">Đã phân tích từ lỗi thực tế:</strong> AI đã ghi nhận{" "}
                  {insights?.recentTotalMistakes} lỗi sai trong quá trình học từ vựng/bài tập của bạn và
                  tự động xây dựng lộ trình thích ứng. Bạn cũng có thể vào mục{" "}
                  <Link href="/luyen-tap" className="font-bold underline hover:text-amber-700">
                    Luyện tập
                  </Link>{" "}
                  để làm thêm bài trắc nghiệm tổng hợp.
                </span>
              ) : (
                <span>
                  <strong className="font-bold">Chưa có đủ lịch sử làm bài:</strong> AI đang gợi ý lộ trình
                  chuẩn hóa nền tảng. Bạn hãy vào mục{" "}
                  <Link href="/luyen-tap" className="font-bold underline hover:text-amber-700">
                    Luyện tập
                  </Link>{" "}
                  làm 1-2 bài trắc nghiệm hoặc điền từ để AI thu thập thêm câu đúng/sai và cá nhân hóa sâu hơn!
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* KHỐI: ÔN LẠI NHỮNG GÌ BẠN HAY SAI (WEAKNESS RECOVERY) */}
      {insights && (insights.topMistakeWords.length > 0 || insights.topRepeatQuestions.length > 0) && (
        <div className="relative mt-7 rounded-2xl border border-rose-200/80 bg-rose-50/50 p-5 dark:border-rose-900/50 dark:bg-rose-950/20 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500 text-white shadow-xs">
                  <Target className="h-3.5 w-3.5" />
                </span>
                <h3 className="text-sm font-bold text-rose-950 dark:text-rose-200">
                  Ôn lại những gì bạn hay sai (Weakness Recovery)
                </h3>
              </div>
              <p className="mt-1 text-xs text-rose-800/80 dark:text-rose-300/80">
                Ghi nhận toàn site: Đúng 2 lần liên tiếp để được đánh dấu &ldquo;Đã nắm&rdquo; và giảm ưu tiên.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleStartMistakeReview()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-rose-600/25 transition hover:bg-rose-700"
            >
              <Play className="h-3.5 w-3.5" />
              Luyện lại ngay
            </button>
          </div>

          {/* Huy hiệu tổng kết số lỗi đã sửa thành công */}
          {insights && insights.masteredCount > 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>
                Đã khắc phục thành công <strong>{insights.masteredCount}</strong> câu/từ (đã trả lời đúng liên tiếp ≥ 2 lần và hoàn toàn loại khỏi danh sách cần ôn).
              </span>
            </div>
          )}

          {/* Top từ vựng hay sai */}
          {insights && insights.topMistakeWords.length > 0 && (
            <div className="mt-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                Từ vựng cần củng cố (bấm vào từ để ôn riêng):
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {insights.topMistakeWords.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleStartMistakeReview(item.word)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs shadow-2xs transition hover:border-rose-400 hover:bg-rose-50/50 dark:border-slate-800 dark:bg-slate-800 dark:hover:border-rose-700"
                    title={`Luyện tập riêng từ "${item.word}"`}
                  >
                    <span className="font-bold text-slate-800 dark:text-slate-100">{item.word}</span>
                    <span className="text-[10px] text-slate-400">·</span>
                    <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400">
                      sai {item.wrongCount} lần
                    </span>
                    {item.correctStreak > 0 && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-700 dark:bg-amber-950/70 dark:text-amber-300">
                        Đang ôn ({item.correctStreak}/2)
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Top câu hỏi lặp lại */}
          {insights && insights.topRepeatQuestions.length > 0 && (
            <div className="mt-4 border-t border-rose-200/60 pt-3 dark:border-rose-900/40">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                Câu hỏi hay nhầm lẫn nhất:
              </span>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {insights.topRepeatQuestions.slice(0, 4).map((q, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between rounded-xl border border-rose-200/80 bg-white/90 p-3 text-xs shadow-2xs dark:border-slate-800 dark:bg-slate-800/80"
                  >
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {q.prompt.length > 80 ? `${q.prompt.slice(0, 80)}…` : q.prompt}
                      </span>
                      <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                        Đáp án đúng: <strong>{q.correctAnswer}</strong>
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{q.topic}</span>
                      <span className="font-bold text-rose-500">Sai {q.wrongCount} lần</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {insights && insights.topMistakeWords.length === 0 && insights.topRepeatQuestions.length === 0 && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-white/90 p-4 text-center text-xs dark:border-emerald-900/50 dark:bg-slate-800/80">
              <span className="font-bold text-emerald-700 dark:text-emerald-300">
                🎉 Bạn đã ôn luyện và khắc phục xong toàn bộ các câu hỏi & từ vựng từng làm sai!
              </span>
              <p className="mt-1 text-slate-500">
                Tất cả các câu/từ từng nhầm lẫn đã được trả lời đúng liên tiếp và chuyển sang trạng thái &ldquo;Đã nắm&rdquo;. Hệ thống sẽ tiếp tục theo dõi trong các bài luyện tập tiếp theo.
              </p>
            </div>
          )}
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
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${!skill.isAttempted
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
                    className={`h-full rounded-full transition-all duration-500 ${skill.isAttempted ? skill.color : "bg-transparent"
                      }`}
                    style={{ width: skill.isAttempted ? `${Math.max(5, skill.accuracy)}%` : "0%" }}
                  />
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span>Điểm cấp thiết AI:</span>
                  {skill.recentMistakes && skill.recentMistakes > 0 ? (
                    <span className="rounded-full bg-rose-100 px-1.5 py-0.2 text-[9px] font-bold text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
                      +{skill.recentMistakes} lỗi
                    </span>
                  ) : null}
                </div>
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
          Lộ trình được hệ thống AI tự động xây dựng dựa trên kết quả các câu bạn làm sai nhiều nhất.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {/* Stage 1 */}
          <div className="relative flex flex-col rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm dark:border-indigo-900/60 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-black text-white">
                  1
                </span>
                Giai đoạn 1 (Ưu tiên cao nhất)
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                {data.stages.stage1.lessons.filter((l) => getTaskProgress(l, practiceResults, learnedGrammar).isCompleted).length}/{data.stages.stage1.lessons.length} hoàn thành
              </span>
            </div>
            <h4 className="mt-2 text-base font-bold text-slate-900 dark:text-white">
              {data.stages.stage1.name}
            </h4>
            <div className="mt-3 flex-1 space-y-2">
              {data.stages.stage1.lessons.map((lesson, idx) => {
                const prog = getTaskProgress(lesson, practiceResults, learnedGrammar)
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      setSelectedGuideTask({
                        stageNumber: 1,
                        stageName: data.stages.stage1.name,
                        lesson,
                      })
                    }
                    className="group flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-left text-xs font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700"
                    title="Bấm để xem hướng dẫn & mục tiêu hoàn thành nhiệm vụ này"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {prog.isCompleted ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      ) : (
                        <BookOpen className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                      )}
                      <span className="truncate">{lesson.title}</span>
                    </div>
                    <div className="ml-2 flex shrink-0 items-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${prog.isCompleted
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300"
                          : prog.hasAttempted
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300"
                            : "bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                      >
                        {prog.statusLabel}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Stage 2 */}
          <div className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[11px] font-black text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                  2
                </span>
                Giai đoạn 2 (Củng cố mở rộng)
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                {data.stages.stage2.lessons.filter((l) => getTaskProgress(l, practiceResults, learnedGrammar).isCompleted).length}/{data.stages.stage2.lessons.length} hoàn thành
              </span>
            </div>
            <h4 className="mt-2 text-base font-bold text-slate-900 dark:text-white">
              {data.stages.stage2.name}
            </h4>
            <div className="mt-3 flex-1 space-y-2">
              {data.stages.stage2.lessons.map((lesson, idx) => {
                const prog = getTaskProgress(lesson, practiceResults, learnedGrammar)
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      setSelectedGuideTask({
                        stageNumber: 2,
                        stageName: data.stages.stage2.name,
                        lesson,
                      })
                    }
                    className="group flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-left text-xs font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700"
                    title="Bấm để xem hướng dẫn & mục tiêu hoàn thành nhiệm vụ này"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {prog.isCompleted ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      ) : (
                        <Layers className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                      )}
                      <span className="truncate">{lesson.title}</span>
                    </div>
                    <div className="ml-2 flex shrink-0 items-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${prog.isCompleted
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300"
                          : prog.hasAttempted
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300"
                            : "bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                      >
                        {prog.statusLabel}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Stage 3 */}
          <div className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[11px] font-black text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                  3
                </span>
                Giai đoạn 3 (Thành thạo)
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                {data.stages.stage3.lessons.filter((l) => getTaskProgress(l, practiceResults, learnedGrammar).isCompleted).length}/{data.stages.stage3.lessons.length} hoàn thành
              </span>
            </div>
            <h4 className="mt-2 text-base font-bold text-slate-900 dark:text-white">
              {data.stages.stage3.name}
            </h4>
            <div className="mt-3 flex-1 space-y-2">
              {data.stages.stage3.lessons.map((lesson, idx) => {
                const prog = getTaskProgress(lesson, practiceResults, learnedGrammar)
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      setSelectedGuideTask({
                        stageNumber: 3,
                        stageName: data.stages.stage3.name,
                        lesson,
                      })
                    }
                    className="group flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-left text-xs font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-700 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700"
                    title="Bấm để xem hướng dẫn & mục tiêu hoàn thành nhiệm vụ này"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {prog.isCompleted ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      ) : (
                        <Award className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      )}
                      <span className="truncate">{lesson.title}</span>
                    </div>
                    <div className="ml-2 flex shrink-0 items-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${prog.isCompleted
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300"
                          : prog.hasAttempted
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300"
                            : "bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                      >
                        {prog.statusLabel}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-600" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL HƯỚNG DẪN NHIỆM VỤ (TASK GUIDANCE MODAL KHI BẤM VÀO TASK) */}
      {selectedGuideTask && (() => {
        const { stageNumber, stageName, lesson } = selectedGuideTask
        const prog = getTaskProgress(lesson, practiceResults, learnedGrammar)

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedGuideTask(null)
            }}
          >
            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-7">
              {/* Background gradient decorative glow */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-500/10 blur-2xl" />

              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
                      Giai đoạn {stageNumber}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs font-medium text-slate-500">
                      {prog.type === "grammar"
                        ? "Lý thuyết Ngữ pháp"
                        : prog.type === "recovery"
                          ? "Khắc phục Lỗ hổng"
                          : "Bài tập Luyện tập"}
                    </span>
                  </div>
                  <h3 className="mt-1.5 text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                    {lesson.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">{stageName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedGuideTask(null)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="mt-5 space-y-4 text-xs">
                {/* 1. Mức chuẩn để xem là HOÀN THÀNH */}
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/30">
                  <div className="flex items-center gap-2 font-bold text-indigo-700 dark:text-indigo-300">
                    <Target className="h-4 w-4" />
                    <span>Mức chuẩn để xem là HOÀN THÀNH:</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed font-semibold text-indigo-950 dark:text-indigo-100">
                    {prog.criteria}
                  </p>
                </div>

                {/* 2. Tiến độ hiện tại của bạn */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-800/80">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Tiến độ hiện tại của bạn:
                  </span>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {prog.isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                      ) : prog.hasAttempted ? (
                        <Clock className="h-5 w-5 shrink-0 text-amber-500" />
                      ) : (
                        <Compass className="h-5 w-5 shrink-0 text-slate-400" />
                      )}
                      <div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {prog.isCompleted
                            ? "Đã đạt chuẩn hoàn thành"
                            : prog.hasAttempted
                              ? "Chưa đạt mức Mastery (≥ 80%)"
                              : "Chưa hoàn thành"}
                        </div>
                        <div className="text-[11px] text-slate-500">{prog.scoreText}</div>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${prog.isCompleted
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300"
                        : prog.hasAttempted
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                        }`}
                    >
                      {prog.statusLabel}
                    </span>
                  </div>
                </div>

                {/* 3. Mục tiêu sư phạm & Cơ chế AI */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-slate-800/80 dark:bg-slate-800/40">
                  <div className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <div>
                      <p className="text-[11px] font-medium text-slate-700 dark:text-slate-200">
                        <strong>Mục tiêu:</strong> {prog.goal}
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                        Sau khi hoàn thành, hệ thống AI sẽ tự động tăng độ chính xác của kỹ năng, giảm điểm cấp thiết và đẩy lộ trình sang bước tiếp theo.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedGuideTask(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Đóng
                </button>
                <Link
                  href={lesson.action}
                  onClick={() => setSelectedGuideTask(null)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-700"
                >
                  <span>Bắt đầu làm bài ngay</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )
      })()}

      {/* MODAL LUYỆN TẬP TỪ LOG LỖI (SPACED REPETITION MODAL) */}
      {showReviewModal && reviewExercise && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseReviewModal()
          }}
        >
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500 text-white">
                  <RotateCcw className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {reviewExercise.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Vòng lặp Spaced Repetition: Trả lời đúng để hạ trọng số lỗi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseReviewModal}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <QuizRunner
              exercise={reviewExercise}
              onClose={handleCloseReviewModal}
              onCompleted={() => {
                // Giữ nguyên kết quả trên màn hình để học viên xem chi tiết;
                // Khi học viên bấm Hoàn tất & Cập nhật lộ trình hoặc đóng modal, lộ trình sẽ được làm mới.
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
