"use client"

/**
 * Hook đếm thời gian học thật của 1 phiên (nguồn cho biểu đồ "Thời gian học theo ngày").
 *
 * - Chỉ đếm khi tab đang hiển thị (document.visibilityState === "visible").
 * - Cộng dồn cục bộ rồi đẩy lên cloud mỗi trackerFlushSeconds giây.
 * - Khi rời trang / ẩn tab thì đẩy ngay phần còn lại.
 * - Giới hạn maxSessionMinutes mỗi phiên để không đếm nhầm khi tab treo.
 */

import { useEffect, useRef } from "react"

import {
  maxSessionMinutes,
  trackerFlushSeconds,
  trackerHeartbeatSeconds,
} from "@/lib/progress/progress-config"
import { addStudySeconds } from "@/lib/progress/study-day-service"

export type StudySessionOptions = {
  uid: string | null | undefined
  /** tắt tạm khi trang chưa sẵn sàng (VD đang tải dữ liệu) */
  enabled?: boolean
}

export function useStudySession({ uid, enabled = true }: StudySessionOptions): void {
  const pendingRef = useRef(0)
  const sessionSecondsRef = useRef(0)
  const lastTickRef = useRef(0)

  useEffect(() => {
    if (!enabled || typeof document === "undefined") return
    lastTickRef.current = Date.now()
    pendingRef.current = 0
    sessionSecondsRef.current = 0

    /** Cộng dồn thời gian vừa trôi qua (chỉ khi tab đang hiển thị). */
    const account = () => {
      const now = Date.now()
      const elapsedSeconds = Math.max(0, (now - lastTickRef.current) / 1000)
      lastTickRef.current = now
      if (document.visibilityState !== "visible") return
      const remaining = maxSessionMinutes * 60 - sessionSecondsRef.current
      if (remaining <= 0) return
      const counted = Math.min(elapsedSeconds, remaining)
      sessionSecondsRef.current += counted
      pendingRef.current += counted
    }

    /** Đẩy phần đã đếm lên cloud/local. */
    const flush = () => {
      const seconds = Math.floor(pendingRef.current)
      if (seconds <= 0) return
      pendingRef.current -= seconds
      void addStudySeconds(uid, seconds)
    }

    const heartbeat = window.setInterval(account, trackerHeartbeatSeconds * 1000)
    const flushTimer = window.setInterval(flush, trackerFlushSeconds * 1000)

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        lastTickRef.current = Date.now()
        return
      }
      account()
      flush()
    }

    const handlePageHide = () => {
      account()
      flush()
    }

    document.addEventListener("visibilitychange", handleVisibility)
    window.addEventListener("pagehide", handlePageHide)

    return () => {
      window.clearInterval(heartbeat)
      window.clearInterval(flushTimer)
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener("pagehide", handlePageHide)
      account()
      flush()
    }
  }, [uid, enabled])
}
