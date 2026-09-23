/**
 * Cấu hình XP, giới hạn phiên học và ngưỡng huy hiệu cho trang Tiến độ.
 * Sửa tại đây để áp dụng cho TOÀN BỘ app (cả phần ghi nhận lẫn hiển thị),
 * tránh mỗi nơi tính một kiểu.
 */

/** Điểm XP cho từng hành động học tập */
export const xpRules = {
  /** mỗi từ vựng MỚI được đánh dấu "đã thuộc" */
  vocabWord: 5,
  /** mỗi mẫu câu MỚI được đánh dấu "đã học" */
  phrase: 5,
  /** mỗi chủ điểm ngữ pháp hoàn thành */
  grammarTopic: 40,
  /** mỗi câu trả lời đúng trong bài luyện tập */
  practiceCorrect: 10,
  /** XP theo thời gian học: mỗi 10 phút được bấy nhiêu XP */
  timePerTenMinutes: 15,
  /** trần XP cộng theo thời gian trong 1 ngày */
  maxTimeXpPerDay: 90,
} as const

/** Giới hạn 1 phiên học để không đếm nhầm khi tab bị treo */
export const maxSessionMinutes = 90

/** Nhịp heartbeat (giây): mỗi nhịp cộng dồn thời gian đang học */
export const trackerHeartbeatSeconds = 15

/** Nhịp đẩy dữ liệu lên cloud (giây) */
export const trackerFlushSeconds = 60

/** Số ngày tối đa ghi vào studyDays (dọn dữ liệu cũ nếu cần) */
export const maxStoredDays = 730

/** Ngưỡng mở khoá huy hiệu */
export const badgeThresholds = {
  /** First Steps — học từ đầu tiên */
  firstWord: 1,
  /** 100 Words */
  words100: 100,
  /** 1000 Words */
  words1000: 1000,
  /** 7-Day Streak */
  streakWeek: 7,
  /** 30-Day Streak */
  streakMonth: 30,
  /** Confident Speaker — số câu mẫu đã học */
  phrasesToSpeak: 10,
} as const
