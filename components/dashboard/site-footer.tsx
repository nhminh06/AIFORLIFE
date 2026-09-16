import { BookOpen, Globe, Mail, MessageCircle, Send } from "lucide-react"

const links = ["Giới thiệu", "Liên hệ", "Điều khoản", "Chính sách"]
const socials = [
  { icon: Globe, label: "Website" },
  { icon: Mail, label: "Email" },
  { icon: MessageCircle, label: "Cộng đồng" },
  { icon: Send, label: "Kênh tin tức" },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-8 sm:px-6 md:flex-row md:justify-between lg:px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
            <BookOpen className="h-5 w-5" />
          </span>
          <div>
            <p className="font-bold text-slate-900">
              Learn<span className="text-blue-600">English</span>
            </p>
            <p className="text-xs text-slate-500">Học mỗi ngày, giỏi mỗi ngày</p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {links.map((l) => (
            <a
              key={l}
              href="#"
              className="text-sm font-medium text-slate-500 transition-colors hover:text-blue-600"
            >
              {l}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {socials.map((s) => {
            const Icon = s.icon
            return (
              <a
                key={s.label}
                href="#"
                aria-label={s.label}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-blue-600 hover:text-white"
              >
                <Icon className="h-4 w-4" />
              </a>
            )
          })}
        </div>
      </div>
    </footer>
  )
}
