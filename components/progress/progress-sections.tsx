import type { ActivityItem, Badge } from "@/lib/data/progress"
import { cn } from "@/lib/utils"

function earnedDate(iso?: string): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
}

export function BadgeGrid({ badges }: { badges: Badge[] }) {
  const earnedCount = badges.filter((b) => b.earned).length
  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold text-slate-900">Huy hiệu thành tích</h3>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          Đã đạt {earnedCount}/{badges.length}
        </span>
      </div>
      <p className="mt-0.5 text-sm text-slate-500">
        Mở khóa thêm huy hiệu bằng cách học đều mỗi ngày.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {badges.map((b) => {
          const Icon = b.icon
          const achievedOn = earnedDate(b.earnedAt)
          return (
            <div
              key={b.id}
              className={cn(
                "flex flex-col items-center rounded-2xl border px-3 py-5 text-center",
                b.earned ? "border-slate-200 bg-white" : "border-dashed border-slate-200 bg-slate-50"
              )}
            >
              <span
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-full text-white shadow-sm",
                  b.earned ? b.bg : "bg-slate-300"
                )}
              >
                <Icon className="h-6 w-6" />
              </span>
              <p className={cn("mt-2.5 text-sm font-bold", b.earned ? "text-slate-900" : "text-slate-400")}>
                {b.name}
              </p>
              <p className={cn("text-xs", b.earned ? "text-slate-500" : "text-slate-400")}>{b.vi}</p>
              {b.earned ? (
                <span className="mt-2 rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">
                  {achievedOn ? `Đạt ${achievedOn}` : "Đã đạt"}
                </span>
              ) : (
                <span className="mt-2 rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
                  Chưa đạt
                </span>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
      <h3 className="font-bold text-slate-900">Lịch sử hoạt động</h3>
      <p className="mt-0.5 text-sm text-slate-500">Những bài học bạn đã hoàn thành gần đây.</p>

      {items.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
          Chưa có hoạt động nào. Hãy học một bộ từ vựng hoặc làm một bài luyện tập để bắt đầu
          hành trình nhé!
        </p>
      ) : (
        <ol className="mt-5 space-y-0">
          {items.map((a, i) => (
            <li key={`${a.title}-${i}`} className="relative flex gap-4 pb-6 last:pb-0">
              {i < items.length - 1 && (
                <span className="absolute left-[7px] top-5 h-full w-px bg-slate-200" aria-hidden="true" />
              )}
              <span className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-[3px] border-teal-500 bg-white" />
              <div className="flex flex-1 flex-col gap-1 rounded-xl bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">{a.title}</p>
                  <p className="text-xs text-slate-500">
                    {a.date} · {a.detail}
                  </p>
                </div>
                <span className={cn("w-fit rounded-full px-2.5 py-1 text-xs font-bold", a.scoreClass)}>
                  {a.score}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
