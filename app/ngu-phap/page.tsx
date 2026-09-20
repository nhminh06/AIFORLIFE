import { Network } from "lucide-react"

import { PageHeading } from "@/components/dashboard/page-heading"
import { SiteShell } from "@/components/dashboard/site-shell"
import { GrammarExplorer } from "@/components/grammar/grammar-explorer"

export default function NguPhapPage() {
  return (
    <SiteShell>
      <PageHeading
        icon={Network}
        title="Ngữ pháp"
        desc="Học ngữ pháp theo chủ điểm: lý thuyết ngắn gọn, bảng công thức và ví dụ minh họa."
        bubbleClass="bg-purple-600"
      />
      <GrammarExplorer />
    </SiteShell>
  )
}
