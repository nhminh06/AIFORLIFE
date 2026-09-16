import { TrendingUp } from "lucide-react"

import { PageHeading } from "@/components/dashboard/page-heading"
import { SiteShell } from "@/components/dashboard/site-shell"
import { DailyChart, WeeklyChart } from "@/components/progress/progress-charts"
import { ProgressOverview } from "@/components/progress/progress-overview"
import { ActivityTimeline, BadgeGrid } from "@/components/progress/progress-sections"

export default function TienDoPage() {
  return (
    <SiteShell>
      <PageHeading
        icon={TrendingUp}
        title="Tiến độ học tập"
        desc="Nhìn lại hành trình của bạn: thời gian học, thành tích và từng cột mốc."
        bubbleClass="bg-teal-600"
      />
      <ProgressOverview />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <h3 className="font-bold text-slate-900">Thời gian học theo ngày</h3>
          <p className="mt-0.5 text-sm text-slate-500">Số phút học mỗi ngày trong tuần này.</p>
          <div className="mt-4">
            <DailyChart />
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <h3 className="font-bold text-slate-900">Tiến độ theo tuần</h3>
          <p className="mt-0.5 text-sm text-slate-500">Số từ và số bài hoàn thành 6 tuần qua.</p>
          <div className="mt-4">
            <WeeklyChart />
          </div>
        </section>
      </div>
      <BadgeGrid />
      <ActivityTimeline />
    </SiteShell>
  )
}
