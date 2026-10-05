function extractComparingWords(query) {
  const clean = query
    .replace(/^(?:hãy\s+)?(?:phân\s*biệt|so\s*sánh|giúp\s*(?:tôi|em)\s*phân\s*biệt|sự\s*khác\s*nhau\s*giữa|khác\s*nhau\s*(?:như\s*thế\s*nào)?)\s*/i, "")
    .replace(/[?!.]+$/, "")
    .trim()

  const match3 = clean.match(/^([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s*(?:vs|\/|,|và|với|and)\s*([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s*(?:vs|\/|,|và|với|and)\s*([a-zA-Z]+(?:\s+[a-zA-Z]+)?)$/i)
  if (match3) {
    return { word1: match3[1].trim().toLowerCase(), word2: match3[2].trim().toLowerCase(), extraWord: match3[3].trim().toLowerCase() }
  }

  const match2 = clean.match(/^([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s*(?:vs|\/|,|và|với|and|hay|hoặc)\s*([a-zA-Z]+(?:\s+[a-zA-Z]+)?)$/i)
  if (match2) {
    return { word1: match2[1].trim().toLowerCase(), word2: match2[2].trim().toLowerCase() }
  }

  const matchGiua = clean.match(/giữa\s+([a-zA-Z]+)\s+(?:và|với)\s+([a-zA-Z]+)/i)
  if (matchGiua) {
    return { word1: matchGiua[1].trim().toLowerCase(), word2: matchGiua[2].trim().toLowerCase() }
  }

  return null
}

console.log("Test 1 ('hi và hello'):", extractComparingWords("hi và hello"))
console.log("Test 2 ('phân biệt hi và hello'):", extractComparingWords("phân biệt hi và hello"))
console.log("Test 3 ('make vs do'):", extractComparingWords("make vs do"))
console.log("Test 4 ('look / see / watch'):", extractComparingWords("look / see / watch"))
console.log("Test 5 ('sự khác nhau giữa house và home'):", extractComparingWords("sự khác nhau giữa house và home"))
