import {
  Award,
  BookText,
  CheckCircle2,
  Flame,
  Medal,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react"

export type Badge = {
  id: string
  name: string
  vi: string
  icon: LucideIcon
  /** đã đạt được hay chưa */
  earned: boolean
  bg: string
}

export type ActivityItem = {
  date: string
  title: string
  detail: string
  score: string
  scoreClass: string
}

export const courseProgress = 45

export const overviewStats = [
  { label: "Từ đã học", value: "1.240", icon: BookText, color: "text-blue-600 bg-blue-50" },
  { label: "Bài hoàn thành", value: "86", icon: CheckCircle2, color: "text-green-600 bg-green-50" },
  { label: "Ngày liên tiếp", value: "12", icon: Flame, color: "text-orange-500 bg-orange-50" },
  { label: "Tổng điểm XP", value: "4.850", icon: Zap, color: "text-purple-600 bg-purple-50" },
]

export const dailyStudy = [
  { day: "T2", minutes: 25 },
  { day: "T3", minutes: 40 },
  { day: "T4", minutes: 15 },
  { day: "T5", minutes: 55 },
  { day: "T6", minutes: 30 },
  { day: "T7", minutes: 70 },
  { day: "CN", minutes: 45 },
]

export const weeklyStudy = [
  { week: "Tuần 1", words: 120, lessons: 8 },
  { week: "Tuần 2", words: 180, lessons: 11 },
  { week: "Tuần 3", words: 150, lessons: 9 },
  { week: "Tuần 4", words: 230, lessons: 14 },
  { week: "Tuần 5", words: 260, lessons: 16 },
  { week: "Tuần 6", words: 300, lessons: 18 },
]

export const badges: Badge[] = [
  { id: "first-steps", name: "First Steps", vi: "Bài học đầu tiên", icon: Star, earned: true, bg: "bg-amber-400" },
  { id: "week-streak", name: "7-Day Streak", vi: "Học 7 ngày liên tiếp", icon: Flame, earned: true, bg: "bg-orange-500" },
  { id: "word-100", name: "100 Words", vi: "Thuộc 100 từ", icon: BookText, earned: true, bg: "bg-blue-500" },
  { id: "perfect-score", name: "Perfect 10", vi: "Bài kiểm tra 10/10", icon: Target, earned: true, bg: "bg-green-500" },
  { id: "speaker", name: "Confident Speaker", vi: "Luyện nói 10 bài", icon: Award, earned: true, bg: "bg-purple-500" },
  { id: "word-1000", name: "1000 Words", vi: "Thuộc 1.000 từ", icon: Medal, earned: true, bg: "bg-teal-500" },
  { id: "grammar-master", name: "Grammar Master", vi: "Xong mọi chủ điểm ngữ pháp", icon: Sparkles, earned: false, bg: "bg-slate-300" },
  { id: "month-streak", name: "30-Day Streak", vi: "Học 30 ngày liên tiếp", icon: Trophy, earned: false, bg: "bg-slate-300" },
]

export const activityHistory: ActivityItem[] = [
  {
    date: "Hôm nay",
    title: "Present Simple Basics",
    detail: "Trắc nghiệm · Ngữ pháp",
    score: "8/8",
    scoreClass: "bg-green-100 text-green-700",
  },
  {
    date: "Hôm qua",
    title: "Daily Life",
    detail: "Từ vựng · 20 từ mới",
    score: "20 từ",
    scoreClass: "bg-blue-100 text-blue-700",
  },
  {
    date: "Hôm qua",
    title: "Listen: At the Airport",
    detail: "Nghe – chọn đáp án",
    score: "3/5",
    scoreClass: "bg-amber-100 text-amber-700",
  },
  {
    date: "2 ngày trước",
    title: "At the Restaurant",
    detail: "Mẫu câu · 6 câu mới",
    score: "Hoàn thành",
    scoreClass: "bg-green-100 text-green-700",
  },
  {
    date: "3 ngày trước",
    title: "Build Greetings",
    detail: "Sắp xếp câu",
    score: "4/4",
    scoreClass: "bg-green-100 text-green-700",
  },
]
