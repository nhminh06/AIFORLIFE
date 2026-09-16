import { MessageSquareText } from "lucide-react"

import { PageHeading } from "@/components/dashboard/page-heading"
import { SiteShell } from "@/components/dashboard/site-shell"

import { PhraseExplorer } from "@/components/phrases/phrase-explorer"

export default function MauCauPage() {
  return (
    <SiteShell>
      <PageHeading
        icon={MessageSquareText}
        title="Mẫu câu"
        desc="Những câu nói thông dụng theo từng tình huống để giao tiếp tự nhiên."
        bubbleClass="bg-green-600"
      />
      <PhraseExplorer />
    </SiteShell>
  )
}
