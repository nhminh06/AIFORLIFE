/**
 * Cổng ghi nhận hoạt động học tập — các trang học chỉ cần gọi những hàm ở đây,
 * không phải tự tính XP / counters / sự kiện.
 *
 * Mỗi hàm làm 3 việc (tuỳ trường hợp):
 *   1. Cộng bộ đếm ngày  → lib/progress/study-day-service
 *   2. Ghi sự kiện       → lib/progress/study-event-service
 *   3. Lưu kết quả riêng → practice-results-service
 * Tất cả đều tự chọn cloud (đã đăng nhập) hay localStorage (khách).
 */

import { xpRules } from "@/lib/progress/progress-config"
import { addStudyCounters } from "@/lib/progress/study-day-service"
import { recordStudyEvent } from "@/lib/progress/study-event-service"
import { savePracticeResult, type PracticeCompletionInput } from "@/lib/progress/practice-results-service"

/* ------------------------------------------------------------------ */
/*  Từ vựng                                                            */
/* ------------------------------------------------------------------ */

/**
 * Người học vừa đánh dấu / bỏ đánh dấu 1 từ là "đã thuộc".
 * Bỏ đánh dấu sẽ trừ lại đúng số đã cộng để số liệu trong ngày luôn khớp.
 */
export async function logVocabLearnedChange(
  uid: string | null | undefined,
  input: { slug: string; title: string; on: boolean }
): Promise<void> {
  const delta = input.on ? 1 : -1
  await addStudyCounters(uid, {
    wordsLearned: delta,
    xp: delta * xpRules.vocabWord,
    xpParts: { vocab: delta * xpRules.vocabWord },
  })
  if (input.on) {
    await recordStudyEvent(uid, {
      type: "vocab",
      refId: input.slug,
      title: input.title,
      count: 1,
      xp: xpRules.vocabWord,
    })
  }
}

/** Bộ từ vừa được học hết (100%). */
export async function logVocabSetCompleted(
  uid: string | null | undefined,
  input: { slug: string; title: string }
): Promise<void> {
  await recordStudyEvent(uid, {
    type: "vocab_set_done",
    refId: input.slug,
    title: input.title,
    count: 1,
    xp: 0,
  })
}

/* ------------------------------------------------------------------ */
/*  Mẫu câu                                                            */
/* ------------------------------------------------------------------ */

/** Người học vừa đánh dấu / bỏ đánh dấu 1 mẫu câu là "đã học". */
export async function logPhraseLearnedChange(
  uid: string | null | undefined,
  input: { slug: string; title: string; on: boolean }
): Promise<void> {
  const delta = input.on ? 1 : -1
  await addStudyCounters(uid, {
    phrasesLearned: delta,
    xp: delta * xpRules.phrase,
    xpParts: { phrase: delta * xpRules.phrase },
  })
  if (input.on) {
    await recordStudyEvent(uid, {
      type: "phrase",
      refId: input.slug,
      title: input.title,
      count: 1,
      xp: xpRules.phrase,
    })
  }
}

/** Bộ mẫu câu vừa được học hết (100%). */
export async function logPhraseSetCompleted(
  uid: string | null | undefined,
  input: { slug: string; title: string }
): Promise<void> {
  await recordStudyEvent(uid, {
    type: "phrase_set_done",
    refId: input.slug,
    title: input.title,
    count: 1,
    xp: 0,
  })
}

/* ------------------------------------------------------------------ */
/*  Ngữ pháp                                                           */
/* ------------------------------------------------------------------ */

/** Người học vừa hoàn thành / bỏ hoàn thành 1 chủ điểm ngữ pháp. */
export async function logGrammarLearnedChange(
  uid: string | null | undefined,
  input: { slug: string; title: string; on: boolean }
): Promise<void> {
  const delta = input.on ? 1 : -1
  await addStudyCounters(uid, {
    grammarCompleted: delta,
    xp: delta * xpRules.grammarTopic,
    xpParts: { grammar: delta * xpRules.grammarTopic },
  })
  if (input.on) {
    await recordStudyEvent(uid, {
      type: "grammar",
      refId: input.slug,
      title: input.title,
      count: 1,
      xp: xpRules.grammarTopic,
      detail: "Trắc nghiệm · Ngữ pháp",
    })
  }
}

/* ------------------------------------------------------------------ */
/*  Luyện tập                                                          */
/* ------------------------------------------------------------------ */

/** Người học vừa nộp 1 bài luyện tập. */
export async function recordPracticeCompletion(
  uid: string | null | undefined,
  input: PracticeCompletionInput
): Promise<void> {
  const correct = Math.max(0, Math.min(input.score, input.total))
  const xp = correct * xpRules.practiceCorrect
  await savePracticeResult(uid, input)
  await addStudyCounters(uid, {
    exercisesCompleted: 1,
    xp,
    xpParts: { practice: xp },
  })
  await recordStudyEvent(uid, {
    type: "practice",
    refId: input.exerciseId,
    title: input.name,
    count: 1,
    xp,
    score: input.score,
    total: input.total,
    detail: input.kindLabel,
  })
}

/* ------------------------------------------------------------------ */
/*  Ôn tập                                                             */
/* ------------------------------------------------------------------ */

/** Người học vừa ôn tập xong 1 lượt (trang Ôn tập từ đã thuộc). */
export async function recordReviewRound(
  uid: string | null | undefined,
  input: { slug: string; count?: number }
): Promise<void> {
  await addStudyCounters(uid, { reviews: 1 })
  if (input.count && input.count > 0) {
    await recordStudyEvent(uid, {
      type: "vocab",
      refId: `review-${input.slug}`,
      title: "Ôn tập từ vựng",
      count: input.count,
      xp: 0,
    })
  }
}
