import { BookText, CheckCircle2, Flame } from "lucide-react"

const stats = [
  { label: "Từ đã học", value: "1.240", icon: BookText, color: "text-blue-600 bg-blue-50" },
  { label: "Bài hoàn thành", value: "86", icon: CheckCircle2, color: "text-green-600 bg-green-50" },
  { label: "Ngày liên tiếp", value: "12", icon: Flame, color: "text-orange-500 bg-orange-50" },
]

const PROGRESS = 45
const RADIUS = 52
const CIRC = 2 * Math.PI * RADIUS

export function StudyStatsCard() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <h3 className="text-base font-bold text-slate-900 dark:text-white">Thống kê học tập</h3>
      <div className="mt-4 flex justify-center">
        <div className="relative flex h-36 w-36 items-center justify-center">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-slate-100 dark:text-slate-800"
            />
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC - (PROGRESS / 100) * CIRC}
              className="text-teal-500"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">{PROGRESS}%</span>
            <span className="text-xs text-slate-400 dark:text-slate-400">Hoàn thành</span>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="flex flex-col items-center rounded-xl bg-slate-50 p-2.5 text-center dark:bg-slate-800/60"
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.color}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="mt-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">{s.value}</span>
              <span className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">{s.label}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
