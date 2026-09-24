"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  LogIn,
  LogOut,
  Settings,
  TrendingUp,
  UserRound,
  ShieldCheck,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { initials, AVATAR_PRESETS } from "@/lib/profile"

export function ProfileMenu() {
  const { user, userProfile, logout, openAuthModal } = useAuth()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const name = userProfile.name || user?.displayName || "Học viên"
  const email = user?.email || userProfile.email || "Chưa đăng nhập"
  const avatarText = initials(name)
  const photoURL = user?.photoURL || userProfile.photoURL
  const activePreset = AVATAR_PRESETS.find((p) => p.id === userProfile.avatarPreset)

  const links = [
    { href: "/ca-nhan", label: "Trang cá nhân", desc: "Hồ sơ, mục tiêu & giao diện", icon: UserRound },
    { href: "/tien-do", label: "Tiến độ của tôi", desc: "Streak, huy hiệu & lịch sử", icon: TrendingUp },
    { href: "/ca-nhan#cai-dat", label: "Cài đặt học tập", desc: "Mục tiêu, nhắc giờ & phát âm", icon: Settings },
  ]

  const handleLogout = async () => {
    setOpen(false)
    await logout()
  }

  // Nếu người dùng chưa đăng nhập
  if (!user) {
    return (
      <button
        type="button"
        onClick={() => openAuthModal("login")}
        className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-blue-600/35"
      >
        <LogIn className="h-3.5 w-3.5" />
        <span>Đăng nhập</span>
      </button>
    )
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label={`Tài khoản của ${name}`}
        aria-expanded={open}
        title={name}
        onClick={() => setOpen((v) => !v)}
        className={`ml-1 flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${
          userProfile.avatarColor || "from-blue-500 to-indigo-600"
        } text-sm font-semibold text-white shadow-sm transition-transform hover:scale-105 ${
          open ? "ring-2 ring-blue-400 ring-offset-2" : ""
        }`}
      >
        {photoURL ? (
          <img
            src={photoURL}
            alt={name}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : activePreset ? (
          <span className="text-base select-none">{activePreset.emoji}</span>
        ) : (
          avatarText
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 dark:border-slate-800 dark:bg-slate-900">
          <Link
            href="/ca-nhan"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${
                userProfile.avatarColor || "from-blue-500 to-indigo-600"
              } text-sm font-bold text-white shadow-sm`}
            >
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={name}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : activePreset ? (
                <span className="text-xl select-none">{activePreset.emoji}</span>
              ) : (
                avatarText
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-bold text-slate-900 dark:text-white">
                  {name}
                </span>
                <span title="Đã xác thực">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                </span>
              </div>
              <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                {email}
              </span>
            </div>
          </Link>

          <nav className="p-2 space-y-0.5">
            {links.map((l) => {
              const Icon = l.icon
              return (
                <Link
                  key={l.href + l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-xs font-bold text-slate-900 dark:text-slate-100">{l.label}</span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400">{l.desc}</span>
                  </span>
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-slate-100 p-2 dark:border-slate-800">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-500 dark:bg-red-950/50 dark:text-red-400">
                <LogOut className="h-4 w-4" />
              </span>
              <div>
                <span className="block text-xs font-bold text-red-600 dark:text-red-400">Đăng xuất</span>
                <span className="block text-[11px] text-red-400 dark:text-red-500/80">Thoát khỏi phiên đăng nhập</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
