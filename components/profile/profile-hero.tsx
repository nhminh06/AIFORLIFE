"use client"

import { useEffect, useState } from "react"
import { PencilLine } from "lucide-react"

import {
  initials,
  loadProfile,
  saveProfile,
  type Profile,
} from "@/lib/profile"

export function ProfileHero() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Profile>({ name: "", email: "", goal: "" })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const p = loadProfile()
    setProfile(p)
    setDraft(p)
  }, [])

  if (!profile) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
      </section>
    )
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const clean: Profile = {
      name: draft.name.trim() || profile.name,
      email: draft.email.trim() || profile.email,
      goal: draft.goal.trim() || profile.goal,
    }
    saveProfile(clean)
    setProfile(clean)
    setDraft(clean)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 pb-14 pt-6 sm:px-8">
        <p className="text-sm text-blue-100">Hồ sơ học viên</p>
        <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
          Chào {profile.name}! 👋
        </h2>
      </div>

      <div className="px-6 pb-6 sm:px-8">
        <div className="-mt-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <span className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 text-2xl font-bold text-white shadow-lg ring-4 ring-white">
            {initials(profile.name)}
          </span>
          <button
            type="button"
            onClick={() => {
              setDraft(profile)
              setEditing((v) => !v)
            }}
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:text-slate-900"
          >
            <PencilLine className="h-3.5 w-3.5" />
            {editing ? "Đóng chỉnh sửa" : "Chỉnh sửa hồ sơ"}
          </button>
        </div>

        {!editing ? (
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <dt className="text-xs font-medium text-slate-400">Họ tên</dt>
              <dd className="mt-0.5 truncate text-sm font-bold text-slate-900">{profile.name}</dd>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <dt className="text-xs font-medium text-slate-400">Email</dt>
              <dd className="mt-0.5 truncate text-sm font-bold text-slate-900">{profile.email}</dd>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <dt className="text-xs font-medium text-slate-400">Mục tiêu</dt>
              <dd className="mt-0.5 line-clamp-1 text-sm font-bold text-slate-900">{profile.goal}</dd>
            </div>
          </dl>
        ) : (
          <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="text-xs font-semibold text-slate-500">Họ tên</span>
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Tên của bạn"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500">Email</span>
              <input
                type="email"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500">Mục tiêu học tập</span>
              <input
                value={draft.goal}
                onChange={(e) => setDraft({ ...draft, goal: e.target.value })}
                placeholder="VD: Giao tiếp khi đi du lịch"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <div className="flex items-center gap-3 sm:col-span-3">
              <button
                type="submit"
                className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-700"
              >
                Lưu thay đổi
              </button>
              {saved && (
                <span className="text-sm font-medium text-green-600">
                  Đã lưu! Avatar trên header cũng đổi theo nhé.
                </span>
              )}
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
