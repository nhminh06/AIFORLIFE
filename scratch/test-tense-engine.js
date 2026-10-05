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
  say: { v1: "say", v2: "said", v3: "said" },
  said: { v1: "say", v2: "said", v3: "said" },
  tell: { v1: "tell", v2: "told", v3: "told" },
  told: { v1: "tell", v2: "told", v3: "told" },
  read: { v1: "read", v2: "read", v3: "read" },
  run: { v1: "run", v2: "ran", v3: "run" },
  ran: { v1: "run", v2: "ran", v3: "run" },
  drink: { v1: "drink", v2: "drank", v3: "drunk" },
  drank: { v1: "drink", v2: "drank", v3: "drunk" },
  drunk: { v1: "drink", v2: "drank", v3: "drunk" },
  drive: { v1: "drive", v2: "drove", v3: "driven" },
  drove: { v1: "drive", v2: "drove", v3: "driven" },
  driven: { v1: "drive", v2: "drove", v3: "driven" },
  speak: { v1: "speak", v2: "spoke", v3: "spoken" },
  spoke: { v1: "speak", v2: "spoke", v3: "spoken" },
  spoken: { v1: "speak", v2: "spoke", v3: "spoken" },
  teach: { v1: "teach", v2: "taught", v3: "taught" },
  taught: { v1: "teach", v2: "taught", v3: "taught" },
  think: { v1: "think", v2: "thought", v3: "thought" },
  thought: { v1: "think", v2: "thought", v3: "thought" },
  find: { v1: "find", v2: "found", v3: "found" },
  found: { v1: "find", v2: "found", v3: "found" },
  leave: { v1: "leave", v2: "left", v3: "left" },
  left: { v1: "leave", v2: "left", v3: "left" },
  feel: { v1: "feel", v2: "felt", v3: "felt" },
  felt: { v1: "feel", v2: "felt", v3: "felt" },
  hear: { v1: "hear", v2: "heard", v3: "heard" },
  heard: { v1: "hear", v2: "heard", v3: "heard" },
  bring: { v1: "bring", v2: "brought", v3: "brought" },
  brought: { v1: "bring", v2: "brought", v3: "brought" },
  begin: { v1: "begin", v2: "began", v3: "begun" },
  began: { v1: "begin", v2: "began", v3: "begun" },
  begun: { v1: "begin", v2: "began", v3: "begun" },
  keep: { v1: "keep", v2: "kept", v3: "kept" },
  kept: { v1: "keep", v2: "kept", v3: "kept" },
  know: { v1: "know", v2: "knew", v3: "known" },
  knew: { v1: "know", v2: "knew", v3: "known" },
  known: { v1: "know", v2: "knew", v3: "known" },
  sleep: { v1: "sleep", v2: "slept", v3: "slept" },
  slept: { v1: "sleep", v2: "slept", v3: "slept" },
  wear: { v1: "wear", v2: "wore", v3: "worn" },
  wore: { v1: "wear", v2: "wore", v3: "worn" },
  worn: { v1: "wear", v2: "wore", v3: "worn" },
  win: { v1: "win", v2: "won", v3: "won" },
  won: { v1: "win", v2: "won", v3: "won" },
  be: { v1: "be", v2: "was", v3: "been" },
  was: { v1: "be", v2: "was", v3: "been" },
  were: { v1: "be", v2: "were", v3: "been" },
  been: { v1: "be", v2: "was", v3: "been" },
  become: { v1: "become", v2: "became", v3: "become" },
  became: { v1: "become", v2: "became", v3: "become" },
  build: { v1: "build", v2: "built", v3: "built" },
  built: { v1: "build", v2: "built", v3: "built" },
  spend: { v1: "spend", v2: "spent", v3: "spent" },
  spent: { v1: "spend", v2: "spent", v3: "spent" },
  send: { v1: "send", v2: "sent", v3: "sent" },
  sent: { v1: "send", v2: "sent", v3: "sent" },
  lose: { v1: "lose", v2: "lost", v3: "lost" },
  lost: { v1: "lose", v2: "lost", v3: "lost" },
  break: { v1: "break", v2: "broke", v3: "broken" },
  broke: { v1: "break", v2: "broke", v3: "broken" },
  broken: { v1: "break", v2: "broke", v3: "broken" },
  choose: { v1: "choose", v2: "chose", v3: "chosen" },
  chose: { v1: "choose", v2: "chose", v3: "chosen" },
  chosen: { v1: "choose", v2: "chose", v3: "chosen" },
  grow: { v1: "grow", v2: "grew", v3: "grown" },
  grew: { v1: "grow", v2: "grew", v3: "grown" },
  grown: { v1: "grow", v2: "grew", v3: "grown" },
  fly: { v1: "fly", v2: "flew", v3: "flown" },
  flew: { v1: "fly", v2: "flew", v3: "flown" },
  flown: { v1: "fly", v2: "flew", v3: "flown" },
  fall: { v1: "fall", v2: "fell", v3: "fallen" },
  fell: { v1: "fall", v2: "fell", v3: "fallen" },
  fallen: { v1: "fall", v2: "fell", v3: "fallen" },
  stand: { v1: "stand", v2: "stood", v3: "stood" },
  stood: { v1: "stand", v2: "stood", v3: "stood" },
  understand: { v1: "understand", v2: "understood", v3: "understood" },
  understood: { v1: "understand", v2: "understood", v3: "understood" },
  sit: { v1: "sit", v2: "sat", v3: "sat" },
  sat: { v1: "sit", v2: "sat", v3: "sat" },
  pay: { v1: "pay", v2: "paid", v3: "paid" },
  paid: { v1: "pay", v2: "paid", v3: "paid" },
};

function getBaseVerb(v) {
  const lower = v.toLowerCase().trim();
  const ir = IRREGULAR_VERBS[lower];
  if (ir) return ir.v1;

  if (lower.endsWith("ies")) return lower.slice(0, -3) + "y";
  if (/(?:ch|sh|ss|x|zz)es$/i.test(lower)) return lower.slice(0, -2);
  if (lower.endsWith("oes")) return lower.slice(0, -2);
  if (lower.endsWith("s") && !lower.endsWith("ss")) return lower.slice(0, -1);
  if (lower.endsWith("ed")) {
    if (lower.endsWith("ied")) return lower.slice(0, -3) + "y";
    if (lower.endsWith("eed")) return lower.slice(0, -1);
    if (/(?:liv|lik|lov|hop|mak|tak|clos|danc|smil|chang)ed$/i.test(lower)) {
      return lower.slice(0, -1);
    }
    return lower.replace(/ed$/, "");
  }
  if (lower.endsWith("ing")) {
    if (lower === "being") return "be";
    if (/^(?:dying|lying|tying)$/i.test(lower)) return lower.replace(/ying$/, "ie");
    if (/(?:mak|tak|liv|writ|hop|danc|smil|com|driv|rid|hid|shak|bak)ing$/i.test(lower)) {
      return lower.slice(0, -3) + "e";
    }
    // double consonant e.g. swimming, running
    const stem = lower.slice(0, -3);
    if (stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2] && !["ss", "ll", "ee"].includes(stem.slice(-2))) {
      return stem.slice(0, -1);
    }
    return lower.replace(/ing$/, "");
  }
  return lower;
}

function getV2(base) {
  const lower = base.toLowerCase();
  if (lower === "be") return "was/were";
  const ir = IRREGULAR_VERBS[lower];
  if (ir) return ir.v2;
  if (lower.endsWith("e")) return lower + "d";
  if (lower.endsWith("y") && !/[aeiou]y$/i.test(lower)) return lower.slice(0, -1) + "ied";
  return lower + "ed";
}

function getV3(base) {
  const lower = base.toLowerCase();
  if (lower === "be") return "been";
  const ir = IRREGULAR_VERBS[lower];
  if (ir) return ir.v3;
  if (lower.endsWith("e")) return lower + "d";
  if (lower.endsWith("y") && !/[aeiou]y$/i.test(lower)) return lower.slice(0, -1) + "ied";
  return lower + "ed";
}

function getVing(base) {
  const lower = base.toLowerCase();
  if (lower === "be") return "being";
  if (lower.endsWith("ie")) return lower.slice(0, -2) + "ying";
  if (lower.endsWith("e") && !lower.endsWith("ee")) return lower.slice(0, -1) + "ing";
  return lower + "ing";
}

function getVs(base) {
  const lower = base.toLowerCase();
  if (lower === "be") return "is";
  if (lower === "have") return "has";
  if (lower.endsWith("y") && !/[aeiou]y$/i.test(lower)) return lower.slice(0, -1) + "ies";
  if (/(?:ch|sh|ss|x|z|o)$/i.test(lower)) return lower + "es";
  return lower + "s";
}

function isV3OrEd(word) {
  const lower = word.toLowerCase();
  if (lower.endsWith("ed")) return true;
  const ir = IRREGULAR_VERBS[lower];
  return Boolean(ir && (ir.v3 === lower || ir.v2 === lower));
}

function parseEnglishSentence(sentence) {
  const clean = sentence.replace(/[.!?]+$/, "").trim();

  // 1. Phân tách mệnh đề phụ / liên từ đẳng lập (Coordinate clauses)
  let mainClause = clean;
  let tailClause = "";

  const conjMatch = clean.match(/^(.*?)(,\s+(?:and|but|so|yet|or|because|although|though)\s+.*)$/i);
  if (conjMatch) {
    mainClause = conjMatch[1];
    tailClause = conjMatch[2];
  }

  // 2. Tách từ trong mệnh đề chính
  let words = mainClause.split(/\s+/).filter(Boolean);

  // Mở rộng các đại từ viết tắt phổ biến
  if (words.length > 0) {
    const first = words[0];
    const firstLower = first.toLowerCase();
    if (firstLower === "i've" || firstLower === "you've" || firstLower === "we've" || firstLower === "they've") {
      words = [first.slice(0, -3), "have", ...words.slice(1)];
    } else if (firstLower === "i'm") {
      words = ["I", "am", ...words.slice(1)];
    } else if (firstLower === "you're" || firstLower === "we're" || firstLower === "they're") {
      words = [first.slice(0, -3), "are", ...words.slice(1)];
    } else if (firstLower === "he's" || firstLower === "she's" || firstLower === "it's") {
      const nextWord = (words[1] || "").toLowerCase();
      const isHas = nextWord === "been" || isV3OrEd(nextWord);
      words = [first.slice(0, -2), isHas ? "has" : "is", ...words.slice(1)];
    } else if (firstLower === "i'd" || firstLower === "he'd" || firstLower === "she'd" || firstLower === "we'd" || firstLower === "they'd") {
      const nextWord = (words[1] || "").toLowerCase();
      const isHad = nextWord === "been" || isV3OrEd(nextWord);
      words = [first.slice(0, -2), isHad ? "had" : "would", ...words.slice(1)];
    } else if (firstLower.endsWith("'ll")) {
      words = [first.slice(0, -3), "will", ...words.slice(1)];
    }
  }

  // 3. Xác định Chủ ngữ (Subject)
  let subject = words[0] || "Someone";
  let verbIndex = 1;

  if (/^(my|the|a|an|his|her|their|our|this|that|these|those|some|many|all|every)\b/i.test(words[0]) && words.length > 2) {
    if (words.length > 3 && /^(older|younger|big|small|best|good|new|old|little)\b/i.test(words[1])) {
      subject = words[0] + " " + words[1] + " " + words[2];
      verbIndex = 3;
    } else {
      subject = words[0] + " " + words[1];
      verbIndex = 2;
    }
  }

  const subjLower = subject.toLowerCase();
  const isI = subjLower === "i";
  const isPlural = /^(they|we|you|my\s+friends|the\s+students|the\s+people|people|both|all)$/i.test(subjLower);
  const is3rdSingular =
    !isI &&
    !isPlural &&
    /^(he|she|it|my\s+[a-z]+|the\s+[a-z]+|[A-Z][a-z]+|this\s+[a-z]+|that\s+[a-z]+|someone|everyone|nobody)$/i.test(subjLower);

  const subjectType = isI
    ? "Đại từ nhân xưng ngôi thứ nhất (I)"
    : is3rdSingular
    ? `Ngôi thứ ba số ít (${subject})`
    : `Chủ ngữ số nhiều / Ngôi thứ hai (${subject})`;

  const remaining = words.slice(verbIndex);
  let w0 = (remaining[0] || "").toLowerCase();
  let w1 = (remaining[1] || "").toLowerCase();
  let w2 = (remaining[2] || "").toLowerCase();
  let w3 = (remaining[3] || "").toLowerCase();

  let tense = "present-simple";
  let tenseNameEn = "Present Simple";
  let tenseNameVi = "Hiện tại đơn";
  let formula = is3rdSingular ? "S + V(s/es) + (O/Adv)" : "S + V(bare) + (O/Adv)";
  let mainVerb = remaining[0] || "is";
  let baseVerb = getBaseVerb(mainVerb);
  let consumedWords = 1;

  // Bỏ qua trạng từ xen giữa nếu có (already, just, never, ever, currently, still)
  let midAdverb = "";
  const commonMidAdverbs = /^(already|just|never|ever|always|currently|still|definitely|really|also|recently)$/i;

  // --- CASE 1: WILL (Future Tenses) ---
  if (/^(will|won't|'ll)$/i.test(w0)) {
    let nextIdx = 1;
    if (w1 === "not") nextIdx++;
    let tw = (remaining[nextIdx] || "").toLowerCase();
    let tw1 = (remaining[nextIdx + 1] || "").toLowerCase();
    let tw2 = (remaining[nextIdx + 2] || "").toLowerCase();

    if (tw === "have" && tw1 === "been" && tw2.endsWith("ing")) {
      tense = "future-perfect-continuous";
      tenseNameEn = "Future Perfect Continuous";
      tenseNameVi = "Tương lai hoàn thành tiếp diễn";
      formula = "S + will have been + V-ing + (O/Adv)";
      mainVerb = "will have been " + tw2;
      baseVerb = getBaseVerb(tw2);
      consumedWords = nextIdx + 3;
    } else if (tw === "have" && isV3OrEd(tw1)) {
      tense = "future-perfect";
      tenseNameEn = "Future Perfect";
      tenseNameVi = "Tương lai hoàn thành";
      formula = "S + will have + V3/ed + (O/Adv)";
      mainVerb = "will have " + tw1;
      baseVerb = getBaseVerb(tw1);
      consumedWords = nextIdx + 2;
    } else if (tw === "be" && tw1.endsWith("ing")) {
      tense = "future-continuous";
      tenseNameEn = "Future Continuous";
      tenseNameVi = "Tương lai tiếp diễn";
      formula = "S + will be + V-ing + (O/Adv)";
      mainVerb = "will be " + tw1;
      baseVerb = getBaseVerb(tw1);
      consumedWords = nextIdx + 2;
    } else {
      tense = "future-simple";
      tenseNameEn = "Future Simple";
      tenseNameVi = "Tương lai đơn";
      formula = "S + will + V(bare) + (O/Adv)";
      const bare = tw || "do";
      mainVerb = "will " + bare;
      baseVerb = getBaseVerb(bare);
      consumedWords = nextIdx + 1;
    }
  }
  // --- CASE 2: HAVE / HAS (Present Perfect & Present Perfect Continuous) ---
  else if (/^(have|has|haven't|hasn't)$/i.test(w0)) {
    let nextIdx = 1;
    if (w1 === "not") nextIdx++;
    if (commonMidAdverbs.test(remaining[nextIdx] || "")) {
      midAdverb = remaining[nextIdx];
      nextIdx++;
    }
    let tw = (remaining[nextIdx] || "").toLowerCase();
    let tw1 = (remaining[nextIdx + 1] || "").toLowerCase();

    if (tw === "been" && tw1.endsWith("ing")) {
      tense = "present-perfect-continuous";
      tenseNameEn = "Present Perfect Continuous";
      tenseNameVi = "Hiện tại hoàn thành tiếp diễn";
      formula = "S + have/has been + V-ing + (O/Adv)";
      mainVerb = w0 + " been " + tw1;
      baseVerb = getBaseVerb(tw1);
      consumedWords = nextIdx + 2;
    } else if (tw === "been") {
      tense = "present-perfect";
      tenseNameEn = "Present Perfect (To Be)";
      tenseNameVi = "Hiện tại hoàn thành (Động từ To Be)";
      formula = "S + have/has + been + Adj/Noun/Prep";
      mainVerb = w0 + " been";
      baseVerb = "be";
      consumedWords = nextIdx + 1;
    } else if (isV3OrEd(tw)) {
      tense = "present-perfect";
      tenseNameEn = "Present Perfect";
      tenseNameVi = "Hiện tại hoàn thành";
      formula = "S + have/has + V3/ed + (O/Adv)";
      mainVerb = w0 + (midAdverb ? " " + midAdverb : "") + " " + tw;
      baseVerb = getBaseVerb(tw);
      consumedWords = nextIdx + 1;
    } else {
      // Lexical have/has
      tense = "present-simple";
      tenseNameEn = "Present Simple";
      tenseNameVi = "Hiện tại đơn";
      formula = is3rdSingular ? "S + has + (O/Adv)" : "S + have + (O/Adv)";
      mainVerb = w0;
      baseVerb = "have";
      consumedWords = 1;
    }
  }
  // --- CASE 3: HAD (Past Perfect & Past Perfect Continuous) ---
  else if (/^(had|hadn't)$/i.test(w0)) {
    let nextIdx = 1;
    if (w1 === "not") nextIdx++;
    if (commonMidAdverbs.test(remaining[nextIdx] || "")) {
      midAdverb = remaining[nextIdx];
      nextIdx++;
    }
    let tw = (remaining[nextIdx] || "").toLowerCase();
    let tw1 = (remaining[nextIdx + 1] || "").toLowerCase();

    if (tw === "been" && tw1.endsWith("ing")) {
      tense = "past-perfect-continuous";
      tenseNameEn = "Past Perfect Continuous";
      tenseNameVi = "Quá khứ hoàn thành tiếp diễn";
      formula = "S + had been + V-ing + (O/Adv)";
      mainVerb = "had been " + tw1;
      baseVerb = getBaseVerb(tw1);
      consumedWords = nextIdx + 2;
    } else if (tw === "been") {
      tense = "past-perfect";
      tenseNameEn = "Past Perfect (To Be)";
      tenseNameVi = "Quá khứ hoàn thành (Động từ To Be)";
      formula = "S + had + been + Adj/Noun/Prep";
      mainVerb = "had been";
      baseVerb = "be";
      consumedWords = nextIdx + 1;
    } else if (isV3OrEd(tw)) {
      tense = "past-perfect";
      tenseNameEn = "Past Perfect";
      tenseNameVi = "Quá khứ hoàn thành";
      formula = "S + had + V3/ed + (O/Adv)";
      mainVerb = "had " + tw;
      baseVerb = getBaseVerb(tw);
      consumedWords = nextIdx + 1;
    } else {
      tense = "past-simple";
      tenseNameEn = "Past Simple";
      tenseNameVi = "Quá khứ đơn";
      formula = "S + V2/ed + (O/Adv)";
      mainVerb = "had";
      baseVerb = "have";
      consumedWords = 1;
    }
  }
  // --- CASE 4: AM / IS / ARE (Present Continuous / Near Future / Present Simple Be) ---
  else if (/^(am|is|are|isn't|aren't)$/i.test(w0)) {
    let nextIdx = 1;
    if (w1 === "not") nextIdx++;
    let tw = (remaining[nextIdx] || "").toLowerCase();
    let tw1 = (remaining[nextIdx + 1] || "").toLowerCase();
    let tw2 = (remaining[nextIdx + 2] || "").toLowerCase();

    if (tw === "going" && tw1 === "to" && tw2) {
      tense = "near-future";
      tenseNameEn = "Near Future (Be going to)";
      tenseNameVi = "Tương lai gần (Be going to)";
      formula = "S + am/is/are + going to + V(bare) + (O/Adv)";
      mainVerb = w0 + " going to " + tw2;
      baseVerb = getBaseVerb(tw2);
      consumedWords = nextIdx + 3;
    } else if (tw.endsWith("ing")) {
      tense = "present-continuous";
      tenseNameEn = "Present Continuous";
      tenseNameVi = "Hiện tại tiếp diễn";
      formula = "S + am/is/are + V-ing + (O/Adv)";
      mainVerb = w0 + " " + tw;
      baseVerb = getBaseVerb(tw);
      consumedWords = nextIdx + 1;
    } else {
      tense = "present-simple";
      tenseNameEn = "Present Simple (To Be)";
      tenseNameVi = "Hiện tại đơn (Động từ To Be)";
      formula = "S + am/is/are + Adj/Noun/Prep";
      mainVerb = w0;
      baseVerb = "be";
      consumedWords = nextIdx;
    }
  }
  // --- CASE 5: WAS / WERE (Past Continuous / Past Simple Be) ---
  else if (/^(was|were|wasn't|weren't)$/i.test(w0)) {
    let nextIdx = 1;
    if (w1 === "not") nextIdx++;
    let tw = (remaining[nextIdx] || "").toLowerCase();

    if (tw.endsWith("ing")) {
      tense = "past-continuous";
      tenseNameEn = "Past Continuous";
      tenseNameVi = "Quá khứ tiếp diễn";
      formula = "S + was/were + V-ing + (O/Adv)";
      mainVerb = w0 + " " + tw;
      baseVerb = getBaseVerb(tw);
      consumedWords = nextIdx + 1;
    } else {
      tense = "past-simple";
      tenseNameEn = "Past Simple (To Be)";
      tenseNameVi = "Quá khứ đơn (Động từ To Be)";
      formula = "S + was/were + Adj/Noun/Prep";
      mainVerb = w0;
      baseVerb = "be";
      consumedWords = nextIdx;
    }
  }
  // --- CASE 6: MODAL VERBS ---
  else if (/^(can|could|should|would|must|may|might)$/i.test(w0)) {
    let nextIdx = 1;
    if (w1 === "not") nextIdx++;
    let tw = remaining[nextIdx] || "do";
    tense = "modal-verbs";
    tenseNameEn = "Modal Verbs";
    tenseNameVi = "Động từ khuyết thiếu";
    formula = `S + ${w0} + V(bare) + (O/Adv)`;
    mainVerb = w0 + " " + tw;
    baseVerb = getBaseVerb(tw);
    consumedWords = nextIdx + 1;
  }
  // --- CASE 7: DIDN'T (Past Simple Negative) ---
  else if (/^(didn't|didnt)$/i.test(w0)) {
    tense = "past-simple";
    tenseNameEn = "Past Simple (Negative)";
    tenseNameVi = "Quá khứ đơn (Thể phủ định)";
    formula = "S + did not + V(bare) + (O/Adv)";
    mainVerb = w0 + " " + (remaining[1] || "do");
    baseVerb = getBaseVerb(remaining[1] || "do");
    consumedWords = 2;
  }
  // --- CASE 8: DON'T / DOESN'T (Present Simple Negative) ---
  else if (/^(don't|dont|doesn't|doesnt)$/i.test(w0)) {
    tense = "present-simple";
    tenseNameEn = "Present Simple (Negative)";
    tenseNameVi = "Hiện tại đơn (Thể phủ định)";
    formula = "S + do/does not + V(bare) + (O/Adv)";
    mainVerb = w0 + " " + (remaining[1] || "do");
    baseVerb = getBaseVerb(remaining[1] || "do");
    consumedWords = 2;
  }
  // --- CASE 9: PAST SIMPLE REGULAR / IRREGULAR ---
  else if (
    w0.endsWith("ed") ||
    (IRREGULAR_VERBS[w0] && IRREGULAR_VERBS[w0].v2 === w0 && IRREGULAR_VERBS[w0].v1 !== w0)
  ) {
    tense = "past-simple";
    tenseNameEn = "Past Simple";
    tenseNameVi = "Quá khứ đơn";
    formula = "S + V2/ed + (O/Adv)";
    mainVerb = remaining[0];
    baseVerb = getBaseVerb(w0);
    consumedWords = 1;
  }
  // --- CASE 10: PRESENT SIMPLE REGULAR ---
  else {
    tense = "present-simple";
    tenseNameEn = "Present Simple";
    tenseNameVi = "Hiện tại đơn";
    formula = is3rdSingular ? "S + V(s/es) + (O/Adv)" : "S + V(bare) + (O/Adv)";
    mainVerb = remaining[0] || "do";
    baseVerb = getBaseVerb(mainVerb);
    consumedWords = 1;
  }

  // Complement: các từ còn lại trong mệnh đề chính + mệnh đề đuôi nếu có
  const mainClauseRest = remaining.slice(consumedWords).join(" ");
  const complement = (mainClauseRest ? mainClauseRest + (tailClause || "") : (tailClause ? tailClause.trim().replace(/^,\s*/, "") : "")).trim();

  return {
    cleanSentence: clean,
    subject,
    subjectType,
    is3rdSingular,
    isI,
    isPlural,
    tense,
    tenseNameEn,
    tenseNameVi,
    formula,
    mainVerb,
    baseVerb,
    complement,
  };
}

function generateSentenceForms(parsed) {
  const { subject, is3rdSingular, isI, baseVerb, complement, tense } = parsed;
  const comp = complement ? " " + complement : "";

  let affirmative = "";
  let negative = "";
  let interrogative = "";
  let shortAnswer = "";

  const ving = getVing(baseVerb);
  const v3 = getV3(baseVerb);
  const v2 = getV2(baseVerb);
  const vs = is3rdSingular ? getVs(baseVerb) : baseVerb;

  if (tense === "present-perfect-continuous") {
    const aux = is3rdSingular ? "has" : "have";
    const auxNeg = is3rdSingular ? "has not (hasn't)" : "have not (haven't)";
    affirmative = `${subject} ${aux} been ${ving}${comp}.`;
    negative = `${subject} ${auxNeg} been ${ving}${comp}.`;
    interrogative = `${aux.charAt(0).toUpperCase() + aux.slice(1)} ${subject} been ${ving}${comp}?`;
    shortAnswer = `Yes, ${subject} ${aux}. / No, ${subject} ${is3rdSingular ? "hasn't" : "haven't"}.`;
  } else if (tense === "past-perfect-continuous") {
    affirmative = `${subject} had been ${ving}${comp}.`;
    negative = `${subject} had not (hadn't) been ${ving}${comp}.`;
    interrogative = `Had ${subject} been ${ving}${comp}?`;
    shortAnswer = `Yes, ${subject} had. / No, ${subject} hadn't.`;
  } else if (tense === "future-perfect-continuous") {
    affirmative = `${subject} will have been ${ving}${comp}.`;
    negative = `${subject} will not (won't) have been ${ving}${comp}.`;
    interrogative = `Will ${subject} have been ${ving}${comp}?`;
    shortAnswer = `Yes, ${subject} will. / No, ${subject} won't.`;
  } else if (tense === "future-perfect") {
    affirmative = `${subject} will have ${v3}${comp}.`;
    negative = `${subject} will not (won't) have ${v3}${comp}.`;
    interrogative = `Will ${subject} have ${v3}${comp}?`;
    shortAnswer = `Yes, ${subject} will. / No, ${subject} won't.`;
  } else if (tense === "future-continuous") {
    affirmative = `${subject} will be ${ving}${comp}.`;
    negative = `${subject} will not (won't) be ${ving}${comp}.`;
    interrogative = `Will ${subject} be ${ving}${comp}?`;
    shortAnswer = `Yes, ${subject} will. / No, ${subject} won't.`;
  } else if (tense === "future-simple") {
    affirmative = `${subject} will ${baseVerb}${comp}.`;
    negative = `${subject} will not (won't) ${baseVerb}${comp}.`;
    interrogative = `Will ${subject} ${baseVerb}${comp}?`;
    shortAnswer = `Yes, ${subject} will. / No, ${subject} won't.`;
  } else if (tense === "past-perfect") {
    affirmative = `${subject} had ${v3}${comp}.`;
    negative = `${subject} had not (hadn't) ${v3}${comp}.`;
    interrogative = `Had ${subject} ${v3}${comp}?`;
    shortAnswer = `Yes, ${subject} had. / No, ${subject} hadn't.`;
  } else if (tense === "past-continuous") {
    const beWord = isI || is3rdSingular ? "was" : "were";
    const beNeg = isI || is3rdSingular ? "was not (wasn't)" : "were not (weren't)";
    affirmative = `${subject} ${beWord} ${ving}${comp}.`;
    negative = `${subject} ${beNeg} ${ving}${comp}.`;
    interrogative = `${beWord.charAt(0).toUpperCase() + beWord.slice(1)} ${subject} ${ving}${comp}?`;
    shortAnswer = `Yes, ${subject} ${beWord}. / No, ${subject} ${beNeg.split(" ")[1].slice(1, -1)}.`;
  } else if (tense === "present-continuous") {
    const beWord = isI ? "am" : is3rdSingular ? "is" : "are";
    const beNeg = isI ? "am not" : is3rdSingular ? "is not (isn't)" : "are not (aren't)";
    affirmative = `${subject} ${beWord} ${ving}${comp}.`;
    negative = `${subject} ${beNeg} ${ving}${comp}.`;
    interrogative = `${beWord.charAt(0).toUpperCase() + beWord.slice(1)} ${subject} ${ving}${comp}?`;
    shortAnswer = `Yes, ${subject} ${beWord}. / No, ${subject} ${beNeg.includes("(") ? beNeg.split(" ")[1].slice(1, -1) : beNeg}.`;
  } else if (tense === "present-perfect") {
    const aux = is3rdSingular ? "has" : "have";
    const auxNeg = is3rdSingular ? "has not (hasn't)" : "have not (haven't)";
    affirmative = `${subject} ${aux} ${v3}${comp}.`;
    negative = `${subject} ${auxNeg} ${v3}${comp}.`;
    interrogative = `${aux.charAt(0).toUpperCase() + aux.slice(1)} ${subject} ${v3}${comp}?`;
    shortAnswer = `Yes, ${subject} ${aux}. / No, ${subject} ${auxNeg.split(" ")[1].slice(1, -1)}.`;
  } else if (tense === "past-simple") {
    if (baseVerb === "be") {
      const beWord = isI || is3rdSingular ? "was" : "were";
      const beNeg = isI || is3rdSingular ? "was not (wasn't)" : "were not (weren't)";
      affirmative = `${subject} ${beWord}${comp}.`;
      negative = `${subject} ${beNeg}${comp}.`;
      interrogative = `${beWord.charAt(0).toUpperCase() + beWord.slice(1)} ${subject}${comp}?`;
      shortAnswer = `Yes, ${subject} ${beWord}. / No, ${subject} ${beNeg.split(" ")[1].slice(1, -1)}.`;
    } else {
      affirmative = `${subject} ${v2}${comp}.`;
      negative = `${subject} did not (didn't) ${baseVerb}${comp}.`;
      interrogative = `Did ${subject} ${baseVerb}${comp}?`;
      shortAnswer = `Yes, ${subject} did. / No, ${subject} didn't.`;
    }
  } else {
    // Present Simple
    if (baseVerb === "be") {
      const beWord = isI ? "am" : is3rdSingular ? "is" : "are";
      const beNeg = isI ? "am not" : is3rdSingular ? "is not (isn't)" : "are not (aren't)";
      affirmative = `${subject} ${beWord}${comp}.`;
      negative = `${subject} ${beNeg}${comp}.`;
      interrogative = `${beWord.charAt(0).toUpperCase() + beWord.slice(1)} ${subject}${comp}?`;
      shortAnswer = `Yes, ${subject} ${beWord}. / No, ${subject} ${beNeg.includes("(") ? beNeg.split(" ")[1].slice(1, -1) : beNeg}.`;
    } else {
      const auxNeg = is3rdSingular ? "does not (doesn't)" : "do not (don't)";
      const auxQ = is3rdSingular ? "Does" : "Do";
      affirmative = `${subject} ${vs}${comp}.`;
      negative = `${subject} ${auxNeg} ${baseVerb}${comp}.`;
      interrogative = `${auxQ} ${subject} ${baseVerb}${comp}?`;
      shortAnswer = is3rdSingular
        ? `Yes, ${subject} does. / No, ${subject} doesn't.`
        : `Yes, ${subject} do. / No, ${subject} don't.`;
    }
  }

  return { affirmative, negative, interrogative, shortAnswer };
}

// TEST CÂU CỦA USER VÀ 12 THÌ TIẾNG ANH:
const testSentences = [
  "I have been studying English every day for the past three months, and I can already see a big improvement.",
  "She has been working at that hospital for five years.",
  "They had been waiting for two hours before the train arrived.",
  "I will have been working here for ten years by next month.",
  "She will have finished her report by 5 PM.",
  "They will be flying to Da Nang at this time tomorrow.",
  "We will visit our grandparents next weekend.",
  "He had already eaten dinner before we called him.",
  "I was reading a fascinating book when the lights went out.",
  "They have lived in London for ten years.",
  "She is listening to music in her bedroom.",
  "They went to the beach last summer.",
  "He speaks three languages fluently.",
  "She does not like spicy food.",
  "Did you see the latest movie last night?"
];

for (const s of testSentences) {
  const p = parseEnglishSentence(s);
  const f = generateSentenceForms(p);
  console.log(`\n------------------------------------------------------------`);
  console.log(`Input: "${s}"`);
  console.log(`➔ Tense: ${p.tenseNameVi} (${p.tenseNameEn})`);
  console.log(`➔ Main Verb: [${p.mainVerb}] (Base: ${p.baseVerb}) | Subject: [${p.subject}]`);
  console.log(`➔ (-) Negative: ${f.negative}`);
  console.log(`➔ (?) Question: ${f.interrogative}`);
  console.log(`➔ Short Answer: ${f.shortAnswer}`);
}

