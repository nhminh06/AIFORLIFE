import { courseProgress, overviewStats } from "@/lib/data/progress"

const R = 64
const CIRC = 2 * Math.PI * R

export function ProgressOverview() {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm shadow-slate-200/50 sm:col-span-2 xl:col-span-1">
        <h3 className="text-sm font-semibold text-slate-500">Hoàn thành khóa học</h3>
        <div className="mx-auto mt-3 relative flex h-40 w-40 items-center justify-center">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 144 144">
            <circle cx="72" cy="72" r={R} fill="none" strokeWidth="12" className="stroke-slate-100" />
            <circle
              cx="72"
              cy="72"
              r={R}
              fill="none"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC - (courseProgress / 100) * CIRC}
              className="stroke-teal-500"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-4xl font-bold text-slate-900">{courseProgress}%</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400">Cố lên, bạn đã đi được nửa đường!</p>
      </section>

      {overviewStats.map((s) => {
        const Icon = s.icon
        return (
          <section
            key={s.label}
            className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm shadow-slate-200/50"
          >
            <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${s.color}`}>
              <Icon className="h-6 w-6" />
            </span>
            <p className="mt-3 text-3xl font-bold text-slate-900">{s.value}</p>
            <p className="mt-1 text-sm text-slate-500">{s.label}</p>
          </section>
        )
      })}
    </div>
  )
}
