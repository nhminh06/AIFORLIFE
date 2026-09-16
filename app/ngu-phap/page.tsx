import { GitBranch } from "lucide-react"

import { PageHeading } from "@/components/dashboard/page-heading"
import { SiteShell } from "@/components/dashboard/site-shell"

import { GrammarTopicCard } from "@/components/grammar/grammar-topic-card"
import { grammarTopics } from "@/lib/data/grammar"

export default function NguPhapPage() {
  return (
    <SiteShell>
      <PageHeading
        icon={GitBranch}
        title="Ngữ pháp"
        desc="Nắm chắc từng chủ điểm qua lý thuyết ngắn gọn, công thức và ví dụ."
        bubbleClass="bg-purple-600"
      />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {grammarTopics.map((t) => (
          <GrammarTopicCard key={t.slug} topic={t} />
        ))}
      </div>
    </SiteShell>
  )
}
