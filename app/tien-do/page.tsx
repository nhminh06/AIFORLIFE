"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Lock, LogIn, TrendingUp } from "lucide-react"

import { PageHeading } from "@/components/dashboard/page-heading"
import { SiteShell } from "@/components/dashboard/site-shell"
import { DailyChart, WeeklyChart } from "@/components/progress/progress-charts"
import { ProgressOverview } from "@/components/progress/progress-overview"
import { ActivityTimeline, BadgeGrid } from "@/components/progress/progress-sections"
import { useAuth } from "@/lib/auth-context"
import { PROGRESS_UPDATED_EVENT } from "@/lib/progress/local-store"
import { migrateGuestProgress } from "@/lib/progress/migrate-local"
import { getProgressData, type ProgressData } from "@/lib/progress-service"

export default function TienDoPage() {
  const { user, loading, openAuthModal } = useAuth()
  const uid = user?.uid ?? null
  const [data, setData] = useState<ProgressData | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (loading) return
    /* Chưa đăng nhập → không đọc / không tính tiến độ khách, chờ UI khóa ở dưới */
    if (!uid) {
      setData(null)
      setLoadingData(false)
      return
    }
    let cancelled = false

    const load = () => {
      getProgressData(uid)
        .then((result) => {
          if (!cancelled) setData(result)
        })
        .finally(() => {
          if (!cancelled) setLoadingData(false)
        })
    }

    /* Đăng nhập lần đầu → đẩy dữ liệu học của khách lên cloud rồi mới đọc */
    const bootstrap = async () => {
      await migrateGuestProgress(uid)
      if (!cancelled) load()
    }
    setLoadingData(true)
    void bootstrap()

    /* Cập nhật lại khi có hoạt động học mới (gộp trong 400ms để không gọi liên tục) */
    const scheduleRefresh = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
      refreshTimer.current = setTimeout(load, 400)
    }

    window.addEventListener(PROGRESS_UPDATED_EVENT, scheduleRefresh)
    window.addEventListener("focus", scheduleRefresh)
    return () => {
      cancelled = true
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
      window.removeEventListener(PROGRESS_UPDATED_EVENT, scheduleRefresh)
      window.removeEventListener("focus", scheduleRefresh)
    }
  }, [uid, loading])

  /* Đang xác thực phiên đăng nhập */
  if (loading) {
    return (
      <SiteShell>
        <PageHeading
          icon={TrendingUp}
          title="Tiến độ học tập"
          desc="Nhìn lại hành trình của bạn: thời gian học, thành tích và từng cột mốc."
          bubbleClass="bg-teal-600"
        />
        <div className="mt-10 flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <p className="mt-3 text-sm font-medium text-slate-500">Đang kiểm tra đăng nhập…</p>
        </div>
      </SiteShell>
    )
  }

  /* Chưa đăng nhập → khóa toàn bộ trang, không để lộ số liệu / huy hiệu của khách */
  if (!user) {
    return (
      <SiteShell>
        <PageHeading
          icon={TrendingUp}
          title="Tiến độ học tập"
          desc="Nhìn lại hành trình của bạn: thời gian học, thành tích và từng cột mốc."
          bubbleClass="bg-teal-600"
        />
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm shadow-slate-200/50">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Lock className="h-7 w-7" />
          </span>
          <h3 className="mt-4 text-lg font-bold text-slate-900">Cần đăng nhập để xem tiến độ</h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-slate-500">
            Tiến độ học tập, huy hiệu và lịch sử hoạt động chỉ hiển thị cho tài khoản đã đăng nhập.
            Hãy đăng nhập để lưu quá trình học và đồng bộ trên mọi thiết bị.
          </p>
          <button
            type="button"
            onClick={() => openAuthModal("login")}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700"
          >
            <LogIn className="h-4 w-4" />
            Đăng nhập ngay
          </button>
        </div>
      </SiteShell>
    )
  }

  return (
    <SiteShell>
      <PageHeading
        icon={TrendingUp}
        title="Tiến độ học tập"
        desc="Nhìn lại hành trình của bạn: thời gian học, thành tích và từng cột mốc."
        bubbleClass="bg-teal-600"
      />

      {loadingData || !data ? (
        <div className="mt-10 flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <p className="mt-3 text-sm font-medium text-slate-500">Đang tổng hợp tiến độ học…</p>
        </div>
      ) : (
        <>
          <ProgressOverview courseProgress={data.overview.courseProgress} stats={data.overview.stats} />
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
              <h3 className="font-bold text-slate-900">Thời gian học theo ngày</h3>
              <p className="mt-0.5 text-sm text-slate-500">Số phút học mỗi ngày trong tuần này.</p>
              <div className="mt-4">
                <DailyChart data={data.daily} />
              </div>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
              <h3 className="font-bold text-slate-900">Tiến độ theo tuần</h3>
              <p className="mt-0.5 text-sm text-slate-500">Số từ và số bài hoàn thành 6 tuần qua.</p>
              <div className="mt-4">
                <WeeklyChart data={data.weekly} />
              </div>
            </section>
          </div>
          <BadgeGrid badges={data.badges} />
          <ActivityTimeline items={data.activity} />
        </>
      )}
    </SiteShell>
  )
}

