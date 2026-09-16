"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { LogOut, Settings, TrendingUp, UserRound } from "lucide-react"

import {
  PROFILE_UPDATED_EVENT,
  initials,
  loadProfile,
} from "@/lib/profile"

export function ProfileMenu() {
  const [open, setOpen] = useState(false)
  const [avatar, setAvatar] = useState("NH")
  const [name, setName] = useState("")
  const wrapRef = useRef<HTMLDivElement>(null)

  const refresh = () => {
    const p = loadProfile()
    setName(p.name)
    setAvatar(initials(p.name))
  }

  useEffect(() => {
    refresh()
    window.addEventListener(PROFILE_UPDATED_EVENT, refresh)
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, refresh)
  }, [])

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
  }, [open ])

  const links = [
    { href: "/ca-nhan", label: "Trang cá nhân", desc: "Hồ sơ, mục tiêu & giao diện", icon: UserRound },
    { href: "/tien-do", label: "Tiến độ của tôi", desc: "Streak, huy hiệu & lịch sử", icon: TrendingUp },
    { href: "/ca-nhan#cai-dat", label: "Cài đặt học tập", desc: "Mục tiêu, nhắc giờ & phát âm", icon: Settings },
  ]

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label={name ? `Tài khoản của ${name}` : "Tài khoản"}
        aria-expanded={open}
        title={name || "Tài khoản"}
        onClick={() => setOpen((v) => !v)}
        className={`ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-105 ${
          open ? "ring-2 ring-blue-300 ring-offset-2" : ""
        }`}
      >
        {avatar}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <Link
            href="/ca-nhan"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 transition-colors hover:bg-slate-50"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-semibold text-white">
              {avatar}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-slate-900">
                {name || "Học viên"}
              </span>
              <span className="block text-xs text-slate-500">Xem trang cá nhân</span>
            </span>
          </Link>

          <nav className="p-2">
            {links.map((l) => {
              const Icon = l.icon
              return (
                <Link
                  key={l.href + l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-slate-50"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{l.label}</span>
                    <span className="block text-xs text-slate-500">{l.desc}</span>
                  </span>
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-slate-100 p-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-red-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-500">
                <LogOut className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold text-red-600">Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
