"use client"

import React, { useState } from "react"
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    openAuthModal,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    resetPassword,
  } = useAuth()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  if (!isAuthModalOpen) return null

  const getVietnameseError = (err: any): string => {
    const code = err?.code || ""
    if (code === "auth/email-already-in-use") {
      return "Email này đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng email khác."
    }
    if (
      code === "auth/invalid-credential" ||
      code === "auth/wrong-password" ||
      code === "auth/user-not-found"
    ) {
      return "Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại."
    }
    if (code === "auth/weak-password") {
      return "Mật khẩu quá ngắn. Vui lòng nhập ít nhất 6 ký tự."
    }
    if (code === "auth/invalid-email") {
      return "Địa chỉ email không đúng định dạng."
    }
    if (code === "auth/popup-closed-by-user") {
      return "Cửa sổ đăng nhập Google đã bị đóng. Vui lòng thử lại."
    }
    if (code === "auth/configuration-not-found" || code === "auth/operation-not-allowed") {
      return "Dịch vụ Xác thực chưa được kích hoạt trên Firebase Console. Vui lòng vào Firebase Console > Authentication > Sign-in method và bật Email/Password hoặc Google Provider."
    }
    if (code === "auth/too-many-requests") {
      return "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau ít phút."
    }
    return err?.message || "Đã có lỗi xảy ra. Vui lòng thử lại."
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setLoading(true)

    try {
      if (authModalTab === "login") {
        await loginWithEmail(email, password)
      } else if (authModalTab === "register") {
        if (!name.trim()) {
          setError("Vui lòng nhập họ tên của bạn.")
          setLoading(false)
          return
        }
        await registerWithEmail(email, password, name)
      } else if (authModalTab === "forgot") {
        await resetPassword(email)
        setSuccessMessage("Đã gửi email khôi phục mật khẩu. Vui lòng kiểm tra hộp thư của bạn.")
        setLoading(false)
        return
      }
    } catch (err: any) {
      setError(getVietnameseError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setLoading(true)
    try {
      await loginWithGoogle()
    } catch (err: any) {
      setError(getVietnameseError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 p-6 text-white sm:p-8">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-xl" />
          <div className="flex items-center gap-2.5">
            <img
              src="/img/logo.png"
              alt="LearnSphere"
              width={40}
              height={40}
              className="h-10 w-10 rounded-2xl object-cover shadow-sm"
            />
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                LearnSphere · Learn English with AI
              </span>
              <h2 className="text-xl font-black text-white sm:text-2xl">
                {authModalTab === "login" && "Đăng nhập tài khoản"}
                {authModalTab === "register" && "Đăng ký thành viên mới"}
                {authModalTab === "forgot" && "Khôi phục mật khẩu"}
              </h2>
            </div>
          </div>
          <p className="mt-2 text-xs text-blue-100">
            {authModalTab === "login" && "Đồng bộ tiến độ học từ vựng, ngữ pháp và chuỗi Streak trên mọi thiết bị."}
            {authModalTab === "register" && "Bắt đầu hành trình chinh phục tiếng Anh với lộ trình thông minh."}
            {authModalTab === "forgot" && "Nhập email của bạn để nhận liên kết thiết lập lại mật khẩu."}
          </p>

          {/* Tab buttons */}
          {authModalTab !== "forgot" && (
            <div className="mt-5 flex rounded-xl bg-black/20 p-1 backdrop-blur-md">
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  openAuthModal("login")
                }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                  authModalTab === "login"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-white/80 hover:text-white"
                }`}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  openAuthModal("register")
                }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                  authModalTab === "register"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-white/80 hover:text-white"
                }`}
              >
                Đăng ký
              </button>
            </div>
          )}
        </div>

        {/* Modal Form */}
        <div className="p-6 sm:p-8">
          {/* Quick Google Sign In */}
          {authModalTab !== "forgot" && (
            <>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750"
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Tiếp tục bằng tài khoản Google</span>
              </button>

              <div className="relative my-5 flex items-center justify-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                <span className="absolute bg-white px-3 text-xs font-medium text-slate-400 dark:bg-slate-900 dark:text-slate-500">
                  hoặc bằng email
                </span>
              </div>
            </>
          )}

          {/* Alerts */}
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {authModalTab === "register" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Họ và tên
                </label>
                <div className="relative mt-1">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:ring-blue-900"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Địa chỉ Email
              </label>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:ring-blue-900"
                />
              </div>
            </div>

            {authModalTab !== "forgot" && (
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mật khẩu
                  </label>
                  {authModalTab === "login" && (
                    <button
                      type="button"
                      onClick={() => {
                        setError(null)
                        setSuccessMessage(null)
                        openAuthModal("forgot")
                      }}
                      className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Quên mật khẩu?
                    </button>
                  )}
                </div>
                <div className="relative mt-1">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:ring-blue-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-blue-600/35 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span>
                    {authModalTab === "login" && "Đăng nhập ngay"}
                    {authModalTab === "register" && "Hoàn tất đăng ký"}
                    {authModalTab === "forgot" && "Gửi email khôi phục"}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {authModalTab === "forgot" && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setSuccessMessage(null)
                  openAuthModal("login")
                }}
                className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                ← Quay lại đăng nhập
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
