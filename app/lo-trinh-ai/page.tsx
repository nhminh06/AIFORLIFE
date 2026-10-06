"use client"

import { Sparkles } from "lucide-react"

import { PageHeading } from "@/components/dashboard/page-heading"
import { SiteShell } from "@/components/dashboard/site-shell"
import { AiLearningPathCard } from "@/components/progress/ai-learning-path-card"
import { useAuth } from "@/lib/auth-context"

export default function LoTrinhAiPage() {
  const { user } = useAuth()

  return (
    <SiteShell>
      <PageHeading
        icon={Sparkles}
        title="Lộ trình Học Cá nhân hoá từ AI"
        desc="Mô hình Machine Learning tổng hợp câu đúng & câu sai của bạn để thiết kế lộ trình học thích ứng (Adaptive Pathway)."
        bubbleClass="bg-indigo-600"
      />

      <div className="mt-6">
        <AiLearningPathCard uid={user?.uid} />
      </div>
    </SiteShell>
  )
}
