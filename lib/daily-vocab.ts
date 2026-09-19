/**
 * Bộ từ vựng 5 từ/ngày do AI tạo, lưu ở localStorage theo user.
 * Người dùng vào lần đầu trong ngày → gọi AI sinh 5 từ và lưu lại,
 * các lần vào sau trong cùng ngày dùng lại bộ từ đã lưu (không gọi AI).
 */

import type { VocabWord } from "@/lib/data/vocabulary"

export type DailyVocabDay = {
  /** ngày dạng YYYY-MM-DD (giờ địa phương) */
  date: string
  /** đúng 5 từ AI chọn cho ngày đó */
  words: VocabWord[]
}

type DailyVocabStore = {
  lastDate: string
  days: DailyVocabDay[]
}

/** Số từ mỗi ngày AI tạo */
export const DAILY_VOCAB_COUNT = 5

/** Số ngày tối đa lưu lại trong lịch sử */
const MAX_DAYS = 30

/** Sự kiện phát ra mỗi khi bộ từ hôm nay được lưu/cập nhật */
export const DAILY_VOCAB_UPDATED_EVENT = "afl-daily-vocab-updated"

const EMPTY_STORE: DailyVocabStore = { lastDate: "", days: [] }

function storageKey(uid?: string | null): string {
  return `afl:daily-vocab:${uid || "guest"}`
}

/** Ngày hiện tại dạng YYYY-MM-DD theo giờ địa phương */
export function todayKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function readStore(uid?: string | null): DailyVocabStore {
  if (typeof window === "undefined") return EMPTY_STORE
  try {
    const raw = window.localStorage.getItem(storageKey(uid))
    if (!raw) return EMPTY_STORE
    const parsed = JSON.parse(raw) as Partial<DailyVocabStore>
    if (!Array.isArray(parsed.days)) return EMPTY_STORE
    return {
      lastDate: typeof parsed.lastDate === "string" ? parsed.lastDate : "",
      days: parsed.days.filter(
        (d): d is DailyVocabDay =>
          !!d && typeof d.date === "string" && Array.isArray(d.words) && d.words.length > 0
      ),
    }
  } catch {
    return EMPTY_STORE
  }
}

function writeStore(uid: string | null | undefined, store: DailyVocabStore): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(storageKey(uid), JSON.stringify(store))
    window.dispatchEvent(new Event(DAILY_VOCAB_UPDATED_EVENT))
  } catch {
    // localStorage đầy / bị chặn → chỉ giữ trong phiên này
  }
}

/** Lấy bản sao lịch sử các ngày đã lưu (mới nhất trước) */
export function loadDailyVocabDays(uid?: string | null): DailyVocabDay[] {
  return [...readStore(uid).days].reverse()
}

/** Lấy bộ từ của 1 ngày cụ thể (nếu đã lưu) */
export function getDailyVocabDay(uid: string | null | undefined, date: string): DailyVocabDay | null {
  return readStore(uid).days.find((d) => d.date === date) ?? null
}

/** Lưu / cập nhật bộ từ của 1 ngày và trả về bản ghi vừa lưu */
export function saveDailyVocabDay(
  uid: string | null | undefined,
  date: string,
  words: VocabWord[]
): DailyVocabDay {
  const store = readStore(uid)
  const entry: DailyVocabDay = { date, words: words.slice(0, DAILY_VOCAB_COUNT) }
  const others = store.days.filter((d) => d.date !== date)
  const days = [...others, entry].slice(-MAX_DAYS)
  writeStore(uid, { lastDate: date, days })
  return entry
}

/* ------------------------------------------------------------------ */
/*  Gọi AI sinh 5 từ cho hôm nay (chỉ chạy phía client)                */
/* ------------------------------------------------------------------ */

/**
 * Lấy trình độ CEFR từ nhãn trình độ trong hồ sơ (VD "Trung cấp (B1)" → "B1").
 * Không nhận diện được thì mặc định B1.
 */
export function extractCefrLevel(label: string | undefined): string {
  const match = /\b([ABC][12])\b/i.exec(label ?? "")
  return match ? match[1].toUpperCase() : "B1"
}

/** Các lần gọi đang chạy để 2 component cùng mount không gọi AI 2 lần */
const inflight = new Map<string, Promise<VocabWord[]>>()

async function generateDailyWords(
  uid: string | null | undefined,
  date: string,
  level: string
): Promise<VocabWord[]> {
  const res = await fetch("/api/ai/vocab/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topicLabel: "Từ vựng hôm nay — từ thông dụng, hữu ích cho giao tiếp hằng ngày",
      level,
      count: DAILY_VOCAB_COUNT,
    }),
  })
  const data = (await res.json()) as { words?: VocabWord[]; error?: string }
  if (!res.ok || !Array.isArray(data.words) || data.words.length === 0) {
    throw new Error(data.error || "Không tạo được bộ từ hôm nay. Vui lòng thử lại.")
  }
  return saveDailyVocabDay(uid, date, data.words).words
}

/**
 * Đảm bảo hôm nay đã có 5 từ:
 * - Đã có trong localStorage → trả về luôn, không gọi AI.
 * - Chưa có → gọi AI sinh 5 từ, lưu lại rồi trả về.
 * Nhiều nơi gọi cùng lúc chỉ tạo đúng 1 yêu cầu AI.
 */
export function ensureTodayVocab(
  uid: string | null | undefined,
  level?: string
): Promise<{ words: VocabWord[]; date: string; generated: boolean }> {
  const today = todayKey()
  const existing = getDailyVocabDay(uid, today)
  if (existing && existing.words.length > 0) {
    return Promise.resolve({ words: existing.words, date: today, generated: false })
  }

  const key = storageKey(uid)
  if (!inflight.has(key)) {
    const task = generateDailyWords(uid, today, extractCefrLevel(level)).finally(() => {
      inflight.delete(key)
    })
    inflight.set(key, task)
  }
  return inflight.get(key)!.then((words) => ({ words, date: today, generated: true }))
}
