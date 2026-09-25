import { SiteFooter } from "./site-footer"
import { SiteHeader } from "./site-header"

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#F8FAFC] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>
      <div className="mt-auto w-full">
        <SiteFooter />
      </div>
    </div>
  )
}

