"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Clock3, ListOrdered, Loader2 } from "lucide-react"

import { PageHeading } from "@/components/dashboard/page-heading"
import { SiteShell } from "@/components/dashboard/site-shell"
import { QuizRunner } from "@/components/practice/quiz-runner"
import { getPracticeType, statusClass, type Exercise } from "@/lib/data/practice"
import { loadDefaultExercise, loadMyExercise, saveLocalPracticeResult } from "@/lib/practice-service"
import { useAuth } from "@/lib/auth-context"
import { updateMyExerciseResult } from "@/lib/user-practice"
import { recordPracticeCompletion } from "@/lib/progress/study-log"
import { useStudySession } from "@/lib/study-tracker"

type Props = { params: Promise<{ id: string }> }

export default function LuyenTapDetailPage({ params }: Props) {
  const { id } = use(params)
  const { user } = useAuth()
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)

  /* Đếm thời gian học thật của phiên làm bài */
  useStudySession({ uid: user?.uid, enabled: Boolean(exercise) })

  useEffect(() => {
    let active = true
    const request = user && id.startsWith("ai-")
      ? loadMyExercise(user.uid, id)
      : loadDefaultExercise(id)
    request.then((result) => {
      if (!active) return
      setExercise(user || !result ? result : { ...result, status: "Chưa làm", bestScore: undefined })
    }).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [id, user])

  if (loading) return <SiteShell><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div></SiteShell>
  if (!exercise) return <SiteShell><div className="py-20 text-center"><p className="font-semibold text-slate-700">Không tìm thấy bài luyện tập.</p><Link href="/luyen-tap" className="mt-3 inline-flex text-sm font-semibold text-orange-600">Về danh sách bài tập</Link></div></SiteShell>

  const type = getPracticeType(exercise.typeId)
  const TypeIcon = type.icon
  const handleCompleted = (result: { score: number; total: number }) => {
    if (!user) return
    saveLocalPracticeResult(exercise.id, result)
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
