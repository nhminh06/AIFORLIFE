/**
 * Kiểu dữ liệu dùng chung cho hệ thống tiến độ học tập (trang /tien-do).
 */

/** Một ngày học — nguồn cho biểu đồ ngày/tuần, XP và streak */
export type StudyDay = {
  /** ngày dạng YYYY-MM-DD theo giờ địa phương */
  date: string
  /** tổng số giây học trong ngày (nguồn chuẩn của thời gian học) */
  seconds: number
  /** số phút học (làm tròn từ seconds, tiện hiển thị) */
  minutes: number
  /** số từ vựng mới đánh dấu "đã thuộc" trong ngày */
  wordsLearned: number
  /** số mẫu câu mới đánh dấu "đã học" trong ngày */
  phrasesLearned: number
  /** số chủ điểm ngữ pháp hoàn thành trong ngày */
  grammarCompleted: number
  /** số bài luyện tập hoàn thành trong ngày */
  exercisesCompleted: number
  /** số lượt ôn tập từ vựng trong ngày */
  reviews: number
  /** tổng XP kiếm được trong ngày */
  xp: number
  /** XP tách theo nguồn (không bắt buộc) */
  xpBreakdown?: Partial<Record<StudyXpSource, number>>
}

export type StudyXpSource = "vocab" | "phrase" | "grammar" | "practice" | "time"

/** Loại sự kiện hiển thị ở "Lịch sử hoạt động" */
export type StudyEventType =
  | "vocab"
  | "vocab_set_done"
  | "phrase"
  | "phrase_set_done"
  | "grammar"
  | "practice"
  | "badge"

/** Một dòng trong lịch sử hoạt động (đã gộp theo ngày + đối tượng) */
export type StudyEvent = {
  id: string
  type: StudyEventType
  /** slug/id của bộ từ, bộ mẫu câu, chủ điểm, bài luyện… */
  refId: string
  /** tiêu đề hiển thị (snapshot lúc ghi để không phải join khi đọc) */
  title: string
  /** ngày dạng YYYY-MM-DD */
  date: string
  /** thời điểm ghi nhận (ms) — dùng để sắp xếp */
  at: number
  /** số lần lặp lại (gộp sự kiện): số từ mới, số lần làm bài… */
  count: number
  /** XP cộng cho sự kiện này */
  xp: number
  /** dùng cho bài luyện tập */
  score?: number
  total?: number
  /** mô tả phụ do nơi ghi truyền vào (VD "Nghe – chọn đáp án") */
  detail?: string
}

/** Tổng hợp nhanh về hành trình học (doc users/{uid}/stats/summary) */
export type ProgressSummary = {
  totalXp: number
  currentStreak: number
  longestStreak: number
  /** ngày học gần nhất YYYY-MM-DD ("" nếu chưa học bao giờ) */
  lastStudyDate: string
  /** số ngày có hoạt động học */
  activeDays: number
  totalMinutes: number
  wordsLearnedTotal: number
}

/** Số liệu dùng để xét huy hiệu (tính ở progress-service) */
export type BadgeMetrics = {
  wordsLearnedTotal: number
  phrasesLearnedTotal: number
  grammarLearned: number
  grammarTotal: number
  perfectScores: number
  exercisesCompleted: number
  currentStreak: number
  longestStreak: number
  activeDays: number
}
