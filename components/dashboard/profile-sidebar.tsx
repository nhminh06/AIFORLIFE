"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Award,
  Bell,
  Cog,
  CreditCard,
  Eye,
  HelpCircle,
  Info,
  Mic,
  Palette,
  PenSquare,
  Shield,
  TrendingUp,
  User,
  Users,
} from "lucide-react"

/**
 * Profile-sidebar navigation – dùng chung cho trang `/ca-nhan/*`.
 * Match style header: bullet, các mục có icon, badge attentions đỏ bên phải.
 */
type ProfileNavItem = {
  href: string
  label: string
  icon: typeof User
  badge?: string | number
  tone?: "primary" | "warm" | "muted"
}

const g = (
  href: string,
  label: string,
  icon: ProfileNavItem["icon"],
  badge?: ProfileNavItem["badge"],
  tone?: ProfileNavItem["tone"],
): ProfileNavItem =>
  // biome-ignore lint/suspicious/noexplicitany: type-safe alias
  ({ href, label, icon, badge, tone } as any)

const items: ProfileNavItem[] = [
  g("/", "Tổng quan", TrendingUp, 2),
  g("/thong-bao", "Thông báo", Bell, 6, "warm"),
  g("/thong-tin-ca-nhan", "Thông tin cá nhân", User),
  g("/ban-thu-vi", "Bàn thắng", Award),
  g("/tich-luy", "Tích lũy", CreditCard),
  g("/cau-hoi", "Câu hỏi & Trợ giúp", HelpCircle),
  g("/dia-diem", "Địa điểm đã học", Eye),
  g("/luyen-noi", "Luyện nói", Mic),
  g("/ngu-chung", "Người cùng học", Users),
  g("/y-kien", "Ý kiến & Góp ý", PenSquare),
  g("/thiet-lap", "Thiết lập", Cog),
  g("/khang-dinh", "Khẳng định", Shield),
  g("/doi-mat", "Đổi mặt", Palette),
  g("/tang-chung", "Tặng chứng", Info),
]

export function ProfileSidebar() {
  const pathname = usePathname()
  const toneClass: Record<NonNullable<ProfileNavItem["tone"]>, string> = {
    primary: "text-slate-900 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800/60",
    warm: "text-slate-900 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800/60",
    muted: "text-slate-400 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800/40",
  }

  return (
    <nav
      id="profile-sidebar-nav"
      className="flex shrink-0 flex-col border-r border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 lg:mt-0 lg:max-h-screen lg:max-w-sm lg:flex-none"
      aria-label="Menu trang cá nhân"
    >
      {/* Học Mới badge ver */}
      <div className="h-12 shrink-0" />

      <div className="relative grow py-4 overflow-y-auto lg:overflow-ellipsis lg:w-full">
        {items.map(({ href, label, icon: Icon, badge, tone = "muted" }) => {
          const active = href === "/" ? pathname === "/ca-nhan" || pathname === "/" : pathname === href || pathname.startsWith(href + "/")

          return (
            <Link
              key={href}
              href={`/ca-nhan${href}`}
              aria-current={active ? "page" : undefined}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-blue-50 text-blue-700 dark:bg-blue-600/10 dark:text-blue-400" : toneClass[tone]}`}
              data-active={active ? "true" : undefined}
            >
              <span className={`flex shrink-0 h-6 w-6 items-center justify-center rounded-lg transition-colors ${active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:group-hover:bg-slate-700"}`}>
                <Icon className="h-4 w-4" />
              </span>

              <span className="flex-1 truncate">{label}</span>

              {badge !== undefined && (
                <span
                  className="flex shrink-0 h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 font-semibold text-[11px] text-white"
                  aria-label={`${badge} thông báo chưa đọc`}
                  title={`${badge} thông báo chưa đọc`}
                >
                  {badge}
                </span>
              )}

              {active && (
                <span className="pointer-events-none absolute inset-y-0 left-0 w-0.5 border-l-2 border-blue-600" />
              )}
            </Link>
          )
        })}
      </div>

      {/* Footer: link ra ngoài */}
      <div className="shrink-0 border-t border-slate-200 bg-slate-50/60 px-3 py-2.5 dark:border-slate-800 lg:hidden lg:max-h-screen lg:pb-3 lg:pt-0">
        <Link
          href="https://learnsphere.example.com/privacy"
          target="_blank"
          rel="noreferrer noopener noreferrer"
          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <Shield className="h-3.5 w-3.5" />
          Điều khoản & Bảo mật
        </Link>
      </div>
    </nav>
  )
}
