"use client"

import { useEffect, useState } from "react"
import {
  Calendar,
  Check,
  Flame,
  GraduationCap,
  LogIn,
  Mail,
  PencilLine,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { initials, type Profile } from "@/lib/profile"

const AVATAR_GRADIENTS = [
  { id: "from-blue-500 to-indigo-600", label: "Lam Tinh Hải" },
  { id: "from-purple-500 to-pink-600", label: "Tím Thần Kỳ" },
  { id: "from-emerald-500 to-teal-600", label: "Ngọc Lục Bảo" },
  { id: "from-amber-500 to-orange-600", label: "Hoàng Hôn Cam" },
  { id: "from-rose-500 to-red-600", label: "Hồng Nhiệt Huyết" },
]

const LEVELS = [
  "Cơ bản (A1 - A2)",
  "Trung cấp (B1)",
  "Trung cấp cao (B2)",
  "Nâng cao (C1 - C2)",
]

export function ProfileHero() {
  const { user, userProfile, updateProfileData, openAuthModal } = useAuth()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Profile>({
    name: "",
    email: "",
    goal: "",
    level: "Trung cấp (B1)",
    avatarColor: "from-blue-500 to-indigo-600",
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setDraft(userProfile)
  }, [userProfile])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const clean: Partial<Profile> = {
      name: draft.name.trim() || userProfile.name,
      email: draft.email.trim() || userProfile.email,
      goal: draft.goal.trim() || userProfile.goal,
      level: draft.level || userProfile.level || "Trung cấp (B1)",
      avatarColor: draft.avatarColor || userProfile.avatarColor || "from-blue-500 to-indigo-600",
    }
    await updateProfileData(clean)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const activeGradient = userProfile.avatarColor || "from-blue-500 to-indigo-600"
  const draftGradient = draft.avatarColor || activeGradient
  const photoURL = user?.photoURL || userProfile.photoURL

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      {/* Banner background */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-6 pb-16 pt-8 text-white sm:px-8">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 right-1/4 h-32 w-32 rounded-full bg-indigo-400/20 blur-xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              {user ? "Tài khoản học viên chính thức" : "Chế độ trải nghiệm khách"}
            </span>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Hồ sơ học viên
            </h2>
            <p className="mt-1 text-sm text-blue-100">
              Theo dõi tiến độ, tùy biến thông tin cá nhân và lưu trữ an toàn trên đám mây Firebase.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!user ? (
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-bold text-blue-700 shadow-lg transition-all hover:bg-blue-50"
              >
                <LogIn className="h-4 w-4" />
                Đăng nhập để đồng bộ
              </button>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-2xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-md">
                  <Flame className="h-4 w-4 text-orange-300 animate-pulse" />
                  Chuỗi 12 ngày
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-2xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-md">
                  <Trophy className="h-4 w-4 text-amber-300" />
                  4,850 XP
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main card body */}
      <div className="px-6 pb-6 sm:px-8">
        <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="relative">
              <span
                className={`flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br ${
                  editing ? draftGradient : activeGradient
                } text-2xl font-black text-white shadow-xl ring-4 ring-white transition-transform dark:ring-slate-900 sm:h-24 sm:w-24 sm:text-3xl`}
              >
                {photoURL && !editing ? (
                  <img
                    src={photoURL}
                    alt={userProfile.name}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  initials(editing ? draft.name || userProfile.name : userProfile.name)
                )}
              </span>
              <span
                className={`absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full text-white ring-2 ring-white dark:ring-slate-900 ${
                  user ? "bg-emerald-500" : "bg-amber-500"
                }`}
                title={user ? "Đã liên kết Firebase Cloud" : "Chế độ khách (Cục bộ)"}
              >
                <ShieldCheck className="h-4 w-4" />
              </span>
            </div>

            <div className="mb-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
                {userProfile.name}
              </h3>
              <p className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <Mail className="h-3.5 w-3.5" />
                {user?.email || userProfile.email}
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                  {userProfile.level || "Trung cấp (B1)"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!user && (
              <button
                type="button"
                onClick={() => openAuthModal("register")}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-700"
              >
                Tạo tài khoản
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setDraft(userProfile)
                setEditing((v) => !v)
              }}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <PencilLine className="h-4 w-4" />
              {editing ? "Hủy chỉnh sửa" : "Chỉnh sửa hồ sơ"}
            </button>
          </div>
        </div>

        {saved && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Check className="h-4 w-4 shrink-0" />
            Đã lưu thay đổi hồ sơ thành công! Dữ liệu đã được đồng bộ lên Firebase Cloud.
          </div>
        )}

        {!editing ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition-colors dark:border-slate-800/60 dark:bg-slate-800/40">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
                <GraduationCap className="h-4 w-4 text-blue-500" />
                Trình độ hiện tại
              </span>
              <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                {userProfile.level || "Trung cấp (B1)"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition-colors dark:border-slate-800/60 dark:bg-slate-800/40">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Mục tiêu học tập
              </span>
              <p className="mt-1 line-clamp-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                {userProfile.goal || "Chinh phục tiếng Anh mỗi ngày"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition-colors dark:border-slate-800/60 dark:bg-slate-800/40">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
                <Calendar className="h-4 w-4 text-purple-500" />
                Ngày tham gia
              </span>
              <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                {userProfile.joinedDate || "Tháng 01/2026"}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/30 p-5 dark:border-blue-900/30 dark:bg-blue-950/20">
            <h4 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">
              Cập nhật thông tin tài khoản
            </h4>

            {/* Avatar color picker */}
            <div className="mb-4">
              <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Màu sắc Avatar
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {AVATAR_GRADIENTS.map((g) => {
                  const selected = draft.avatarColor === g.id
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setDraft({ ...draft, avatarColor: g.id })}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                        selected
                          ? "border-blue-600 bg-white shadow-sm ring-2 ring-blue-500/20 dark:bg-slate-800"
                          : "border-slate-200 bg-white/60 hover:bg-white dark:border-slate-700 dark:bg-slate-800/60"
                      }`}
                    >
                      <span className={`h-4 w-4 rounded-full bg-gradient-to-br ${g.id}`} />
                      <span className="text-slate-700 dark:text-slate-300">{g.label}</span>
                      {selected && <Check className="h-3.5 w-3.5 text-blue-600" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Họ và tên</span>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Nhập tên của bạn"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-900"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Email</span>
                <input
                  type="email"
                  value={draft.email}
                  disabled={!!user}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  placeholder="you@example.com"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-900 dark:disabled:bg-slate-800/50 dark:disabled:text-slate-400"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Trình độ mục tiêu</span>
                <select
                  value={draft.level || "Trung cấp (B1)"}
                  onChange={(e) => setDraft({ ...draft, level: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-900"
                >
                  {LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Mục tiêu học tập</span>
                <input
                  value={draft.goal}
                  onChange={(e) => setDraft({ ...draft, goal: e.target.value })}
                  placeholder="VD: Giao tiếp khi đi du lịch, phỏng vấn xin việc..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-900"
                />
              </label>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                type="submit"
                className="rounded-full bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-blue-600/35"
              >
                Lưu hồ sơ
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Hủy bỏ
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
