const STORAGE_KEY = "afl-grammar-learned"

function read(uid?: string | null): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:${uid || "guest"}`)
    const values = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(values) ? values.filter((value): value is string => typeof value === "string") : [])
  } catch {
    return new Set()
  }
}

function write(uid: string | null | undefined, values: Set<string>) {
  if (typeof window === "undefined") return
  localStorage.setItem(`${STORAGE_KEY}:${uid || "guest"}`, JSON.stringify([...values]))
  window.dispatchEvent(new CustomEvent("afl-grammar-progress-updated"))
}

export function isGrammarLearned(slug: string, uid?: string | null) {
  return read(uid).has(slug)
}

export function setGrammarLearned(slug: string, uid: string | null | undefined, learned: boolean) {
  const values = read(uid)
  if (learned) values.add(slug)
  else values.delete(slug)
  write(uid, values)
  return learned
}

export function countGrammarLearned(slugs: string[], uid?: string | null) {
  const values = read(uid)
  return slugs.filter((slug) => values.has(slug)).length
}
