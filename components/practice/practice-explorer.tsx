"use client"

import { useEffect, useMemo, useState } from "react"
import { ClipboardList, Loader2, Sparkles } from "lucide-react"

import { SearchInput } from "@/components/dashboard/search-input"
import { VocabPagination } from "@/components/vocab/vocab-pagination"
import { exercises, getPracticeCategory, type PracticeCategory } from "@/lib/data/practice"
import { deleteMyExercise, loadDefaultExercises, loadMyExercises } from "@/lib/practice-service"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

import { CreateAiPracticeModal } from "./create-ai-practice-modal"
import { ExerciseCard } from "./exercise-card"

const categoryTabs: { id: PracticeCategory; label: string; activeClass: string }[] = [
  { id: "writing", label: "Viết", activeClass: "border-blue-500 bg-blue-500" },
  { id: "listening", label: "Nghe", activeClass: "border-purple-500 bg-purple-500" },
  { id: "reading", label: "Đọc", activeClass: "border-orange-500 bg-orange-500" },
]

export function PracticeExplorer() {
  const { user, openAuthModal } = useAuth()
  const [tab, setTab] = useState<PracticeCategory | "all">("all")
  const [query, setQuery] = useState("")
  const [allExercises, setAllExercises] = useState(() => user
    ? exercises
    : exercises.map((exercise) => ({ ...exercise, status: "Chưa làm" as const, bestScore: undefined })))
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([loadDefaultExercises(), user ? loadMyExercises(user.uid) : Promise.resolve([])])
      .then(([defaults, mine]) => {
        const guestDefaults = user
          ? defaults
          : defaults.map((exercise) => ({ ...exercise, status: "Chưa làm" as const, bestScore: undefined }))
        setAllExercises([...mine, ...guestDefaults])
      })
      .finally(() => setLoading(false))
  }, [user])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allExercises.filter((exercise) => {
      if (tab !== "all" && getPracticeCategory(exercise) !== tab) return false
      if (!q) return true
      return [exercise.name, exercise.vi, exercise.desc, exercise.examType ?? ""]
        .some((value) => value.toLowerCase().includes(q))
    })
  }, [allExercises, tab, query])

  useEffect(() => setPage(1), [tab, query])

  useEffect(() => {
    const handleCompleted = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string; result: { score: number; total: number } }>).detail
      if (!detail?.id || !detail.result) return
      setAllExercises((current) => current.map((exercise) => exercise.id === detail.id
        ? { ...exercise, status: "Hoàn thành", bestScore: `${detail.result.score}/${detail.result.total}` }
        : exercise))
    }
    window.addEventListener("afl-practice-completed", handleCompleted)
    return () => window.removeEventListener("afl-practice-completed", handleCompleted)
  }, [])

  const pageSize = 9
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedExercises = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const changePage = (next: number) => {
    setPage(Math.min(Math.max(next, 1), totalPages))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDelete = async (exercise: (typeof allExercises)[number]) => {
    if (!user || !exercise.id.startsWith("ai-")) return
    if (!window.confirm(`Xóa bài "${exercise.name}"? Hành động này không thể hoàn tác.`)) return
    try {
      await deleteMyExercise(user.uid, exercise.id)
      setAllExercises((current) => current.filter((item) => item.id !== exercise.id))
    } catch (error) {
      console.error("[practice-explorer] Không xóa được bài luyện:", error)
      window.alert("Không xóa được bài luyện. Vui lòng thử lại.")
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Nhóm kỹ năng">
          <button type="button" role="tab" aria-selected={tab === "all"} onClick={() => setTab("all")} className={cn("rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors", tab === "all" ? "border-orange-500 bg-orange-500 text-white shadow-sm" : "border-slate-200 bg-white text-slate-500 hover:text-slate-800")}>Tất cả</button>
          {categoryTabs.map((category) => (
            <button key={category.id} type="button" role="tab" aria-selected={tab === category.id} onClick={() => setTab(category.id)} className={cn("rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors", tab === category.id ? `${category.activeClass} text-white shadow-sm` : "border-slate-200 bg-white text-slate-500 hover:text-slate-800")}>{category.label}</button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SearchInput value={query} onChange={setQuery} placeholder="Tìm bài tập…" label="Tìm bài tập" />
          <button type="button" onClick={() => user ? setCreating(true) : openAuthModal("login")} className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 hover:bg-orange-600"><Sparkles className="h-4 w-4" />Tạo bài tập</button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /><p className="mt-3 text-sm font-medium text-slate-500">Đang tải bài luyện tập…</p></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500"><ClipboardList className="h-6 w-6" /></span><p className="mt-3 font-semibold text-slate-900">Không tìm thấy bài tập</p><p className="mt-1 text-sm text-slate-500">Thử từ khóa hoặc nhóm kỹ năng khác nhé.</p></div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{pagedExercises.map((exercise) => <ExerciseCard key={exercise.id} ex={exercise} onDelete={exercise.id.startsWith("ai-") ? () => handleDelete(exercise) : undefined} />)}</div>
          <p className="px-1 text-xs font-semibold text-slate-500">Đang xem {pagedExercises.length}/{filtered.length} bài</p>
          <VocabPagination page={currentPage} totalPages={totalPages} onChange={changePage} />
        </>
      )}
      {creating && <CreateAiPracticeModal onClose={() => setCreating(false)} onCreated={(exercise) => setAllExercises((current) => [exercise, ...current.filter((item) => item.id !== exercise.id)])} />}
    </div>
  )
}
