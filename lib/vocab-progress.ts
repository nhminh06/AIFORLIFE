/**
 * Tiến độ "đã thuộc" của từng bộ từ vựng, lưu ở localStorage.
 * Key gồm slug bộ từ + uid (hoặc "guest") nên không lẫn giữa các user / bộ từ.
 */

function storageKey(slug: string, uid?: string | null): string {
  return `afl:vocab-learned:${uid || "guest"}:${slug}`
}

function readKeys(slug: string, uid?: string | null): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = window.localStorage.getItem(storageKey(slug, uid))
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((v): v is string => typeof v === "string"))
  } catch {
    return new Set()
  }
}

function writeKeys(slug: string, uid: string | null | undefined, keys: Set<string>): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(storageKey(slug, uid), JSON.stringify([...keys]))
    window.dispatchEvent(new CustomEvent("afl-vocab-progress-updated", { detail: { slug, uid } }))
  } catch {
    // localStorage đầy hoặc bị chặn → bỏ qua, tiến độ chỉ giữ trong phiên này
  }
}

/** Tải tập hợp các từ đã thuộc (key = en.toLowerCase()) của 1 bộ từ. */
export function loadVocabProgress(slug: string, uid?: string | null): Set<string> {
  return readKeys(slug, uid)
}

/** Đánh dấu 1 từ là đã thuộc, trả về tập hợp mới sau khi lưu. */
export function markVocabLearned(
  slug: string,
  uid: string | null | undefined,
  wordKey: string
): Set<string> {
  const next = readKeys(slug, uid)
  next.add(wordKey.toLowerCase())
  writeKeys(slug, uid, next)
  return next
}

/** Bỏ đánh dấu đã thuộc (dùng khi muốn học lại), trả về tập hợp mới. */
export function unmarkVocabLearned(
  slug: string,
  uid: string | null | undefined,
  wordKey: string
): Set<string> {
  const next = readKeys(slug, uid)
  next.delete(wordKey.toLowerCase())
  writeKeys(slug, uid, next)
  return next
}
