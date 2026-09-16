import {
  ArrowRight,
  BookText,
  MessageCircle,
  Network,
  PencilLine,
  BarChart3,
} from "lucide-react"

const features = [
  {
    label: "Từ vựng",
    desc: "Học 5.000+ từ theo chủ đề",
    icon: BookText,
    bg: "bg-blue-50 dark:bg-blue-950/40",
    iconBg: "bg-blue-600",
    border: "border-blue-100 dark:border-blue-900/40",
    href: "/tu-vung",
  },
  {
    label: "Mẫu câu",
    desc: "Giao tiếp tự nhiên mỗi ngày",
    icon: MessageCircle,
    bg: "bg-green-50 dark:bg-green-950/40",
    iconBg: "bg-green-600",
    border: "border-green-100 dark:border-green-900/40",
    href: "/mau-cau",
  },
  {
    label: "Ngữ pháp",
    desc: "Nắm chắc cấu trúc câu",
    icon: Network,
    bg: "bg-purple-50 dark:bg-purple-950/40",
    iconBg: "bg-purple-600",
    border: "border-purple-100 dark:border-purple-900/40",
    href: "/ngu-phap",
  },
  {
    label: "Luyện tập",
    desc: "Bài tập tương tác đa dạng",
    icon: PencilLine,
    bg: "bg-orange-50 dark:bg-orange-950/40",
    iconBg: "bg-orange-500",
    border: "border-orange-100 dark:border-orange-900/40",
    href: "/luyen-tap",
  },
  {
    label: "Tiến độ",
    desc: "Theo dõi hành trình học",
    icon: BarChart3,
    bg: "bg-teal-50 dark:bg-teal-950/40",
    iconBg: "bg-teal-600",
    border: "border-teal-100 dark:border-teal-900/40",
    href: "/tien-do",
  },
]

export function FeatureCards() {
  return (
    <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {features.map((f) => {
        const Icon = f.icon
        return (
          <a
            key={f.label}
            href={f.href}
            className={`group relative flex flex-col rounded-2xl border ${f.border} ${f.bg} p-4 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-200/60 dark:hover:shadow-none`}
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full ${f.iconBg} text-white shadow-sm`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">{f.label}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {f.desc}
            </p>
            <ArrowRight className="mt-3 ml-auto h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-200" />
          </a>
        )
      })}
    </section>
  )
}
