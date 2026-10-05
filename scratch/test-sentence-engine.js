// Test negative and question sentence parsing
const IRREGULAR_VERBS = {
  eat: { v1: "eat", v2: "ate", v3: "eaten" },
  ate: { v1: "eat", v2: "ate", v3: "eaten" },
  eaten: { v1: "eat", v2: "ate", v3: "eaten" },
  go: { v1: "go", v2: "went", v3: "gone" },
  went: { v1: "go", v2: "went", v3: "gone" },
  gone: { v1: "go", v2: "went", v3: "gone" },
  see: { v1: "see", v2: "saw", v3: "seen" },
  saw: { v1: "see", v2: "saw", v3: "seen" },
  seen: { v1: "see", v2: "saw", v3: "seen" },
  write: { v1: "write", v2: "wrote", v3: "written" },
  wrote: { v1: "write", v2: "wrote", v3: "written" },
  written: { v1: "write", v2: "wrote", v3: "written" },
  do: { v1: "do", v2: "did", v3: "done" },
  did: { v1: "do", v2: "did", v3: "done" },
  done: { v1: "do", v2: "did", v3: "done" },
  take: { v1: "take", v2: "took", v3: "taken" },
  took: { v1: "take", v2: "took", v3: "taken" },
  taken: { v1: "take", v2: "took", v3: "taken" },
  give: { v1: "give", v2: "gave", v3: "given" },
  gave: { v1: "give", v2: "gave", v3: "given" },
  given: { v1: "give", v2: "gave", v3: "given" },
  buy: { v1: "buy", v2: "bought", v3: "bought" },
  bought: { v1: "buy", v2: "bought", v3: "bought" },
  sing: { v1: "sing", v2: "sang", v3: "sung" },
  sang: { v1: "sing", v2: "sang", v3: "sung" },
  sung: { v1: "sing", v2: "sang", v3: "sung" },
  come: { v1: "come", v2: "came", v3: "come" },
  came: { v1: "come", v2: "came", v3: "come" },
  meet: { v1: "meet", v2: "met", v3: "met" },
  met: { v1: "meet", v2: "met", v3: "met" },
  have: { v1: "have", v2: "had", v3: "had" },
  has: { v1: "have", v2: "had", v3: "had" },
  had: { v1: "have", v2: "had", v3: "had" },
  make: { v1: "make", v2: "made", v3: "made" },
  made: { v1: "make", v2: "made", v3: "made" },
  live: { v1: "live", v2: "lived", v3: "lived" },
  lived: { v1: "live", v2: "lived", v3: "lived" },
  work: { v1: "work", v2: "worked", v3: "worked" },
  worked: { v1: "work", v2: "worked", v3: "worked" },
  read: { v1: "read", v2: "read", v3: "read" },
  play: { v1: "play", v2: "played", v3: "played" },
  played: { v1: "play", v2: "played", v3: "played" },
  study: { v1: "study", v2: "studied", v3: "studied" },
  studied: { v1: "study", v2: "studied", v3: "studied" },
  learn: { v1: "learn", v2: "learned", v3: "learned" },
  learned: { v1: "learn", v2: "learned", v3: "learned" },
  love: { v1: "love", v2: "loved", v3: "loved" },
  loved: { v1: "love", v2: "loved", v3: "loved" },
  like: { v1: "like", v2: "liked", v3: "liked" },
  liked: { v1: "like", v2: "liked", v3: "liked" },
}

function getBaseVerb(v) {
  const lower = v.toLowerCase()
  const ir = IRREGULAR_VERBS[lower]
  if (ir) return ir.v1
  if (lower.endsWith("ies")) return lower.slice(0, -3) + "y"
  if (/(?:ch|sh|ss|x|zz)es$/i.test(lower)) return lower.slice(0, -2)
  if (lower.endsWith("oes")) return lower.slice(0, -2)
  if (lower.endsWith("s") && !lower.endsWith("ss")) return lower.slice(0, -1)
  if (lower.endsWith("ed")) {
    if (lower.endsWith("ied")) return lower.slice(0, -3) + "y"
    return lower.endsWith("eed") ? lower.slice(0, -1) : lower.replace(/ed$/, "")
  }
  if (lower.endsWith("ing")) return lower.replace(/ing$/, "")
  return lower
}

function parseEnglishSentence(sentence) {
  const clean = sentence.replace(/[.!?]+$/, "").trim()
  const words = clean.split(/\s+/)
  const isQuestion = sentence.trim().endsWith("?") || /^(do|does|did|is|am|are|was|were|can|could|will|would|have|has|what|where|when|why|how)\b/i.test(words[0])
  const isNegative = /\b(not|n't|never|hardly)\b/i.test(clean)

  let subject = words[0]
  let verbIndex = 1

  if (/^(my|the|a|an|his|her|their|our|this|that|these|those)\b/i.test(words[0]) && words.length > 2) {
    subject = words[0] + " " + words[1]
    verbIndex = 2
  }

  const subjLower = subject.toLowerCase()
  const is3rdSingular = /^(he|she|it|my\s+[a-z]+|the\s+[a-z]+|[A-Z][a-z]+)$/i.test(subject) && !/^(they|we|you|i|my\s+friends|the\s+students|the\s+people)$/i.test(subject)
  const isI = subjLower === "i"

  const remaining = words.slice(verbIndex)
  const firstWord = (remaining[0] || "").toLowerCase()
  const secondWord = (remaining[1] || "").toLowerCase()

  let tense = "present-simple"
  let tenseNameVi = "Hiện tại đơn (Present Simple)"
  let mainVerb = remaining[0] || "is"
  let baseVerb = getBaseVerb(mainVerb)
  let complement = remaining.slice(1).join(" ")

  // Negative aux: doesn't / don't / didn't
  if (/^(doesn't|doesnt|don't|dont)$/i.test(firstWord) && remaining.length > 1) {
    tense = "present-simple"
    tenseNameVi = "Hiện tại đơn (Present Simple)"
    mainVerb = remaining[0] + " " + remaining[1]
    baseVerb = getBaseVerb(remaining[1])
    complement = remaining.slice(2).join(" ")
  } else if (/^(didn't|didnt)$/i.test(firstWord) && remaining.length > 1) {
    tense = "past-simple"
    tenseNameVi = "Quá khứ đơn (Past Simple)"
    mainVerb = remaining[0] + " " + remaining[1]
    baseVerb = getBaseVerb(remaining[1])
    complement = remaining.slice(2).join(" ")
  } else if (/^(am|is|are)$/i.test(firstWord) && remaining.length > 1 && remaining[1].toLowerCase().endsWith("ing")) {
    tense = "present-continuous"
    tenseNameVi = "Hiện tại tiếp diễn (Present Continuous)"
    mainVerb = remaining[0] + " " + remaining[1]
    baseVerb = getBaseVerb(remaining[1])
    complement = remaining.slice(2).join(" ")
  } else if (/^(was|were)$/i.test(firstWord) && remaining.length > 1 && remaining[1].toLowerCase().endsWith("ing")) {
    tense = "past-continuous"
    tenseNameVi = "Quá khứ tiếp diễn (Past Continuous)"
    mainVerb = remaining[0] + " " + remaining[1]
    baseVerb = getBaseVerb(remaining[1])
    complement = remaining.slice(2).join(" ")
  } else if (/^(have|has)$/i.test(firstWord) && remaining.length > 1 && (remaining[1].toLowerCase().endsWith("ed") || IRREGULAR_VERBS[remaining[1].toLowerCase()])) {
    tense = "present-perfect"
    tenseNameVi = "Hiện tại hoàn thành (Present Perfect)"
    mainVerb = remaining[0] + " " + remaining[1]
    baseVerb = getBaseVerb(remaining[1])
    complement = remaining.slice(2).join(" ")
  } else if (/^(will|can|could|should|would|must|may|might)$/i.test(firstWord) && remaining.length > 1) {
    tense = firstWord === "will" ? "future-simple" : "modal-verbs"
    tenseNameVi = firstWord === "will" ? "Tương lai đơn (Future Simple)" : "Động từ khuyết thiếu (Modal Verbs)"
    mainVerb = remaining[0] + " " + remaining[1]
    baseVerb = getBaseVerb(remaining[1])
    complement = remaining.slice(2).join(" ")
  } else if (/^(was|were)$/i.test(firstWord)) {
    tense = "past-simple"
    tenseNameVi = "Quá khứ đơn (Past Simple - To Be)"
    mainVerb = remaining[0]
    baseVerb = "be"
    complement = remaining.slice(1).join(" ")
  } else if (/^(am|is|are)$/i.test(firstWord)) {
    tense = "present-simple"
    tenseNameVi = "Hiện tại đơn (Present Simple - To Be)"
    mainVerb = remaining[0]
    baseVerb = "be"
    complement = remaining.slice(1).join(" ")
  } else if (firstWord.endsWith("ed") || (IRREGULAR_VERBS[firstWord] && IRREGULAR_VERBS[firstWord].v2 === firstWord && IRREGULAR_VERBS[firstWord].v1 !== firstWord)) {
    tense = "past-simple"
    tenseNameVi = "Quá khứ đơn (Past Simple)"
    mainVerb = remaining[0]
    baseVerb = getBaseVerb(remaining[0])
    complement = remaining.slice(1).join(" ")
  }

  return {
    cleanSentence: clean,
    subject,
    is3rdSingular,
    isI,
    tense,
    tenseNameVi,
    mainVerb,
    baseVerb,
    complement,
    isNegative,
    isQuestion,
  }
}

const n1 = parseEnglishSentence("She doesn't like milk")
console.log("Negative test:", n1)
