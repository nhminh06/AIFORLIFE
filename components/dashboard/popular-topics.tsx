import {
  Plane,
  Briefcase,
  GraduationCap,
  UtensilsCrossed,
  HeartPulse,
  Users,
  LayoutGrid,
} from "lucide-react"
import Link from "next/link"
import { SectionHeading } from "./section-heading"

const topics = [
  { label: "Du lịch", icon: Plane, bg: "bg-blue-50 dark:bg-blue-950/40", iconClass: "bg-blue-600", href: "/tu-vung?topic=travel" },
  { label: "Công việc", icon: Briefcase, bg: "bg-orange-50 dark:bg-orange-950/40", iconClass: "bg-orange-500", href: "/tu-vung?topic=business" },
  { label: "Học tập", icon: GraduationCap, bg: "bg-purple-50 dark:bg-purple-950/40", iconClass: "bg-purple-600", href: "/tu-vung?topic=education" },
  { label: "Ẩm thực", icon: UtensilsCrossed, bg: "bg-green-50 dark:bg-green-950/40", iconClass: "bg-green-600", href: "/tu-vung?topic=food" },
  { label: "Sức khỏe", icon: HeartPulse, bg: "bg-pink-50 dark:bg-pink-950/40", iconClass: "bg-pink-500", href: "/tu-vung?topic=health" },
  { label: "Gia đình", icon: Users, bg: "bg-sky-50 dark:bg-sky-950/40", iconClass: "bg-sky-500", href: "/tu-vung?topic=family" },
]

export function PopularTopics() {
  return (
    <section>
      <SectionHeading icon={LayoutGrid} title="Chủ đề phổ biến" action="Xem tất cả" />
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {topics.map((t) => {
          const Icon = t.icon
          return (
            <Link
              key={t.label}
              href={t.href}
              className={`group flex items-center gap-3 rounded-2xl border border-transparent ${t.bg} p-4 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-200/60 dark:hover:border-slate-700/60 dark:hover:shadow-none`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${t.iconClass} text-white shadow-sm`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{t.label}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
