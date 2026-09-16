export type Profile = {
  name: string
  email: string
  goal: string
  level?: string
  joinedDate?: string
  avatarColor?: string
}

export type StudySettings = {
  /** mục tiêu số từ mới mỗi ngày */
  dailyGoal: number
  /** thời lượng học mục tiêu mỗi ngày (phút) */
  dailyMinutes: number
  /** bật nhắc học hằng ngày */
  reminder: boolean
  reminderTime: string
  /** tự động phát âm khi mở từ mới */
  autoplay: boolean
  /** âm thanh hiệu ứng khi làm đúng/sai */
  soundEffects: boolean
}

const PROFILE_KEY = "learnenglish-profile"
const SETTINGS_KEY = "learnenglish-settings"

export const PROFILE_UPDATED_EVENT = "learnenglish-profile-updated"

export const defaultProfile: Profile = {
  name: "Ngọc Hân",
  email: "ngoc.han@example.com",
  goal: "Giao tiếp tự tin khi đi du lịch và làm việc",
  level: "Trung cấp (B1)",
  joinedDate: "Tháng 01/2026",
  avatarColor: "from-blue-500 to-indigo-600",
}

export const defaultSettings: StudySettings = {
  dailyGoal: 10,
  dailyMinutes: 20,
  reminder: true,
  reminderTime: "20:00",
  autoplay: true,
  soundEffects: true,
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return { ...fallback, ...JSON.parse(raw) }
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* bỏ qua */
  }
}

export function loadProfile(): Profile {
  return readJson(PROFILE_KEY, defaultProfile)
}

export function saveProfile(p: Profile) {
  writeJson(PROFILE_KEY, p)
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT))
  }
}

export function loadSettings(): StudySettings {
  return readJson(SETTINGS_KEY, defaultSettings)
}

export function saveSettings(s: StudySettings) {
  writeJson(SETTINGS_KEY, s)
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("learnenglish-settings-updated"))
  }
}

/** Lấy 2 chữ cái đầu làm avatar, VD "Ngọc Hân" -> "NH". */
export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "LE"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

