"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { BookOpen, ChevronDown, Clock, RotateCcw, Timer } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { defaultSettings } from "@/lib/profile"

/** Phát sự kiện khi học xong 1 từ — gọi từ bất kỳ component nào */
export function emitWordLearned() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("learnsphere-word-learned"))
  }
}

/* ──────────────────────────────────────────────
   Helpers
────────────────────────────────────────────── */

const DAILY_WIDGET_KEY = "learnsphere-daily-widget"

function dailyWidgetKey(uid?: string | null): string {
  return uid ? `${DAILY_WIDGET_KEY}:${uid}` : DAILY_WIDGET_KEY
}

type DailyData = {
  ownerUid: string | null
  date: string
  secondsLeft: number
  totalSeconds: number
  wordGoal: number
  wordsLearned: number
}

function todayStr() {
  return new Date().toLocaleDateString("sv-SE") // "YYYY-MM-DD"
}

function freshData(totalSec: number, wordGoal: number, ownerUid: string | null): DailyData {
  return { ownerUid, date: todayStr(), secondsLeft: totalSec, totalSeconds: totalSec, wordGoal, wordsLearned: 0 }
}

function loadDaily(totalSec: number, wordGoal: number, uid: string | null): DailyData {
  if (typeof window === "undefined") return freshData(totalSec, wordGoal, uid)
  try {
    const raw = localStorage.getItem(dailyWidgetKey(uid))
    if (!raw) throw new Error("empty")
    const parsed: DailyData = JSON.parse(raw)
    // Reset nếu sang ngày mới, đổi tài khoản hoặc settings thay đổi.
    if (
      parsed.ownerUid !== uid ||
      parsed.date !== todayStr() ||
      parsed.totalSeconds !== totalSec ||
      parsed.wordGoal !== wordGoal ||
      !Number.isFinite(parsed.secondsLeft) ||
      !Number.isFinite(parsed.wordsLearned) ||
      parsed.secondsLeft < 0 ||
      parsed.wordsLearned < 0
    ) throw new Error("stale")
    return { ...parsed, secondsLeft: Math.min(parsed.secondsLeft, totalSec) }
  } catch {
    return freshData(totalSec, wordGoal, uid)
  }
}

function saveDaily(data: DailyData, uid?: string | null) {
  try { localStorage.setItem(dailyWidgetKey(uid), JSON.stringify(data)) } catch { /* bỏ qua */ }
}



function progressDash(pct: number, radius: number) {
  const circ = 2 * Math.PI * radius
  const filled = circ * Math.max(0, Math.min(1, pct))
  return { strokeDasharray: circ.toFixed(2), strokeDashoffset: (circ - filled).toFixed(2) }
}

function fmt(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

/* ──────────────────────────────────────────────
   Component
────────────────────────────────────────────── */

export function DailyStudyWidget() {
  const pathname = usePathname()
  const { user, studySettings } = useAuth()

  const dailyMinutes = Number.isFinite(studySettings.dailyMinutes)
    ? studySettings.dailyMinutes
    : defaultSettings.dailyMinutes
  const dailyGoal = Number.isFinite(studySettings.dailyGoal)
    ? studySettings.dailyGoal
    : defaultSettings.dailyGoal
  const totalSeconds = dailyMinutes * 60
  const wordGoal = dailyGoal
  const uid = user?.uid ?? null

  const [data, setData] = useState<DailyData>(() => loadDaily(totalSeconds, wordGoal, uid))
  const [running, setRunning] = useState(false)
  const [collapsed, setCollapsed] = useState(true) // mặc định thu gọn thành FAB
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Sync khi settings hoặc tài khoản thay đổi
  useEffect(() => {
    setRunning(false)
    setData(loadDaily(totalSeconds, wordGoal, uid))
  }, [totalSeconds, wordGoal, uid])

  // Lưu mỗi khi data thay đổi; không ghi dữ liệu cũ sang key của tài khoản mới.
  useEffect(() => {
    if (data.ownerUid === uid) saveDaily(data, uid)
  }, [data, uid])

  // Đồng hồ đếm ngược
  useEffect(() => {
    if (running && data.secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setData((prev) => {
          if (prev.secondsLeft <= 1) {
            setRunning(false)
            clearInterval(intervalRef.current!)
            return { ...prev, secondsLeft: 0 }
          }
          return { ...prev, secondsLeft: prev.secondsLeft - 1 }
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  // Lắng nghe sự kiện học từ từ bất kỳ trang nào
  useEffect(() => {
    const handler = () => {
      setData((prev) => ({
        ...prev,
        wordsLearned: Math.min(prev.wordGoal, prev.wordsLearned + 1),
      }))
    }
    window.addEventListener("learnsphere-word-learned", handler)
    return () => window.removeEventListener("learnsphere-word-learned", handler)
  }, [])

  // Không hiển thị trên trang cá nhân
  if (pathname.startsWith("/ca-nhan")) return null

  const timerDone = data.secondsLeft <= 0
  const wordsLearned = data.wordsLearned
  const wordsDone = wordsLearned >= wordGoal

  const timerPct = data.secondsLeft / data.totalSeconds
  const wordsPct = wordGoal > 0 ? wordsLearned / wordGoal : 0

  function handleToggle() {
    if (timerDone) return
    setRunning((r) => !r)
  }

  function handleReset() {
    setRunning(false)
    setData(freshData(totalSeconds, wordGoal, uid))
  }

  /* ──── FAB (thu gọn) ──── */
  if (collapsed) {
    const R_FAB = 22
    const fabDash = progressDash(timerPct, R_FAB)

    return (
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-center gap-1.5">
        {/* FAB button với ring SVG */}
        <button
          id="daily-widget-fab"
          onClick={() => setCollapsed(false)}
          title="Mở widget học hôm nay"
          className="relative flex h-14 w-14 items-center justify-center"
        >
          {/* Ring nền */}
          <svg
            width={56} height={56}
            className="absolute inset-0 -rotate-90"
            viewBox="0 0 56 56"
          >
            <circle cx={28} cy={28} r={R_FAB} stroke="currentColor" strokeWidth={3.5} fill="none"
              className="text-blue-200 dark:text-blue-900" />
            <circle cx={28} cy={28} r={R_FAB} stroke="currentColor" strokeWidth={3.5} fill="none"
              strokeLinecap="round"
              strokeDasharray={fabDash.strokeDasharray}
              strokeDashoffset={fabDash.strokeDashoffset}
              className={timerDone ? "text-emerald-400" : running ? "text-blue-500" : "text-blue-400"}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>

          {/* Nền tròn gradient */}
          <span className={[
            "flex h-10 w-10 items-center justify-center rounded-full shadow-lg",
            "bg-gradient-to-br from-blue-500 to-violet-600",
            running ? "animate-pulse" : "",
          ].join(" ")}>
            <Timer className="h-5 w-5 text-white" />
          </span>
        </button>

        {/* Badge số từ */}
        <span className={[
          "rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm",
          wordsDone
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
            : "bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300",
        ].join(" ")}>
          {wordsDone ? "✓" : `${wordsLearned}`}/{wordGoal} từ
        </span>
      </div>
    )
  }

  /* ──── Panel mở rộng ──── */
  const R_TIMER = 30
  const R_WORDS = 18
  const timerDash = progressDash(timerPct, R_TIMER)
  const wordsDash = progressDash(wordsPct, R_WORDS)

  return (
    <div
      id="daily-study-widget"
      className="fixed bottom-5 right-5 z-50 w-[248px] rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-900/15 backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-slate-900/50"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2.5 dark:border-slate-800">
        <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-slate-700 dark:text-slate-200">
          <Timer className="h-3.5 w-3.5 text-blue-500" />
          Học hôm nay
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleReset}
            title="Đặt lại"
            className="rounded-full p-1 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
          <button
            onClick={() => setCollapsed(true)}
            title="Thu gọn"
            className="rounded-full p-1 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-3">

        {/* ── Countdown Timer ── */}
        <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-3 dark:from-blue-950/40 dark:to-indigo-950/40">
          {/* Ring */}
          <div className="relative shrink-0 flex items-center justify-center">
            <svg width={76} height={76} className="-rotate-90" viewBox="0 0 76 76">
              <circle cx={38} cy={38} r={R_TIMER} stroke="currentColor" strokeWidth={5.5}
                fill="none" className="text-blue-100 dark:text-blue-950" />
              <circle cx={38} cy={38} r={R_TIMER} stroke="currentColor" strokeWidth={5.5}
                fill="none" strokeLinecap="round"
                strokeDasharray={timerDash.strokeDasharray}
                strokeDashoffset={timerDash.strokeDashoffset}
                className={timerDone ? "text-emerald-500" : running ? "text-blue-500" : "text-blue-400"}
                style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
              />
            </svg>
            <span className={`absolute text-[13px] font-extrabold tabular-nums ${
              timerDone ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-white"
            }`}>
              {timerDone ? "✓" : fmt(data.secondsLeft)}
            </span>
          </div>

          {/* Info + button */}
          <div className="flex flex-1 flex-col gap-2">
            <div>
              <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                <Clock className="h-3 w-3" />
                Thời gian học
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                {timerDone ? "Hoàn thành!" : `Còn ${fmt(data.secondsLeft)}`}
              </p>
            </div>
            {!timerDone ? (
              <button
                onClick={handleToggle}
                id="widget-timer-btn"
                className={`rounded-lg py-1 text-[11px] font-bold transition-all ${
                  running
                    ? "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200"
                    : "bg-blue-600 text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700"
                }`}
              >
                {running ? "⏸ Dừng" : "▶ Bắt đầu"}
              </button>
            ) : (
              <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                🎉 Xong rồi!
              </p>
            )}
          </div>
        </div>

        {/* ── Word Counter (auto) ── */}
        <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 p-3 dark:from-violet-950/40 dark:to-purple-950/40">
          {/* Ring */}
          <div className="relative shrink-0 flex items-center justify-center">
            <svg width={52} height={52} className="-rotate-90" viewBox="0 0 52 52">
              <circle cx={26} cy={26} r={R_WORDS} stroke="currentColor" strokeWidth={4.5}
                fill="none" className="text-violet-100 dark:text-violet-950" />
              <circle cx={26} cy={26} r={R_WORDS} stroke="currentColor" strokeWidth={4.5}
                fill="none" strokeLinecap="round"
                strokeDasharray={wordsDash.strokeDasharray}
                strokeDashoffset={wordsDash.strokeDashoffset}
                className={`transition-all duration-700 ${wordsDone ? "text-emerald-500" : "text-violet-500"}`}
              />
            </svg>
            <span className={`absolute text-[12px] font-extrabold ${
              wordsDone ? "text-emerald-600 dark:text-emerald-400" : "text-violet-700 dark:text-violet-300"
            }`}>
              {wordsLearned}
            </span>
          </div>

          {/* Info */}
          <div className="flex flex-1 flex-col gap-0.5">
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-violet-600 dark:text-violet-400">
              <BookOpen className="h-3 w-3" />
              Từ vựng hôm nay
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {wordsDone
                ? <span className="font-semibold text-emerald-600 dark:text-emerald-400">🎉 Đủ {wordGoal} từ!</span>
                : <><span className="font-bold text-violet-600 dark:text-violet-400">{wordsLearned}</span> / {wordGoal} từ</>
              }
            </p>
            <p className="text-[9px] text-slate-400 dark:text-slate-600">
              Tự cộng theo thời gian học
            </p>
          </div>
        </div>

        {/* Goal info */}
        <p className="text-center text-[9px] text-slate-400 dark:text-slate-600">
          Mục tiêu: {dailyMinutes} phút · {wordGoal} từ / ngày
        </p>
      </div>
    </div>
  )
}
