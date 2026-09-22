"use client"

import {
  Home,
  Pencil,
  MessageSquare,
  GitBranch,
  Timer,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { GlobalSearch } from "./global-search"
import { NotificationsBell } from "./notifications-bell"
import { ProfileMenu } from "./profile-menu"
import { ThemeToggle } from "./theme-toggle"

const navItems = [
  { label: "Trang chủ", icon: Home, href: "/" },
  { label: "Từ vựng", icon: Pencil, href: "/tu-vung" },
  { label: "Mẫu câu", icon: MessageSquare, href: "/mau-cau" },
  { label: "Ngữ pháp", icon: GitBranch, href: "/ngu-phap" },
  { label: "Luyện tập", icon: Timer, href: "/luyen-tap" },
  { label: "Tiến độ", icon: TrendingUp, href: "/tien-do" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/")

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <img
            src="/img/logo.png"
            alt="LearnSphere"
            width={36}
            height={36}
            className="h-9 w-9 rounded-xl object-cover shadow-sm"
          />
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Learn<span className="text-blue-600 dark:text-blue-400">Sphere</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <GlobalSearch />
          <NotificationsBell />
          <ThemeToggle compact />
          <ProfileMenu />
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 dark:border-slate-800 lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}

