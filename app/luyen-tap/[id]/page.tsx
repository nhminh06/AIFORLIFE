"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Clock3, ListOrdered, Loader2, Sparkles, ArrowRight } from "lucide-react"

import { PageHeading } from "@/components/dashboard/page-heading"
import { SiteShell } from "@/components/dashboard/site-shell"
import { QuizRunner } from "@/components/practice/quiz-runner"
import { CreateAiPracticeModal } from "@/components/practice/create-ai-practice-modal"
import {
  exercises as defaultExercises,
  getPracticeType,
  statusClass,
  type Exercise,
  type PracticeCategory,
  type PracticeQuestionKind,
  type PracticeTypeId,
} from "@/lib/data/practice"
import { loadDefaultExercise, loadMyExercise, loadMyExercises, saveLocalPracticeResult } from "@/lib/practice-service"
import { useAuth } from "@/lib/auth-context"
import { updateMyExerciseResult } from "@/lib/user-practice"
import { recordPracticeCompletion } from "@/lib/progress/study-log"
import { useStudySession } from "@/lib/study-tracker"

function inferPracticeMeta(id: string) {
  const lower = id.toLowerCase()

  // Sắp xếp câu
  if (lower === "ex-04" || lower.includes("order") || lower.includes("sap-xep") || lower.includes("sentence")) {
    return {
      typeId: "sap-xep-cau" as PracticeTypeId,
      typeName: "Sắp xếp câu",
      title: "Luyện sắp xếp câu cấp độ 1",
      category: "reading" as PracticeCategory,
      examType: "Sắp xếp câu",
      questionKind: "order" as PracticeQuestionKind,
      topic: "Luyện sắp xếp câu cấp độ 1: Cấu trúc câu & Trật tự từ S-V-O",
      desc: "Rèn phản xạ ghép các từ xáo trộn thành câu hoàn chỉnh đúng ngữ pháp và ngữ cảnh giao tiếp.",
      badgeClass: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800",
      accentBg: "bg-teal-500",
    }
  }

  // Điền từ
  if (lower === "ex-02" || lower.includes("fill") || lower.includes("dien-tu")) {
    return {
      typeId: "dien-tu" as PracticeTypeId,
      typeName: "Điền từ",
      title: "Luyện điền từ dạng động từ",
      category: "reading" as PracticeCategory,
      examType: "Điền từ vào câu",
      questionKind: "fill" as PracticeQuestionKind,
      topic: "Điền từ dạng động từ & từ vựng theo ngữ cảnh",
      desc: "Rèn luyện cách chọn và chia dạng động từ hoặc từ vựng phù hợp vào chỗ trống.",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
      accentBg: "bg-blue-600",
    }
  }

  // Nghe – chọn đáp án
  if (lower === "ex-03" || lower.includes("listen") || lower.includes("nghe")) {
    return {
      typeId: "nghe-chon" as PracticeTypeId,
      typeName: "Nghe – chọn đáp án",
      title: "Nghe - chọn đáp án cơ bản",
      category: "listening" as PracticeCategory,
      examType: "Nghe chọn đáp án",
      questionKind: "listening" as PracticeQuestionKind,
      topic: "Nghe phát âm từ vựng và câu giao tiếp cơ bản",
      desc: "Luyện phản xạ nhận diện âm thanh bản ngữ và chọn đáp án có ý nghĩa chính xác.",
      badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
      accentBg: "bg-purple-600",
    }
  }

  // Trắc nghiệm
  if (lower === "ex-01" || lower.includes("choice") || lower.includes("quiz") || lower.includes("trac-nghiem")) {
    return {
      typeId: "trac-nghiem" as PracticeTypeId,
      typeName: "Trắc nghiệm",
      title: "Trắc nghiệm 12 thì cơ bản",
      category: "reading" as PracticeCategory,
      examType: "Trắc nghiệm",
      questionKind: "choice" as PracticeQuestionKind,
      topic: "Trắc nghiệm các thì cơ bản trong tiếng Anh",
      desc: "Luyện tập câu hỏi 4 lựa chọn để củng cố nền tảng ngữ pháp và phản xạ nhanh.",
      badgeClass: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800",
      accentBg: "bg-orange-500",
    }
  }

  // Mặc định cho ID khác
  const formatted = id
    .replace(/^ex-?/i, "Bài tập ")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())

  return {
    typeId: "trac-nghiem" as PracticeTypeId,
    typeName: "Luyện tập ngữ pháp & từ vựng",
    title: formatted,
    category: "reading" as PracticeCategory,
    examType: "Trắc nghiệm",
    questionKind: "choice" as PracticeQuestionKind,
    topic: formatted,
    desc: "Bài tập rèn luyện kỹ năng và nâng cao trình độ tiếng Anh.",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800",
    accentBg: "bg-orange-500",
  }
}

type Props = { params: Promise<{ id: string }> }

export default function LuyenTapDetailPage({ params }: Props) {
  const { id } = use(params)
  const { user, openAuthModal } = useAuth()
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [myExercises, setMyExercises] = useState<Exercise[]>([])
  const [filterScope, setFilterScope] = useState<"similar" | "all">("similar")
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  /* Đếm thời gian học thật của phiên làm bài */
  useStudySession({ uid: user?.uid, enabled: Boolean(exercise) })

  useEffect(() => {
    let active = true
    const request = user && id.startsWith("ai-")
      ? loadMyExercise(user.uid, id)
      : loadDefaultExercise(id, user?.uid)
    request.then((result) => {
      if (!active) return
      setExercise(user || !result ? result : { ...result, status: "Chưa làm", bestScore: undefined })
    }).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [id, user])

  useEffect(() => {
    if (user?.uid) {
      loadMyExercises(user.uid).then(setMyExercises).catch(() => {})
    }
  }, [user?.uid])

  if (loading) return <SiteShell><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div></SiteShell>

  if (!exercise) {
    const meta = inferPracticeMeta(id)
    const MetaType = getPracticeType(meta.typeId)
    const MetaIcon = MetaType.icon

    // Gộp cả bài tập hệ thống và bài tập do người học tự tạo
    const allAvailable = [
      ...myExercises,
      ...defaultExercises.filter((def) => !myExercises.some((m) => m.id === def.id)),
    ]
    const similarExercises = allAvailable.filter((ex) => ex.typeId === meta.typeId)
    const displayList = filterScope === "similar" ? similarExercises : allAvailable

    return (
      <SiteShell>
        <Link
          href="/luyen-tap"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Tất cả bài tập
        </Link>

        {/* Khung gợi ý tạo bài luyện tập bằng AI */}
        <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-100/80 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <div className="relative bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-teal-500/10 p-6 sm:p-8 dark:from-orange-950/20 dark:via-amber-950/20 dark:to-teal-950/20">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${meta.accentBg} text-white shadow-lg`}>
                  <MetaIcon className="h-7 w-7" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-bold ${meta.badgeClass}`}>
                      Dạng: {meta.typeName}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      Mã: {id}
                    </span>
                  </div>
                  <h1 className="mt-2 text-xl font-extrabold text-slate-900 sm:text-2xl dark:text-white">
                    Chưa có sẵn bài &ldquo;{meta.title}&rdquo;
                  </h1>
                  <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                    {meta.desc} Bạn có thể để <strong>AI tạo tự động một bài mới đúng dạng {meta.typeName}</strong> để luyện tập ngay lập tức!
                  </p>
                </div>
              </div>
            </div>

            {/* Các nút hành động chính */}
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-200/60 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (user) {
                    setShowCreateModal(true)
                  } else {
                    openAuthModal("login")
                  }
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:from-orange-600 hover:to-amber-600 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
              >
                <Sparkles className="h-4 w-4" />
                Tạo bài {meta.typeName} với AI ngay
              </button>

              <Link
                href="/luyen-tap"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Về danh sách bài tập
              </Link>
            </div>
          </div>

          {/* Danh sách bài tập có sẵn */}
          {allAvailable.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/60 p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Bài tập có sẵn trong hệ thống ({displayList.length} bài)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Chọn làm ngay một trong các bài tập đã có sẵn mà không cần chờ tạo mới:
                  </p>
                </div>

                {/* Tabs chuyển đổi giữa bài cùng dạng và tất cả bài */}
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => setFilterScope("similar")}
                    className={`rounded-lg px-3 py-1.5 transition-colors ${
                      filterScope === "similar"
                        ? "bg-orange-500 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    Dạng {meta.typeName} ({similarExercises.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterScope("all")}
                    className={`rounded-lg px-3 py-1.5 transition-colors ${
                      filterScope === "all"
                        ? "bg-orange-500 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    Tất cả dạng bài ({allAvailable.length})
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {displayList.map((alt) => {
                  const altType = getPracticeType(alt.typeId)
                  const AltIcon = altType.icon
                  const isUserCreated = myExercises.some((m) => m.id === alt.id)

                  return (
                    <Link
                      key={alt.id}
                      href={`/luyen-tap/${alt.id}`}
                      className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-orange-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-orange-500/50"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${altType.iconClass} text-white`}>
                          <AltIcon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-bold text-slate-900 group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400">
                              {alt.name}
                            </span>
                            {isUserCreated && (
                              <span className="shrink-0 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
                                Bài của bạn
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                            {alt.vi}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500 dark:border-slate-700/60 dark:text-slate-400">
                        <span>{altType.label} · {alt.minutes} phút · {alt.items.length} câu</span>
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-600 dark:bg-slate-700 dark:group-hover:bg-orange-950/60 dark:group-hover:text-orange-400">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal tạo bài bằng AI được prefill */}
        {showCreateModal && (
          <CreateAiPracticeModal
            title={`Tạo bài ${meta.typeName} bằng AI`}
            initialTopic={meta.topic}
            initialCategory={meta.category}
            initialExamType={meta.examType}
            initialQuestionKind={meta.questionKind}
            initialLevel="Cơ bản"
            initialDifficulty="Cơ bản"
            onClose={() => setShowCreateModal(false)}
            onCreated={(newEx) => {
              setExercise(newEx)
              setShowCreateModal(false)
              if (typeof window !== "undefined") {
                window.history.replaceState(null, "", `/luyen-tap/${newEx.id}`)
              }
            }}
          />
        )}
      </SiteShell>
    )
  }

  const type = getPracticeType(exercise.typeId)
  const TypeIcon = type.icon
  const handleCompleted = (result: { score: number; total: number }) => {
    /* Khách chưa có tài khoản → giữ kết quả tại trình duyệt này;
       đã đăng nhập → kết quả đi thẳng lên Firestore của riêng user (không ghi local dùng chung). */
    if (!user) {
      saveLocalPracticeResult(exercise.id, result)
    }
    window.dispatchEvent(new CustomEvent("afl-practice-completed", { detail: { id: exercise.id, result } }))
    if (user && exercise.id.startsWith("ai-")) {
      updateMyExerciseResult(user.uid, exercise.id, result).catch((error) => {
        console.error("[practice-detail] Không lưu được kết quả:", error)
      })
    }
    /* Ghi nhận lên sổ tiến độ: bài hoàn thành + XP theo số câu đúng + lịch sử hoạt động */
    void recordPracticeCompletion(user?.uid, {
      exerciseId: exercise.id,
      name: exercise.name,
      vi: exercise.vi,
      typeId: exercise.typeId,
      kindLabel: type.label,
      score: result.score,
      total: result.total,
    })
  }

  return (
    <SiteShell>
      <Link
        href="/luyen-tap"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-orange-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Tất cả bài tập
      </Link>

      <div className="mt-3">
        <PageHeading
          icon={TypeIcon}
          title={exercise.name}
          desc={`${exercise.vi} · ${type.label}`}
          bubbleClass={type.iconClass}
        >
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass[exercise.status]}`}
          >
            {exercise.status}
          </span>
        </PageHeading>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
        <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 shadow-sm">
          <Clock3 className="h-3.5 w-3.5" />
          Khoảng {exercise.minutes} phút
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 shadow-sm">
          <ListOrdered className="h-3.5 w-3.5" />
          {exercise.items.length} câu hỏi
        </span>
      </div>

      <div className="mt-6">
        <QuizRunner exercise={exercise} onCompleted={handleCompleted} />
      </div>
    </SiteShell>
  )
}
