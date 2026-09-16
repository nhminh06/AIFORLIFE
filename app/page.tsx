import { SiteHeader } from "@/components/dashboard/site-header"
import { HeroBanner } from "@/components/dashboard/hero-banner"
import { FeatureCards } from "@/components/dashboard/feature-cards"
import { ContinueLearning } from "@/components/dashboard/continue-learning"
import { PopularTopics } from "@/components/dashboard/popular-topics"
import { FeaturedLessons } from "@/components/dashboard/featured-lessons"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { SiteFooter } from "@/components/dashboard/site-footer"

export default function Page() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <HeroBanner />

        <div className="mt-6">
          <FeatureCards />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Left column */}
          <div className="space-y-8">
            <ContinueLearning />
            <PopularTopics />
            <FeaturedLessons />
          </div>

          {/* Right column */}
          <aside>
            <DashboardSidebar />
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
