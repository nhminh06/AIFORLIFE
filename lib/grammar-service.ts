import { collection, getDocs } from "firebase/firestore"

import { db } from "@/lib/firebase"
import { GrammarGroup, grammarTopics, type GrammarLevel, type GrammarTopic } from "@/lib/data/grammar"

/* ------------------------------------------------------------------ */
/*  Chủ điểm ngữ pháp hệ thống                                         */
/*  Collection: grammarTopics/{slug} — seed bằng scripts/push-grammar… */
/*  Lỗi mạng/quyền → fallback về dữ liệu tĩnh trong lib/data/grammar.  */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToGrammarTopic(data: Record<string, any>): GrammarTopic {
  return {
    slug: data.slug ?? "",
    name: data.name ?? "",
    vi: data.vi ?? "",
    desc: data.desc ?? "",
    level: data.level ?? "Cơ bản",
    progress: data.progress ?? 0,
    accent: data.accent ?? "bg-purple-600",
    intro: data.intro ?? "",
    usage: (Array.isArray(data.usage) ? data.usage : []) as string[],
    formulas: (Array.isArray(data.formulas) ? data.formulas : []) as GrammarTopic["formulas"],
    examples: (Array.isArray(data.examples) ? data.examples : []) as GrammarTopic["examples"],
    practiceId: data.practiceId ?? "",
    group: isGrammarGroup(data.group) ? data.group : inferDefaultGroup(data.slug),
  }
}

function isGrammarGroup(value: unknown): value is GrammarGroup {
  return value === "tense" || value === "other"
}

/** Dựa vào slug để ước đoán nhóm nếu document Firestore chưa có group */
function inferDefaultGroup(slug: string): GrammarGroup {
  const tenseKeywords = ["simple", "continuous", "perfect"]
  return tenseKeywords.some((kw) => slug.toLowerCase().includes(kw)) ? "tense" : "other"
}

function isValidTopic(topic: GrammarTopic): boolean {
  return Boolean(
    topic.slug && topic.name && topic.intro && Array.isArray(topic.formulas)
  )
}

function isGrammarLevel(value: unknown): value is GrammarLevel {
  return value === "Cơ bản" || value === "Trung cấp" || value === "Nâng cao"
}

/** Lấy toàn bộ chủ điểm ngữ pháp hệ thống (Firestore trước, fallback static). */
export async function getAllGrammarTopics(): Promise<GrammarTopic[]> {
  try {
    const snapshot = await getDocs(collection(db, "grammarTopics"))
    const topics = snapshot.docs
      .map((d) => docToGrammarTopic(d.data()))
      .filter(isValidTopic)
      .map((t) => ({
        ...t,
        level: isGrammarLevel(t.level) ? t.level : "Cơ bản",
      }))
    return topics.length > 0 ? topics : grammarTopics
  } catch (err) {
    console.error("[grammar-service] Lỗi khi tải chủ điểm ngữ pháp:", err)
    return grammarTopics
  }
}
