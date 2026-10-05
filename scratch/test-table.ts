import { processLocalDynamicQuery } from "../lib/ai/local-dynamic-tutor"

const userSentence = "I have been studying English every day for the past three months, and I can already see a big improvement."
const res = processLocalDynamicQuery(userSentence, [], "grammar_lookup")
console.log(res.reply)
