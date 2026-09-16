import {
  Plane,
  Briefcase,
  GraduationCap,
  UtensilsCrossed,
  HeartPulse,
  Users,
  LayoutGrid,
} from "lucide-react"
import { SectionHeading } from "./section-heading"

const topics = [
  { label: "Du lịch", icon: Plane, bg: "bg-blue-50", iconClass: "bg-blue-600" },
  { label: "Công việc", icon: Briefcase, bg: "bg-orange-50", iconClass: "bg-orange-500" },
  { label: "Học tập", icon: GraduationCap, bg: "bg-purple-50", iconClass: "bg-purple-600" },
  { label: "Ẩm thực", icon: UtensilsCrossed, bg: "bg-green-50", iconClass: "bg-green-600" },
  { label: "Sức khỏe", icon: HeartPulse, bg: "bg-pink-50", iconClass: "bg-pink-500" },
  { label: "Gia đình", icon: Users, bg: "bg-sky-50", iconClass: "bg-sky-500" },
]

export function PopularTopics() {
  return (
    <section>
      <SectionHeading icon={LayoutGrid} title="Chủ đề phổ biến" action="Xem tất cả" />
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {topics.map((t) => {
          const Icon = t.icon
          return (
            <a
              key={t.label}
              href="#"
              className={`group flex items-center gap-3 rounded-2xl ${t.bg} p-4 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-200/60`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${t.iconClass} text-white shadow-sm`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="font-semibold text-slate-800">{t.label}</span>
            </a>
          )
        })}
      </div>
    </section>
  )
}
