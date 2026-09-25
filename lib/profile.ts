export type Profile = {
  name: string
  email: string
  goal: string
  level?: string
  joinedDate?: string
  avatarColor?: string
  avatarPreset?: string
  photoURL?: string | null
  fontSize?: "normal" | "large" | "xlarge"
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

export const AVATAR_PRESETS = [
  { id: "owl", emoji: "🦉", label: "Cú Thông Thái", bg: "bg-blue-500" },
  { id: "fox", emoji: "🦊", label: "Cáo Nhanh Trí", bg: "bg-amber-500" },
  { id: "cat", emoji: "🐱", label: "Mèo Chăm Chỉ", bg: "bg-purple-500" },
  { id: "lion", emoji: "🦁", label: "Sư Tử Tự Tin", bg: "bg-orange-500" },
  { id: "panda", emoji: "🐼", label: "Gấu Kiên Trì", bg: "bg-emerald-500" },
  { id: "rocket", emoji: "🚀", label: "Tên Lửa Bứt Phá", bg: "bg-rose-500" },
  { id: "star", emoji: "⭐", label: "Ngôi Sao Sáng", bg: "bg-yellow-500" },
  { id: "book", emoji: "📚", label: "Mọt Sách Vui Vẻ", bg: "bg-indigo-500" },
]

export const AVATAR_GRADIENTS = [
  { id: "from-blue-500 to-indigo-600", label: "Lam Tinh Hải" },
  { id: "from-purple-500 to-pink-600", label: "Tím Thần Kỳ" },
  { id: "from-emerald-500 to-teal-600", label: "Ngọc Lục Bảo" },
  { id: "from-amber-500 to-orange-600", label: "Hoàng Hôn Cam" },
  { id: "from-rose-500 to-red-600", label: "Hồng Nhiệt Huyết" },
  { id: "from-cyan-500 to-blue-600", label: "Biển Xanh Rực Rỡ" },
]

export const PROFILE_KEY = "learnenglish-profile"
export const SETTINGS_KEY = "learnenglish-settings"

export const PROFILE_UPDATED_EVENT = "learnenglish-profile-updated"
export const SETTINGS_UPDATED_EVENT = "learnenglish-settings-updated"

export const defaultProfile: Profile = {
  name: "Ngọc Hân",
  email: "ngoc.han@example.com",
  goal: "Giao tiếp tự tin khi đi du lịch và làm việc",
  level: "Trung cấp (B1)",
  joinedDate: "Tháng 01/2026",
  avatarColor: "from-blue-500 to-indigo-600",
  fontSize: "normal",
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

function storageKey(uid?: string | null): string {
  return uid ? `${SETTINGS_KEY}:${uid}` : SETTINGS_KEY
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/**
 * Chuẩn hóa settings từ localStorage hoặc Firestore.
 * Firestore có thể chứa dữ liệu cũ/một phần nên không được để giá trị
 * sai ghi đè hoàn toàn cấu hình hợp lệ.
 *
 * LƯU Ý: nguồn truyền sau sẽ ghi đè nguồn truyền trước nếu giá trị hợp lệ.
 * Vì vậy thứ tự sources phải là: [ưu tiên thấp nhất, ..., ưu tiên cao nhất].
 * Không được truyền `defaultSettings` làm nguồn cuối cùng nếu muốn giữ
 * giá trị người dùng đã tùy chỉnh — vì default luôn hợp lệ (>0) nên sẽ
 * luôn thắng và ghi đè giá trị thật.
 */
export function mergeStudySettings(
  ...sources: Array<Partial<StudySettings> | null | undefined>
): StudySettings {
  const merged: StudySettings = { ...defaultSettings }

  for (const source of sources) {
    if (!isRecord(source)) continue

    if (
      typeof source.dailyGoal === "number" &&
      Number.isFinite(source.dailyGoal) &&
      source.dailyGoal > 0
    ) {
      merged.dailyGoal = source.dailyGoal
    }
    if (
      typeof source.dailyMinutes === "number" &&
      Number.isFinite(source.dailyMinutes) &&
      source.dailyMinutes > 0
    ) {
      merged.dailyMinutes = source.dailyMinutes
    }
    if (typeof source.reminder === "boolean") merged.reminder = source.reminder
    if (typeof source.reminderTime === "string") merged.reminderTime = source.reminderTime
    if (typeof source.autoplay === "boolean") merged.autoplay = source.autoplay
    if (typeof source.soundEffects === "boolean") merged.soundEffects = source.soundEffects
  }

  return merged
}

export function loadSettings(uid?: string | null): StudySettings {
  const fallback = uid ? defaultSettings : readJson(SETTINGS_KEY, defaultSettings)
  // FIX: readJson(...) đã tự merge với `fallback` cho các trường còn thiếu rồi.
  // Trước đây code còn truyền thêm `fallback` làm nguồn thứ 2 khiến
  // defaultSettings (20 phút/10 từ) luôn ghi đè lại giá trị người dùng vừa lưu.
  return mergeStudySettings(readJson(storageKey(uid), fallback))
}

export function saveSettings(s: StudySettings, uid?: string | null) {
  const normalized = mergeStudySettings(s)
  writeJson(storageKey(uid), normalized)
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SETTINGS_UPDATED_EVENT))
  }
}

/** Lấy 2 chữ cái đầu làm avatar, VD "Ngọc Hân" -> "NH". */
export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "LE"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}