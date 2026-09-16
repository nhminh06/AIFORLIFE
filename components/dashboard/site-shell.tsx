import { SiteFooter } from "./site-footer"
import { SiteHeader } from "./site-header"

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
