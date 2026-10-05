import { processLocalDynamicQuery } from "../lib/ai/local-dynamic-tutor"

console.log("=== TEST 1: User types 'She lives in Hanoi' + category 'examples' ===")
const t1 = processLocalDynamicQuery("She lives in Hanoi", [], "examples")
console.log(t1.reply.slice(0, 400))
console.log("...\n")

console.log("=== TEST 2: User types 'mạo từ' + category 'examples' ===")
const t2 = processLocalDynamicQuery("mạo từ", [], "examples")
console.log(t2.reply.slice(0, 400))
console.log("...\n")
