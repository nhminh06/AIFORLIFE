import { ArrowRight, BookText, Network, MessageCircle, Play } from "lucide-react"
import { SectionHeading } from "./section-heading"

const lessons = [
  {
    badge: "Từ vựng",
    badgeClass: "bg-blue-100 text-blue-700",
    icon: BookText,
    iconClass: "bg-blue-50 text-blue-600",
    title: "Daily Life",
    desc: "Từ vựng về cuộc sống hằng ngày",
    progress: 60,
    barClass: "bg-blue-600",
  },
  {
    badge: "Ngữ pháp",
    badgeClass: "bg-purple-100 text-purple-700",
    icon: Network,
    iconClass: "bg-purple-50 text-purple-600",
    title: "Present Simple",
    desc: "Thì hiện tại đơn trong giao tiếp",
    progress: 40,
    barClass: "bg-purple-600",
  },
  {
    badge: "Mẫu câu",
    badgeClass: "bg-green-100 text-green-700",
    icon: MessageCircle,
    iconClass: "bg-green-50 text-green-600",
    title: "Giao tiếp hàng ngày",
    desc: "Các mẫu câu thông dụng nhất",
    progress: 30,
    barClass: "bg-green-600",
  },
]

export function ContinueLearning() {
  return (
    <section>
      <SectionHeading icon={Play} title="Tiếp tục học" action="Xem tất cả" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {lessons.map((l) => {
          const Icon = l.icon
          return (
            <a
              key={l.title}
              href="#"
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${l.badgeClass}`}
                >
                  {l.badge}
                </span>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${l.iconClass}`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
              </div>
              <h3 className="mt-3 font-bold text-slate-900 dark:text-white">{l.title}</h3>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{l.desc}</p>
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-400 dark:text-slate-500">Hoàn thành</span>
                  <span className="text-slate-700 dark:text-slate-300">{l.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full ${l.barClass}`}
                    style={{ width: `${l.progress}%` }}
                  />
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </section>
  )
}
