import { ArrowRight, Sparkles } from "lucide-react"
import { SectionHeading } from "./section-heading"

const lessons = [
  {
    img: "/images/lesson-travel.png",
    badge: "Từ vựng",
    badgeClass: "bg-blue-100 text-blue-700",
    title: "Tiếng Anh khi đi du lịch",
    meta: "120 từ · Sơ cấp",
  },
  {
    img: "/images/lesson-business.png",
    badge: "Mẫu câu",
    badgeClass: "bg-orange-100 text-orange-700",
    title: "Giao tiếp trong công việc",
    meta: "85 mẫu câu · Trung cấp",
  },
  {
    img: "/images/lesson-interview.png",
    badge: "Ngữ pháp",
    badgeClass: "bg-purple-100 text-purple-700",
    title: "Phỏng vấn xin việc",
    meta: "60 từ · Cao cấp",
  },
]

export function FeaturedLessons() {
  return (
    <section>
      <SectionHeading icon={Sparkles} title="Bài học nổi bật" action="Xem tất cả" />
      <div className="mt-4 space-y-3">
        {lessons.map((l) => (
          <a
            key={l.title}
            href="#"
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/50 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
          >
            <img
              src={l.img || "/placeholder.svg"}
              alt=""
              className="h-16 w-16 shrink-0 rounded-xl object-cover dark:brightness-90"
            />
            <div className="min-w-0 flex-1">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${l.badgeClass}`}
              >
                {l.badge}
              </span>
              <h3 className="mt-1.5 truncate font-bold text-slate-900 dark:text-white">
                {l.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{l.meta}</p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300" />
          </a>
        ))}
      </div>
    </section>
  )
}
