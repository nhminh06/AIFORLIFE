"use client"

import { useEffect, useState } from "react"
import {
  Bell,
  Check,
  Clock,
  Flame,
  Play,
  Save,
  Sliders,
  Sparkles,
  Target,
  Volume2,
  Zap,
} from "lucide-react"

import { useAuth } from "@/lib/auth-context"
import { speak } from "@/lib/speak"
import type { StudySettings } from "@/lib/profile"
import {
  disableReminder,
  enableReminder,
  fireReminder,
  postReminderTimeToSW,
} from "@/lib/reminder"
import { playSuccessSound, unlockAudio } from "@/lib/speak"

const WORD_GOALS = [5, 10, 15, 20, 30]
const MINUTE_GOALS = [10, 15, 20, 30, 45, 60]

export function StudySettingsCard() {
  const { studySettings, updateStudySettings } = useAuth()
  const [draft, setDraft] = useState<StudySettings>(studySettings)
  const [saved, setSaved] = useState(false)
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null)

  useEffect(() => {
    setDraft(studySettings)
  }, [studySettings])

  const handleToggleReminder = async () => {
    const nextVal = !draft.reminder
    if (!nextVal) {
      setDraft({ ...draft, reminder: false })
      await disableReminder()
      return
    }

    // Bật → phải xin cấp quyền thông báo (chỉ hợp lệ trong thao tác của người dùng).
    const granted = await enableReminder()
    if (!granted) {
      setNotificationMsg("Bạn cần cho phép thông báo trên trình duyệt để nhận nhắc nhở hằng ngày.")
      setTimeout(() => setNotificationMsg(null), 6000)
      return
    }

    setDraft({ ...draft, reminder: true })
    postReminderTimeToSW(draft.reminderTime)
    setNotificationMsg("Đã bật nhắc nhở hằng ngày!")
    setTimeout(() => setNotificationMsg(null), 4000)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateStudySettings(draft)
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
            Tùy chỉnh lịch học, số lượng từ vựng hàng ngày và lời nhắc nhở (Đồng bộ Firebase)
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
              {draft.dailyGoal} từ / ngày
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {WORD_GOALS.map((w) => {
              const active = draft.dailyGoal === w
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => setDraft({ ...draft, dailyGoal: w })}
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
              {draft.dailyMinutes} phút / ngày
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {MINUTE_GOALS.map((m) => {
              const active = draft.dailyMinutes === m
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDraft({ ...draft, dailyMinutes: m })}
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
              aria-checked={draft.reminder}
              onClick={handleToggleReminder}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                draft.reminder ? "bg-orange-500" : "bg-slate-200 dark:bg-slate-700"
              }`}
            >
              <span
                className={`absolute top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-all ${
                  draft.reminder ? "left-[1.375rem]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {draft.reminder && (
            <div className="mt-4 border-t border-slate-200/60 pt-3 dark:border-slate-700/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Giờ nhắc hàng ngày
                </span>
                <input
                  type="time"
                  value={draft.reminderTime}
                  onChange={(e) => {
                    const next = e.target.value
                    setDraft({ ...draft, reminderTime: next })
                    postReminderTimeToSW(next)
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  fireReminder({ force: true })
                  setNotificationMsg("Đã gửi 1 thông báo nhắc nhở thử — kiểm tra khay hệ thống của bạn.")
                  setTimeout(() => setNotificationMsg(null), 5000)
                }}
                className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-orange-700 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
              >
                <Play className="h-3 w-3" />
                Gửi thử thông báo nhắc nhở
              </button>
            </div>
          )}

          {notificationMsg && (
            <p className="mt-3 text-xs font-semibold text-orange-600 dark:text-orange-400">
              {notificationMsg}
            </p>
          )}
        </div>

        {/* Âm thanh & Tự động phát âm */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Volume2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Tự phát âm từ mới
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tự phát âm từ đang học
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={draft.autoplay}
                onClick={() => setDraft({ ...draft, autoplay: !draft.autoplay })}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  draft.autoplay ? "bg-teal-600" : "bg-slate-200 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-all ${
                    draft.autoplay ? "left-[1.375rem]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
              <button
                type="button"
                onClick={() => speak("Welcome to LearnEnglish. Keep going!")}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300"
              >
                <Play className="h-3 w-3" />
                Nghe thử phát âm AI
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Zap className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Hiệu ứng âm thanh
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Khi trả lời đúng hoặc sai
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={draft.soundEffects ?? true}
                onClick={() =>
                  setDraft({ ...draft, soundEffects: !(draft.soundEffects ?? true) })
                }
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  (draft.soundEffects ?? true) ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-all ${
                    (draft.soundEffects ?? true) ? "left-[1.375rem]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
              <button
                type="button"
                onClick={() => {
                  unlockAudio()
                  playSuccessSound()
                }}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
              >
                <Play className="h-3 w-3" />
                Thử âm thanh chúc mừng
              </button>
            </div>
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
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Check className="h-4 w-4" />
              Đã đồng bộ cài đặt học tập!
            </span>
          )}
        </div>
      </form>
    </section>
  )
}
