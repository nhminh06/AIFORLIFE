"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, BookOpenText, Loader2, Plus } from "lucide-react"

import { useAuth } from "@/lib/auth-context"
import {
  customVocabTopicsFromSets,
  vocabSets as staticVocabSets,
  vocabTopics,
  type VocabSet,
} from "@/lib/data/vocabulary"
import { deleteMyVocabSet, getMyVocabSets } from "@/lib/user-vocab"
import { getAllVocabSets } from "@/lib/vocab-service"

import { CreateVocabSetModal } from "./create-vocab-set-modal"
import { VocabPagination } from "./vocab-pagination"
import { VocabSearchBar } from "./vocab-search-bar"
import { VocabSetCard } from "./vocab-set-card"
import { VocabTopicFilter } from "./vocab-topic-filter"

/** Số bộ từ vựng hiển thị trên mỗi trang của danh sách */
const SETS_PER_PAGE = 9

export function VocabExplorer() {
  const { user, loading: authLoading, openAuthModal } = useAuth()

  const [query, setQuery] = useState("")
  const [topic, setTopic] = useState("all")
  const [systemSets, setSystemSets] = useState<VocabSet[]>(staticVocabSets)
  const [mySets, setMySets] = useState<VocabSet[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const gridTopRef = useRef<HTMLDivElement | null>(null)

  /* Bộ từ hệ thống: lấy từ Firestore, fallback về static */
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await getAllVocabSets()
        if (!cancelled) setSystemSets(data)
      } catch {
        // giữ nguyên static fallback
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  /* Bộ từ cá nhân: chỉ tải cho user đang đăng nhập */
  const loadMySets = useCallback(async (uid: string) => {
    try {
      setMySets(await getMyVocabSets(uid))
      setError(null)
    } catch (err) {
      console.error("[vocab-explorer] Lỗi khi tải bộ từ cá nhân:", err)
      setError("Không tải được bộ từ của bạn. Vui lòng thử lại.")
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setMySets([])
      return
    }
    loadMySets(user.uid)
  }, [user, authLoading, loadMySets])

  /* Bộ từ của bạn xếp trước, rồi tới các bộ có sẵn */
  const sets = useMemo(() => [...mySets, ...systemSets], [mySets, systemSets])

  /* Bộ lọc chủ đề = chủ đề hệ thống + chủ đề riêng do user đã tạo */
  const topics = useMemo(() => [...vocabTopics, ...customVocabTopicsFromSets(mySets)], [mySets])

  /* Chủ đề riêng bị xóa hết thì đưa bộ lọc về "Tất cả" */
  useEffect(() => {
    if (topic !== "all" && !topics.some((t) => t.id === topic)) setTopic("all")
  }, [topics, topic])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sets.filter((s) => {
      const matchTopic = topic === "all" || s.topicId === topic
      if (!matchTopic) return false
      if (!q) return true
      return (
        s.name.toLowerCase().includes(q) ||
        s.vi.toLowerCase().includes(q) ||
        s.words.some((w) => w.en.toLowerCase().includes(q) || w.vi.toLowerCase().includes(q))
      )
    })
  }, [query, topic, sets])

  /* Đổi bộ lọc/tìm kiếm → quay lại trang đầu */
  useEffect(() => {
    setPage(1)
  }, [query, topic])

  const handleCreated = (created: VocabSet) => {
    setMySets((prev) => [created, ...prev.filter((s) => s.slug !== created.slug)])
  }

  const handleDelete = async (set: VocabSet) => {
    if (!user) return
    const confirmed = window.confirm(
      `Xóa bộ từ “${set.name}”? Hành động này không thể hoàn tác.`
    )
    if (!confirmed) return

    setDeletingSlug(set.slug)
    setError(null)
    try {
      await deleteMyVocabSet(user.uid, set.slug)
      setMySets((prev) => prev.filter((s) => s.slug !== set.slug))
    } catch (err) {
      console.error("[vocab-explorer] Lỗi khi xóa bộ từ:", err)
      setError("Không xóa được bộ từ. Vui lòng thử lại.")
    } finally {
      setDeletingSlug(null)
    }
  }

  const handleCreateClick = () => {
    if (!user) {
      openAuthModal("login")
      return
    }
    setCreating(true)
  }

  /* Phân trang: mỗi trang tối đa SETS_PER_PAGE bộ từ */
  const totalSets = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalSets / SETS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const pagedSets = filtered.slice(
    (currentPage - 1) * SETS_PER_PAGE,
    currentPage * SETS_PER_PAGE
  )

  const changePage = (next: number) => {
    const target = Math.min(Math.max(next, 1), totalPages)
    if (target === currentPage) return
    setPage(target)
    gridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <VocabTopicFilter topics={topics} active={topic} onChange={setTopic} />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <VocabSearchBar value={query} onChange={setQuery} />
          <button
            type="button"
            onClick={handleCreateClick}
            title={user ? "Tạo bộ từ vựng của riêng bạn" : "Đăng nhập để tạo bộ từ vựng"}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Tạo bộ từ
          </button>
        </div>
      </div>

      {error && (
        <p className="flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-3 text-sm font-medium text-slate-500">Đang tải bộ từ vựng…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <BookOpenText className="h-6 w-6" />
          </span>
          <p className="mt-3 font-semibold text-slate-900">Không tìm thấy bộ từ vựng</p>
          <p className="mt-1 text-sm text-slate-500">
            Thử từ khóa khác, chọn chủ đề khác hoặc tạo bộ từ mới của bạn nhé.
          </p>
          <button
            type="button"
            onClick={handleCreateClick}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Tạo bộ từ vựng
          </button>
        </div>
      ) : (
        <>
          <div ref={gridTopRef} className="grid scroll-mt-24 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pagedSets.map((s) => (
              <VocabSetCard
                key={s.slug}
                set={s}
                onDelete={user && s.ownerId === user.uid ? () => handleDelete(s) : undefined}
                deleting={deletingSlug === s.slug}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-xs font-semibold text-slate-500">
              Đang xem {pagedSets.length}/{totalSets} bộ từ
            </p>
            <p className="text-xs font-semibold text-slate-500">
              Trang {currentPage}/{totalPages}
            </p>
          </div>

          <VocabPagination page={currentPage} totalPages={totalPages} onChange={changePage} />
        </>
      )}

      <p className="text-[11px] text-slate-400">
        Bộ từ bạn tự tạo được gắn nhãn “Của tôi” và chỉ hiển thị với tài khoản của bạn.
      </p>

      {creating && (
        <CreateVocabSetModal
          onClose={() => setCreating(false)}
          onCreated={handleCreated}
          customTopics={customVocabTopicsFromSets(mySets)}
        />
      )}
    </div>
  )
}
