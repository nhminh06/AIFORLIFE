import { processLocalDynamicQuery, parseEnglishSentence, generateSentenceForms, generateSentenceQuizQuestions, generateSentenceSimilarExamples } from "@/lib/ai/local-dynamic-tutor"

console.log("==================================================================")
console.log("TEST 1: CÂU CỦA USER VỚI CATEGORY 'grammar_lookup'")
console.log("==================================================================")
const userSentence = "I have been studying English every day for the past three months, and I can already see a big improvement."
const res1 = processLocalDynamicQuery(userSentence, [], "grammar_lookup")
console.log(res1.reply)
console.log("\nModel used:", res1.model)
console.log("Execution time:", res1.executionTimeMs, "ms")

console.log("\n==================================================================")
console.log("TEST 2: CÂU CỦA USER VỚI CATEGORY 'examples'")
console.log("==================================================================")
const res2 = processLocalDynamicQuery(userSentence, [], "examples")
console.log(res2.reply)

console.log("\n==================================================================")
console.log("TEST 3: CÂU CỦA USER VỚI CATEGORY 'quiz'")
console.log("==================================================================")
const res3 = processLocalDynamicQuery(userSentence, [], "quiz")
console.log(res3.reply)

console.log("\n==================================================================")
console.log("TEST 4: AUTO INTENT ROUTING (Không chọn nhãn, để AI tự nhận diện)")
console.log("==================================================================")
const autoQueries = [
  "Tra cứu 12 thì",
  "Thì hiện tại hoàn thành tiếp diễn",
  "Phân biệt affect và effect",
  "She don't like apple",
  "Cho tôi bài tập trắc nghiệm",
]

for (const q of autoQueries) {
  const r = processLocalDynamicQuery(q, [], "auto")
  console.log(`\nQuery: "${q}"`)
  console.log(`Model: ${r.model} (${r.executionTimeMs}ms)`)
  console.log(`Output Preview:\n${r.reply.split("\n").slice(0, 4).join("\n")}`)
}
