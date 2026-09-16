import { PenLine } from "lucide-react"

import { PageHeading } from "@/components/dashboard/page-heading"
import { SiteShell } from "@/components/dashboard/site-shell"
import { PracticeExplorer } from "@/components/practice/practice-explorer"

export default function LuyenTapPage() {
  return (
    <SiteShell>
      <PageHeading
        icon={PenLine}
        title="Luyện tập"
        desc="Rèn kỹ năng qua trắc nghiệm, điền từ, nghe hiểu và sắp xếp câu."
        bubbleClass="bg-orange-500"
      />
      <PracticeExplorer />
    </SiteShell>
  )
}
