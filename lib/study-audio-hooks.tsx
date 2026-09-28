"use client"

import { useEffect } from "react"

import { useAuth } from "@/lib/auth-context"
import { playCorrectSound, playWrongSound, playSuccessSound, unlockAudio, speak } from "@/lib/speak"
import { postReminderTimeToSW, startReminderTimer } from "@/lib/reminder"

/**
 * Nạp 1 lần khi vào app: tự chạy timer nhắc nhở + đồng bộ giờ nhắc với Service Worker.
 * Mount 1 lần ở layout để nhắc nhở hoạt động ở mọi trang.
 */
export function ReminderScheduler() {
  const { studySettings } = useAuth()

  useEffect(() => {
    const stop = startReminderTimer(studySettings)
    postReminderTimeToSW(studySettings.reminderTime)
    return stop
  }, [studySettings])

  return null
}

/**
 * Hook áp dụng cài đặt "Hiệu ứng âm thanh" & "Tự phát âm từ mới".
 *
 * - `soundEffects` (mặc định bật): phát âm khi trả lời đúng/sai.
 * - `autoplay`: phát âm từ ngay khi component có từ mới (`word` thay đổi).
 *
 * Cả hai đều tôn trọng khoá AudioContext của trình duyệt: chỉ phát sau khi
 * người dùng đã tương tác ít nhất 1 lần (xem unlockAudio).
 */
export function useStudyAudio(word?: string | null) {
  const { studySettings } = useAuth()
  const soundOn = studySettings.soundEffects !== false
  const autoplayOn = studySettings.autoplay === true

  /* Mở khoá AudioContext ngay khi vào trang học (sau tương tác của người dùng) */
  useEffect(() => {
    if (!soundOn && !autoplayOn) return
    const unlock = () => {
      unlockAudio()
      window.removeEventListener("pointerdown", unlock)
      window.removeEventListener("keydown", unlock)
    }
    window.addEventListener("pointerdown", unlock, { once: true })
    window.addEventListener("keydown", unlock, { once: true })
    return () => {
      window.removeEventListener("pointerdown", unlock)
      window.removeEventListener("keydown", unlock)
    }
  }, [soundOn, autoplayOn])

  /* Tự phát âm từ mới (chỉ khi bật autoplay) */
  useEffect(() => {
    if (!autoplayOn || !word) return
    // Chờ một nhịp để tránh trùng lúc vừa chuyển từ → vẫn khoá audio ở lần đầu.
    const timer = window.setTimeout(() => {
      unlockAudio()
      speak(word)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [autoplayOn, word])

  return {
    /** Phát âm khi trả lời đúng */
    correct: () => {
      if (soundOn) playCorrectSound()
    },
    /** Phát âm khi trả lời sai */
    wrong: () => {
      if (soundOn) playWrongSound()
    },
    /** Phát âm khi hoàn thành bài */
    success: () => {
      if (soundOn) playSuccessSound()
    },
  }
}