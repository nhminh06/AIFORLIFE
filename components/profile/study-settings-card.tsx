"use client"

import { useEffect, useState } from "react"
import {
  Bell,
  Clock,
  Flame,
  Save,
  Sliders,
  Target,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react"

import {
  loadSettings,
  saveSettings,
  type StudySettings,
} from "@/lib/profile"

const WORD_GOALS = [5, 10, 15, 20, 30]
const MINUTE_GOALS = [10, 15, 20, 30, 45, 60]

export function StudySettingsCard() {
  const [settings, setSettings] = useState<StudySettings>(loadSettings())
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
          <Sliders className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Mục tiêu & Cài đặt học tập
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tùy chỉnh lịch học, số lượng từ vựng hàng ngày và lời nhắc nhở
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-6 space-y-6">
        {/* Mục tiêu từ vựng mỗi ngày */}
        <div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
              <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Mục tiêu từ vựng mới mỗi ngày
            </label>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              {settings.dailyGoal} từ / ngày
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {WORD_GOALS.map((w) => {
              const active = settings.dailyGoal === w
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => setSettings({ ...settings, dailyGoal: w })}
                  className={`flex-1 min-w-[70px] rounded-xl border py-2 text-center text-xs font-bold transition-all ${
                    active
                      ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {w} từ
                </button>
              )
            })}
          </div>
        </div>

        {/* Thời lượng học mỗi ngày */}
        <div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
              <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              Thời gian luyện tập mong muốn
            </label>
            <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
              {settings.dailyMinutes || 20} phút / ngày
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {MINUTE_GOALS.map((m) => {
              const active = (settings.dailyMinutes || 20) === m
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSettings({ ...settings, dailyMinutes: m })}
                  className={`flex-1 min-w-[65px] rounded-xl border py-2 text-center text-xs font-bold transition-all ${
                    active
                      ? "border-purple-600 bg-purple-600 text-white shadow-md shadow-purple-600/20"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {m}p
                </button>
              )
            })}
          </div>
        </div>

        {/* Nhắc nhở học tập */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
                <Bell className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Nhắc nhở học tập hàng ngày
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Giữ chuỗi Streak liên tục không bị gián đoạn
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={settings.reminder}
              onClick={() => setSettings({ ...settings, reminder: !settings.reminder })}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                settings.reminder ? "bg-orange-500" : "bg-slate-200 dark:bg-slate-700"
              }`}
            >
              <span
                className={`absolute top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-all ${
                  settings.reminder ? "left-[1.375rem]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {settings.reminder && (
            <div className="mt-4 flex items-center justify-between border-t border-slate-200/60 pt-3 dark:border-slate-700/60">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Giờ nhắc hàng ngày
              </span>
              <input
                type="time"
                value={settings.reminderTime}
                onChange={(e) => setSettings({ ...settings, reminderTime: e.target.value })}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* Âm thanh & Tự động phát âm */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center gap-2.5">
              <Volume2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Tự phát âm từ mới
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Khi mở danh sách bài học
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.autoplay}
              onClick={() => setSettings({ ...settings, autoplay: !settings.autoplay })}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                settings.autoplay ? "bg-teal-600" : "bg-slate-200 dark:bg-slate-700"
              }`}
            >
              <span
                className={`absolute top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-all ${
                  settings.autoplay ? "left-[1.375rem]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center gap-2.5">
              <Zap className="h-4 w-4 text-amber-500" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Hiệu ứng âm thanh
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Khi trả lời câu hỏi đúng
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.soundEffects ?? true}
              onClick={() =>
                setSettings({ ...settings, soundEffects: !(settings.soundEffects ?? true) })
              }
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                (settings.soundEffects ?? true) ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-700"
              }`}
            >
              <span
                className={`absolute top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-all ${
                  (settings.soundEffects ?? true) ? "left-[1.375rem]" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Nút lưu cài đặt */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-blue-600/35"
          >
            <Save className="h-3.5 w-3.5" />
            Lưu cài đặt học tập
          </button>
          {saved && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              ✓ Đã cập nhật cài đặt học tập!
            </span>
          )}
        </div>
      </form>
    </section>
  )
}
