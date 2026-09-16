import { BookOpenText } from "lucide-react"

import { PageHeading } from "@/components/dashboard/page-heading"
import { SiteShell } from "@/components/dashboard/site-shell"
import { StudyStatsCard } from "@/components/dashboard/study-stats-card"
import { TodayVocabulary } from "@/components/dashboard/today-vocabulary"

import { VocabExplorer } from "@/components/vocab/vocab-explorer"

export default function TuVungPage() {
  return (
    <SiteShell>
      <PageHeading
        icon={BookOpenText}
        title="Từ vựng"
        desc="Học từ mới theo từng chủ đề, theo dõi tiến độ và ôn lại mỗi ngày."
        bubbleClass="bg-blue-600"
      />
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <VocabExplorer />
        <aside className="space-y-6">
          <TodayVocabulary />
          <StudyStatsCard />
        </aside>
      </div>
    </SiteShell>
  )
}
