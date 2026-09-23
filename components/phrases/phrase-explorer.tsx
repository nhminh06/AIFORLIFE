"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Loader2, MessageCircleHeart, Plus } from "lucide-react"

import { SearchInput } from "@/components/dashboard/search-input"
import { VocabPagination } from "@/components/vocab/vocab-pagination"
import { useAuth } from "@/lib/auth-context"
import {
  phraseSets as staticPhraseSets,
  phraseSituations,
  type PhraseSet,
} from "@/lib/data/phrases"
import { getAllPhraseSets } from "@/lib/phrase-service"
import { getMyPhraseSets } from "@/lib/user-phrases"
import { loadAllPhraseProgress } from "@/lib/phrase-progress"
import { cn } from "@/lib/utils"

import { CreatePhraseSetModal } from "./create-phrase-set-modal"
import { PhraseSetCard } from "./phrase-set-card"

/** Số bộ mẫu câu hiển thị trên mỗi trang của danh sách */
const SETS_PER_PAGE = 9

export function PhraseExplorer() {
  const { user, openAuthModal } = useAuth()
  const [query, setQuery] = useState("")
  const [sit, setSit] = useState("all")
  const [sets, setSets] = useState<PhraseSet[]>(staticPhraseSets)
  const [mySets, setMySets] = useState<PhraseSet[]>([])
  /** số câu đã học thật của từng bộ (theo user, từ Firestore) — slug → số câu */
  const [progressCounts, setProgressCounts] = useState<Record<string, number>>({})
  /** đã nạp xong tiến độ từ Firestore cho user (để phân biệt "chưa tải" với "0 câu") */
  const [progressLoaded, setProgressLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [page, setPage] = useState(1)
  const gridTopRef = useRef<HTMLDivElement | null>(null)

  /* Bộ mẫu câu hệ thống: lấy từ Firestore, fallback về static */
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await getAllPhraseSets()
        if (!cancelled && data.length > 0) setSets(data)
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

  /* Bộ mẫu câu cá nhân của user đang đăng nhập */
  const loadMySets = useCallback(async (uid: string) => {
    try {
      setMySets(await getMyPhraseSets(uid))
    } catch {
      setMySets([])
    }
  }, [])

  useEffect(() => {
    if (user?.uid) {
      loadMySets(user.uid)
    } else {
      setMySets([])
    }
  }, [user?.uid, loadMySets])

  /* Tiến độ "đã học" riêng của user cho mọi bộ (cả hệ thống) → card hiển thị số thật */
  useEffect(() => {
    let cancelled = false
    if (!user?.uid) {
      setProgressCounts({})
      setProgressLoaded(true)
      return
    }
    ;(async () => {
      const all = await loadAllPhraseProgress(user?.uid)
      if (cancelled) return
      const counts: Record<string, number> = {}
      for (const [slug, keys] of Object.entries(all)) counts[slug] = keys.length
      setProgressCounts(counts)
      setProgressLoaded(true)
    })()
    return () => {
      cancelled = true
    }
  }, [user?.uid])

  /* Bộ cá nhân lên đầu, rồi đến bộ hệ thống */
  const allSets = useMemo(() => [...mySets, ...sets], [mySets, sets])
  const mySetSlugs = useMemo(() => new Set(mySets.map((s) => s.slug)), [mySets])

  const handleCreated = (created: PhraseSet) => {
    setMySets((prev) => [created, ...prev])
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allSets.filter((s) => {
      if (sit !== "all" && s.situationId !== sit) return false
      if (!q) return true
      return (
        s.name.toLowerCase().includes(q) ||
        s.vi.toLowerCase().includes(q) ||
        s.items.some((i) => i.en.toLowerCase().includes(q) || i.vi.toLowerCase().includes(q))
      )
    })
  }, [allSets, query, sit])

  /* Phân trang: 9 bộ trên 1 trang */
  const totalPages = Math.max(1, Math.ceil(filtered.length / SETS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const pagedSets = filtered.slice((currentPage - 1) * SETS_PER_PAGE, currentPage * SETS_PER_PAGE)

  const changePage = (next: number) => {
    setPage(Math.min(Math.max(1, next), totalPages))
    gridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSit("all")
              changePage(1)
            }}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
              sit === "all"
                ? "border-green-600 bg-green-600 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-500 hover:text-slate-800"
            )}
          >
            Tất cả
          </button>
          {phraseSituations.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setSit(p.id)
                changePage(1)
              }}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                sit === p.id
                  ? p.chipClass + " border-current shadow-sm"
                  : "border-slate-200 bg-white text-slate-500 hover:text-slate-800"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Tìm mẫu câu…"
            label="Tìm mẫu câu"
          />
          <button
            type="button"
            onClick={() => {
              if (!user) {
                openAuthModal("login")
                return
              }
              setCreating(true)
            }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-green-600/25 transition-all hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            Tạo bộ
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <p className="mt-3 text-sm font-medium text-slate-500">Đang tải bộ mẫu câu…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
            <MessageCircleHeart className="h-6 w-6" />
          </span>
          <p className="mt-3 font-semibold text-slate-900">Không tìm thấy mẫu câu</p>
          <p className="mt-1 text-sm text-slate-500">Thử từ khóa hoặc tình huống khác nhé.</p>
        </div>
      ) : (
        <>
          <div ref={gridTopRef} className="grid scroll-mt-24 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pagedSets.map((s) => (
              <PhraseSetCard
                key={s.slug}
                set={s}
                mine={mySetSlugs.has(s.slug)}
                realLearned={
                  user ? (progressLoaded ? (progressCounts[s.slug] ?? 0) : undefined) : 0
                }
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-xs font-semibold text-slate-500">
              Đang xem {pagedSets.length}/{filtered.length} bộ mẫu câu
            </p>
            <p className="text-xs font-semibold text-slate-500">Trang {currentPage}/{totalPages}</p>
          </div>

          <VocabPagination page={currentPage} totalPages={totalPages} onChange={changePage} />
        </>
      )}

      {creating && (
        <CreatePhraseSetModal
          onClose={() => setCreating(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}

