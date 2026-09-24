"use client"

import { Check, Laptop, Moon, Palette, Sun, Type } from "lucide-react"

import { useTheme, type ThemeChoice } from "@/lib/theme"
import { useAuth } from "@/lib/auth-context"

type Option = {
  id: ThemeChoice
  label: string
  desc: string
  icon: typeof Sun
  previewBg: string
  previewBorder: string
  previewText: string
  previewBar: string
}

const THEME_OPTIONS: Option[] = [
  {
    id: "light",
    label: "Giao diện Sáng",
    desc: "Nền trắng sáng rõ, tươi mới và dễ nhìn ban ngày",
    icon: Sun,
    previewBg: "bg-slate-100",
    previewBorder: "border-slate-300",
    previewText: "bg-slate-800",
    previewBar: "bg-blue-600",
  },
  {
    id: "dark",
    label: "Giao diện Tối",
    desc: "Nền tối huyền bí, bảo vệ mắt và tiết kiệm pin",
    icon: Moon,
    previewBg: "bg-slate-900",
    previewBorder: "border-slate-700",
    previewText: "bg-slate-200",
    previewBar: "bg-blue-500",
  },
  {
    id: "system",
    label: "Tự động (Hệ thống)",
    desc: "Tự động đồng bộ theo cài đặt hệ điều hành của bạn",
    icon: Laptop,
    previewBg: "bg-gradient-to-r from-slate-100 to-slate-900",
    previewBorder: "border-slate-400",
    previewText: "bg-slate-500",
    previewBar: "bg-indigo-600",
  },
]

const FONT_OPTIONS: { id: "normal" | "large" | "xlarge"; label: string; desc: string; sample: string }[] = [
  { id: "normal", label: "Tiêu chuẩn", desc: "Kích thước văn bản mặc định cân đối", sample: "Aa" },
  { id: "large", label: "Vừa phải (+10%)", desc: "Dễ đọc hơn khi học ngữ pháp và từ vựng", sample: "Aa" },
  { id: "xlarge", label: "Lớn (+20%)", desc: "Bảo vệ mắt, văn bản to rõ tối đa", sample: "Aa" },
]

export function AppearanceCard() {
  const { theme, resolved, setTheme } = useTheme()
  const { userProfile, updateProfileData } = useAuth()
  const currentFont = userProfile.fontSize || "normal"

  const handleFontChange = (size: "normal" | "large" | "xlarge") => {
    void updateProfileData({ fontSize: size })
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-font-size", size)
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
          <Palette className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Tùy biến Giao diện & Màu sắc
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Lựa chọn chế độ hiển thị và kích cỡ chữ phù hợp với thói quen học tập của bạn
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {THEME_OPTIONS.map((opt) => {
          const Icon = opt.icon
          const selected = theme === opt.id

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id)}
              className={`group relative flex flex-col rounded-2xl border p-4 text-left transition-all ${
                selected
                  ? "border-blue-600 bg-blue-50/40 shadow-md shadow-blue-600/10 ring-2 ring-blue-500/20 dark:border-blue-500 dark:bg-blue-950/20"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-slate-700"
              }`}
            >
              {/* Preview Box */}
              <div
                className={`relative mb-3.5 h-20 w-full overflow-hidden rounded-xl border ${opt.previewBorder} ${opt.previewBg} p-2.5 transition-transform group-hover:scale-[1.02]`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                </div>
                <div className="mt-2 space-y-1.5">
                  <div className={`h-2 w-3/4 rounded ${opt.previewText}`} />
                  <div className={`h-1.5 w-1/2 rounded opacity-50 ${opt.previewText}`} />
                  <div className={`h-1.5 w-1/3 rounded ${opt.previewBar}`} />
                </div>
              </div>

              {/* Title & Desc */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  <Icon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  {opt.label}
                </span>
                {selected && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                {opt.desc}
              </p>
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-slate-800/50">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Chế độ đang áp dụng:
        </span>
        <span className="text-xs font-bold text-slate-900 dark:text-white">
          {theme === "system" ? `Tự động (${resolved === "dark" ? "Đang Tối" : "Đang Sáng"})` : theme === "light" ? "Giao diện Sáng" : "Giao diện Tối"}
        </span>
      </div>

      {/* Tùy chỉnh kích thước chữ hiển thị */}
      <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <Type className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
            Cỡ chữ hiển thị bài học & từ vựng
          </h4>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {FONT_OPTIONS.map((f) => {
            const active = currentFont === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => handleFontChange(f.id)}
                className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all ${
                  active
                    ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 dark:border-blue-500 dark:bg-blue-950/30"
                    : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-800/50"
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-serif font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200 ${
                    f.id === "large" ? "text-base" : f.id === "xlarge" ? "text-lg" : "text-sm"
                  }`}
                >
                  {f.sample}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {f.label}
                    </span>
                    {active && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    {f.desc}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

