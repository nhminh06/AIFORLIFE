"use client"

import { useState } from "react"
import {
  AlertTriangle,
  Download,
  LogOut,
  RefreshCw,
  Shield,
  Trash2,
} from "lucide-react"

export function AccountSecurityCard() {
  const [resetConfirm, setResetConfirm] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  const handleExportData = () => {
    try {
      const data: Record<string, any> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith("learnenglish")) {
          data[key] = localStorage.getItem(key)
        }
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `learnenglish-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert("Không thể xuất dữ liệu!")
    }
  }

  const handleResetProgress = () => {
    if (!resetConfirm) {
      setResetConfirm(true)
      return
    }

    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith("learnenglish-notif") || key.includes("progress") || key.includes("learned"))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k))
      setResetConfirm(false)
      setResetSuccess(true)
      setTimeout(() => {
        setResetSuccess(false)
        window.location.reload()
      }, 1500)
    } catch {
      setResetConfirm(false)
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <Shield className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Dữ liệu & Quản trị tài khoản
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sao lưu lịch sử học tập, đặt lại tiến độ hoặc đăng xuất
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {/* Sao lưu dữ liệu */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-colors sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-800/40">
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Sao lưu tiến độ học tập
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tải file JSON chứa toàn bộ dữ liệu từ vựng, điểm thi và streak cá nhân
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportData}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Download className="h-3.5 w-3.5" />
            Tải về file sao lưu (.json)
          </button>
        </div>

        {/* Đặt lại tiến độ / Reset */}
        <div className="rounded-2xl border border-rose-100 bg-rose-50/30 p-4 dark:border-rose-950/40 dark:bg-rose-950/15">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400">
                <AlertTriangle className="h-4 w-4" />
                Đặt lại tiến độ học tập
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Xóa lịch sử bài học và các câu hỏi đã làm để bắt đầu học lại từ đầu
              </p>
            </div>

            <div className="flex items-center gap-2">
              {resetConfirm ? (
                <>
                  <button
                    type="button"
                    onClick={handleResetProgress}
                    className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-rose-700"
                  >
                    Xác nhận đặt lại!
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetConfirm(false)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    Hủy
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setResetConfirm(true)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-600 shadow-sm transition-all hover:bg-rose-50 dark:border-rose-900/40 dark:bg-slate-800 dark:text-rose-400"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Đặt lại dữ liệu
                </button>
              )}
            </div>
          </div>

          {resetSuccess && (
            <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              ✓ Đã đặt lại dữ liệu! Đang tải lại trang...
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
