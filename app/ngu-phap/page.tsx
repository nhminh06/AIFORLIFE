"use client"

import { useState, useMemo } from "react"
import { GitBranch } from "lucide-react"

import { PageHeading } from "@/components/dashboard/page-heading"
import { SiteShell } from "@/components/dashboard/site-shell"
import { VocabPagination } from "@/components/vocab/vocab-pagination"

import { GrammarTopicCard } from "@/components/grammar/grammar-topic-card"
import { grammarTopics } from "@/lib/data/grammar"

const PER_PAGE = 9

export default function NguPhapPage() {
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(grammarTopics.length / PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const offset = (currentPage - 1) * PER_PAGE
  const pagedTopics = useMemo(
    () => grammarTopics.slice(offset, offset + PER_PAGE),
    [offset]
  )

  const changePage = (next: number) => {
    const target = Math.min(Math.max(next, 1), totalPages)
    if (target === currentPage) return
    setPage(target)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <SiteShell>
      <PageHeading
        icon={GitBranch}
        title="Ngữ pháp"
        desc="Nắm chắc từng chủ điểm qua lý thuyết ngắn gọn, công thức và ví dụ."
        bubbleClass="bg-purple-600"
      />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {pagedTopics.map((t) => (
          <GrammarTopicCard key={t.slug} topic={t} />
        ))}
      </div>
      <VocabPagination page={currentPage} totalPages={totalPages} onChange={changePage} />
    </SiteShell>
  )
}
