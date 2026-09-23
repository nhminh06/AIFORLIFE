/**
 * API tổng hợp cho trang /tien-do: tính toán 5 khối số liệu từ dữ liệu thật.
 *
 * - Dùng chung công thức với Dashboard (components/dashboard/study-stats-card.tsx)
 *   để 2 nơi không bao giờ lệch số.
 * - Ưu tiên Firestore khi đã đăng nhập; khách dùng localStorage.
 * - Mọi hàm đều KHÔNG throw: lỗi mạng → trả số 0 / dữ liệu tĩnh để UI vẫn chạy.
 */

import {
  BookText as BookTextIcon,
  CheckCircle2 as CheckCircleIcon,
  Flame as FlameIcon,
  Zap as ZapIcon,
  type LucideIcon,
} from "lucide-react"

import { grammarTopics } from "@/lib/data/grammar"
import { badges as staticBadges, type ActivityItem, type Badge } from "@/lib/data/progress"
import { getAllPhraseSets } from "@/lib/phrase-service"
import { getAllVocabSets } from "@/lib/vocab-service"
import { loadVocabProgress } from "@/lib/vocab-progress"
import { loadPhraseProgress, loadAllPhraseProgress } from "@/lib/phrase-progress"
import { loadGrammarLearned } from "@/lib/grammar-progress"
import { getMyVocabSets } from "@/lib/user-vocab"
import { getMyPhraseSets } from "@/lib/user-phrases"
import { getMyGrammarSets } from "@/lib/user-grammar"
import {
  getAllPracticeResults,
  type PracticeResultRecord,
} from "@/lib/progress/practice-results-service"
import { getLocalPracticeResults, loadDefaultExercises, loadMyExercises } from "@/lib/practice-service"
import { loadAllVocabProgress } from "@/lib/progress/vocab-progress-cloud"
import { loadAllGrammarProgress } from "@/lib/progress/grammar-progress-cloud"
import { getAllStudyDays, fillMissingDays } from "@/lib/progress/study-day-service"
import { getRecentStudyEvents } from "@/lib/progress/study-event-service"
import { computeSummary, saveProgressSummary } from "@/lib/progress/summary-service"
import { getEarnedBadges, syncEarnedBadges } from "@/lib/progress/badge-service"
import { todayKey } from "@/lib/daily-vocab"
import type { BadgeMetrics, ProgressSummary, StudyDay, StudyEvent } from "@/lib/progress/types"

/* ------------------------------------------------------------------ */
/*  Kiểu dữ liệu trả về                                                */
/* ------------------------------------------------------------------ */

export type OverviewStat = {
  label: string
  value: string
  icon: LucideIcon
  color: string
}

export type ProgressOverview = {
  courseProgress: number
  stats: OverviewStat[]
}

export type DailyPoint = { day: string; minutes: number; date: string }
export type WeeklyPoint = { week: string; words: number; lessons: number }

export type ProgressData = {
  overview: ProgressOverview
  daily: DailyPoint[]
  weekly: WeeklyPoint[]
  badges: Badge[]
  activity: ActivityItem[]
}

/** Số liệu cốt lõi (dùng chung cho Dashboard và trang Tiến độ) */
export type LearningMetrics = {
  wordsLearned: number
  phrasesLearned: number
  completedVocabSets: number
  completedPhraseSets: number
  grammarLearned: number
  grammarTotal: number
  completedExercises: number
  perfectScores: number
  /** bài học đã hoàn thành = bộ từ + bộ mẫu câu + chủ điểm + bài luyện */
  completedLessons: number
  courseProgress: number
}

const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function weekdayLabel(date: string): string {
  const parsed = new Date(`${date}T00:00:00`)
  return WEEKDAY_LABELS[parsed.getDay()] ?? ""
}

function daysAgoFromToday(date: string): number {
  const today = new Date(`${todayKey()}T00:00:00`)
  const target = new Date(`${date}T00:00:00`)
  return Math.round((today.getTime() - target.getTime()) / 86400000)
}

/** Nhãn ngày cho Lịch sử hoạt động: Hôm nay / Hôm qua / N ngày trước / dd/mm/yyyy */
function relativeDateLabel(date: string): string {
  const diff = daysAgoFromToday(date)
  if (diff <= 0) return "Hôm nay"
  if (diff === 1) return "Hôm qua"
  if (diff < 7) return `${diff} ngày trước`
  const [y, m, d] = date.split("-")
  return `${d}/${m}/${y}`
}

/** Gộp tiến độ local + cloud thành 1 tập key */
function mergedKeySet(localKeys: Iterable<string>, cloudKeys: string[] | undefined): Set<string> {
  const merged = new Set(localKeys)
  cloudKeys?.forEach((k) => merged.add(k))
  return merged
}

/* ------------------------------------------------------------------ */
/*  Số liệu cốt lõi                                                    */
/* ------------------------------------------------------------------ */

/** Gom toàn bộ số liệu học tập của user (1 lần đọc Firestore song song). */
export async function getLearningMetrics(uid: string | null | undefined): Promise<LearningMetrics> {
  const [
    systemVocab,
    myVocab,
    systemPhrases,
    myPhrases,
    myGrammar,
    defaultExercises,
    myExercises,
    cloudVocab,
    cloudPhrase,
    cloudGrammar,
    cloudResults,
  ] = await Promise.all([
    getAllVocabSets(),
    uid ? getMyVocabSets(uid) : Promise.resolve([]),
    getAllPhraseSets(),
    uid ? getMyPhraseSets(uid) : Promise.resolve([]),
    uid ? getMyGrammarSets(uid) : Promise.resolve([]),
    loadDefaultExercises(),
    uid ? loadMyExercises(uid) : Promise.resolve([]),
    loadAllVocabProgress(uid),
    loadAllPhraseProgress(uid),
    loadAllGrammarProgress(uid),
    getAllPracticeResults(uid),
  ])

  /* --- Từ vựng --- */
  const vocabSets = [...myVocab, ...systemVocab]
  const vocabLearnedCounts = vocabSets.map(
    (set) => mergedKeySet(loadVocabProgress(set.slug, uid), cloudVocab[set.slug]).size
  )
  const wordsLearned = vocabLearnedCounts.reduce((sum, count) => sum + count, 0)
  const vocabTotal = vocabSets.reduce((sum, set) => sum + set.total, 0)
  const completedVocabSets = vocabSets.filter(
    (set, i) => set.total > 0 && vocabLearnedCounts[i] >= set.total
  ).length

  /* --- Mẫu câu --- */
  const phraseSets = [...myPhrases, ...systemPhrases]
  const phraseLearnedCounts = phraseSets.map(
    (set) => mergedKeySet(loadPhraseProgress(set.slug, uid), cloudPhrase[set.slug]).size
  )
  const phrasesLearned = phraseLearnedCounts.reduce((sum, count) => sum + count, 0)
  const phraseTotal = phraseSets.reduce((sum, set) => sum + set.total, 0)
  const completedPhraseSets = phraseSets.filter(
    (set, i) => set.total > 0 && phraseLearnedCounts[i] >= set.total
  ).length

  /* --- Ngữ pháp --- */
  const grammarSlugs = [...grammarTopics.map((t) => t.slug), ...myGrammar.map((s) => s.slug)]
  const learnedGrammarSlugs = new Set([...cloudGrammar, ...loadGrammarLearned(uid)])
  myGrammar.forEach((set) => {
    if (set.progress >= 100) learnedGrammarSlugs.add(set.slug)
  })
  const grammarLearned = grammarSlugs.filter((slug) => learnedGrammarSlugs.has(slug)).length
  const grammarTotal = grammarSlugs.length

  /* --- Luyện tập: gộp kết quả local + cloud --- */
  const resultSources: Record<string, { score: number; total: number }> = {}
  Object.entries(getLocalPracticeResults()).forEach(([id, r]) => {
    resultSources[id] = { score: r.score, total: r.total }
  })
  Object.entries(cloudResults as Record<string, PracticeResultRecord>).forEach(([id, r]) => {
    const current = resultSources[id]
    const isBetter = !current || r.bestScore > current.score
    resultSources[id] = isBetter ? { score: r.bestScore, total: r.bestTotal } : current
  })
  const completedExercises = [...defaultExercises, ...myExercises].filter(
    (exercise) => exercise.status === "Hoàn thành" || Boolean(resultSources[exercise.id])
  ).length
  const perfectScores = Object.values(resultSources).filter(
    (r) => r.total > 0 && r.score >= r.total
  ).length

  /* --- Tiến độ khóa học: CÙNG công thức với study-stats-card --- */
  const overallTotal = vocabTotal + phraseTotal + grammarTotal
  const overallLearned = wordsLearned + phrasesLearned + grammarLearned
  const courseProgress =
    overallTotal > 0 ? Math.min(100, Math.round((overallLearned / overallTotal) * 100)) : 0

  return {
    wordsLearned,
    phrasesLearned,
    completedVocabSets,
    completedPhraseSets,
    grammarLearned,
    grammarTotal,
    completedExercises,
    perfectScores,
    completedLessons:
      completedVocabSets + completedPhraseSets + grammarLearned + completedExercises,
    courseProgress,
  }
}

/** 4 thẻ số liệu của khối "Tổng quan" */
function buildOverviewStats(metrics: LearningMetrics, summary: ProgressSummary): OverviewStat[] {
  return [
    {
      label: "Từ đã học",
      value: metrics.wordsLearned.toLocaleString("vi-VN"),
      icon: BookTextIcon,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Bài hoàn thành",
      value: metrics.completedLessons.toString(),
      icon: CheckCircleIcon,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "Ngày liên tiếp",
      value: summary.currentStreak.toString(),
      icon: FlameIcon,
      color: "text-orange-500 bg-orange-50",
    },
    {
      label: "Tổng điểm XP",
      value: summary.totalXp.toLocaleString("vi-VN"),
      icon: ZapIcon,
      color: "text-purple-600 bg-purple-50",
    },
  ]
}

/* ------------------------------------------------------------------ */
/*  Biểu đồ                                                            */
/* ------------------------------------------------------------------ */

/** Biểu đồ "Thời gian học theo ngày": `days` ngày gần nhất. */
export function buildDailyPoints(days: StudyDay[]): DailyPoint[] {
  return days.map((d) => ({ day: weekdayLabel(d.date), minutes: d.minutes, date: d.date }))
}

/** Biểu đồ "Tiến độ theo tuần": gộp studyDays thành `weeks` tuần gần nhất. */
export function buildWeeklyPoints(days: StudyDay[], weeks = 6): WeeklyPoint[] {
  const buckets = Array.from({ length: weeks }, (_, i) => ({
    week: `Tuần ${i + 1}`,
    words: 0,
    lessons: 0,
  }))

  days.forEach((day) => {
    const weeksAgo = Math.floor(daysAgoFromToday(day.date) / 7)
    if (weeksAgo < 0 || weeksAgo >= weeks) return
    const index = weeks - 1 - weeksAgo
    buckets[index].words += day.wordsLearned
    buckets[index].lessons += day.exercisesCompleted + day.grammarCompleted
  })

  return buckets
}

/* ------------------------------------------------------------------ */
/*  Huy hiệu                                                           */
/* ------------------------------------------------------------------ */

/** Danh sách huy hiệu kèm trạng thái đạt được thật (gộp catalog tĩnh + Firestore). */
export async function getBadgeList(uid: string | null | undefined): Promise<Badge[]> {
  const earned = await getEarnedBadges(uid)
  return staticBadges.map((badge) => ({
    ...badge,
    /* trạng thái thật lấy từ dữ liệu đã ghi, không dùng giá trị demo trong catalog */
    earned: Boolean(earned[badge.id]),
    earnedAt: earned[badge.id],
  }))
}

function badgeTitleMap(): Record<string, string> {
  return Object.fromEntries(staticBadges.map((b) => [b.id, b.name]))
}

/* ------------------------------------------------------------------ */
/*  Lịch sử hoạt động                                                  */
/* ------------------------------------------------------------------ */

const TONE_CLASS: Record<string, string> = {
  green: "bg-green-100 text-green-700",
  blue: "bg-blue-100 text-blue-700",
  amber: "bg-amber-100 text-amber-700",
  purple: "bg-purple-100 text-purple-700",
}

/** Đổi 1 sự kiện đã gộp thành 1 dòng trong Lịch sử hoạt động. */
export function eventToActivityItem(event: StudyEvent): ActivityItem {
  const date = relativeDateLabel(event.date)
  const count = Math.max(1, event.count)

  switch (event.type) {
    case "vocab":
      return {
        date,
        title: event.title,
        detail: `Từ vựng · ${count} từ mới`,
        score: `${count} từ`,
        scoreClass: TONE_CLASS.blue,
      }
    case "vocab_set_done":
      return {
        date,
        title: event.title,
        detail: "Từ vựng · Hoàn thành cả bộ",
        score: "Hoàn thành",
        scoreClass: TONE_CLASS.green,
      }
    case "phrase":
      return {
        date,
        title: event.title,
        detail: `Mẫu câu · ${count} câu mới`,
        score: `${count} câu`,
        scoreClass: TONE_CLASS.green,
      }
    case "phrase_set_done":
      return {
        date,
        title: event.title,
        detail: "Mẫu câu · Hoàn thành cả bộ",
        score: "Hoàn thành",
        scoreClass: TONE_CLASS.green,
      }
    case "grammar":
      return {
        date,
        title: event.title,
        detail: event.detail || "Trắc nghiệm · Ngữ pháp",
        score: "Hoàn thành",
        scoreClass: TONE_CLASS.green,
      }
    case "practice": {
      const score = event.score ?? 0
      const total = event.total ?? 0
      const perfect = total > 0 && score >= total
      return {
        date,
        title: event.title,
        detail: event.detail ? `Luyện tập · ${event.detail}` : "Luyện tập",
        score: total > 0 ? `${score}/${total}` : "Hoàn thành",
        scoreClass: perfect ? TONE_CLASS.green : TONE_CLASS.amber,
      }
    }
    case "badge":
    default:
      return {
        date,
        title: `Huy hiệu mới: ${event.title}`,
        detail: "Thành tích · Mở khoá huy hiệu",
        score: "Huy hiệu",
        scoreClass: TONE_CLASS.purple,
      }
  }
}

/* ------------------------------------------------------------------ */
/*  API chính cho trang /tien-do                                       */
/* ------------------------------------------------------------------ */

/**
 * Lấy toàn bộ dữ liệu cho trang Tiến độ trong 1 lần gọi:
 * tổng quan + biểu đồ ngày + biểu đồ tuần + huy hiệu + lịch sử hoạt động.
 * Đồng thời ghi lại summary & các huy hiệu mới đạt được (không chặn UI).
 */
export async function getProgressData(
  uid: string | null | undefined,
  options?: { days?: number; weeks?: number; activityLimit?: number }
): Promise<ProgressData> {
  const days = options?.days ?? 7
  const weeks = options?.weeks ?? 6
  const activityLimit = options?.activityLimit ?? 20

  const [metrics, allDays, events] = await Promise.all([
    getLearningMetrics(uid),
    getAllStudyDays(uid),
    getRecentStudyEvents(uid, activityLimit),
  ])

  const summary = computeSummary(allDays)

  /* Xét huy hiệu mới đạt (ghi Firestore/local, lỗi không chặn UI) */
  const badgeMetrics: BadgeMetrics = {
    wordsLearnedTotal: metrics.wordsLearned,
    phrasesLearnedTotal: metrics.phrasesLearned,
    grammarLearned: metrics.grammarLearned,
    grammarTotal: metrics.grammarTotal,
    perfectScores: metrics.perfectScores,
    exercisesCompleted: metrics.completedExercises,
    currentStreak: summary.currentStreak,
    longestStreak: summary.longestStreak,
    activeDays: summary.activeDays,
  }
  const newBadgeIds = await syncEarnedBadges(uid, badgeMetrics, badgeTitleMap())

  /* Lưu snapshot summary để nơi khác đọc nhanh */
  if (uid) void saveProgressSummary(uid, summary)

  const earned = await getEarnedBadges(uid)
  const now = new Date().toISOString()
  const badgeList = staticBadges.map((badge) => ({
    ...badge,
    earned: Boolean(earned[badge.id]) || newBadgeIds.includes(badge.id),
    earnedAt: earned[badge.id] ?? (newBadgeIds.includes(badge.id) ? now : undefined),
  }))

  return {
    overview: {
      courseProgress: metrics.courseProgress,
      stats: buildOverviewStats(metrics, summary),
    },
    daily: buildDailyPoints(fillMissingDays(allDays, days)),
    weekly: buildWeeklyPoints(allDays, weeks),
    badges: badgeList,
    activity: events.map(eventToActivityItem),
  }
}

/** Số liệu rút gọn cho Dashboard (StudyStatsCard) — cùng nguồn với trang Tiến độ. */
export type StatsSummary = {
  wordsLearned: number
  completedLessons: number
  currentStreak: number
  totalXp: number
  courseProgress: number
  totalMinutes: number
}

export async function getStatsSummary(uid: string | null | undefined): Promise<StatsSummary> {
  const [metrics, allDays] = await Promise.all([getLearningMetrics(uid), getAllStudyDays(uid)])
  const summary = computeSummary(allDays)
  return {
    wordsLearned: metrics.wordsLearned,
    completedLessons: metrics.completedLessons,
    currentStreak: summary.currentStreak,
    totalXp: summary.totalXp,
    courseProgress: metrics.courseProgress,
    totalMinutes: summary.totalMinutes,
  }
}
