import { grammarTopics } from "./data/grammar"
import { phraseSets } from "./data/phrases"
import { exercises, getPracticeType } from "./data/practice"
import { getVocabTopic, vocabSets } from "./data/vocabulary"

export type SearchKind = "vocab" | "word" | "phrase" | "grammar" | "practice"

export type SearchItem = {
  id: string
  kind: SearchKind
  title: string
  sub: string
  href: string
}

export type SearchGroup = {
  kind: SearchKind
  label: string
  items: SearchItem[]
}

const GROUP_LABEL: Record<SearchKind, string> = {
  vocab: "Bộ từ vựng",
  word: "Từ vựng",
  phrase: "Mẫu câu",
  grammar: "Ngữ pháp",
  practice: "Bài luyện tập",
}

/** Bỏ dấu để tìm "ngu phap" vẫn ra "Ngữ pháp". */
function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
}

function buildIndex(): SearchItem[] {
  const items: SearchItem[] = []

  for (const s of vocabSets) {
    const topic = getVocabTopic(s.topicId)
    items.push({
      id: `vocab-${s.slug}`,
      kind: "vocab",
      title: `${s.name} — ${s.vi}`,
      sub: `Bộ từ vựng · ${topic.label} · ${s.total} từ`,
      href: `/tu-vung/${s.slug}`,
    })
    for (const w of s.words) {
      items.push({
        id: `word-${s.slug}-${w.en}`,
        kind: "word",
        title: w.en,
        sub: `${w.vi} · ${w.ipa} · trong bộ ${s.name}`,
        href: `/tu-vung/${s.slug}`,
      })
    }
  }

  for (const s of phraseSets) {
    items.push({
      id: `phrase-${s.slug}`,
      kind: "phrase",
      title: `${s.name} — ${s.vi}`,
      sub: `Bộ mẫu câu · ${s.total} câu`,
      href: `/mau-cau/${s.slug}`,
    })
    for (const p of s.items) {
      items.push({
        id: `phrase-item-${s.slug}-${p.en.slice(0, 24)}`,
        kind: "phrase",
        title: p.en,
        sub: `${p.vi} · trong bộ ${s.name}`,
        href: `/mau-cau/${s.slug}`,
      })
    }
  }

  for (const t of grammarTopics) {
    items.push({
      id: `grammar-${t.slug}`,
      kind: "grammar",
      title: `${t.name} — ${t.vi}`,
      sub: `Ngữ pháp · ${t.level}`,
      href: `/ngu-phap/${t.slug}`,
    })
  }

  for (const e of exercises) {
    const type = getPracticeType(e.typeId)
    items.push({
      id: `practice-${e.id}`,
      kind: "practice",
      title: `${e.name} — ${e.vi}`,
      sub: `Bài tập · ${type.label} · ${e.items.length} câu`,
      href: `/luyen-tap/${e.id}`,
    })
  }

  return items
}

const INDEX = buildIndex()

export function searchAll(query: string, perGroup = 5): SearchGroup[] {
  const q = norm(query.trim())
  if (!q) return []
  const words = q.split(/\s+/).filter(Boolean)

  const matched = INDEX.filter((item) => {
    const hay = norm(`${item.title} ${item.sub}`)
    return words.every((w) => hay.includes(w))
  })

  const order: SearchKind[] = ["vocab", "word", "phrase", "grammar", "practice"]
  return order
    .map((kind) => ({
      kind,
      label: GROUP_LABEL[kind],
      items: matched.filter((m) => m.kind === kind).slice(0, perGroup),
    }))
    .filter((g) => g.items.length > 0)
}

/** Gợi ý khi chưa gõ gì. */
export function popularSearches(): SearchItem[] {
  return [
    {
      id: "pop-1",
      kind: "grammar",
      title: "Present Simple — Thì hiện tại đơn",
      sub: "Ngữ pháp · Cơ bản",
      href: "/ngu-phap/present-simple",
    },
    {
      id: "pop-2",
      kind: "vocab",
      title: "Daily Life — Cuộc sống hằng ngày",
      sub: "Bộ từ vựng · Đời sống",
      href: "/tu-vung/daily-life",
    },
    {
      id: "pop-3",
      kind: "phrase",
      title: "Greetings & Introductions — Chào hỏi",
      sub: "Bộ mẫu câu · 60 câu",
      href: "/mau-cau/greetings-introductions",
    },
    {
      id: "pop-4",
      kind: "practice",
      title: "Present Simple Basics — trắc nghiệm",
      sub: "Bài tập · 8 câu",
      href: "/luyen-tap/present-simple-quiz",
    },
  ]
}
