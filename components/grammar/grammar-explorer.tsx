"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, Network, Plus } from "lucide-react"

import { useAuth } from "@/lib/auth-context"
import {
  grammarGroupLabel,
  grammarTopics as staticTopics,
  type GrammarGroup,
  type GrammarLevel,
  type GrammarTopic,
} from "@/lib/data/grammar"
import { getAllGrammarTopics } from "@/lib/grammar-service"
import {
  deleteMyGrammarSet,
  getMyGrammarSets,
  type GrammarSet,
} from "@/lib/user-grammar"
import { cn } from "@/lib/utils"

import { CreateGrammarModal } from "./create-grammar-set-modal"
import { GrammarSearchBar } from "./grammar-search-bar"
import { GrammarSetCard } from "./grammar-set-card"
import { GrammarTopicCard } from "./grammar-topic-card"
import { VocabPagination } from "@/components/vocab/vocab-pagination"

/** Số chủ điểm hiển thị trên mỗi trang của mỗi nhóm (thì / mở rộng) */
const SETS_PER_PAGE = 9

type GrammarFilter = "all" | "mine" | GrammarLevel

const FILTERS: { id: GrammarFilter; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "Cơ bản", label: "Cơ bản" },
  { id: "Trung cấp", label: "Trung cấp" },
  { id: "Nâng cao", label: "Nâng cao" },
  { id: "mine", label: "Của tôi" },
]

/** Thứ tự hiển thị 2 nhóm chủ điểm: 12 thì trước, mở rộng sau */
const GROUP_ORDER: GrammarGroup[] = ["tense", "other"]

type ExplorerItem =
  | { kind: "mine"; key: string; group: GrammarGroup; set: GrammarSet }
  | { kind: "core"; key: string; group: GrammarGroup; topic: GrammarTopic }

export function GrammarExplorer() {
  const { user, loading: authLoading, openAuthModal } = useAuth()

  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<GrammarFilter>("all")
  const [systemTopics, setSystemTopics] = useState<GrammarTopic[]>(staticTopics)
  const [mySets, setMySets] = useState<GrammarSet[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  /* Mỗi nhóm (thì / mở rộng) có trang riêng */
  const [pageByGroup, setPageByGroup] = useState<Record<GrammarGroup, number>>({
    tense: 1,
    other: 1,
  })
  const gridTopRef = useRef<HTMLDivElement | null>(null)

  /* Chủ điểm hệ thống: lấy từ Firestore, fallback về static */
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await getAllGrammarTopics()
        if (!cancelled && data.length > 0) setSystemTopics(data)
      } catch {
        // giữ nguyên static fallback
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  /* Chủ điểm cá nhân: chỉ tải cho user đang đăng nhập */
  const loadMySets = useCallback(async (uid: string) => {
    try {
      setMySets(await getMyGrammarSets(uid))
      setError(null)
    } catch (err) {
      console.error("[grammar-explorer] Lỗi khi tải chủ điểm cá nhân:", err)
      setError("Không tải được chủ điểm của bạn. Vui lòng thử lại.")
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

  /* Chủ điểm của bạn xếp trước, rồi tới các chủ điểm hệ thống — mỗi item giữ nhóm (tense/other) riêng */
  const items = useMemo<ExplorerItem[]>(
    () => [
      ...mySets.map((set) => ({
        kind: "mine" as const,
        key: set.slug,
        group: set.group,
        set,
      })),
      ...systemTopics.map((topic) => ({
        kind: "core" as const,
        key: topic.slug,
        group: topic.group,
        topic,
      })),
    ],
    [mySets, systemTopics]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((it) => {
      if (filter === "mine" && it.kind !== "mine") return false
      if (filter !== "all" && filter !== "mine") {
        const level = it.kind === "mine" ? it.set.level : it.topic.level
        if (level !== filter) return false
      }
      if (!q) return true
      const hay =
        it.kind === "mine"
          ? `${it.set.name} ${it.set.vi} ${it.set.desc}`
          : `${it.topic.name} ${it.topic.vi} ${it.topic.desc}`
      return hay.toLowerCase().includes(q)
    })
  }, [items, filter, query])

  /* Tách theo nhóm: 12 thì / ngữ pháp mở rộng (bao gồm cả chủ điểm user tạo gắn nhóm "other") */
  const itemsByGroup = useMemo(() => {
    const map: Record<GrammarGroup, ExplorerItem[]> = { tense: [], other: [] }
    for (const it of filtered) {
      map[it.group].push(it)
    }
    return map
  }, [filtered])

  /* Đổi bộ lọc/tìm kiếm → quay lại trang đầu ở cả 2 nhóm */
  useEffect(() => {
    setPageByGroup({ tense: 1, other: 1 })
  }, [query, filter])

  const handleCreated = (created: GrammarSet) => {
    setMySets((prev) => [created, ...prev.filter((s) => s.slug !== created.slug)])
  }

  const handleDelete = async (set: GrammarSet) => {
    if (!user) return
    const confirmed = window.confirm(
      `Xóa chủ điểm "${set.name}"? Hành động này không thể hoàn tác.`
    )
    if (!confirmed) return

    setDeletingSlug(set.slug)
    setError(null)
    try {
      await deleteMyGrammarSet(user.uid, set.slug)
      setMySets((prev) => prev.filter((s) => s.slug !== set.slug))
    } catch (err) {
      console.error("[grammar-explorer] Lỗi khi xóa chủ điểm:", err)
      setError("Không xóa được chủ điểm. Vui lòng thử lại.")
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

  const changePage = (group: GrammarGroup, next: number, totalPages: number) => {
    const target = Math.min(Math.max(next, 1), totalPages)
    setPageByGroup((prev) => {
      if (prev[group] === target) return prev
      return { ...prev, [group]: target }
    })
    gridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const totalItems = filtered.length

  const renderItem = (it: ExplorerItem) =>
    it.kind === "mine" ? (
      <GrammarSetCard
        key={it.key}
        set={it.set}
        mine
        onDelete={user ? () => handleDelete(it.set) : undefined}
        deleting={deletingSlug === it.key}
      />
    ) : (
      <GrammarTopicCard key={it.key} topic={it.topic} />
    )

  return (
    <div className="mt-6 space-y-4">
      {/* Thanh công cụ: bộ lọc + tìm kiếm + nút tạo (giống trang Từ vựng) */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => {
            if (f.id === "mine" && !user) return null
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  filter === f.id
                    ? "border-purple-600 bg-purple-600 text-white shadow-sm shadow-purple-600/25"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800"
                )}
              >
                {f.label}
              </button>
            )
          })}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <GrammarSearchBar value={query} onChange={setQuery} />
          <button
            type="button"
            onClick={handleCreateClick}
            title={user ? "Tạo chủ điểm ngữ pháp của riêng bạn" : "Đăng nhập để tạo chủ điểm"}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 transition-all hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" />
            Tạo ngữ pháp
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
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
          <p className="mt-3 text-sm font-medium text-slate-500">Đang tải chủ điểm ngữ pháp…</p>
        </div>
      ) : totalItems === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
            <Network className="h-6 w-6" />
          </span>
          <p className="mt-3 font-semibold text-slate-900">Không tìm thấy chủ điểm ngữ pháp</p>
          <p className="mt-1 text-sm text-slate-500">
            Thử từ khóa khác, chọn cấp độ khác hoặc tạo chủ điểm mới của bạn nhé.
          </p>
          <button
            type="button"
            onClick={handleCreateClick}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 transition-all hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" />
            Tạo chủ điểm ngữ pháp
          </button>
        </div>
      ) : (
        <div ref={gridTopRef} className="scroll-mt-24 space-y-8">
          {GROUP_ORDER.map((group) => {
            const groupItems = itemsByGroup[group]
            if (groupItems.length === 0) return null

            const page = pageByGroup[group]
            const totalPages = Math.max(1, Math.ceil(groupItems.length / SETS_PER_PAGE))
            const currentPage = Math.min(page, totalPages)
            const pagedItems = groupItems.slice(
              (currentPage - 1) * SETS_PER_PAGE,
              currentPage * SETS_PER_PAGE
            )

            return (
              <section key={group} className="space-y-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                    {grammarGroupLabel[group]}
                  </h2>
                  <p className="text-xs font-semibold text-slate-400">
                    {groupItems.length} chủ điểm
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {pagedItems.map(renderItem)}
                </div>

                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                    <p className="text-xs font-semibold text-slate-500">
                      Đang xem {pagedItems.length}/{groupItems.length} chủ điểm
                    </p>
                    <p className="text-xs font-semibold text-slate-500">
                      Trang {currentPage}/{totalPages}
                    </p>
                  </div>
                )}

                {totalPages > 1 && (
                  <VocabPagination
                    page={currentPage}
                    totalPages={totalPages}
                    onChange={(next) => changePage(group, next, totalPages)}
                  />
                )}
              </section>
            )
          })}
        </div>
      )}

      <p className="text-[11px] text-slate-400">
        Chủ điểm bạn tự tạo được gắn nhãn "Của tôi" và chỉ hiển thị với tài khoản của bạn.
      </p>

      {creating && (
        <CreateGrammarModal onClose={() => setCreating(false)} onCreated={handleCreated} />
      )}
    </div>
  )
}