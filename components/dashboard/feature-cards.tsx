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
    bg: "bg-blue-50",
    iconBg: "bg-blue-600",
    border: "border-blue-100",
  },
  {
    label: "Mẫu câu",
    desc: "Giao tiếp tự nhiên mỗi ngày",
    icon: MessageCircle,
    bg: "bg-green-50",
    iconBg: "bg-green-600",
    border: "border-green-100",
  },
  {
    label: "Ngữ pháp",
    desc: "Nắm chắc cấu trúc câu",
    icon: Network,
    bg: "bg-purple-50",
    iconBg: "bg-purple-600",
    border: "border-purple-100",
  },
  {
    label: "Luyện tập",
    desc: "Bài tập tương tác đa dạng",
    icon: PencilLine,
    bg: "bg-orange-50",
    iconBg: "bg-orange-500",
    border: "border-orange-100",
  },
  {
    label: "Tiến độ",
    desc: "Theo dõi hành trình học",
    icon: BarChart3,
    bg: "bg-teal-50",
    iconBg: "bg-teal-600",
    border: "border-teal-100",
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
            href="#"
            className={`group relative flex flex-col rounded-2xl border ${f.border} ${f.bg} p-4 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-200/60`}
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full ${f.iconBg} text-white shadow-sm`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-3 text-sm font-bold text-slate-900">{f.label}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {f.desc}
            </p>
            <ArrowRight className="mt-3 ml-auto h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600" />
          </a>
        )
      })}
    </section>
  )
}
