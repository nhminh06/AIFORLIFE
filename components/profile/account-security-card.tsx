"use client"

import { useRef, useState } from "react"
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  LogIn,
  LogOut,
  Mail,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
  UserCheck,
  X,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export function AccountSecurityCard() {
  const {
    user,
    userProfile,
    logout,
    openAuthModal,
    resetPassword,
    changePassword,
    sendEmailVerificationLink,
    deleteUserAccount,
    exportUserData,
    importUserData,
  } = useAuth()

  // Trạng thái đổi mật khẩu
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [passLoading, setPassLoading] = useState(false)
  const [passMsg, setPassMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Trạng thái nhập sao lưu
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importMsg, setImportMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Trạng thái xác thực email
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null)

  // Trạng thái xóa tài khoản
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Trạng thái đặt lại tiến độ
  const [resetConfirm, setResetConfirm] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  // Xuất file sao lưu JSON
  const handleExportData = () => {
    try {
      const jsonContent = exportUserData()
      const blob = new Blob([jsonContent], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const dateStr = new Date().toISOString().slice(0, 10)
      a.download = `learnenglish-backup-${dateStr}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert("Không thể xuất dữ liệu sao lưu!")
    }
  }

  // Khôi phục file sao lưu JSON
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportLoading(true)
    setImportMsg(null)

    try {
      const text = await file.text()
      const res = await importUserData(text)
      if (res.success) {
        setImportMsg({ type: "success", text: res.message })
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        setImportMsg({ type: "error", text: res.message })
      }
    } catch (err: any) {
      setImportMsg({ type: "error", text: err?.message || "Lỗi khi đọc file." })
    } finally {
      setImportLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // Xử lý đổi mật khẩu
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPassMsg(null)
    if (newPassword.length < 6) {
      setPassMsg({ type: "error", text: "Mật khẩu mới phải có ít nhất 6 ký tự." })
      return
    }
    if (newPassword !== confirmPassword) {
      setPassMsg({ type: "error", text: "Mật khẩu xác nhận không khớp." })
      return
    }

    setPassLoading(true)
    try {
      await changePassword(newPassword)
      setPassMsg({ type: "success", text: "Đã cập nhật mật khẩu mới thành công!" })
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => {
        setShowPasswordForm(false)
        setPassMsg(null)
      }, 3000)
    } catch (err: any) {
      if (err?.code === "auth/requires-recent-login") {
        setPassMsg({
          type: "error",
          text: "Phiên đăng nhập đã hết hạn bảo mật. Vui lòng đăng xuất và đăng nhập lại trước khi đổi mật khẩu.",
        })
      } else {
        setPassMsg({ type: "error", text: err?.message || "Không thể cập nhật mật khẩu." })
      }
    } finally {
      setPassLoading(false)
    }
  }

  // Gửi email đặt lại mật khẩu nhanh
  const handleSendResetEmail = async () => {
    if (!user?.email) return
    try {
      await resetPassword(user.email)
      setPassMsg({
        type: "success",
        text: `Đã gửi link đặt lại mật khẩu tới ${user.email}. Vui lòng kiểm tra hộp thư!`,
      })
      setTimeout(() => setPassMsg(null), 5000)
    } catch (err: any) {
      setPassMsg({ type: "error", text: err?.message || "Lỗi khi gửi email." })
    }
  }

  // Gửi link xác thực email
  const handleSendVerifyEmail = async () => {
    try {
      await sendEmailVerificationLink()
      setVerifyNotice("Đã gửi email xác thực tài khoản. Vui lòng kiểm tra hòm thư của bạn!")
      setTimeout(() => setVerifyNotice(null), 5000)
    } catch (err: any) {
      setVerifyNotice(err?.message || "Không thể gửi email xác thực lúc này.")
      setTimeout(() => setVerifyNotice(null), 5000)
    }
  }

  // Xóa tài khoản
  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim() !== "XÓA TÀI KHOẢN") return
    setDeleteLoading(true)
    setDeleteError(null)

    try {
      await deleteUserAccount()
      setShowDeleteModal(false)
      window.location.href = "/"
    } catch (err: any) {
      if (err?.code === "auth/requires-recent-login") {
        setDeleteError("Yêu cầu bảo mật: Vui lòng đăng xuất và đăng nhập lại trước khi thực hiện xóa tài khoản.")
      } else {
        setDeleteError(err?.message || "Không thể xóa tài khoản lúc này.")
      }
      setDeleteLoading(false)
    }
  }

  // Đặt lại tiến độ học
  const handleResetProgress = () => {
    if (!resetConfirm) {
      setResetConfirm(true)
      return
    }

    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (
          key &&
          (key.startsWith("learnenglish-notif") ||
            key.includes("progress") ||
            key.includes("learned") ||
            key.startsWith("afl:"))
        ) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k))
      setResetConfirm(false)
      setResetSuccess(true)
      setTimeout(() => {
        setResetSuccess(false)
        window.location.reload()
      }, 1200)
    } catch {
      setResetConfirm(false)
    }
  }

  const isPasswordProvider = user?.providerData.some((p) => p.providerId === "password")

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <Shield className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Bảo mật & Quản trị tài khoản
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Quản lý mật khẩu, xác thực danh tính, sao lưu và khôi phục tiến độ học tập
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {/* Khối 1: Trạng thái tài khoản & Đăng xuất */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-colors sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-800/40">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {user ? "Tài khoản Firebase Cloud" : "Chế độ học viên Khách"}
              </p>
              {user ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <ShieldCheck className="h-3 w-3" />
                  Đã đồng bộ đám mây
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                  Lưu cục bộ
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              {user
                ? `Email: ${user.email} · Phương thức: ${isPasswordProvider ? "Mật khẩu" : "Google"}`
                : "Đăng nhập để đồng bộ tiến độ học lên đám mây và bảo vệ dữ liệu khi đổi thiết bị."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <button
                type="button"
                onClick={() => logout()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 shadow-sm transition-all hover:bg-red-50 dark:border-red-900/40 dark:bg-slate-800 dark:text-red-400"
              >
                <LogOut className="h-3.5 w-3.5" />
                Đăng xuất
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-700"
              >
                <LogIn className="h-3.5 w-3.5" />
                Đăng nhập / Đăng ký
              </button>
            )}
          </div>
        </div>

        {/* Khối 2: Đổi mật khẩu & Xác thực email (cho người dùng đăng nhập) */}
        {user && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                  <KeyRound className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Mật khẩu & Xác thực danh tính
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Cập nhật mật khẩu định kỳ hoặc xác minh địa chỉ email bảo vệ tài khoản
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!user.emailVerified && (
                  <button
                    type="button"
                    onClick={handleSendVerifyEmail}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-800 shadow-sm transition-all hover:bg-amber-50 dark:border-amber-800 dark:bg-slate-800 dark:text-amber-300"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Xác thực email
                  </button>
                )}

                {isPasswordProvider && (
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    {showPasswordForm ? "Đóng form" : "Đổi mật khẩu"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  title="Nhận liên kết đặt lại mật khẩu qua email"
                >
                  Gửi link đặt lại
                </button>
              </div>
            </div>

            {verifyNotice && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 p-2.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                <Check className="h-3.5 w-3.5" />
                {verifyNotice}
              </div>
            )}

            {/* Form đổi mật khẩu mở rộng */}
            {showPasswordForm && isPasswordProvider && (
              <form onSubmit={handleChangePassword} className="mt-4 border-t border-slate-200/60 pt-4 dark:border-slate-700/60">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  <input
                    type={showPass ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={passLoading}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-700 disabled:opacity-50"
                  >
                    {passLoading ? "Đang lưu..." : "Cập nhật mật khẩu"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(false)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}

            {passMsg && (
              <p
                className={`mt-3 text-xs font-semibold ${
                  passMsg.type === "success"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {passMsg.text}
              </p>
            )}
          </div>
        )}

        {/* Khối 3: Sao lưu (Export) & Khôi phục (Import) dữ liệu */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-colors sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-800/40">
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Sao lưu & Khôi phục tiến độ
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Xuất dữ liệu học tập ra file JSON an toàn hoặc khôi phục từ bản sao lưu trước đó
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Input file ẩn cho chức năng khôi phục */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importLoading}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3.5 py-2 text-xs font-bold text-blue-600 shadow-sm transition-all hover:bg-blue-50 dark:border-blue-900/40 dark:bg-slate-800 dark:text-blue-400"
            >
              <Upload className="h-3.5 w-3.5" />
              {importLoading ? "Đang xử lý..." : "Khôi phục (.json)"}
            </button>

            <button
              type="button"
              onClick={handleExportData}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Download className="h-3.5 w-3.5" />
              Tải sao lưu (.json)
            </button>
          </div>
        </div>

        {importMsg && (
          <div
            className={`rounded-2xl p-3 text-xs font-semibold ${
              importMsg.type === "success"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
            }`}
          >
            {importMsg.text}
          </div>
        )}

        {/* Khối 4: Đặt lại tiến độ học tập */}
        <div className="rounded-2xl border border-amber-100 bg-amber-50/30 p-4 dark:border-amber-950/40 dark:bg-amber-950/15">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                Đặt lại tiến độ học tập
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Làm mới toàn bộ câu hỏi đã làm và các từ đã ôn để bắt đầu lại từ đầu
              </p>
            </div>

            <div className="flex items-center gap-2">
              {resetConfirm ? (
                <>
                  <button
                    type="button"
                    onClick={handleResetProgress}
                    className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-amber-700"
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
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-white px-4 py-2 text-xs font-bold text-amber-700 shadow-sm transition-all hover:bg-amber-50 dark:border-amber-900/40 dark:bg-slate-800 dark:text-amber-400"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Đặt lại dữ liệu
                </button>
              )}
            </div>
          </div>

          {resetSuccess && (
            <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              ✓ Đã đặt lại dữ liệu học tập thành công! Đang làm mới...
            </p>
          )}
        </div>

        {/* Khối 5: Khu vực Nguy hiểm - Xóa tài khoản vĩnh viễn (cho tài khoản đăng nhập) */}
        {user && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 dark:border-rose-950/60 dark:bg-rose-950/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400">
                  <Trash2 className="h-4 w-4" />
                  Xóa tài khoản vĩnh viễn
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Hành động này sẽ xóa toàn bộ tài khoản, chuỗi Streak và dữ liệu đám mây không thể hoàn tác
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-300 bg-white px-4 py-2 text-xs font-bold text-rose-600 shadow-sm transition-all hover:bg-rose-600 hover:text-white dark:border-rose-900 dark:bg-slate-900 dark:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Xóa tài khoản
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal xác nhận xóa tài khoản */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-6 shadow-2xl dark:border-rose-900 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5" />
                <h4 className="text-base font-bold">Xác nhận xóa tài khoản</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Bạn có chắc chắn muốn xóa tài khoản <strong>{user?.email}</strong>? Tất cả thông tin hồ sơ, điểm số tích lũy, các huy hiệu và bài học đã làm sẽ bị xóa vĩnh viễn khỏi máy chủ đám mây.
            </p>

            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Để xác nhận, vui lòng nhập chính xác cụm từ: <strong className="text-rose-600">XÓA TÀI KHOẢN</strong>
            </div>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Nhập: XÓA TÀI KHOẢN"
              className="mt-3 w-full rounded-xl border border-rose-300 px-3.5 py-2 text-xs font-bold text-rose-600 outline-none placeholder:font-normal placeholder:text-slate-400 focus:ring-2 focus:ring-rose-200 dark:border-rose-800 dark:bg-slate-800"
            />

            {deleteError && (
              <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                {deleteError}
              </p>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={deleteConfirmText.trim() !== "XÓA TÀI KHOẢN" || deleteLoading}
                onClick={handleDeleteAccount}
                className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-rose-700 disabled:opacity-40"
              >
                {deleteLoading ? "Đang xóa..." : "Xác nhận xóa vĩnh viễn"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
