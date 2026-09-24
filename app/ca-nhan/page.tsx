"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Award,
  Bell,
  BookOpenText,
  CheckCircle2,
  ChevronRight,
  Flame,
  LayoutDashboard,
  Palette,
  Shield,
  Sliders,
  TrendingUp,
  UserRound,
  Zap,
} from "lucide-react"

import { useAuth } from "@/lib/auth-context"
import { getStatsSummary, type StatsSummary } from "@/lib/progress-service"
import { getEarnedBadges } from "@/lib/progress/badge-service"
import { useNotifications } from "@/lib/progress/notifications.hooks"

import { PageHeading } from "@/components/dashboard/page-heading"
import { SiteShell } from "@/components/dashboard/site-shell"
import { ProfileHero } from "@/components/profile/profile-hero"
import { DailyVocabCard } from "@/components/profile/daily-vocab-card"
import { StudySettingsCard } from "@/components/profile/study-settings-card"
import { AppearanceCard } from "@/components/profile/appearance-card"
import { BadgesShowcaseCard } from "@/components/profile/badges-showcase-card"
import { AccountSecurityCard } from "@/components/profile/account-security-card"
import { NotificationItem } from "@/components/profile/notification-item"

type TabKey = "all" | "profile" | "settings" | "appearance" | "badges" | "notifications"

const TABS: { id: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "all", label: "Tất cả", icon: LayoutDashboard },
  { id: "profile", label: "Hồ sơ học viên", icon: UserRound },
  { id: "settings", label: "Mục tiêu học", icon: Sliders },
  { id: "appearance", label: "Giao diện", icon: Palette },
  { id: "badges", label: "Huy hiệu", icon: Award },
  { id: "notifications", label: "Thông báo", icon: Bell },
]

export default function CaNhanPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabKey>("all")
  const [stats, setStats] = useState<StatsSummary | null>(null)
  const [earnedBadgeCount, setEarnedBadgeCount] = useState<number>(0)

  // Hệ thống thông báo thời gian thực
  const { notifications, unreadCount, markAsRead } = useNotifications({ limitCount: 6 })

  useEffect(() => {
    let isMounted = true
    const loadStats = async () => {
      try {
        const [s, earned] = await Promise.all([
          getStatsSummary(user?.uid),
          getEarnedBadges(user?.uid),
        ])
        if (isMounted) {
          setStats(s)
          setEarnedBadgeCount(Object.keys(earned).length)
        }
      } catch {
        /* fallback */
      }
    }
    loadStats()
    window.addEventListener("storage", loadStats)
    window.addEventListener("learnenglish-progress-updated" as any, loadStats)
    return () => {
      isMounted = false
      window.removeEventListener("storage", loadStats)
      window.removeEventListener("learnenglish-progress-updated" as any, loadStats)
    }
  }, [user?.uid])

  const quickStats = [
    {
      label: "Chuỗi học liên tiếp",
      value: `${stats ? stats.currentStreak : 0} ngày`,
      icon: Flame,
      color: "bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400",
      detail: stats && stats.currentStreak > 0 ? "Tiếp tục duy trì hôm nay" : "Bắt đầu bài học để tạo chuỗi",
    },
    {
      label: "Từ vựng đã thuộc",
      value: `${stats ? stats.wordsLearned : 0} từ`,
      icon: BookOpenText,
      color: "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
      detail: "Từ vựng đã thành thạo",
    },
    {
      label: "Tổng điểm tích lũy",
      value: `${stats ? stats.totalXp.toLocaleString() : 0} XP`,
      icon: Zap,
      color: "bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400",
      detail: `${stats ? stats.completedLessons : 0} bài học hoàn thành`,
    },
    {
      label: "Huy hiệu đạt được",
      value: `${earnedBadgeCount} / 8`,
      icon: Award,
      color: "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
      detail: earnedBadgeCount === 8 ? "Đã mở khóa toàn bộ!" : `Còn ${8 - earnedBadgeCount} danh hiệu nữa`,
    },
  ]

  const recentNotifs = notifications.slice(0, 3)

  return (
    <SiteShell>
      <PageHeading
        icon={UserRound}
        title="Trang cá nhân & Cài đặt"
        desc="Quản lý hồ sơ học viên, thiết lập mục tiêu học tập hàng ngày, tùy biến giao diện và theo dõi thành tích."
        bubbleClass="bg-blue-600"
      />

      {/* Tabs Filter Bar */}
      <div className="mt-6 flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                active
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.id === "notifications" && unreadCount > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.25 text-[10px] font-bold ${
                    active
                      ? "bg-white text-blue-600"
                      : "bg-rose-500 text-white"
                  }`}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Main Content Layout */}
      <div className="mt-6 space-y-6">
        {/* Profile Hero section */}
        {(activeTab === "all" || activeTab === "profile") && (
          <div id="profile-section">
            <ProfileHero />
          </div>
        )}

        {/* Quick Stats Grid */}
        {activeTab === "all" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickStats.map((s) => {
              const Icon = s.icon
              return (
                <div
                  key={s.label}
                  className="flex items-center gap-3.5 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
                >
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${s.color}`}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {s.label}
                    </span>
                    <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {s.value}
                    </p>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {s.detail}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Daily AI Vocabulary — từ vựng 5 từ/ngày AI tạo */}
        {(activeTab === "all" || activeTab === "profile") && (
          <div id="daily-vocab-section">
            <DailyVocabCard />
          </div>
        )}

        {/* Study Settings Section */}
        {(activeTab === "all" || activeTab === "settings") && (
          <div id="settings-section">
            <StudySettingsCard />
          </div>
        )}

        {/* Appearance Settings Section */}
        {(activeTab === "all" || activeTab === "appearance") && (
          <div id="appearance-section">
            <AppearanceCard />
          </div>
        )}

        {/* Badges Showcase Section */}
        {(activeTab === "all" || activeTab === "badges") && (
          <div id="badges-section">
            <BadgesShowcaseCard />
          </div>
        )}

        {/* Recent Notifications Summary */}
        {(activeTab === "all" || activeTab === "notifications") && (
          <section
            id="notifications-section"
            className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                  <Bell className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Thông báo mới nhất
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cập nhật kết quả bài thi, chuỗi Streak và phần thưởng học tập
                  </p>
                </div>
              </div>

              <Link
                href="/ca-nhan/thong-bao"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Xem tất cả ({notifications.length})
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 space-y-2">
              {recentNotifs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  Chưa có thông báo nào. Bắt đầu học bài và duy trì Streak để mở khóa thêm thành tích!
                </div>
              ) : (
                recentNotifs.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    isRead={n.read}
                    onClick={() => markAsRead(n.id)}
                  />
                ))
              )}
            </div>
          </section>
        )}

        {/* Account & Data Management */}
        {(activeTab === "all" || activeTab === "settings" || activeTab === "profile") && (
          <div id="security-section">
            <AccountSecurityCard />
          </div>
        )}
      </div>
    </SiteShell>
  )
}

