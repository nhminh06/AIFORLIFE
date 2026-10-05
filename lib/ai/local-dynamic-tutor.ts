/**
 * Local Dynamic NLP, Machine Learning & JFLEG Knowledge Engine
 *
 * 100% NỘI BỘ TRÊN MÁY — TUYỆT ĐỐI KHÔNG GỌI BẤT KỲ API BÊN NGOÀI NÀO.
 * Không gọi OpenAI, không gọi Groq, không gọi OpenRouter.
 *
 * 1. Tri thức từ 1.501 câu JFLEG (Johns Hopkins University GEC Dataset):
 *    - Tự động đối chiếu câu của người học với kho 1.501 câu thực tế và gợi ý bản sửa của người bản ngữ.
 * 2. Nhận thức ngữ cảnh hội thoại đa lượt (Multi-turn Context Awareness):
 *    - Nhận biết các câu nối tiếp như "cho tôi ví dụ về thì này", "cho bài tập về thì này",
 *      "công thức là gì", "dấu hiệu nhận biết"... dựa vào tin nhắn liền trước.
 * 3. Phân tích cú pháp & ngữ pháp động (Dynamic Syntax & Error Detection Engine):
 *    - Tự động bóc tách thành phần câu (S-V Agreement, Tenses, Modals, Articles, Collocations, Word Order)
 *    - Tạo bảng phân tích chi tiết từng từ sai & nguyên nhân ngữ pháp
 *    - Tái tạo câu đúng chuẩn động theo thời gian thực
 * 4. Phân loại ý định thông minh bằng Machine Learning (TF-IDF + Logistic Regression):
 *    - Nạp trực tiếp trọng số từ ml_engine/chatbot_model.json
 * 5. Chấm điểm bài viết AES bằng Ridge Regression:
 *    - Huấn luyện trên 3.000 bài luận ASAP trong ml_engine/model_weights.json
 */

import { scoreEssayML, extractNLPFeatures } from "./local-scorer"
import { predictChatbotIntent } from "./local-chatbot-predictor"
import { grammarTopics, type GrammarTopic } from "@/lib/data/grammar"
import { findSimilarJflegSentence } from "./local-jfleg-retriever"

export type LocalDynamicResult = {
  reply: string
  model: string
  executionTimeMs: number
}

// Bảng động từ bất quy tắc phổ biến (V1, V2, V3)
const IRREGULAR_VERBS: Record<string, { v1: string; v2: string; v3: string }> = {
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
  catch: { v1: "catch", v2: "caught", v3: "caught" },
  caught: { v1: "catch", v2: "caught", v3: "caught" },
}

// Bảng tính từ + giới từ chuẩn (Collocations)
const ADJ_PREPOSITIONS: Record<string, { wrongPrep: string[]; correctPrep: string }> = {
  interested: { wrongPrep: ["on", "at", "about"], correctPrep: "in" },
  good: { wrongPrep: ["in"], correctPrep: "at" },
  bad: { wrongPrep: ["in"], correctPrep: "at" },
  proud: { wrongPrep: ["for", "about", "with"], correctPrep: "of" },
  famous: { wrongPrep: ["with", "about"], correctPrep: "for" },
  tired: { wrongPrep: ["with", "from"], correctPrep: "of" },
  afraid: { wrongPrep: ["with", "from", "about"], correctPrep: "of" },
  fond: { wrongPrep: ["with", "about"], correctPrep: "of" },
  keen: { wrongPrep: ["in", "at", "with"], correctPrep: "on" },
}

type DynamicError = {
  type: string
  badPart: string
  goodPart: string
  reason: string
}

/**
 * Kiểm tra xem chuỗi có phải tiếng Việt không
 */
export function isVietnameseText(text: string): boolean {
  if (/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(text)) {
    return true
  }
  const viWordPattern = /\b(xin|chào|chao|cho|tôi|toi|mình|minh|bạn|ban|về|ve|thì|thi|này|nay|đó|do|gì|gi|sao|thế|the|nào|nao|ví\s*dụ|vi\s*du|bài\s*tập|bai\s*tap|luyện|luyen|cách|cach|dùng|dung|phủ\s*định|phu\s*dinh|nghi\s*vấn|khẳng|câu|hoi|giải\s*thích|thêm|them|chưa|chua|hiểu|hieu|không|khong|có|va|hoặc|nhưng|nên|bởi|tại\s*sao|chấm|điểm|đoạn\s*văn|sửa|lỗi|giúp|alo|ch|ơi)\b/i
  return viWordPattern.test(text)
}

/**
 * Truy vết chủ đề ngữ pháp được nhắc đến gần nhất trong lịch sử hội thoại
 */
export function findRecentContextTopic(
  history?: { role: string; content: string }[]
): GrammarTopic | undefined {
  if (!history || history.length < 2) return undefined

  for (let i = history.length - 2; i >= 0; i--) {
    const msg = history[i]
    if (!msg || !msg.content) continue
    const text = msg.content.toLowerCase()

    for (const topic of grammarTopics) {
      if (
        text.includes(topic.name.toLowerCase()) ||
        text.includes(topic.vi.toLowerCase()) ||
        text.includes(topic.slug.replace(/-/g, " "))
      ) {
        return topic
      }
    }
  }
  return undefined
}

/**
 * Kho ví dụ và câu hỏi luyện tập phong phú cho từng chủ điểm ngữ pháp
 */
const TOPIC_EXTENDED_DATA: Record<
  string,
  {
    affirmative: { en: string; vi: string; note?: string }[]
    negative: { en: string; vi: string; note?: string }[]
    interrogative: { en: string; vi: string; note?: string }[]
    signals: string
    traps?: string
    quiz: { question: string; options: string[]; answer: string; explanation: string }[]
  }
> = {
  "present-continuous": {
    affirmative: [
      {
        en: "Right now, my brother **is preparing** dinner in the kitchen.",
        vi: "Ngay lúc này, anh trai tôi đang nấu bữa tối trong bếp.",
        note: "Hành động đang diễn ra ngay tại thời điểm nói.",
      },
      {
        en: "The company **is currently expanding** its operations into Southeast Asia.",
        vi: "Công ty hiện đang mở rộng hoạt động sang khu vực Đông Nam Á.",
        note: "Sự việc/xu hướng đang diễn ra ở thời kỳ hiện tại.",
      },
      {
        en: "We **are flying** to Da Nang tomorrow morning for our summer vacation.",
        vi: "Sáng mai chúng tôi sẽ bay đến Đà Nẵng để nghỉ hè.",
        note: "Kế hoạch chắc chắn đã được sắp xếp trong tương lai gần.",
      },
      {
        en: "She **is staying** with her grandparents this month while her apartment is painted.",
        vi: "Tháng này cô ấy đang ở cùng ông bà trong lúc căn hộ được sơn lại.",
        note: "Tình huống tạm thời (temporary situation).",
      },
    ],
    negative: [
      {
        en: "He **is not (isn't) listening** to the instructions at the moment.",
        vi: "Hiện tại cậu ấy không chú ý nghe hướng dẫn.",
      },
      {
        en: "They **aren't working** today because the office is closed for maintenance.",
        vi: "Hôm nay họ không làm việc vì văn phòng đóng cửa để bảo trì.",
      },
      {
        en: "I **am not using** my laptop right now, so you can borrow it.",
        vi: "Lúc này mình không dùng máy tính đâu, bạn có thể mượn nhé.",
      },
    ],
    interrogative: [
      {
        en: "**What are you doing** here all by yourself in the dark?",
        vi: "Cậu đang làm gì ở đây một mình trong bóng tối thế?",
      },
      {
        en: "**Is she still studying** for her IELTS exam tonight?",
        vi: "Tối nay cô ấy vẫn đang ôn thi IELTS à?",
        note: "Trả lời ngắn: Yes, she is. / No, she isn't.",
      },
      {
        en: "**Why are they arguing** with the store manager?",
        vi: "Tại sao họ lại đang tranh cãi với quản lý cửa hàng vậy?",
      },
    ],
    signals: "now, right now, at the moment, at present, currently, Look!, Listen!, Be quiet!",
    traps:
      "⚠️ **Lưu ý quan trọng:** Tuyệt đối không dùng thì tiếp diễn với các động từ chỉ trạng thái, nhận thức, tri giác hoặc sở hữu (**Stative Verbs**): *know, understand, believe, love, hate, like, want, need, belong to, remember, feel*. (Ví dụ: nói *'I understand the lesson'*, KHÔNG nói *'I am understanding the lesson'*).",
    quiz: [
      {
        question: "Look! That car (speed) _________ towards the intersection.",
        options: ["A. speeds", "B. is speeding", "C. are speeding", "D. was speeding"],
        answer: "B. is speeding",
        explanation: "Có dấu hiệu 'Look!' báo hiệu hành động đang diễn ra ngay trước mắt, chủ ngữ 'That car' số ít đi với 'is speeding'.",
      },
      {
        question: "I (not watch) _________ TV right now; you can turn it off.",
        options: ["A. don't watch", "B. am not watching", "C. isn't watching", "D. not watching"],
        answer: "B. am not watching",
        explanation: "Có 'right now', chủ ngữ 'I' đi với thể phủ định 'am not watching'.",
      },
      {
        question: "Why (you / wear) _________ a heavy winter coat today? It is so sunny!",
        options: ["A. do you wear", "B. are you wearing", "C. you are wearing", "D. have you worn"],
        answer: "B. are you wearing",
        explanation: "Hỏi về hành động bất thường đang diễn ra hôm nay, cấu trúc câu hỏi nghi vấn: 'Why are you wearing...?'",
      },
    ],
  },
  "present-simple": {
    affirmative: [
      {
        en: "My father **drinks** a warm cup of green tea every single morning.",
        vi: "Bố tôi uống một tách trà xanh ấm vào mỗi buổi sáng.",
        note: "Thói quen lặp đi lặp lại hàng ngày.",
      },
      {
        en: "Water **boils** at 100 degrees Celsius and **freezes** at 0 degrees.",
        vi: "Nước sôi ở 100 độ C và đóng băng ở 0 độ C.",
        note: "Sự thật hiển nhiên, quy luật khoa học tự nhiên.",
      },
      {
        en: "The high-speed train **leaves** the central station at 7:30 a.m. sharp.",
        vi: "Chuyến tàu cao tốc rời ga trung tâm lúc 7h30 sáng đúng.",
        note: "Lịch trình, thời gian biểu cố định.",
      },
    ],
    negative: [
      {
        en: "He **doesn't like** eating spicy food because it upsets his stomach.",
        vi: "Anh ấy không thích ăn đồ cay vì đau dạ dày.",
      },
      {
        en: "They **don't work** on weekends or national holidays.",
        vi: "Họ không làm việc vào các ngày cuối tuần hay ngày lễ quốc gia.",
      },
    ],
    interrogative: [
      {
        en: "**Do you speak** both English and Japanese fluently?",
        vi: "Bạn có nói trôi chảy cả tiếng Anh và tiếng Nhật không?",
      },
      {
        en: "**Where does your sister work** as a graphic designer?",
        vi: "Chị gái bạn làm thiết kế đồ họa ở đâu?",
      },
    ],
    signals: "always, usually, often, sometimes, rarely, never, every day/week/month, once/twice a week",
    traps:
      "⚠️ **Lưu ý:** Với chủ ngữ ngôi thứ 3 số ít (He/She/It), động từ phải thêm *-s* hoặc *-es* (thêm *-es* sau các động từ tận cùng bằng *o, s, ch, x, sh, z* như: *goes, watches, washes, fixes*).",
    quiz: [
      {
        question: "My brother usually (walk) _________ to school with his best friend.",
        options: ["A. walk", "B. walks", "C. is walking", "D. walking"],
        answer: "B. walks",
        explanation: "Chủ ngữ ngôi thứ 3 số ít 'My brother' + trạng từ tần suất 'usually' nên động từ thêm -s -> 'walks'.",
      },
      {
        question: "The flight to Singapore (depart) _________ at 9:00 p.m. tonight.",
        options: ["A. departs", "B. will depart", "C. is departing", "D. depart"],
        answer: "A. departs",
        explanation: "Lịch trình máy bay cố định dùng thì hiện tại đơn -> 'departs'.",
      },
    ],
  },
  "present-perfect": {
    affirmative: [
      {
        en: "I **have worked** at this software firm for more than four years.",
        vi: "Tôi đã làm việc ở công ty phần mềm này được hơn 4 năm.",
        note: "Bắt đầu trong quá khứ và vẫn tiếp diễn ở hiện tại.",
      },
      {
        en: "She **has already finished** her graduation thesis ahead of deadline.",
        vi: "Cô ấy đã hoàn thành khóa luận tốt nghiệp trước thời hạn rồi.",
        note: "Hành động vừa hoàn tất mang kết quả đến hiện tại.",
      },
      {
        en: "We **have visited** Da Lat three times and still want to return.",
        vi: "Chúng tôi đã đến Đà Lạt 3 lần rồi và vẫn muốn quay lại.",
        note: "Kinh nghiệm sống tính đến thời điểm nói.",
      },
    ],
    negative: [
      {
        en: "He **has not (hasn't) replied** to my urgent email yet.",
        vi: "Anh ấy vẫn chưa trả lời email khẩn cấp của tôi.",
      },
      {
        en: "We **haven't seen** each other since our high school graduation.",
        vi: "Chúng tôi chưa gặp lại nhau kể từ lễ tốt nghiệp cấp ba.",
      },
    ],
    interrogative: [
      {
        en: "**Have you ever tried** authentic Vietnamese egg coffee in Hanoi?",
        vi: "Bạn đã từng thử món cà phê trứng chuẩn vị ở Hà Nội chưa?",
      },
      {
        en: "**How long have you lived** in this peaceful neighborhood?",
        vi: "Bạn đã sống ở khu phố yên bình này được bao lâu rồi?",
      },
    ],
    signals: "already, yet, just, ever, never, recently, so far, since + mốc, for + khoảng",
    traps:
      "⚠️ **Lưu ý:** Tuyệt đối KHÔNG dùng thì hiện tại hoàn thành với mốc thời gian quá khứ xác định như *yesterday, 2 days ago, in 2020*. Khi có mốc quá khứ, bắt buộc dùng **Quá khứ đơn (Past Simple)**.",
    quiz: [
      {
        question: "I (know) _________ Sarah since we were primary school students.",
        options: ["A. know", "B. have known", "C. knew", "D. has known"],
        answer: "B. have known",
        explanation: "Có 'since + mệnh đề quá khứ', mệnh đề chính chia HTHT với chủ ngữ 'I' -> 'have known'.",
      },
    ],
  },
  "past-simple": {
    affirmative: [
      {
        en: "Yesterday, I **met** my former English teacher at the bookstore.",
        vi: "Hôm qua, tôi đã gặp lại thầy giáo tiếng Anh cũ ở hiệu sách.",
      },
      {
        en: "She **graduated** from university two years ago with honors.",
        vi: "Cô ấy đã tốt nghiệp đại học cách đây 2 năm với tấm bằng loại giỏi.",
      },
      {
        en: "They **traveled** to Europe in the summer of 2019.",
        vi: "Họ đã đi du lịch châu Âu vào mùa hè năm 2019.",
      },
    ],
    negative: [
      {
        en: "I **didn't receive** your phone call last night because my phone was off.",
        vi: "Tối qua tôi không nhận được cuộc gọi của bạn vì máy bị tắt nguồn.",
      },
      {
        en: "He **wasn't** present at the morning meeting yesterday.",
        vi: "Sáng qua anh ấy đã không có mặt ở buổi họp.",
      },
    ],
    interrogative: [
      {
        en: "**Did you watch** the football final match yesterday evening?",
        vi: "Tối qua bạn có xem trận chung kết bóng đá không?",
      },
      {
        en: "**Where did you go** on your last summer vacation?",
        vi: "Kỳ nghỉ hè năm ngoái bạn đã đi đâu?",
      },
    ],
    signals: "yesterday, ago, last night/week/month/year, in + năm quá khứ",
    traps: "⚠️ **Lưu ý:** Khi đã dùng trợ động từ *did / didn't*, động từ chính phải ở dạng nguyên mẫu không chia (Bare infinitive).",
    quiz: [
      {
        question: "Last week, she (buy) _________ a brand new laptop for her work.",
        options: ["A. buy", "B. bought", "C. has bought", "D. was buying"],
        answer: "B. bought",
        explanation: "Có mốc thời gian quá khứ 'Last week', động từ 'buy' chuyển sang dạng V2 bất quy tắc là 'bought'.",
      },
    ],
  },
  "past-continuous": {
    affirmative: [
      {
        en: "At 8:00 p.m. yesterday, we **were having** dinner with our grandparents.",
        vi: "Vào lúc 8 giờ tối hôm qua, chúng tôi đang ăn tối cùng ông bà.",
        note: "Hành động đang diễn ra tại một thời điểm xác định trong quá khứ.",
      },
      {
        en: "While my brother **was studying** in his room, I was playing guitar.",
        vi: "Trong khi anh trai tôi đang học bài trong phòng, tôi đang chơi đàn guitar.",
        note: "Hai hành động diễn ra song song cùng lúc trong quá khứ.",
      },
    ],
    negative: [
      {
        en: "He **wasn't paying** attention when the teacher asked the question.",
        vi: "Cậu ấy đã không chú ý khi giáo viên đặt câu hỏi.",
      },
    ],
    interrogative: [
      {
        en: "**What were you doing** when the storm hit the city?",
        vi: "Bạn đang làm gì lúc cơn bão ập vào thành phố?",
      },
    ],
    signals: "at this time yesterday, at + giờ + quá khứ, when, while, as",
    traps: "⚠️ **Lưu ý:** Hành động đang diễn ra dùng Quá khứ tiếp diễn (was/were + V-ing), hành động khác chen ngang vào dùng Quá khứ đơn (V2/ed).",
    quiz: [
      {
        question: "While Mary (read) _________ a book, the telephone suddenly rang.",
        options: ["A. read", "B. was reading", "C. is reading", "D. has read"],
        answer: "B. was reading",
        explanation: "Hành động đọc sách đang diễn ra trong quá khứ thì chuông điện thoại reo cắt ngang, chia Quá khứ tiếp diễn: 'was reading'.",
      },
    ],
  },
  "future-simple": {
    affirmative: [
      {
        en: "I promise I **will help** you finish your graduation project tomorrow.",
        vi: "Tôi hứa tôi sẽ giúp bạn hoàn thành đồ án tốt nghiệp vào ngày mai.",
        note: "Lời hứa hoặc quyết định đưa ra ngay tại thời điểm nói.",
      },
      {
        en: "Artificial Intelligence **will transform** education in the next decade.",
        vi: "Trí tuệ nhân tạo sẽ làm thay đổi nền giáo dục trong thập kỷ tới.",
        note: "Dự đoán trong tương lai không có bằng chứng trực tiếp.",
      },
    ],
    negative: [
      {
        en: "They **will not (won't) accept** applications submitted after 5:00 p.m.",
        vi: "Họ sẽ không nhận các hồ sơ nộp sau 5 giờ chiều.",
      },
    ],
    interrogative: [
      {
        en: "**Will you attend** the international tech conference next Monday?",
        vi: "Bạn sẽ tham dự hội nghị công nghệ quốc tế vào thứ Hai tới chứ?",
      },
    ],
    signals: "tomorrow, next week/month/year, soon, in + thời gian tương lai, probably, I think",
    traps: "⚠️ **Lưu ý:** Không dùng 'will' trong các mệnh đề trạng ngữ chỉ thời gian bắt đầu bằng *when, as soon as, until, before, after* (dùng thì Hiện tại đơn).",
    quiz: [
      {
        question: "I think people (travel) _________ to Mars in the near future.",
        options: ["A. travels", "B. will travel", "C. is travelling", "D. traveled"],
        answer: "B. will travel",
        explanation: "Có 'I think' và mốc tương lai 'in the near future', dùng thì Tương lai đơn: 'will travel'.",
      },
    ],
  },
  "conditionals": {
    affirmative: [
      {
        en: "If you **practice** speaking English every day, you **will become** fluent.",
        vi: "Nếu bạn luyện nói tiếng Anh mỗi ngày, bạn sẽ nói trôi chảy. (Loại 1 - Có thật ở hiện tại/tương lai)",
      },
      {
        en: "If I **had** more free time, I **would travel** around the world.",
        vi: "Nếu tôi có nhiều thời gian rảnh hơn, tôi sẽ đi du lịch vòng quanh thế giới. (Loại 2 - Giả định trái với hiện tại)",
      },
      {
        en: "If we **had taken** the map, we **would not have gotten** lost in the forest.",
        vi: "Nếu chúng ta mang theo bản đồ, chúng ta đã không bị lạc trong rừng. (Loại 3 - Trái với quá khứ)",
      },
    ],
    negative: [
      {
        en: "Unless you **submit** the essay today, you **won't receive** a score.",
        vi: "Trừ khi bạn nộp bài luận hôm nay, bạn sẽ không nhận được điểm. (Unless = If not)",
      },
    ],
    interrogative: [
      {
        en: "**What would you do** if you won the lottery tomorrow?",
        vi: "Bạn sẽ làm gì nếu trúng số vào ngày mai?",
      },
    ],
    signals: "if, unless, as long as, provided that, in case",
    traps: "⚠️ **Lưu ý:** Trong mệnh đề IF, tuyệt đối KHÔNG bao giờ dùng 'will' hoặc 'would' (Nói *If it rains*, KHÔNG nói *If it will rain*).",
    quiz: [
      {
        question: "If she (study) _________ harder, she would have passed the exam.",
        options: ["A. studies", "B. studied", "C. had studied", "D. would study"],
        answer: "C. had studied",
        explanation: "Vế chính có 'would have passed' (Điều kiện loại 3), mệnh đề IF chia Quá khứ hoàn thành: 'had studied'.",
      },
    ],
  },
  "passive-voice": {
    affirmative: [
      {
        en: "The historic building **was constructed** in 1890 by skilled craftsmen.",
        vi: "Tòa nhà lịch sử này đã được xây dựng vào năm 1890 bởi các thợ thủ công lành nghề.",
      },
      {
        en: "English **is spoken** by millions of people all over the world.",
        vi: "Tiếng Anh được nói bởi hàng triệu người trên toàn thế giới.",
      },
    ],
    negative: [
      {
        en: "The confidential files **have not been leaked** to the media.",
        vi: "Các tài liệu mật đã không bị rò rỉ ra ngoài truyền thông.",
      },
    ],
    interrogative: [
      {
        en: "**Will the new highway be opened** to traffic before the holiday?",
        vi: "Tuyến đường cao tốc mới có được thông xe trước kỳ nghỉ lễ không?",
      },
    ],
    signals: "by + tân ngữ, cấu trúc Be + V3/ed",
    traps: "⚠️ **Lưu ý:** Các nội động từ không có tân ngữ (*happen, arrive, occur, die, disappear*) KHÔNG thể chuyển sang câu bị động.",
    quiz: [
      {
        question: "The new bridge _________ by the president next week.",
        options: ["A. opens", "B. will be opened", "C. was opened", "D. has opened"],
        answer: "B. will be opened",
        explanation: "Chủ ngữ 'The new bridge' chịu tác động + có 'next week', chia bị động tương lai đơn: 'will be opened'.",
      },
    ],
  },
  "articles": {
    affirmative: [
      {
        en: "I bought **a** new laptop yesterday, and **the** laptop works very fast.",
        vi: "Hôm qua tôi mua một chiếc máy tính xách tay mới, và chiếc máy tính đó chạy rất nhanh.",
        note: "Dùng 'a' khi danh từ đếm được số ít nhắc lần đầu, dùng 'the' khi danh từ đã xác định ở câu sau.",
      },
      {
        en: "She wants to become **an** English teacher at **a** prestigious university.",
        vi: "Cô ấy muốn trở thành một giáo viên tiếng Anh tại một trường đại học danh tiếng.",
        note: "Dùng 'an' trước nguyên âm phát âm ('English'), dùng 'a' trước 'university' vì phát âm là /ˌjuːnɪ.../ (bắt đầu bằng bán nguyên âm /j/).",
      },
      {
        en: "**The** Earth orbits around **the** Sun.",
        vi: "Trái Đất quay xung quanh Mặt Trời.",
        note: "Dùng 'the' cho các vật thể độc nhất vô nhị trong vũ trụ/tự nhiên.",
      },
      {
        en: "He usually has **Ø** breakfast with his family before going to **Ø** work.",
        vi: "Anh ấy thường ăn sáng cùng gia đình trước khi đi làm.",
        note: "Không dùng mạo từ (Zero article - Ø) trước bữa ăn và cụm 'go to work'.",
      },
    ],
    negative: [
      {
        en: "He is **not an** honest person because he broke his promise.",
        vi: "Anh ấy không phải là một người trung thực vì đã thất hứa. (Lưu ý: 'honest' có âm /h/ câm nên đi với 'an').",
      },
      {
        en: "They do **not play Ø** basketball on rainy days.",
        vi: "Họ không chơi bóng rổ vào những ngày mưa. (Không dùng mạo từ trước môn thể thao).",
      },
    ],
    interrogative: [
      {
        en: "Is that **the** boy who won **the** first prize in **the** competition?",
        vi: "Đó có phải là cậu bé đã giành giải nhất trong cuộc thi không?",
        note: "Dùng 'the' vì có mệnh đề quan hệ xác định danh từ và trước số thứ tự 'the first'.",
      },
      {
        en: "Do you have **an** umbrella I can borrow for **an** hour?",
        vi: "Bạn có cây dù nào mình có thể mượn trong một tiếng không?",
        note: "'hour' có âm 'h' câm nên dùng 'an hour'.",
      },
    ],
    signals: "a (âm phụ âm), an (âm nguyên âm), the (vật duy nhất / xác định / so sánh nhất), Ø (số nhiều nói chung / môn thể thao / bữa ăn)",
    traps: "⚠️ **Lưu ý bẫy mạo từ:**\n- *'a university'* (phát âm bắt đầu bằng phụ âm /j/, KHÔNG dùng *an*).\n- *'an hour'*, *'an honest man'* (chữ 'h' câm, phát âm bắt đầu bằng nguyên âm nên dùng *an*).\n- Không dùng mạo từ trước tên riêng cá nhân, quốc gia đơn lẻ (*Vietnam, France*), trừ quốc gia liên bang/quần đảo (*the USA, the UK, the Philippines*).",
    quiz: [
      {
        question: "She spent _________ hour waiting for the doctor at _________ hospital.",
        options: ["A. a / a", "B. an / the", "C. the / an", "D. an / an"],
        answer: "B. an / the",
        explanation: "'hour' có chữ 'h' câm nên phát âm bắt đầu bằng nguyên âm -> dùng 'an hour'. Bệnh viện cụ thể đã xác định -> dùng 'the hospital'.",
      },
      {
        question: "My brother is studying at _________ university in _________ London.",
        options: ["A. a / Ø", "B. an / Ø", "C. a / the", "D. an / the"],
        answer: "A. a / Ø",
        explanation: "'university' phát âm là /ˌjuːnɪˈvɜːsəti/ (phụ âm /j/) nên dùng 'a university'. 'London' là tên thành phố nên dùng mạo từ rỗng (Ø).",
      },
      {
        question: "Who is _________ tallest student in your class?",
        options: ["A. a", "B. an", "C. the", "D. Ø"],
        answer: "C. the",
        explanation: "Trước tính từ so sánh nhất ('tallest') bắt buộc phải dùng mạo từ xác định 'the'.",
      },
    ],
  },
  "modal-verbs": {
    affirmative: [
      {
        en: "You **must wear** a helmet when riding a motorbike in Vietnam.",
        vi: "Bạn bắt buộc phải đội mũ bảo hiểm khi đi xe máy ở Việt Nam.",
        note: "'must' thể hiện nghĩa vụ/luật lệ bắt buộc mạnh mẽ.",
      },
      {
        en: "She **can speak** three foreign languages fluently.",
        vi: "Cô ấy có thể nói trôi chảy ba thứ tiếng nước ngoài.",
        note: "'can' diễn tả khả năng ở hiện tại.",
      },
    ],
    negative: [
      {
        en: "You **must not (mustn't) park** your car in front of the emergency exit.",
        vi: "Bạn tuyệt đối không được đỗ xe trước cửa thoát hiểm.",
        note: "'mustn't' diễn tả sự cấm đoán tuyệt đối.",
      },
      {
        en: "You **shouldn't stay up** too late before the examination.",
        vi: "Bạn không nên thức quá khuya trước kỳ thi.",
      },
    ],
    interrogative: [
      {
        en: "**Could you please show** me the way to the nearest subway station?",
        vi: "Bạn có thể vui lòng chỉ đường cho tôi đến ga tàu điện ngầm gần nhất không?",
        note: "'could' dùng trong câu hỏi mang sắc thái lịch sự, trang trọng hơn 'can'.",
      },
    ],
    signals: "can, could, must, should, have to, may, might, ought to + V-bare",
    traps: "⚠️ **Lưu ý:** Sau động từ khuyết thiếu (modal verbs), động từ chính luôn ở dạng nguyên mẫu không 'to' (Bare infinitive), không chia theo ngôi và không thêm -s/es.",
    quiz: [
      {
        question: "You _________ drive without a valid driving license. It is illegal.",
        options: ["A. shouldn't", "B. mustn't", "C. needn't", "D. don't have to"],
        answer: "B. mustn't",
        explanation: "Hành vi trái pháp luật bị cấm đoán tuyệt đối dùng 'mustn't'.",
      },
    ],
  },
  "relative-clauses": {
    affirmative: [
      {
        en: "The professor **who teaches** advanced physics won the Nobel Prize.",
        vi: "Vị giáo sư dạy môn vật lý nâng cao đã đoạt giải Nobel.",
        note: "'who' thay thế cho danh từ chỉ người làm chủ ngữ trong mệnh đề quan hệ.",
      },
      {
        en: "This is the smartphone **which I bought** during Black Friday.",
        vi: "Đây là chiếc điện thoại thông minh mà tôi đã mua trong dịp Black Friday.",
        note: "'which' thay thế cho danh từ chỉ đồ vật.",
      },
    ],
    negative: [
      {
        en: "I don't know any person **who doesn't like** delicious food.",
        vi: "Tôi không biết bất kỳ ai mà lại không thích đồ ăn ngon.",
      },
    ],
    interrogative: [
      {
        en: "Is that the girl **whose parents** own the bakery?",
        vi: "Đó có phải là cô gái mà bố mẹ sở hữu tiệm bánh không?",
        note: "'whose' chỉ sự sở hữu (whose + N).",
      },
    ],
    signals: "who (người-S), whom (người-O), which (vật), that (người/vật), whose (sở hữu), where (nơi chốn), when (thời gian)",
    traps: "⚠️ **Lưu ý:** Không dùng 'that' trong mệnh đề quan hệ không xác định (mệnh đề có dấu phẩy) hoặc ngay sau giới từ.",
    quiz: [
      {
        question: "The man _________ wallet was lost reported it to the police station.",
        options: ["A. who", "B. which", "C. whose", "D. that"],
        answer: "C. whose",
        explanation: "'whose wallet' = chiếc ví của người đàn ông (chỉ mối quan hệ sở hữu).",
      },
    ],
  },
  "reported-speech": {
    affirmative: [
      {
        en: "He said that he **was studying** for his final exam.",
        vi: "Anh ấy nói rằng anh ấy đang ôn thi học kỳ.",
        note: "Lời trực tiếp 'I am studying' khi tường thuật lùi thì thành 'was studying'.",
      },
    ],
    negative: [
      {
        en: "She told me that she **had not received** my message the day before.",
        vi: "Cô ấy nói với tôi rằng cô ấy đã không nhận được tin nhắn của tôi ngày hôm trước.",
        note: "Quá khứ đơn lùi về Quá khứ hoàn thành (had not received), yesterday ➔ the day before.",
      },
    ],
    interrogative: [
      {
        en: "My teacher asked me **if I had completed** the homework.",
        vi: "Cô giáo hỏi tôi liệu tôi đã hoàn thành bài tập về nhà chưa.",
        note: "Câu hỏi Yes/No chuyển thành: S + asked + if/whether + S + V(lùi thì, trật tự câu khẳng định).",
      },
    ],
    signals: "said that, told + O that, asked + if/whether, lùi thì (HTĐ -> QKĐ, HTTD -> QKTD, HTHT/QKĐ -> QKHT)",
    traps: "⚠️ **Lưu ý:** Trong câu tường thuật gián tiếp, trật tự từ luôn là câu khẳng định (S + V), KHÔNG đảo trợ động từ lên trước chủ ngữ.",
    quiz: [
      {
        question: "\"Where do you live?\" - She asked me where I _________.",
        options: ["A. do live", "B. lived", "C. did live", "D. have lived"],
        answer: "B. lived",
        explanation: "Lùi thì từ Hiện tại đơn sang Quá khứ đơn và đưa về trật tự khẳng định: 'where I lived'.",
      },
    ],
  },
  "gerund-infinitive": {
    affirmative: [
      {
        en: "I **enjoy reading** English novels in my leisure time.",
        vi: "Tôi thích đọc tiểu thuyết tiếng Anh vào thời gian rảnh rỗi.",
        note: "Động từ 'enjoy' luôn đi kèm V-ing (Gerund).",
      },
      {
        en: "She **decided to study** abroad in Australia next year.",
        vi: "Cô ấy đã quyết định đi du học ở Úc vào năm sau.",
        note: "Động từ 'decide' luôn đi kèm To-V (Infinitive).",
      },
    ],
    negative: [
      {
        en: "He promised **not to repeat** that careless mistake.",
        vi: "Anh ấy hứa sẽ không lặp lại sai lầm bất cẩn đó.",
      },
    ],
    interrogative: [
      {
        en: "Do you **mind opening** the window? It is quite hot in here.",
        vi: "Bạn có phiền mở cửa sổ giúp tôi không? Trong phòng khá nóng.",
        note: "'mind' luôn đi kèm V-ing ('mind doing something').",
      },
    ],
    signals: "V-ing (enjoy, avoid, practice, suggest, mind), To-V (decide, want, hope, promise, plan, refuse)",
    traps: "⚠️ **Lưu ý:**\n- *Remember to V:* nhớ phải làm gì (tương lai).\n- *Remember V-ing:* nhớ đã làm gì (quá khứ).\n- *Stop to V:* dừng lại để làm việc khác; *Stop V-ing:* dừng hẳn việc đang làm.",
    quiz: [
      {
        question: "I can't help _________ when I watch that hilarious comedy.",
        options: ["A. laugh", "B. laughing", "C. to laugh", "D. laughed"],
        answer: "B. laughing",
        explanation: "Cụm thành ngữ 'can't help + V-ing' nghĩa là không thể nhịn được / không thể không.",
      },
    ],
  },
  "comparisons": {
    affirmative: [
      {
        en: "Tokyo is **much more expensive than** Da Nang.",
        vi: "Tokyo đắt đỏ hơn nhiều so với Đà Nẵng.",
        note: "So sánh hơn của tính từ dài: more + adj + than.",
      },
      {
        en: "**The harder** you study, **the higher** score you will get.",
        vi: "Bạn càng học chăm chỉ, điểm số của bạn sẽ càng cao.",
        note: "Cấu trúc so sánh kép: The + comp..., the + comp...",
      },
    ],
    negative: [
      {
        en: "My current smartphone is **not as (so) fast as** your laptop.",
        vi: "Điện thoại của tôi không nhanh bằng máy tính xách tay của bạn.",
      },
    ],
    interrogative: [
      {
        en: "Is this **the most difficult** grammar topic you have learned?",
        vi: "Đây có phải là chủ điểm ngữ pháp khó nhất mà bạn từng học không?",
        note: "So sánh nhất: the most + adj dài.",
      },
    ],
    signals: "as...as, -er / more...than, the -est / the most, the more... the more...",
    traps: "⚠️ **Lưu ý:** Với tính từ ngắn tận cùng 1 nguyên âm + 1 phụ âm, phải gấp đôi phụ âm cuối trước khi thêm -er/-est (*hot -> hotter -> the hottest*).",
    quiz: [
      {
        question: "The more books you read, _________ knowledgeable you become.",
        options: ["A. the most", "B. more", "C. the more", "D. the much"],
        answer: "C. the more",
        explanation: "Cấu trúc so sánh kép: 'The more..., the more...'.",
      },
    ],
  },
  "inversion": {
    affirmative: [
      {
        en: "**Never have I seen** such a spectacular sunset over the ocean.",
        vi: "Chưa bao giờ tôi thấy cảnh hoàng hôn trên biển ngoạn mục đến vậy.",
        note: "'Never' đứng đầu câu, đảo trợ động từ 'have' lên trước chủ ngữ 'I'.",
      },
      {
        en: "**Not only did he win** the championship, **but he also broke** the record.",
        vi: "Anh ấy không những giành chức vô địch mà còn phá vỡ kỷ lục.",
        note: "Đảo ngữ ở vế 'Not only did he win...'.",
      },
    ],
    negative: [
      {
        en: "**Under no circumstances should you share** your password with anyone.",
        vi: "Trong bất kỳ hoàn cảnh nào bạn cũng không được chia sẻ mật khẩu cho người khác.",
      },
    ],
    interrogative: [
      {
        en: "**Had she arrived** on time, would the meeting have started earlier?",
        vi: "Nếu cô ấy đến đúng giờ, liệu cuộc họp có bắt đầu sớm hơn không? (Đảo ngữ điều kiện loại 3).",
      },
    ],
    signals: "Never, Rarely, Seldom, Hardly... when, No sooner... than, Not only... but also, Under no circumstances",
    traps: "⚠️ **Lưu ý:** Đảo ngữ bắt buộc phải mượn trợ động từ (do/does/did/have/had/will/modal) đưa lên trước chủ ngữ, động từ chính giữ nguyên mẫu.",
    quiz: [
      {
        question: "Rarely _________ such dedication in a young apprentice.",
        options: ["A. we see", "B. do we see", "C. we have seen", "D. are we seeing"],
        answer: "B. do we see",
        explanation: "'Rarely' đứng đầu câu, đảo trợ động từ 'do' lên trước chủ ngữ 'we' -> 'do we see'.",
      },
    ],
  },
}

function getBaseVerb(v: string): string {
  const lower = v.toLowerCase().trim()
  const ir = IRREGULAR_VERBS[lower]
  if (ir) return ir.v1

  if (lower.endsWith("ies")) {
    return lower.slice(0, -3) + "y"
  }
  if (/(?:ch|sh|ss|x|zz)es$/i.test(lower)) {
    return lower.slice(0, -2)
  }
  if (lower.endsWith("oes")) {
    return lower.slice(0, -2)
  }
  if (lower.endsWith("s") && !lower.endsWith("ss")) {
    return lower.slice(0, -1)
  }
  if (lower.endsWith("ed")) {
    if (lower.endsWith("ied")) return lower.slice(0, -3) + "y"
    if (lower.endsWith("eed")) return lower.slice(0, -1)
    if (/(?:liv|lik|lov|hop|mak|tak|clos|danc|smil|chang)ed$/i.test(lower)) {
      return lower.slice(0, -1)
    }
    return lower.replace(/ed$/, "")
  }
  if (lower.endsWith("ing")) {
    if (lower === "being") return "be"
    if (/^(?:dying|lying|tying)$/i.test(lower)) return lower.replace(/ying$/, "ie")
    if (/(?:mak|tak|liv|writ|hop|danc|smil|com|driv|rid|hid|shak|bak)ing$/i.test(lower)) {
      return lower.slice(0, -3) + "e"
    }
    const stem = lower.slice(0, -3)
    if (stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2] && !["ss", "ll", "ee"].includes(stem.slice(-2))) {
      return stem.slice(0, -1)
    }
    return lower.replace(/ing$/, "")
  }
  return lower
}

function isV3OrEd(word: string): boolean {
  const lower = word.toLowerCase().trim()
  if (lower.endsWith("ed")) return true
  const ir = IRREGULAR_VERBS[lower]
  return Boolean(ir && (ir.v3 === lower || ir.v2 === lower))
}

function getV2(base: string): string {
  const lower = base.toLowerCase()
  if (lower === "be") return "was/were"
  const ir = IRREGULAR_VERBS[lower]
  if (ir) return ir.v2
  if (lower.endsWith("e")) return lower + "d"
  if (lower.endsWith("y") && !/[aeiou]y$/i.test(lower)) return lower.slice(0, -1) + "ied"
  return lower + "ed"
}

function getV3(base: string): string {
  const lower = base.toLowerCase()
  if (lower === "be") return "been"
  const ir = IRREGULAR_VERBS[lower]
  if (ir) return ir.v3
  if (lower.endsWith("e")) return lower + "d"
  if (lower.endsWith("y") && !/[aeiou]y$/i.test(lower)) return lower.slice(0, -1) + "ied"
  return lower + "ed"
}

function getVing(base: string): string {
  const lower = base.toLowerCase()
  if (lower === "be") return "being"
  if (lower.endsWith("ie")) return lower.slice(0, -2) + "ying"
  if (lower.endsWith("e") && !lower.endsWith("ee")) return lower.slice(0, -1) + "ing"
  return lower + "ing"
}

function getVs(base: string): string {
  const lower = base.toLowerCase()
  if (lower === "be") return "is"
  if (lower === "have") return "has"
  if (lower.endsWith("y") && !/[aeiou]y$/i.test(lower)) return lower.slice(0, -1) + "ies"
  if (/(?:ch|sh|ss|x|z|o)$/i.test(lower)) return lower + "es"
  return lower + "s"
}

/**
 * Thuật toán Phân tích Cú pháp Động & Phát hiện Lỗi Ngữ pháp (0ms, 100% Local)
 */
function analyzeGrammarDynamically(sentence: string): {
  errors: DynamicError[]
  correctedSentence: string
} {
  const errors: DynamicError[] = []
  let corrected = sentence

  // 1. Kiểm tra hòa hợp Chủ ngữ - Động từ (Subject-Verb Agreement)
  const iHasMatch = sentence.match(/\bI\s+(has|is|wasn't|doesn't|doesnt)\b/i)
  if (iHasMatch) {
    const wrong = iHasMatch[1].toLowerCase()
    const right = wrong === "has" ? "have" : wrong === "is" ? "am" : wrong.startsWith("doesn") ? "don't" : "wasn't"
    errors.push({
      type: "Hòa hợp Chủ ngữ - Động từ (Ngôi I)",
      badPart: `I ${iHasMatch[1]}`,
      goodPart: `I ${right}`,
      reason: `Chủ ngữ là đại từ ngôi thứ nhất **"I"**, luôn đi kèm với dạng động từ **"${right}"**, không dùng *"${iHasMatch[1]}"*.`,
    })
    corrected = corrected.replace(new RegExp(`\\bI\\s+${iHasMatch[1]}\\b`, "i"), `I ${right}`)
  }

  const s3Match = sentence.match(/\b(he|she|it|my\s+[a-z]+|the\s+[a-z]+)\s+(don't|dont|have|are|were)\b/i)
  if (s3Match) {
    const subj = s3Match[1]
    const wrong = s3Match[2].toLowerCase()
    const right = wrong.startsWith("don") ? "doesn't" : wrong === "have" ? "has" : wrong === "are" ? "is" : "was"
    errors.push({
      type: "Hòa hợp Chủ ngữ ngôi thứ 3 số ít",
      badPart: `${subj} ${s3Match[2]}`,
      goodPart: `${subj} ${right}`,
      reason: `Chủ ngữ số ít ngôi thứ ba (*${subj}*) phải chia động từ ở dạng số ít **"${right}"** thay vì *"${s3Match[2]}"*.`,
    })
    corrected = corrected.replace(new RegExp(`\\b${subj}\\s+${s3Match[2]}\\b`, "i"), `${subj} ${right}`)
  }

  const pluralMatch = sentence.match(/\b(they|we|you)\s+(is|has|doesn't|doesnt)\b/i)
  if (pluralMatch) {
    const subj = pluralMatch[1]
    const wrong = pluralMatch[2].toLowerCase()
    const right = wrong === "is" ? "are" : wrong === "has" ? "have" : "don't"
    errors.push({
      type: "Hòa hợp Chủ ngữ số nhiều",
      badPart: `${subj} ${pluralMatch[2]}`,
      goodPart: `${subj} ${right}`,
      reason: `Chủ ngữ số nhiều (*${subj}*) phải đi với động từ số nhiều **"${right}"**, không đi với *"${pluralMatch[2]}"*.`,
    })
    corrected = corrected.replace(new RegExp(`\\b${subj}\\s+${pluralMatch[2]}\\b`, "i"), `${subj} ${right}`)
  }

  // 2. Lỗi trợ động từ + dạng động từ (Auxiliary + Non-base form)
  const auxVerbMatch = corrected.match(/\b(don't|dont|doesn't|doesnt|didn't|didnt)\s+([a-zA-Z]+)\b/i)
  if (auxVerbMatch) {
    const aux = auxVerbMatch[1]
    const verb = auxVerbMatch[2].toLowerCase()
    const ir = IRREGULAR_VERBS[verb]
    if (ir && ir.v2 === verb && ir.v1 !== verb) {
      errors.push({
        type: "Dạng động từ sau Trợ động từ phủ định",
        badPart: auxVerbMatch[0],
        goodPart: `${aux} ${ir.v1}`,
        reason: `Sau trợ động từ (*${aux}*), động từ chính bắt buộc phải về dạng nguyên mẫu (**${ir.v1}**), không dùng dạng quá khứ (*${verb}*).`,
      })
      corrected = corrected.replace(new RegExp(`\\b${auxVerbMatch[0]}\\b`, "i"), `${aux} ${ir.v1}`)
    } else if (/(?:s|es|ed|ing)$/i.test(verb) && verb !== "is" && verb !== "has") {
      const base = getBaseVerb(verb)
      errors.push({
        type: "Động từ nguyên mẫu sau Trợ động từ",
        badPart: auxVerbMatch[0],
        goodPart: `${aux} ${base}`,
        reason: `Khi đã có trợ động từ (*${aux}*), động từ chính phải ở dạng nguyên thể không chia (**${base}**), không được thêm *-s / -es / -ed / -ing*.`,
      })
      corrected = corrected.replace(new RegExp(`\\b${auxVerbMatch[0]}\\b`, "i"), `${aux} ${base}`)
    }
  }

  // 3. Kiểm tra Giới từ thời gian: SINCE vs FOR
  const sinceDurationMatch = sentence.match(
    /\bsince\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|many|a\s+few|several|a\s+couple\s+of)\s+(seconds?|minutes?|hours?|days?|weeks?|months?|years?)\b/i
  )
  if (sinceDurationMatch) {
    const duration = `${sinceDurationMatch[1]} ${sinceDurationMatch[2]}`
    errors.push({
      type: "Giới từ chỉ thời gian (Since vs For)",
      badPart: sinceDurationMatch[0],
      goodPart: `for ${duration}`,
      reason: `**"${duration}"** là một khoảng thời gian kéo dài (Duration). Trong tiếng Anh, bắt buộc dùng giới từ **"for"** (*for ${duration}*). Giới từ **"since"** chỉ dùng cho mốc thời gian bắt đầu (ví dụ: *since 2 p.m., since 2020*).`,
    })
    corrected = corrected.replace(new RegExp(`\\b${sinceDurationMatch[0]}\\b`, "i"), `for ${duration}`)
  }

  const forPointMatch = sentence.match(
    /\bfor\s+(19\d\d|20\d\d|yesterday|last\s+(?:week|month|year)|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i
  )
  if (forPointMatch) {
    const point = forPointMatch[1]
    errors.push({
      type: "Giới từ chỉ mốc thời gian (For vs Since)",
      badPart: forPointMatch[0],
      goodPart: `since ${point}`,
      reason: `**"${point}"** là mốc thời gian cố định. Phải dùng giới từ **"since"** (*since ${point}*), không dùng *for*.`,
    })
    corrected = corrected.replace(new RegExp(`\\b${forPointMatch[0]}\\b`, "i"), `since ${point}`)
  }

  // 4. Lỗi thời gian quá khứ: Có mốc thời gian quá khứ nhưng dùng động từ nguyên thể
  const pastMarker = sentence.match(/\b(yesterday|last\s+(?:night|week|month|year)|\d+\s+(?:days?|weeks?|months?|years?)\s+ago|in\s+(?:19\d\d|20[0-2]\d))\b/i)
  if (pastMarker) {
    const pMarkerStr = pastMarker[1]
    const presVerbMatch = sentence.match(/\b(I|he|she|it|they|we|you|my\s+[a-z]+)\s+(go|eat|buy|see|come|take|write|meet|sing|do|watch|play|visit|finish|start|arrive)\b/i)
    if (presVerbMatch) {
      const subj = presVerbMatch[1]
      const baseV = presVerbMatch[2].toLowerCase()
      const beforeIndex = sentence.indexOf(presVerbMatch[0])
      const beforeStr = sentence.slice(0, beforeIndex)
      if (!/(?:did|didn't|didnt|can|could|would|should|will)\s*$/i.test(beforeStr.trim())) {
        const ir = IRREGULAR_VERBS[baseV]
        const pastV = ir ? ir.v2 : baseV.endsWith("e") ? `${baseV}d` : `${baseV}ed`
        errors.push({
          type: "Chia động từ thì Quá khứ đơn (Past Simple)",
          badPart: `${subj} ${baseV}`,
          goodPart: `${subj} ${pastV}`,
          reason: `Trong câu có trạng từ chỉ thời gian quá khứ xác định (**"${pMarkerStr}"**), động từ chính bắt buộc phải chia ở thì Quá khứ đơn (**${pastV}**), không dùng dạng hiện tại (*${baseV}*).`,
        })
        corrected = corrected.replace(new RegExp(`\\b${subj}\\s+${baseV}\\b`, "i"), `${subj} ${pastV}`)
      }
    }
  }

  // 5. Kiểm tra Động từ sau Have/Has/Had (phải là V3, không được là V2)
  const haveV2Match = sentence.match(/\b(have|has|had)\s+([a-zA-Z]+)\b/i)
  if (haveV2Match) {
    const aux = haveV2Match[1]
    const wordAfter = haveV2Match[2].toLowerCase()
    const ir = IRREGULAR_VERBS[wordAfter]
    if (ir && ir.v2 === wordAfter && ir.v3 !== ir.v2) {
      errors.push({
        type: "Dạng động từ phân từ sau Trợ động từ hoàn thành",
        badPart: `${aux} ${wordAfter}`,
        goodPart: `${aux} ${ir.v3}`,
        reason: `Sau trợ động từ hoàn thành **"${aux}"**, động từ chính phải ở dạng Quá khứ phân từ V3 (**${ir.v3}**), không được dùng dạng quá khứ đơn V2 (*${wordAfter}*).`,
      })
      corrected = corrected.replace(new RegExp(`\\b${aux}\\s+${wordAfter}\\b`, "i"), `${aux} ${ir.v3}`)
    }
  }

  // 6. Dùng V3 làm vị ngữ mà thiếu trợ động từ
  const v3AloneMatch = sentence.match(/\b(I|he|she|they|we|you)\s+(seen|done|gone|eaten|taken|written)\b/i)
  if (v3AloneMatch) {
    const subj = v3AloneMatch[1]
    const v3 = v3AloneMatch[2].toLowerCase()
    const ir = IRREGULAR_VERBS[v3]
    if (ir) {
      errors.push({
        type: "Dùng sai Quá khứ phân từ V3 làm vị ngữ quá khứ",
        badPart: `${subj} ${v3}`,
        goodPart: `${subj} ${ir.v2}`,
        reason: `Động từ dạng V3 (**"${v3}"**) không thể đứng một mình làm vị ngữ thì quá khứ đơn mà phải dùng dạng V2 (**"${ir.v2}"**) hoặc thêm trợ động từ *have/has*.`,
      })
      corrected = corrected.replace(new RegExp(`\\b${subj}\\s+${v3}\\b`, "i"), `${subj} ${ir.v2}`)
    }
  }

  // 7. Modal verbs + Bare Infinitive
  const modalMatch = sentence.match(/\b(can|could|should|must|will|would|may|might)\s+([a-zA-Z]+(?:s|ed|ing))\b/i)
  if (modalMatch) {
    const modal = modalMatch[1]
    const badVerb = modalMatch[2]
    const cleanVerb = badVerb.replace(/(?:ing|ed|es|s)$/i, "")
    errors.push({
      type: "Dạng động từ sau Động từ khuyết thiếu (Modal Verbs)",
      badPart: `${modal} ${badVerb}`,
      goodPart: `${modal} ${cleanVerb}`,
      reason: `Sau động từ khuyết thiếu (*${modal}*), động từ chính bắt buộc phải ở dạng nguyên mẫu không "to" (Bare Infinitive: **${cleanVerb}**), không thêm -s/-ed/-ing.`,
    })
    corrected = corrected.replace(new RegExp(`\\b${modal}\\s+${badVerb}\\b`, "i"), `${modal} ${cleanVerb}`)
  }

  // 8. Mạo từ không xác định A vs AN
  const aBeforeVowelMatch = sentence.match(/\ba\s+(apple|orange|egg|elephant|island|ice\s+cream|umbrella|uncle|hour|honest|honor)\b/i)
  if (aBeforeVowelMatch) {
    errors.push({
      type: "Mạo từ không xác định (A vs An)",
      badPart: aBeforeVowelMatch[0],
      goodPart: `an ${aBeforeVowelMatch[1]}`,
      reason: `Từ **"${aBeforeVowelMatch[1]}"** bắt đầu bằng một nguyên âm (hoặc âm câm h), vì vậy bắt buộc phải dùng mạo từ **"an"** thay vì *"a"*.`,
    })
    corrected = corrected.replace(new RegExp(`\\b${aBeforeVowelMatch[0]}\\b`, "i"), `an ${aBeforeVowelMatch[1]}`)
  }

  const anBeforeConsonantMatch = sentence.match(/\ban\s+(car|book|pen|dog|cat|house|table|computer|university|uniform|user|European|unique)\b/i)
  if (anBeforeConsonantMatch) {
    errors.push({
      type: "Mạo từ không xác định (An vs A)",
      badPart: anBeforeConsonantMatch[0],
      goodPart: `a ${anBeforeConsonantMatch[1]}`,
      reason: `Từ **"${anBeforeConsonantMatch[1]}"** phát âm bắt đầu bằng một phụ âm (như âm /j/), nên phải dùng mạo từ **"a"** thay vì *"an"*.`,
    })
    corrected = corrected.replace(new RegExp(`\\b${anBeforeConsonantMatch[0]}\\b`, "i"), `a ${anBeforeConsonantMatch[1]}`)
  }

  // 9. Danh từ không đếm được thêm -s
  const uncountableMatch = sentence.match(/\b(informations|advices|furnitures|homeworks|equipments|luggages|baggages)\b/i)
  if (uncountableMatch) {
    const wrongWord = uncountableMatch[1]
    const correctWord = wrongWord.slice(0, -1)
    errors.push({
      type: "Danh từ không đếm được (Uncountable Nouns)",
      badPart: wrongWord,
      goodPart: correctWord,
      reason: `**"${correctWord}"** là danh từ không đếm được trong tiếng Anh, tuyệt đối không thêm đuôi số nhiều *-s*. Nếu muốn đếm số lượng, dùng cụm *a piece of ${correctWord}*.`,
    })
    corrected = corrected.replace(new RegExp(`\\b${wrongWord}\\b`, "i"), correctWord)
  }

  // 10. Số lượng > 1 đi với danh từ số ít
  const pluralCounterMatch = sentence.match(/\b(\d+|two|three|four|five|six|seven|eight|nine|ten|many|several)\s+(brother|sister|year|day|book|car|student|friend|child)\b/i)
  if (pluralCounterMatch) {
    const count = pluralCounterMatch[1]
    const noun = pluralCounterMatch[2].toLowerCase()
    const pluralNoun = noun === "child" ? "children" : `${noun}s`
    errors.push({
      type: "Danh từ số nhiều sau từ chỉ số lượng",
      badPart: pluralCounterMatch[0],
      goodPart: `${count} ${pluralNoun}`,
      reason: `Khi đứng sau số từ số nhiều (*${count}*), danh từ đếm được bắt buộc phải ở dạng số nhiều (**${pluralNoun}**).`,
    })
    corrected = corrected.replace(new RegExp(`\\b${pluralCounterMatch[0]}\\b`, "i"), `${count} ${pluralNoun}`)
  }

  // 11. Các lỗi chuyển ngữ tiếng Việt phổ biến
  if (/\bI\s+am\s+agree\b/i.test(sentence)) {
    errors.push({
      type: "Nhầm lẫn từ loại của 'Agree'",
      badPart: "I am agree",
      goodPart: "I agree",
      reason: `**"Agree"** là một động từ (Verb), không phải tính từ. Câu đúng chuẩn là **"I agree with you"**, không dùng động từ to be *am*.`,
    })
    corrected = corrected.replace(/\bI\s+am\s+agree\b/i, "I agree")
  }

  const althoughButMatch = sentence.match(/\balthough\s+([^,]+?),\s*but\s+/i)
  if (althoughButMatch) {
    errors.push({
      type: "Lặp liên từ chỉ sự tương phản (Although ... but)",
      badPart: althoughButMatch[0],
      goodPart: `Although ${althoughButMatch[1]}, `,
      reason: `Trong tiếng Anh, chỉ dùng **một** trong hai liên từ: hoặc dùng **Although**, hoặc dùng **but**, không được dùng cả hai cùng lúc trong một câu.`,
    })
    corrected = corrected.replace(new RegExp(`\\balthough\\s+${althoughButMatch[1]},\\s*but\\s+`, "i"), `Although ${althoughButMatch[1]}, `)
  }

  const lookForwardMatch = sentence.match(/\blook(?:s|ing|ed)?\s+forward\s+to\s+([a-zA-Z]+(?<!ing))\b/i)
  if (lookForwardMatch) {
    const verb = lookForwardMatch[1].toLowerCase()
    const ving = /(?:e)$/.test(verb) ? `${verb.slice(0, -1)}ing` : `${verb}ing`
    errors.push({
      type: "Dạng động từ sau cụm 'Look forward to'",
      badPart: lookForwardMatch[0],
      goodPart: `look forward to ${ving}`,
      reason: `Trong cụm **"look forward to"**, từ *to* là một giới từ, theo sau nó bắt buộc phải là một danh động từ (**V-ing**: *${ving}*).`,
    })
    corrected = corrected.replace(new RegExp(`\\b${lookForwardMatch[0]}\\b`, "i"), `look forward to ${ving}`)
  }

  if (/\bmarried\s+with\b/i.test(sentence)) {
    errors.push({
      type: "Sai giới từ đi với 'Married'",
      badPart: "married with",
      goodPart: "married to",
      reason: `Cụm chuẩn là **be married TO someone** (kết hôn với ai), không dùng *married with*.`,
    })
    corrected = corrected.replace(/\bmarried\s+with\b/i, "married to")
  }

  // 12. Kiểm tra Cụm Tính từ + Giới từ (Adjective Collocations)
  for (const [adj, info] of Object.entries(ADJ_PREPOSITIONS)) {
    const regex = new RegExp(`\\b${adj}\\s+(${info.wrongPrep.join("|")})\\b`, "i")
    const match = sentence.match(regex)
    if (match) {
      errors.push({
        type: "Giới từ đi kèm tính từ (Adjective Collocation)",
        badPart: match[0],
        goodPart: `${adj} ${info.correctPrep}`,
        reason: `Tính từ **"${adj}"** đi với giới từ chuẩn là **"${info.correctPrep}"** (*${adj} ${info.correctPrep}*), không đi kèm với *"${match[1]}"*.`,
      })
      corrected = corrected.replace(regex, `${adj} ${info.correctPrep}`)
    }
  }

  // 13. Lỗi phủ định kép (Double Negative): don't have no, do not do nothing
  const doubleNegMatch = sentence.match(/\b(don't|doesn't|didn't|dont|doesnt|didnt|do\s+not|does\s+not|did\s+not)\s+([a-zA-Z]+)\s+(no|nothing)\b/i)
  if (doubleNegMatch) {
    const aux = doubleNegMatch[1]
    const verb = doubleNegMatch[2]
    const negWord = doubleNegMatch[3].toLowerCase()
    const anyWord = negWord === "nothing" ? "anything" : "any"
    errors.push({
      type: "Lỗi phủ định kép (Double Negative)",
      badPart: doubleNegMatch[0],
      goodPart: `${aux} ${verb} ${anyWord}`,
      reason: `Trong ngữ pháp tiếng Anh chuẩn, không dùng hai từ phủ định (*${aux}* và *${negWord}*) cùng lúc trong một mệnh đề. Cần thay *${negWord}* bằng **${anyWord}** (*${aux} ${verb} ${anyWord}*).`,
    })
    corrected = corrected.replace(new RegExp(`\\b${doubleNegMatch[0]}\\b`, "i"), `${aux} ${verb} ${anyWord}`)
  }

  // 14. Thiếu mạo từ a/an trước cụm tính từ + danh từ đếm được số ít (e.g. into good university, is good student)
  const missingArticleMatch = sentence.match(/\b(into|to|in|at|is|become|like)\s+(good|great|famous|new|big|small)\s+(university|college|school|student|teacher|doctor|car|house|job)\b/i)
  if (missingArticleMatch) {
    const prep = missingArticleMatch[1]
    const adj = missingArticleMatch[2]
    const noun = missingArticleMatch[3]
    const art = /^[aeiou]/i.test(adj) ? "an" : "a"
    errors.push({
      type: "Thiếu mạo từ bất định (a/an) trước danh từ số ít",
      badPart: `${prep} ${adj} ${noun}`,
      goodPart: `${prep} ${art} ${adj} ${noun}`,
      reason: `Danh từ đếm được số ít (**"${noun}"**) khi đi kèm với tính từ (**"${adj}"**) bắt buộc phải có mạo từ **"${art}"** đi trước (*${prep} ${art} ${adj} ${noun}*).`,
    })
    corrected = corrected.replace(new RegExp(`\\b${prep}\\s+${adj}\\s+${noun}\\b`, "i"), `${prep} ${art} ${adj} ${noun}`)
  }

  // 15. Dùng nhầm 'everyday' (tính từ) thay vì 'every day' (trạng từ chỉ tần suất)
  const everydayMatch = sentence.match(/\b([a-zA-Z]+)\s+everyday\b/i)
  if (everydayMatch && !/\b(life|use|clothes|routine|activity|objects|language)\b/i.test(sentence)) {
    const prevWord = everydayMatch[1]
    errors.push({
      type: "Phân biệt Everyday (Tính từ) và Every day (Trạng từ)",
      badPart: `${prevWord} everyday`,
      goodPart: `${prevWord} every day`,
      reason: `**"Everyday"** (viết liền) là một tính từ mang nghĩa "thông thường/hằng ngày" (ví dụ: *everyday life*). Khi dùng làm trạng từ chỉ tần suất đứng sau động từ hoặc cuối câu, bắt buộc phải viết rời là **"every day"**.`,
    })
    corrected = corrected.replace(/\beveryday\b/g, "every day")
  }

  // 16. Thiếu dấu phẩy trước liên từ chỉ sự tương phản (while/whereas) giữa 2 mệnh đề
  const commaWhileMatch = sentence.match(/\b([a-zA-Z]+)\s+while\s+(I|he|she|it|they|we|you|[a-z]+)\b/i)
  if (commaWhileMatch && !sentence.includes(", while")) {
    const before = commaWhileMatch[1]
    const after = commaWhileMatch[2]
    errors.push({
      type: "Dấu câu ngăn cách mệnh đề tương phản (while)",
      badPart: `${before} while`,
      goodPart: `${before}, while`,
      reason: `Khi liên từ **"while"** được dùng để diễn đạt sự đối lập/tương phản giữa hai mệnh đề độc lập, nên đặt một dấu phẩy (**","**) phía trước để câu văn mạch lạc, chuẩn văn phong học thuật.`,
    })
    corrected = corrected.replace(new RegExp(`\\b${before}\\s+while\\b`, "i"), `${before}, while`)
  }

  // Lọc bỏ lỗi trùng lặp vị trí
  const uniqueErrors: DynamicError[] = []
  const seenBadParts = new Set<string>()
  for (const err of errors) {
    const key = err.badPart.toLowerCase().trim()
    if (!seenBadParts.has(key)) {
      seenBadParts.add(key)
      uniqueErrors.push(err)
    }
  }

  return { errors: uniqueErrors, correctedSentence: corrected }
}

/**
 * Trích xuất phần câu tiếng Anh sạch (loại bỏ các từ nối/mệnh lệnh tiếng Việt mở đầu)
 */
export function extractTargetSentence(text: string): string {
  let targetText = text.trim()
  const prefixRegex =
    /^(?:hãy\s+)?(?:sửa\s*(?:giúp\s*(?:tôi|em))?\s*(?:lỗi)?\s*(?:ngữ\s*pháp)?\s*(?:câu\s*(?:sau|này|dưới\s*đây)?)?|kiểm\s*tra\s*(?:giúp\s*(?:tôi|em))?\s*(?:lỗi)?\s*(?:câu\s*(?:sau|này)?)?|chỉ\s*(?:giúp\s*)?lỗi\s*(?:câu\s*(?:sau|này)?)?|check\s*(?:giúp\s*)?(?:lỗi)?\s*(?:câu\s*(?:sau|này)?)?|câu\s*(?:sau|này)\s*(?:sai|đúng)\s*(?:ở\s*đâu|chỗ\s*nào|không)?|can\s+you\s+(?:check|correct)\s+(?:this\s+sentence|my\s+grammar)?|please\s+(?:check|correct))\s*[:：\-]?\s*["“']?/i
  if (prefixRegex.test(targetText)) {
    targetText = targetText.replace(prefixRegex, "").replace(/["”']\s*$/, "").trim()
  }
  return targetText
}

/**
 * Tìm chủ điểm ngữ pháp từ câu hỏi hoặc lịch sử hội thoại
 */
function findGrammarTopic(
  query: string,
  history?: { role: string; content: string }[]
): GrammarTopic | undefined {
  const lower = query.toLowerCase()

  const KEYWORD_MAP: Record<string, string> = {
    "hiện tại đơn": "present-simple",
    "hien tai don": "present-simple",
    "present simple": "present-simple",
    "hiện tại tiếp diễn": "present-continuous",
    "hien tai tiep dien": "present-continuous",
    "present continuous": "present-continuous",
    "hiện tại hoàn thành tiếp diễn": "present-perfect-continuous",
    "hien tai hoan thanh tiep dien": "present-perfect-continuous",
    "present perfect continuous": "present-perfect-continuous",
    "hiện tại hoàn thành": "present-perfect",
    "hien tai hoan thanh": "present-perfect",
    "present perfect": "present-perfect",
    "quá khứ tiếp diễn": "past-continuous",
    "qua khu tiep dien": "past-continuous",
    "past continuous": "past-continuous",
    "quá khứ hoàn thành tiếp diễn": "past-perfect-continuous",
    "qua khu hoan thanh tiep dien": "past-perfect-continuous",
    "past perfect continuous": "past-perfect-continuous",
    "quá khứ hoàn thành": "past-perfect",
    "qua khu hoan thanh": "past-perfect",
    "past perfect": "past-perfect",
    "quá khứ đơn": "past-simple",
    "qua khu don": "past-simple",
    "past simple": "past-simple",
    "tương lai hoàn thành tiếp diễn": "future-perfect-continuous",
    "tuong lai hoan thanh tiep dien": "future-perfect-continuous",
    "future perfect continuous": "future-perfect-continuous",
    "tương lai hoàn thành": "future-perfect",
    "tuong lai hoan thanh": "future-perfect",
    "future perfect": "future-perfect",
    "tương lai tiếp diễn": "future-continuous",
    "tuong lai tiep dien": "future-continuous",
    "future continuous": "future-continuous",
    "tương lai đơn": "future-simple",
    "tuong lai don": "future-simple",
    "future simple": "future-simple",
    "câu điều kiện": "conditionals",
    "cau dieu kien": "conditionals",
    "điều kiện": "conditionals",
    "conditionals": "conditionals",
    "câu bị động": "passive-voice",
    "cau bi dong": "passive-voice",
    "bị động": "passive-voice",
    "passive voice": "passive-voice",
    "câu gián tiếp": "reported-speech",
    "cau gian tiep": "reported-speech",
    "câu tường thuật": "reported-speech",
    "cau tuong thuat": "reported-speech",
    "tường thuật": "reported-speech",
    "tuong thuat": "reported-speech",
    "gián tiếp": "reported-speech",
    "gian tiep": "reported-speech",
    "reported speech": "reported-speech",
    "mệnh đề quan hệ": "relative-clauses",
    "menh de quan he": "relative-clauses",
    "relative clauses": "relative-clauses",
    "relative clause": "relative-clauses",
    "danh động từ": "gerund-infinitive",
    "danh dong tu": "gerund-infinitive",
    "gerund": "gerund-infinitive",
    "infinitive": "gerund-infinitive",
    "to v": "gerund-infinitive",
    "v-ing": "gerund-infinitive",
    "so sánh": "comparisons",
    "so sanh": "comparisons",
    "comparisons": "comparisons",
    "đảo ngữ": "inversion",
    "dao ngu": "inversion",
    "inversion": "inversion",
    "mạo từ": "articles",
    "mao tu": "articles",
    "articles": "articles",
    "article": "articles",
    "a an the": "articles",
    "a, an, the": "articles",
    "khuyết thiếu": "modal-verbs",
    "khuyet thieu": "modal-verbs",
    "động từ khuyết thiếu": "modal-verbs",
    "dong tu khuyet thieu": "modal-verbs",
    "modal verbs": "modal-verbs",
    "modal verb": "modal-verbs",
    "modal": "modal-verbs",
  }

  for (const [kw, slug] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(kw)) {
      const topic = grammarTopics.find((t) => t.slug === slug)
      if (topic) return topic
    }
  }

  const direct = grammarTopics.find(
    (t) =>
      lower.includes(t.name.toLowerCase()) ||
      lower.includes(t.vi.toLowerCase()) ||
      lower.includes(t.slug.replace(/-/g, " "))
  )
  if (direct) return direct

  return findRecentContextTopic(history)
}

// ==========================================
// CÁC HÀM XỬ LÝ & BÓC TÁCH CÂU TIẾNG ANH ĐỘNG
// ==========================================

export interface ParsedSentence {
  cleanSentence: string
  subject: string
  subjectType: string
  is3rdSingular: boolean
  isI: boolean
  isPlural: boolean
  tense: string
  tenseNameEn: string
  tenseNameVi: string
  formula: string
  mainVerb: string
  baseVerb: string
  complement: string
  isNegative: boolean
  isQuestion: boolean
}

/**
 * Kiểm tra xem chuỗi có phải là một câu tiếng Anh người dùng nhập vào để thao tác hay không
 */
export function isLikelyEnglishSentence(text: string): boolean {
  const clean = extractTargetSentence(text)
  const words = clean.split(/\s+/).filter(Boolean)
  if (words.length < 2) return false

  // Nếu chứa tiếng Việt có dấu rõ ràng
  if (/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(clean)) {
    const quoted = text.match(/["“'‘]([^"”'’]{3,})["”'’]/)
    if (quoted && !isVietnameseText(quoted[1])) {
      return true
    }
    return false
  }

  // Nếu là từ khóa tiếng Việt không dấu tra cứu ngữ pháp thuần túy
  const viKeywords =
    /^(?:mao\s*tu|thi\s*qua\s*khu|thi\s*hien\s*tai|cau\s*bi\s*dong|cau\s*dieu\s*kien|12\s*thi|phan\s*biet|tra\s*cuu|bai\s*tap|cho\s*vi\s*du|menh\s*de|danh\s*dong\s*tu|so\s*sanh|dao\s*ngu)$/i
  if (viKeywords.test(clean.trim())) {
    return false
  }

  const englishSentenceMarkers =
    /\b(i|you|he|she|it|we|they|my|your|his|her|their|our|this|that|these|those|the|a|an|is|am|are|was|were|be|been|being|have|has|had|do|does|did|can|could|will|would|shall|should|may|might|must|go|goes|went|gone|see|saw|seen|look|looks|looked|live|lives|lived|work|works|worked|study|studies|studied|like|likes|liked|love|loves|loved|want|wants|wanted|play|plays|played|make|makes|made|take|takes|took|come|comes|came|get|gets|got|give|gives|gave|say|says|said|tell|tells|told|eat|eats|ate|buy|buys|bought|read|reads|write|writes|wrote|in|on|at|to|for|with|from|by|about|and|but|or|because|so|if|when|while|not|don't|doesn't|didn't|isn't|aren't|wasn't|weren't)\b/i

  return englishSentenceMarkers.test(clean)
}

/**
 * Phân tích cấu trúc thành phần của một câu tiếng Anh
 */
export function parseEnglishSentence(sentence: string): ParsedSentence {
  const clean = extractTargetSentence(sentence).replace(/[.!?]+$/, "").trim()
  const isNegative = /(?:n't|not|never|hardly|\bdon't|\bdoesn't|\bdidn't|\bwon't|\bhasn't|\bhaven't|\bhadn't)/i.test(clean)

  // 1. Phân tách mệnh đề phụ / liên từ đẳng lập (Coordinate clauses: , and / , but / , so ... hoặc liên từ phụ thuộc)
  let mainClause = clean
  let tailClause = ""

  const conjMatch = clean.match(
    /^(.*?)(?:,\s*|\s+)(?:and|but|so|yet|or|because|although|though|even though|whereas|while|if|unless|since)\s+(.*)$/i
  )
  if (conjMatch && conjMatch[1].trim().length > 3) {
    mainClause = conjMatch[1].trim()
    tailClause = clean.slice(conjMatch[1].length).trim()
  }

  // 2. Tách từ trong mệnh đề chính & mở rộng các đại từ viết tắt phổ biến
  let words = mainClause.split(/\s+/).filter(Boolean)

  if (words.length > 0) {
    const first = words[0]
    const firstLower = first.toLowerCase()
    if (firstLower === "i've" || firstLower === "you've" || firstLower === "we've" || firstLower === "they've") {
      words = [first.slice(0, -3), "have", ...words.slice(1)]
    } else if (firstLower === "i'm") {
      words = ["I", "am", ...words.slice(1)]
    } else if (firstLower === "you're" || firstLower === "we're" || firstLower === "they're") {
      words = [first.slice(0, -3), "are", ...words.slice(1)]
    } else if (firstLower === "he's" || firstLower === "she's" || firstLower === "it's") {
      const nextWord = (words[1] || "").toLowerCase()
      const isHas = nextWord === "been" || isV3OrEd(nextWord)
      words = [first.slice(0, -2), isHas ? "has" : "is", ...words.slice(1)]
    } else if (firstLower === "i'd" || firstLower === "he'd" || firstLower === "she'd" || firstLower === "we'd" || firstLower === "they'd") {
      const nextWord = (words[1] || "").toLowerCase()
      const isHad = nextWord === "been" || isV3OrEd(nextWord)
      words = [first.slice(0, -2), isHad ? "had" : "would", ...words.slice(1)]
    } else if (firstLower.endsWith("'ll")) {
      words = [first.slice(0, -3), "will", ...words.slice(1)]
    }
  }

  const isQuestion =
    sentence.trim().endsWith("?") ||
    /^(do|does|did|is|am|are|was|were|can|could|will|would|have|has|had|what|where|when|why|how)\b/i.test(words[0] || "")

  // 3. Xác định Chủ ngữ (Subject) & Vị trí Bắt đầu của Cụm Động từ (Verb Phrase)
  const AUX_OR_MODAL_REGEX =
    /^(?:has|have|had|is|am|are|was|were|will|would|shall|should|can|could|may|might|must|do|does|did|hasn't|haven't|hadn't|isn't|aren't|wasn't|weren't|won't|wouldn't|can't|couldn't|shouldn't|don't|doesn't|didn't)$/i

  let subject = words[0] || "Someone"
  let verbIndex = 1

  // Nếu là câu hỏi đảo trợ động từ lên đầu (ví dụ: "Did you see...", "Have you finished...")
  if (AUX_OR_MODAL_REGEX.test(words[0] || "") && words.length > 2 && isQuestion) {
    if (/^(my|the|a|an|his|her|their|our|this|that|these|those)\b/i.test(words[1]) && words.length > 3) {
      subject = words[1] + " " + words[2]
      verbIndex = 3
    } else {
      subject = words[1]
      verbIndex = 2
    }
  } else {
    // Câu khẳng định hoặc phủ định chuẩn
    let auxIndex = -1
    for (let i = 1; i < words.length; i++) {
      if (AUX_OR_MODAL_REGEX.test(words[i])) {
        auxIndex = i
        break
      }
    }

    if (auxIndex > 0) {
      // Có trợ động từ: toàn bộ cụm danh từ phía trước chính là Chủ ngữ!
      subject = words.slice(0, auxIndex).join(" ")
      verbIndex = auxIndex
    } else if (/^(i|you|he|she|it|we|they|someone|everyone|nobody|anybody)$/i.test(words[0])) {
      subject = words[0]
      verbIndex = /^(always|often|usually|never|already|just|still)$/i.test(words[1] || "") ? 2 : 1
    } else {
      // Tìm động từ quá khứ (-ed, bất quy tắc) hoặc hiện tại ngôi thứ 3 (-s/-es)
      let foundVerb = -1
      for (let i = 1; i < words.length; i++) {
        const w = (words[i] || "").toLowerCase()
        if (
          w.endsWith("ed") ||
          (IRREGULAR_VERBS[w] && IRREGULAR_VERBS[w].v2 === w) ||
          /^(went|saw|bought|took|made|came|found|said|told|thought|felt|knew|wrote|read|ran|ate|left|heard)$/.test(w) ||
          (w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("us") && i >= 1)
        ) {
          foundVerb = i
          break
        }
      }

      if (foundVerb > 0) {
        subject = words.slice(0, foundVerb).join(" ")
        verbIndex = foundVerb
      } else if (/^(my|the|a|an|his|her|their|our|this|that|these|those|some|many|all|every)\b/i.test(words[0]) && words.length > 2) {
        // Cụm danh từ ít nhất 2 từ
        subject = words.slice(0, Math.min(3, words.length - 1)).join(" ")
        verbIndex = Math.min(3, words.length - 1)
      } else {
        subject = words[0] || "Someone"
        verbIndex = 1
      }
    }
  }

  const subjLower = subject.toLowerCase()
  const isI = subjLower === "i"
  const isPlural =
    /^(they|we|you|my\s+friends|the\s+students|the\s+people|people|both|all)$/i.test(subjLower) ||
    (!isI &&
      !/^(he|she|it|this|that|someone|everyone|nobody|nothing|everybody)$/i.test(subjLower) &&
      /(s|men|people|children)$/i.test(subjLower) &&
      !/^(glass|grass|class|bus|pass|address)$/i.test(subjLower))
  const is3rdSingular = !isI && !isPlural && subjLower !== "you"

  const subjectType = isI
    ? "Đại từ nhân xưng ngôi thứ nhất (I)"
    : is3rdSingular
    ? `Ngôi thứ ba số ít (${subject})`
    : `Chủ ngữ số nhiều / Ngôi thứ hai (${subject})`

  const remaining = words.slice(verbIndex)
  const w0 = (remaining[0] || "").toLowerCase()
  const w1 = (remaining[1] || "").toLowerCase()

  let tense = "present-simple"
  let tenseNameEn = "Present Simple"
  let tenseNameVi = "Hiện tại đơn"
  let formula = is3rdSingular ? "S + V(s/es) + (O/Adv)" : "S + V(bare) + (O/Adv)"
  let mainVerb = remaining[0] || "is"
  let baseVerb = getBaseVerb(mainVerb)
  let consumedWords = 1

  const commonMidAdverbs = /^(already|just|never|ever|always|currently|still|definitely|really|also|recently)$/i
  let midAdverb = ""

  // --- CASE 1: WILL (Future Tenses) ---
  if (/^(will|won't|'ll)$/i.test(w0)) {
    let nextIdx = 1
    if (w1 === "not") nextIdx++
    const tw = (remaining[nextIdx] || "").toLowerCase()
    const tw1 = (remaining[nextIdx + 1] || "").toLowerCase()
    const tw2 = (remaining[nextIdx + 2] || "").toLowerCase()

    if (tw === "have" && tw1 === "been" && tw2.endsWith("ing")) {
      tense = "future-perfect-continuous"
      tenseNameEn = "Future Perfect Continuous"
      tenseNameVi = "Tương lai hoàn thành tiếp diễn"
      formula = "S + will have been + V-ing + (O/Adv)"
      mainVerb = "will have been " + tw2
      baseVerb = getBaseVerb(tw2)
      consumedWords = nextIdx + 3
    } else if (tw === "have" && isV3OrEd(tw1)) {
      tense = "future-perfect"
      tenseNameEn = "Future Perfect"
      tenseNameVi = "Tương lai hoàn thành"
      formula = "S + will have + V3/ed + (O/Adv)"
      mainVerb = "will have " + tw1
      baseVerb = getBaseVerb(tw1)
      consumedWords = nextIdx + 2
    } else if (tw === "be" && tw1.endsWith("ing")) {
      tense = "future-continuous"
      tenseNameEn = "Future Continuous"
      tenseNameVi = "Tương lai tiếp diễn"
      formula = "S + will be + V-ing + (O/Adv)"
      mainVerb = "will be " + tw1
      baseVerb = getBaseVerb(tw1)
      consumedWords = nextIdx + 2
    } else {
      tense = "future-simple"
      tenseNameEn = "Future Simple"
      tenseNameVi = "Tương lai đơn"
      formula = "S + will + V(bare) + (O/Adv)"
      const bare = tw || "do"
      mainVerb = "will " + bare
      baseVerb = getBaseVerb(bare)
      consumedWords = nextIdx + 1
    }
  }
  // --- CASE 2: HAVE / HAS (Present Perfect & Present Perfect Continuous) ---
  else if (/^(have|has|haven't|hasn't)$/i.test(w0)) {
    let nextIdx = 1
    if (w1 === "not") nextIdx++
    if (commonMidAdverbs.test(remaining[nextIdx] || "")) {
      midAdverb = remaining[nextIdx]
      nextIdx++
    }
    const tw = (remaining[nextIdx] || "").toLowerCase()
    const tw1 = (remaining[nextIdx + 1] || "").toLowerCase()

    if (tw === "been" && tw1.endsWith("ing")) {
      tense = "present-perfect-continuous"
      tenseNameEn = "Present Perfect Continuous"
      tenseNameVi = "Hiện tại hoàn thành tiếp diễn"
      formula = "S + have/has been + V-ing + (O/Adv)"
      mainVerb = `${w0} been ${tw1}`
      baseVerb = getBaseVerb(tw1)
      consumedWords = nextIdx + 2
    } else if (tw === "been") {
      tense = "present-perfect"
      tenseNameEn = "Present Perfect (To Be)"
      tenseNameVi = "Hiện tại hoàn thành (Động từ To Be)"
      formula = "S + have/has + been + Adj/Noun/Prep"
      mainVerb = `${w0} been`
      baseVerb = "be"
      consumedWords = nextIdx + 1
    } else if (isV3OrEd(tw)) {
      tense = "present-perfect"
      tenseNameEn = "Present Perfect"
      tenseNameVi = "Hiện tại hoàn thành"
      formula = "S + have/has + V3/ed + (O/Adv)"
      mainVerb = `${w0}${midAdverb ? " " + midAdverb : ""} ${tw}`
      baseVerb = getBaseVerb(tw)
      consumedWords = nextIdx + 1
    } else {
      // Lexical have/has
      tense = "present-simple"
      tenseNameEn = "Present Simple"
      tenseNameVi = "Hiện tại đơn"
      formula = is3rdSingular ? "S + has + (O/Adv)" : "S + have + (O/Adv)"
      mainVerb = w0
      baseVerb = "have"
      consumedWords = 1
    }
  }
  // --- CASE 3: HAD (Past Perfect & Past Perfect Continuous) ---
  else if (/^(had|hadn't)$/i.test(w0)) {
    let nextIdx = 1
    if (w1 === "not") nextIdx++
    if (commonMidAdverbs.test(remaining[nextIdx] || "")) {
      midAdverb = remaining[nextIdx]
      nextIdx++
    }
    const tw = (remaining[nextIdx] || "").toLowerCase()
    const tw1 = (remaining[nextIdx + 1] || "").toLowerCase()

    if (tw === "been" && tw1.endsWith("ing")) {
      tense = "past-perfect-continuous"
      tenseNameEn = "Past Perfect Continuous"
      tenseNameVi = "Quá khứ hoàn thành tiếp diễn"
      formula = "S + had been + V-ing + (O/Adv)"
      mainVerb = `had been ${tw1}`
      baseVerb = getBaseVerb(tw1)
      consumedWords = nextIdx + 2
    } else if (tw === "been") {
      tense = "past-perfect"
      tenseNameEn = "Past Perfect (To Be)"
      tenseNameVi = "Quá khứ hoàn thành (Động từ To Be)"
      formula = "S + had + been + Adj/Noun/Prep"
      mainVerb = "had been"
      baseVerb = "be"
      consumedWords = nextIdx + 1
    } else if (isV3OrEd(tw)) {
      tense = "past-perfect"
      tenseNameEn = "Past Perfect"
      tenseNameVi = "Quá khứ hoàn thành"
      formula = "S + had + V3/ed + (O/Adv)"
      mainVerb = `had ${tw}`
      baseVerb = getBaseVerb(tw)
      consumedWords = nextIdx + 1
    } else {
      tense = "past-simple"
      tenseNameEn = "Past Simple"
      tenseNameVi = "Quá khứ đơn"
      formula = "S + V2/ed + (O/Adv)"
      mainVerb = "had"
      baseVerb = "have"
      consumedWords = 1
    }
  }
  // --- CASE 4: AM / IS / ARE (Present Continuous / Near Future / Present Simple Be) ---
  else if (/^(am|is|are|isn't|aren't)$/i.test(w0)) {
    let nextIdx = 1
    if (w1 === "not") nextIdx++
    const tw = (remaining[nextIdx] || "").toLowerCase()
    const tw1 = (remaining[nextIdx + 1] || "").toLowerCase()
    const tw2 = (remaining[nextIdx + 2] || "").toLowerCase()

    if (tw === "going" && tw1 === "to" && tw2) {
      tense = "near-future"
      tenseNameEn = "Near Future (Be going to)"
      tenseNameVi = "Tương lai gần (Be going to)"
      formula = "S + am/is/are + going to + V(bare) + (O/Adv)"
      mainVerb = `${w0} going to ${tw2}`
      baseVerb = getBaseVerb(tw2)
      consumedWords = nextIdx + 3
    } else if (tw.endsWith("ing")) {
      tense = "present-continuous"
      tenseNameEn = "Present Continuous"
      tenseNameVi = "Hiện tại tiếp diễn"
      formula = "S + am/is/are + V-ing + (O/Adv)"
      mainVerb = `${w0} ${tw}`
      baseVerb = getBaseVerb(tw)
      consumedWords = nextIdx + 1
    } else {
      tense = "present-simple"
      tenseNameEn = "Present Simple (To Be)"
      tenseNameVi = "Hiện tại đơn (Động từ To Be)"
      formula = "S + am/is/are + Adj/Noun/Prep"
      mainVerb = w0
      baseVerb = "be"
      consumedWords = nextIdx
    }
  }
  // --- CASE 5: WAS / WERE (Past Continuous / Past Simple Be) ---
  else if (/^(was|were|wasn't|weren't)$/i.test(w0)) {
    let nextIdx = 1
    if (w1 === "not") nextIdx++
    const tw = (remaining[nextIdx] || "").toLowerCase()

    if (tw.endsWith("ing")) {
      tense = "past-continuous"
      tenseNameEn = "Past Continuous"
      tenseNameVi = "Quá khứ tiếp diễn"
      formula = "S + was/were + V-ing + (O/Adv)"
      mainVerb = `${w0} ${tw}`
      baseVerb = getBaseVerb(tw)
      consumedWords = nextIdx + 1
    } else {
      tense = "past-simple"
      tenseNameEn = "Past Simple (To Be)"
      tenseNameVi = "Quá khứ đơn (Động từ To Be)"
      formula = "S + was/were + Adj/Noun/Prep"
      mainVerb = w0
      baseVerb = "be"
      consumedWords = nextIdx
    }
  }
  // --- CASE 6: MODAL VERBS ---
  else if (/^(can|could|should|would|must|may|might)$/i.test(w0)) {
    let nextIdx = 1
    if (w1 === "not") nextIdx++
    const tw = remaining[nextIdx] || "do"
    tense = "modal-verbs"
    tenseNameEn = "Modal Verbs"
    tenseNameVi = "Động từ khuyết thiếu"
    formula = `S + ${w0} + V(bare) + (O/Adv)`
    mainVerb = `${w0} ${tw}`
    baseVerb = getBaseVerb(tw)
    consumedWords = nextIdx + 1
  }
  // --- CASE 7: DIDN'T / DID NOT (Past Simple Negative) ---
  else if (/^(didn't|didnt)$/i.test(w0) || (w0 === "did" && w1 === "not")) {
    const nextIdx = w0 === "did" ? 2 : 1
    const bare = remaining[nextIdx] || "do"
    tense = "past-simple"
    tenseNameEn = "Past Simple (Negative)"
    tenseNameVi = "Quá khứ đơn (Thể phủ định)"
    formula = "S + did not + V(bare) + (O/Adv)"
    mainVerb = `${w0 === "did" ? "did not" : w0} ${bare}`
    baseVerb = getBaseVerb(bare)
    consumedWords = nextIdx + 1
  }
  // --- CASE 8: DON'T / DOESN'T / DO NOT / DOES NOT (Present Simple Negative) ---
  else if (/^(don't|dont|doesn't|doesnt)$/i.test(w0) || (/^(do|does)$/i.test(w0) && w1 === "not")) {
    const nextIdx = /^(do|does)$/i.test(w0) ? 2 : 1
    const bare = remaining[nextIdx] || "do"
    tense = "present-simple"
    tenseNameEn = "Present Simple (Negative)"
    tenseNameVi = "Hiện tại đơn (Thể phủ định)"
    formula = "S + do/does not + V(bare) + (O/Adv)"
    mainVerb = `${/^(do|does)$/i.test(w0) ? `${w0} not` : w0} ${bare}`
    baseVerb = getBaseVerb(bare)
    consumedWords = nextIdx + 1
  }
  // --- CASE 9: PAST SIMPLE REGULAR / IRREGULAR ---
  else if (
    w0.endsWith("ed") ||
    (IRREGULAR_VERBS[w0] && IRREGULAR_VERBS[w0].v2 === w0 && IRREGULAR_VERBS[w0].v1 !== w0)
  ) {
    tense = "past-simple"
    tenseNameEn = "Past Simple"
    tenseNameVi = "Quá khứ đơn"
    formula = "S + V2/ed + (O/Adv)"
    mainVerb = remaining[0]
    baseVerb = getBaseVerb(w0)
    consumedWords = 1
  }
  // --- CASE 10: PRESENT SIMPLE REGULAR ---
  else {
    tense = "present-simple"
    tenseNameEn = "Present Simple"
    tenseNameVi = "Hiện tại đơn"
    formula = is3rdSingular ? "S + V(s/es) + (O/Adv)" : "S + V(bare) + (O/Adv)"
    mainVerb = remaining[0] || "do"
    baseVerb = getBaseVerb(mainVerb)
    consumedWords = 1
  }

  // Complement: các từ còn lại trong mệnh đề chính + mệnh đề đuôi nếu có
  const mainClauseRest = remaining.slice(consumedWords).join(" ").trim()
  const cleanTail = tailClause.trim().replace(/^,\s*/, "")
  const complement = [mainClauseRest, cleanTail].filter(Boolean).join(" ").trim()

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
    isNegative,
    isQuestion,
  }
}

/**
 * Tạo các thể câu (+), (-), (?) và các thì thời gian khác cho một câu
 */
export function generateSentenceForms(parsed: ParsedSentence) {
  const { subject, is3rdSingular, isI, baseVerb, complement, tense } = parsed
  const comp = complement ? " " + complement : ""
  const subjQ = isI
    ? "I"
    : /^[A-Z][a-z]+$/.test(subject)
    ? subject
    : subject.charAt(0).toLowerCase() + subject.slice(1)

  let affirmative = ""
  let negative = ""
  let interrogative = ""
  let shortAnswer = ""

  const ving = getVing(baseVerb)
  const v3 = getV3(baseVerb)
  const v2 = getV2(baseVerb)
  const vs = is3rdSingular ? getVs(baseVerb) : baseVerb

  if (tense === "present-perfect-continuous") {
    const aux = is3rdSingular ? "has" : "have"
    const auxNeg = is3rdSingular ? "has not (hasn't)" : "have not (haven't)"
    affirmative = `${subject} ${aux} been ${ving}${comp}.`
    negative = `${subject} ${auxNeg} been ${ving}${comp}.`
    interrogative = `${aux.charAt(0).toUpperCase() + aux.slice(1)} ${subjQ} been ${ving}${comp}?`
    shortAnswer = `Yes, ${subject} ${aux}. / No, ${subject} ${is3rdSingular ? "hasn't" : "haven't"}.`
  } else if (tense === "past-perfect-continuous") {
    affirmative = `${subject} had been ${ving}${comp}.`
    negative = `${subject} had not (hadn't) been ${ving}${comp}.`
    interrogative = `Had ${subjQ} been ${ving}${comp}?`
    shortAnswer = `Yes, ${subject} had. / No, ${subject} hadn't.`
  } else if (tense === "future-perfect-continuous") {
    affirmative = `${subject} will have been ${ving}${comp}.`
    negative = `${subject} will not (won't) have been ${ving}${comp}.`
    interrogative = `Will ${subjQ} have been ${ving}${comp}?`
    shortAnswer = `Yes, ${subject} will. / No, ${subject} won't.`
  } else if (tense === "future-perfect") {
    affirmative = `${subject} will have ${v3}${comp}.`
    negative = `${subject} will not (won't) have ${v3}${comp}.`
    interrogative = `Will ${subjQ} have ${v3}${comp}?`
    shortAnswer = `Yes, ${subject} will. / No, ${subject} won't.`
  } else if (tense === "future-continuous") {
    affirmative = `${subject} will be ${ving}${comp}.`
    negative = `${subject} will not (won't) be ${ving}${comp}.`
    interrogative = `Will ${subjQ} be ${ving}${comp}?`
    shortAnswer = `Yes, ${subject} will. / No, ${subject} won't.`
  } else if (tense === "future-simple") {
    affirmative = `${subject} will ${baseVerb}${comp}.`
    negative = `${subject} will not (won't) ${baseVerb}${comp}.`
    interrogative = `Will ${subjQ} ${baseVerb}${comp}?`
    shortAnswer = `Yes, ${subject} will. / No, ${subject} won't.`
  } else if (tense === "near-future") {
    const beWord = isI ? "am" : is3rdSingular ? "is" : "are"
    const beNeg = isI ? "am not" : is3rdSingular ? "is not (isn't)" : "are not (aren't)"
    affirmative = `${subject} ${beWord} going to ${baseVerb}${comp}.`
    negative = `${subject} ${beNeg} going to ${baseVerb}${comp}.`
    interrogative = `${beWord.charAt(0).toUpperCase() + beWord.slice(1)} ${subjQ} going to ${baseVerb}${comp}?`
    shortAnswer = `Yes, ${subject} ${beWord}. / No, ${subject} ${isI ? "am not" : is3rdSingular ? "isn't" : "aren't"}.`
  } else if (tense === "past-perfect") {
    affirmative = `${subject} had ${v3}${comp}.`
    negative = `${subject} had not (hadn't) ${v3}${comp}.`
    interrogative = `Had ${subjQ} ${v3}${comp}?`
    shortAnswer = `Yes, ${subject} had. / No, ${subject} hadn't.`
  } else if (tense === "past-continuous") {
    const beWord = isI || is3rdSingular ? "was" : "were"
    const beNeg = isI || is3rdSingular ? "was not (wasn't)" : "were not (weren't)"
    affirmative = `${subject} ${beWord} ${ving}${comp}.`
    negative = `${subject} ${beNeg} ${ving}${comp}.`
    interrogative = `${beWord.charAt(0).toUpperCase() + beWord.slice(1)} ${subjQ} ${ving}${comp}?`
    shortAnswer = `Yes, ${subject} ${beWord}. / No, ${subject} ${isI || is3rdSingular ? "wasn't" : "weren't"}.`
  } else if (tense === "present-continuous") {
    const beWord = isI ? "am" : is3rdSingular ? "is" : "are"
    const beNeg = isI ? "am not" : is3rdSingular ? "is not (isn't)" : "are not (aren't)"
    affirmative = `${subject} ${beWord} ${ving}${comp}.`
    negative = `${subject} ${beNeg} ${ving}${comp}.`
    interrogative = `${beWord.charAt(0).toUpperCase() + beWord.slice(1)} ${subjQ} ${ving}${comp}?`
    shortAnswer = `Yes, ${subject} ${beWord}. / No, ${subject} ${isI ? "am not" : is3rdSingular ? "isn't" : "aren't"}.`
  } else if (tense === "present-perfect") {
    const aux = is3rdSingular ? "has" : "have"
    const auxNeg = is3rdSingular ? "has not (hasn't)" : "have not (haven't)"
    affirmative = `${subject} ${aux} ${v3}${comp}.`
    negative = `${subject} ${auxNeg} ${v3}${comp}.`
    interrogative = `${aux.charAt(0).toUpperCase() + aux.slice(1)} ${subjQ} ${v3}${comp}?`
    shortAnswer = `Yes, ${subject} ${aux}. / No, ${subject} ${is3rdSingular ? "hasn't" : "haven't"}.`
  } else if (tense === "past-simple") {
    if (baseVerb === "be") {
      const beWord = isI || is3rdSingular ? "was" : "were"
      const beNeg = isI || is3rdSingular ? "was not (wasn't)" : "were not (weren't)"
      affirmative = `${subject} ${beWord}${comp}.`
      negative = `${subject} ${beNeg}${comp}.`
      interrogative = `${beWord.charAt(0).toUpperCase() + beWord.slice(1)} ${subjQ}${comp}?`
      shortAnswer = `Yes, ${subject} ${beWord}. / No, ${subject} ${isI || is3rdSingular ? "wasn't" : "weren't"}.`
    } else {
      affirmative = `${subject} ${v2}${comp}.`
      negative = `${subject} did not (didn't) ${baseVerb}${comp}.`
      interrogative = `Did ${subjQ} ${baseVerb}${comp}?`
      shortAnswer = `Yes, ${subject} did. / No, ${subject} didn't.`
    }
  } else if (tense === "modal-verbs") {
    const modalWord = parsed.mainVerb.split(" ")[0] || "can"
    const modalNeg = modalWord === "can" ? "cannot (can't)" : `${modalWord} not (${modalWord}n't)`
    affirmative = `${subject} ${modalWord} ${baseVerb}${comp}.`
    negative = `${subject} ${modalNeg} ${baseVerb}${comp}.`
    interrogative = `${modalWord.charAt(0).toUpperCase() + modalWord.slice(1)} ${subjQ} ${baseVerb}${comp}?`
    shortAnswer = `Yes, ${subject} ${modalWord}. / No, ${subject} ${modalWord === "can" ? "can't" : modalWord + "n't"}.`
  } else {
    // Present Simple
    if (baseVerb === "be") {
      const beWord = isI ? "am" : is3rdSingular ? "is" : "are"
      const beNeg = isI ? "am not" : is3rdSingular ? "is not (isn't)" : "are not (aren't)"
      affirmative = `${subject} ${beWord}${comp}.`
      negative = `${subject} ${beNeg}${comp}.`
      interrogative = `${beWord.charAt(0).toUpperCase() + beWord.slice(1)} ${subjQ}${comp}?`
      shortAnswer = `Yes, ${subject} ${beWord}. / No, ${subject} ${isI ? "am not" : is3rdSingular ? "isn't" : "aren't"}.`
    } else {
      const auxNeg = is3rdSingular ? "does not (doesn't)" : "do not (don't)"
      const auxQ = is3rdSingular ? "Does" : "Do"
      affirmative = `${subject} ${vs}${comp}.`
      negative = `${subject} ${auxNeg} ${baseVerb}${comp}.`
      interrogative = `${auxQ} ${subjQ} ${baseVerb}${comp}?`
      shortAnswer = is3rdSingular
        ? `Yes, ${subject} does. / No, ${subject} doesn't.`
        : `Yes, ${subject} do. / No, ${subject} don't.`
    }
  }

  // Tense variations across 12 tenses
  const beWordPres = isI ? "am" : is3rdSingular ? "is" : "are"
  const vPres = is3rdSingular ? vs : baseVerb
  const vPast = baseVerb === "be" ? (isI || is3rdSingular ? "was" : "were") : v2
  const auxPerf = is3rdSingular ? "has" : "have"

  const tenses = {
    presentSimple: `${subject} ${baseVerb === "be" ? beWordPres : vPres}${comp}.`,
    presentContinuous: `${subject} ${beWordPres} ${baseVerb === "be" ? "being" : ving}${comp}.`,
    presentPerfect: `${subject} ${auxPerf} ${baseVerb === "be" ? "been" : v3}${comp}.`,
    presentPerfectContinuous: `${subject} ${auxPerf} been ${ving}${comp}.`,
    pastSimple: `${subject} ${vPast}${comp}.`,
    pastContinuous: `${subject} ${isI || is3rdSingular ? "was" : "were"} ${baseVerb === "be" ? "being" : ving}${comp}.`,
    pastPerfect: `${subject} had ${baseVerb === "be" ? "been" : v3}${comp}.`,
    pastPerfectContinuous: `${subject} had been ${ving}${comp}.`,
    futureSimple: `${subject} will ${baseVerb}${comp}.`,
    futureContinuous: `${subject} will be ${ving}${comp}.`,
    futurePerfect: `${subject} will have ${baseVerb === "be" ? "been" : v3}${comp}.`,
    futurePerfectContinuous: `${subject} will have been ${ving}${comp}.`,
  }

  return { affirmative, negative, interrogative, shortAnswer, tenses }
}

/**
 * Tạo 3 câu tương tự cùng cấu trúc với bản dịch tiếng Việt
 */
export function generateSentenceSimilarExamples(parsed: ParsedSentence): { en: string; vi: string }[] {
  const { tense, baseVerb } = parsed

  if (tense === "present-perfect-continuous") {
    return [
      {
        en: "They **have been working** on this complex AI project for six months.",
        vi: "Họ đã và đang làm việc trong dự án AI phức tạp này được sáu tháng liên tục.",
      },
      {
        en: "She **has been practicing** the piano diligently all afternoon.",
        vi: "Cô ấy đã luyện tập đàn dương cầm chăm chỉ suốt cả buổi chiều.",
      },
      {
        en: "We **have been living** in this peaceful neighborhood since last year.",
        vi: "Chúng tôi đã sinh sống tại khu phố yên bình này từ năm ngoái đến nay.",
      },
    ]
  }

  if (tense === "past-perfect-continuous") {
    return [
      {
        en: "He **had been waiting** for two hours before the flight finally departed.",
        vi: "Anh ấy đã đợi suốt hai tiếng trước khi chuyến bay cuối cùng cũng khởi hành.",
      },
      {
        en: "They **had been discussing** the contract terms before signing it.",
        vi: "Họ đã thảo luận kỹ các điều khoản hợp đồng trước khi ký kết.",
      },
      {
        en: "She was tired because she **had been running** in the marathon.",
        vi: "Cô ấy kiệt sức vì đã chạy trong cuộc thi ma-ra-tông trước đó.",
      },
    ]
  }

  if (tense === "future-perfect" || tense === "future-perfect-continuous") {
    return [
      {
        en: "By next month, our team **will have completed** the entire curriculum.",
        vi: "Đến tháng sau, đội ngũ của chúng tôi sẽ đã hoàn thành toàn bộ giáo trình.",
      },
      {
        en: "She **will have been working** at the company for ten years by 2027.",
        vi: "Đến năm 2027 cô ấy sẽ đã làm việc tại công ty tròn mười năm.",
      },
      {
        en: "By the time you return, they **will have built** the new library.",
        vi: "Trước khi bạn trở lại, họ sẽ đã xây xong thư viện mới.",
      },
    ]
  }

  if (tense === "present-perfect") {
    return [
      {
        en: "She **has achieved** remarkable improvements in her English fluency.",
        vi: "Cô ấy đã đạt được những tiến bộ vượt bậc về độ lưu loát tiếng Anh.",
      },
      {
        en: "We **have visited** many famous historical landmarks across Vietnam.",
        vi: "Chúng tôi đã ghé thăm nhiều di tích lịch sử nổi tiếng trên khắp Việt Nam.",
      },
      {
        en: "They **have lived** in this vibrant city for more than a decade.",
        vi: "Họ đã sinh sống tại thành phố sôi động này hơn một thập kỷ.",
      },
    ]
  }

  if (tense === "past-continuous") {
    return [
      {
        en: "I **was studying** in the university library when the heavy storm hit.",
        vi: "Tôi đang học tại thư viện trường đại học thì cơn bão lớn đổ bộ.",
      },
      {
        en: "While they **were having** lunch, the manager announced the promotion.",
        vi: "Trong khi họ đang dùng bữa trưa thì người quản lý đã công bố quyết định thăng chức.",
      },
      {
        en: "She **was reading** a fascinating scientific journal at 9 p.m. yesterday.",
        vi: "Tối qua lúc 9 giờ cô ấy đang đọc một bài báo khoa học rất lôi cuốn.",
      },
    ]
  }

  if (["live", "work", "stay", "study", "travel"].includes(baseVerb)) {
    return [
      {
        en: "My brother works at a multinational company in Ho Chi Minh City.",
        vi: "Anh trai tôi làm việc tại một công ty đa quốc gia ở TP. Hồ Chí Minh.",
      },
      {
        en: "They study English at a prestigious university in Da Nang.",
        vi: "Họ học tiếng Anh tại một trường đại học danh tiếng ở Đà Nẵng.",
      },
      {
        en: "David stays at a cozy hotel near the lake every weekend.",
        vi: "David ở tại một khách sạn ấm cúng gần hồ vào mỗi dịp cuối tuần.",
      },
    ]
  }

  return [
    {
      en: `Alex always practices ${baseVerb}ing with great enthusiasm every day.`,
      vi: `Alex luôn luyện tập mỗi ngày với tinh thần hào hứng cao độ.`,
    },
    {
      en: `They successfully managed to ${baseVerb} during their project last week.`,
      vi: `Họ đã hoàn thành xuất sắc công việc trong dự án tuần trước.`,
    },
    {
      en: `Many students choose to ${baseVerb} to improve their professional skills.`,
      vi: `Nhiều sinh viên lựa chọn điều này để cải thiện kỹ năng chuyên môn của mình.`,
    },
  ]
}

/**
 * Tạo câu hỏi trắc nghiệm dựa trực tiếp trên câu của người dùng
 */
export function generateSentenceQuizQuestions(parsed: ParsedSentence) {
  const { cleanSentence, subject, is3rdSingular, baseVerb, complement, tense, mainVerb } = parsed
  const comp = complement ? " " + complement : ""
  const forms = generateSentenceForms(parsed)

  // Câu 1: Chia động từ
  let q1Options: string[] = []
  let q1Answer = ""
  let q1Explanation = ""

  const subjQ = parsed.isI
    ? "I"
    : /^[A-Z][a-z]+$/.test(subject)
    ? subject
    : subject.charAt(0).toLowerCase() + subject.slice(1)

  if (tense === "present-perfect-continuous") {
    const correctV = parsed.mainVerb
    const wrongV1 = `${parsed.is3rdSingular ? "have" : "has"} been ${getVing(parsed.baseVerb)}`
    const wrongV2 = `was ${getVing(parsed.baseVerb)}`
    const wrongV3 = `had been ${parsed.baseVerb}`
    q1Options = [`A. ${correctV}`, `B. ${wrongV1}`, `C. ${wrongV2}`, `D. ${wrongV3}`]
    q1Answer = `A. ${correctV}`
    q1Explanation = `Chủ ngữ "${subject}" đi với thì Hiện tại hoàn thành tiếp diễn để nhấn mạnh thời lượng hành động kéo dài từ quá khứ đến hiện tại ➔ **${correctV}**.`
  } else if (tense === "past-perfect-continuous") {
    const correctV = parsed.mainVerb
    const wrongV1 = `has been ${getVing(parsed.baseVerb)}`
    const wrongV2 = `had ${parsed.baseVerb}`
    const wrongV3 = `was ${parsed.baseVerb}`
    q1Options = [`A. ${correctV}`, `B. ${wrongV1}`, `C. ${wrongV2}`, `D. ${wrongV3}`]
    q1Answer = `A. ${correctV}`
    q1Explanation = `Cấu trúc thì Quá khứ hoàn thành tiếp diễn: S + had been + V-ing ➔ **${correctV}**.`
  } else if (tense === "present-perfect") {
    const correctV = parsed.mainVerb
    const wrongV1 = `${parsed.is3rdSingular ? "have" : "has"} ${getV3(parsed.baseVerb)}`
    const wrongV2 = parsed.baseVerb
    const wrongV3 = `is ${getVing(parsed.baseVerb)}`
    q1Options = [`A. ${correctV}`, `B. ${wrongV1}`, `C. ${wrongV2}`, `D. ${wrongV3}`]
    q1Answer = `A. ${correctV}`
    q1Explanation = `Cấu trúc thì Hiện tại hoàn thành: S + have/has + V3/ed ➔ **${correctV}**.`
  } else if (tense === "present-simple") {
    const vs = getVs(baseVerb)
    q1Options = [`A. ${baseVerb}`, `B. ${vs}`, `C. ${getVing(baseVerb)}`, `D. is ${baseVerb}`]
    q1Answer = is3rdSingular ? `B. ${vs}` : `A. ${baseVerb}`
    q1Explanation = is3rdSingular
      ? `Vì chủ ngữ "${subject}" là ngôi thứ ba số ít ở thì Hiện tại đơn, động từ chính bắt buộc thêm đuôi "-s/-es" ➔ **${vs}**.`
      : `Vì chủ ngữ "${subject}" là ngôi thứ nhất / số nhiều ở thì Hiện tại đơn, động từ chính giữ nguyên mẫu ➔ **${baseVerb}**.`
  } else if (tense === "past-simple") {
    const v2 = getV2(baseVerb)
    q1Options = [`A. ${baseVerb}`, `B. ${getVs(baseVerb)}`, `C. ${v2}`, `D. ${getV3(baseVerb)}`]
    q1Answer = `C. ${v2}`
    q1Explanation = `Câu diễn tả hành động trong quá khứ nên động từ chia ở dạng Quá khứ đơn V2 ➔ **${v2}**.`
  } else {
    q1Options = [`A. ${mainVerb}`, `B. ${baseVerb}`, `C. ${getVs(baseVerb)}`, `D. ${getV2(baseVerb)}`]
    q1Answer = `A. ${mainVerb}`
    q1Explanation = `Cấu trúc chuẩn của thì ${parsed.tenseNameVi} áp dụng cho chủ ngữ "${subject}" là **${mainVerb}**.`
  }

  // Câu 2: Thể phủ định
  let wrongNeg1 = ""
  let wrongNeg2 = ""
  let wrongNeg3 = ""

  if (tense === "present-perfect-continuous") {
    wrongNeg1 = `${subject} do not have been ${getVing(baseVerb)}${comp}.`
    wrongNeg2 = `${subject} haven't be ${getVing(baseVerb)}${comp}.`
    wrongNeg3 = `${subject} not have been ${getVing(baseVerb)}${comp}.`
  } else if (tense === "present-perfect") {
    wrongNeg1 = `${subject} didn't ${getV3(baseVerb)}${comp}.`
    wrongNeg2 = `${subject} ${is3rdSingular ? "don't" : "doesn't"} have ${getV3(baseVerb)}${comp}.`
    wrongNeg3 = `${subject} not ${getV3(baseVerb)}${comp}.`
  } else if (tense.startsWith("future")) {
    wrongNeg1 = `${subject} not will ${baseVerb}${comp}.`
    wrongNeg2 = `${subject} don't will ${baseVerb}${comp}.`
    wrongNeg3 = `${subject} won't ${getVs(baseVerb)}${comp}.`
  } else {
    wrongNeg1 = is3rdSingular
      ? `${subject} don't ${baseVerb}${comp}.`
      : `${subject} doesn't ${baseVerb}${comp}.`
    wrongNeg2 = `${subject} not ${baseVerb}${comp}.`
    wrongNeg3 = `${subject} doesn't ${getVs(baseVerb)}${comp}.`
  }

  const q2Options = [`A. ${forms.negative}`, `B. ${wrongNeg1}`, `C. ${wrongNeg2}`, `D. ${wrongNeg3}`]
  const q2Answer = `A. ${forms.negative}`
  const q2Explanation = `Thể phủ định chuẩn xác của thì ${parsed.tenseNameVi}: **${forms.negative}**.`

  // Câu 3: Thể nghi vấn
  let wrongQ1 = ""
  let wrongQ2 = ""
  let wrongQ3 = ""

  if (tense === "present-perfect-continuous") {
    wrongQ1 = `Do ${subjQ} have been ${getVing(baseVerb)}${comp}?`
    wrongQ2 = `Did ${subjQ} have been ${getVing(baseVerb)}${comp}?`
    wrongQ3 = `Have been ${subjQ} ${getVing(baseVerb)}${comp}?`
  } else if (tense === "present-perfect") {
    wrongQ1 = `Do ${subjQ} have ${getV3(baseVerb)}${comp}?`
    wrongQ2 = `Did ${subjQ} have ${getV3(baseVerb)}${comp}?`
    wrongQ3 = `Has ${subjQ} ${baseVerb}${comp}?`
  } else if (tense.startsWith("future")) {
    wrongQ1 = `Do ${subjQ} will ${baseVerb}${comp}?`
    wrongQ2 = `Will ${subjQ} ${getVs(baseVerb)}${comp}?`
    wrongQ3 = `Are ${subjQ} will ${baseVerb}${comp}?`
  } else {
    wrongQ1 = is3rdSingular
      ? `Do ${subjQ} ${baseVerb}${comp}?`
      : `Does ${subjQ} ${baseVerb}${comp}?`
    wrongQ2 = `Is ${subjQ} ${baseVerb}${comp}?`
    wrongQ3 = `Did ${subjQ} ${getVs(baseVerb)}${comp}?`
  }

  const q3Options = [`A. ${forms.interrogative}`, `B. ${wrongQ1}`, `C. ${wrongQ2}`, `D. ${wrongQ3}`]
  const q3Answer = `A. ${forms.interrogative}`
  const q3Explanation = `Đưa trợ động từ lên trước chủ ngữ để tạo thể nghi vấn chuẩn: **${forms.interrogative}**.`

  return [
    {
      question: `Complete the sentence with the correct verb form:\n> "${subject} _______${comp}."`,
      options: q1Options,
      answer: q1Answer,
      explanation: q1Explanation,
    },
    {
      question: `Chọn dạng PHỦ ĐỊNH chính xác của câu: "${cleanSentence}"`,
      options: q2Options,
      answer: q2Answer,
      explanation: q2Explanation,
    },
    {
      question: `Chọn dạng NGHI VẤN (câu hỏi) chính xác của câu: "${cleanSentence}"`,
      options: q3Options,
      answer: q3Answer,
      explanation: q3Explanation,
    },
  ]
}

/**
 * Bóc tách và phân tích ngữ pháp cho một câu cụ thể
 */
export function generateSentenceGrammarAnalysis(
  parsed: ParsedSentence,
  targetText: string,
  startTime: number
): LocalDynamicResult {
  const { errors, correctedSentence } = analyzeGrammarDynamically(targetText)
  const nlpFeatures = extractNLPFeatures(targetText)
  const jflegMatch = findSimilarJflegSentence(targetText)

  let jflegSection = ""
  if (jflegMatch) {
    jflegSection = `\n\n---\n\n📚 **Tham khảo Ngân hàng Chuẩn JFLEG (Johns Hopkins University):**\n- *Câu người học tương tự:* "${jflegMatch.learnerSentence}"\n- *Bản sửa chuẩn bản ngữ:* "**${jflegMatch.nativeCorrection}**"`
  }

  let errorSection = ""
  if (errors.length > 0) {
    const tableHeader =
      "| Lỗi phát hiện | Vị trí sai | Cách sửa chuẩn | Nguyên nhân ngữ pháp |\n| :--- | :--- | :--- | :--- |"
    const tableRows = errors
      .map(
        (err, idx) =>
          `| **${idx + 1}. ${err.type}** | \`${err.badPart}\` | **\`${err.goodPart}\`** | ${err.reason} |`
      )
      .join("\n")

    errorSection = `#### ⚠️ Điểm ngữ pháp cần hiệu chỉnh (${errors.length} lỗi):
${tableHeader}
${tableRows}

✅ **Câu chuẩn đã sửa:** "**${correctedSentence}**"

---`
  } else {
    errorSection = `#### ✅ Đánh giá độ chính xác Cú pháp:
Câu văn của bạn có cấu trúc **hoàn toàn chính xác ngữ pháp**, không phát hiện lỗi chia động từ hay hòa hợp chủ ngữ!

---`
  }

  const reply = `### 🔍 Bóc tách & Tra cứu Ngữ pháp cho Câu của Bạn

> **"${targetText}"**

---

${errorSection}

#### 🧩 1. Bóc tách Thành phần Câu (Syntactic Breakdown):
| Thành phần Cú pháp | Từ trong câu | Vai trò & Đặc điểm Ngữ pháp |
| :--- | :--- | :--- |
| **Chủ ngữ (Subject)** | \`${parsed.subject}\` | ${parsed.subjectType} |
| **Động từ chính (Main Verb)** | \`${parsed.mainVerb}\` | Chia ở thì ${parsed.tenseNameVi} (Động từ nguyên mẫu: *${parsed.baseVerb}*) |
| **Bổ ngữ / Tân ngữ / Trạng từ** | \`${parsed.complement || "(Không có)"}\` | Bổ ngữ hoàn thiện ý nghĩa cho câu |

---

#### 📘 2. Cấu trúc & Thì Áp dụng:
- **Thì ngữ pháp:** **${parsed.tenseNameVi} (${parsed.tenseNameEn})**
- **Công thức chuẩn:** \`${parsed.formula}\`
- **Quy tắc hòa hợp Chủ ngữ - Động từ (S-V Agreement):** ${
    parsed.is3rdSingular
      ? `Chủ ngữ ngôi thứ 3 số ít (*${parsed.subject}*) yêu cầu động từ chia số ít (thêm *-s/-es* ở HTĐ, dùng *has/is/was*).`
      : `Chủ ngữ (*${parsed.subject}*) đi kèm động từ nguyên mẫu hoặc trợ động từ số nhiều (*have/are/were*).`
  }

---

#### 🌟 3. Các dạng câu mở rộng:
- **Khẳng định (+):** \`${generateSentenceForms(parsed).affirmative}\`
- **Phủ định (-):** \`${generateSentenceForms(parsed).negative}\`
- **Nghi vấn (?):** \`${generateSentenceForms(parsed).interrogative}\`${jflegSection}

---

📊 **Chỉ số khoa học phân tích từ mô hình ML nội bộ (ml_engine):**
- **Độ dễ đọc (Flesch Reading Ease):** \`${nlpFeatures.flesch_reading_ease}/100\`
- **Độ đa dạng từ vựng (TTR):** \`${(nlpFeatures.lexical_diversity * 100).toFixed(1)}%\`
- **Tỷ lệ từ học thuật CEFR:** \`${(nlpFeatures.advanced_vocab_ratio * 100).toFixed(1)}%\`

*(Phân tích tự động 100% nội bộ trên máy, 0ms, không gọi API).*`

  return {
    reply,
    model: `AI Nội bộ (Phân tích cú pháp: ${parsed.tense})`,
    executionTimeMs: Date.now() - startTime,
  }
}

// ==========================================
// CÁC BỘ XỬ LÝ CHUYÊN BIỆT THEO LOẠI CÂU HỎI
// ==========================================

/**
 * 1. Chế độ: Sửa lỗi câu & Ngữ pháp (error_correction)
 */
function handleCategoryErrorCorrection(query: string, startTime: number): LocalDynamicResult {
  const targetText = extractTargetSentence(query)

  // Nếu người dùng nhập chủ điểm ngữ pháp (như "mạo từ", "thì quá khứ") thay vì câu
  const topic = findGrammarTopic(targetText)
  if (topic && !isLikelyEnglishSentence(targetText)) {
    const extData = TOPIC_EXTENDED_DATA[topic.slug]
    const sample = extData?.negative?.[0] || extData?.affirmative?.[0] || topic.examples[0]
    return {
      reply: `💡 **Chế độ Sửa lỗi câu & Ngữ pháp cho chủ điểm: ${topic.name} (${topic.vi})**

Bạn đã chọn nhãn **"Sửa lỗi câu"**. Vui lòng dán câu tiếng Anh bạn muốn kiểm tra lỗi liên quan đến chủ điểm **${topic.vi}**.

Ví dụ câu bạn có thể thử gửi:
- *"${sample?.en || "She don't like apple"}"*

Hệ thống sẽ lập tức bóc tách từng lỗi, chỉ ra vị trí sai và đối chiếu với ngân hàng 1.501 câu bản ngữ JFLEG!`,
      model: `AI Nội bộ (Hướng dẫn sửa lỗi: ${topic.slug})`,
      executionTimeMs: Date.now() - startTime,
    }
  }

  if (!targetText || targetText.length < 2) {
    return {
      reply: `💡 **Chế độ Sửa lỗi câu & Ngữ pháp:**\n\nVui lòng dán câu tiếng Anh bạn muốn kiểm tra lỗi (Ví dụ: *"She don't like apple"* hoặc *"I has been waiting here since two hours"*). Hệ thống sẽ bóc tách từng lỗi ngữ pháp và đối chiếu với ngân hàng 1.501 câu bản ngữ JFLEG!`,
      model: "AI Nội bộ (Sửa lỗi câu)",
      executionTimeMs: Date.now() - startTime,
    }
  }

  const { errors, correctedSentence } = analyzeGrammarDynamically(targetText)
  const nlpFeatures = extractNLPFeatures(targetText)
  const jflegMatch = findSimilarJflegSentence(targetText)

  const hasJflegRefinement = Boolean(
    jflegMatch &&
    jflegMatch.similarity >= 0.45 &&
    jflegMatch.learnerSentence.trim().toLowerCase() !== jflegMatch.nativeCorrection.trim().toLowerCase()
  )

  let jflegSection = ""
  if (jflegMatch) {
    jflegSection = `\n\n---\n\n📚 **Tham khảo từ Bộ dữ liệu Chuẩn JFLEG (1.501 mẫu câu người học & bản ngữ):**\n- *Câu người học tương tự:* "${jflegMatch.learnerSentence}"\n- *Bản sửa mượt mà từ người bản xứ:* "**${jflegMatch.nativeCorrection}**"`
  }

  // A. Nếu câu có lỗi từ bộ phân tích cú pháp
  if (errors.length > 0) {
    const tableHeader = "| Lỗi phát hiện | Vị trí sai | Cách sửa chuẩn | Nguyên nhân ngữ pháp |\n| :--- | :--- | :--- | :--- |"
    const tableRows = errors
      .map(
        (err, idx) =>
          `| **${idx + 1}. ${err.type}** | \`${err.badPart}\` | **\`${err.goodPart}\`** | ${err.reason} |`
      )
      .join("\n")

    const reply = `### ✍️ Kết quả sửa lỗi câu & Phân tích ngữ pháp

---

❌ **Câu gốc của bạn:**
> "${targetText}"

---

🔴 **Chi tiết ${errors.length} điểm ngữ pháp cần chỉnh sửa:**

${tableHeader}
${tableRows}

---

✅ **Phiên bản hoàn chỉnh đã sửa:**
> "**${correctedSentence}**"
${jflegSection}

---

💡 **Gợi ý học tập & Diễn đạt:**
- Khi viết tiếng Anh học thuật, chú ý sự hòa hợp giữa chủ ngữ và động từ (S-V Agreement).
- Dùng các liên từ nối phù hợp (*furthermore, however, therefore*) để liên kết ý tưởng.

---

📊 **Chỉ số khoa học phân tích từ mô hình ML nội bộ (ml_engine):**
- **Độ dễ đọc (Flesch Reading Ease):** \`${nlpFeatures.flesch_reading_ease}/100\`
- **Độ đa dạng từ vựng (TTR):** \`${(nlpFeatures.lexical_diversity * 100).toFixed(1)}%\`
- **Tỷ lệ từ học thuật CEFR:** \`${(nlpFeatures.advanced_vocab_ratio * 100).toFixed(1)}%\`

*(Phân tích tự động 100% nội bộ trên máy, 0ms, không gọi API).*`

    return {
      reply,
      model: "AI Nội bộ (Sửa lỗi câu & Cú pháp)",
      executionTimeMs: Date.now() - startTime,
    }
  }

  // B. Nếu đối chiếu JFLEG có bản sửa bản ngữ hoàn thiện hơn
  if (hasJflegRefinement && jflegMatch) {
    const reply = `### ✍️ Kết quả đối chiếu Ngân hàng Chuẩn JFLEG (Johns Hopkins)

---

❌ **Câu gốc của bạn:**
> "${targetText}"

---

✅ **Bản sửa mượt mà chuẩn người bản xứ:**
> "**${jflegMatch.nativeCorrection}**"

---

🔴 **Điểm ngữ pháp & diễn đạt hoàn thiện:**
- **Câu gốc của người học tương đồng:** *"${jflegMatch.learnerSentence}"*
- **Bản sửa từ người bản xứ:** *"${jflegMatch.nativeCorrection}"*
- **Gợi ý ngữ pháp:** Người bản ngữ đã bổ sung mạo từ, dấu câu hoặc chuẩn hóa từ vựng để câu văn mạch lạc, tự nhiên và chuẩn văn phong học thuật.

---

📊 **Chỉ số khoa học phân tích từ mô hình ML nội bộ (ml_engine):**
- **Độ dễ đọc (Flesch Reading Ease):** \`${nlpFeatures.flesch_reading_ease}/100\`
- **Độ đa dạng từ vựng (TTR):** \`${(nlpFeatures.lexical_diversity * 100).toFixed(1)}%\`
- **Tỷ lệ từ học thuật CEFR:** \`${(nlpFeatures.advanced_vocab_ratio * 100).toFixed(1)}%\`

*(Phân tích tự động 100% nội bộ trên máy, 0ms, không gọi API).*`

    return {
      reply,
      model: "AI Nội bộ (JFLEG Native Benchmark)",
      executionTimeMs: Date.now() - startTime,
    }
  }

  // C. Câu đúng ngữ pháp
  const reply = `### ✅ Câu của bạn: "${targetText}"

Hệ thống phân tích cú pháp nội bộ đã kiểm tra: câu văn này có cấu trúc đúng ngữ pháp, không phát hiện thấy lỗi sai về thì hay chia động từ.
${jflegSection}

---

📊 **Chỉ số khoa học phân tích từ mô hình ML nội bộ (ml_engine):**
- **Độ dễ đọc (Flesch Reading Ease):** \`${nlpFeatures.flesch_reading_ease}/100\`
- **Độ đa dạng từ vựng (TTR):** \`${(nlpFeatures.lexical_diversity * 100).toFixed(1)}%\`
- **Tỷ lệ từ học thuật CEFR:** \`${(nlpFeatures.advanced_vocab_ratio * 100).toFixed(1)}%\`

---

💡 **Gợi ý:** Bạn có thể tiếp tục dán câu tiếng Anh khác, hoặc chọn loại vấn đề **"Cho ví dụ"** để xem các thể câu biến đổi!`

  return {
    reply,
    model: "AI Nội bộ (Cú pháp chuẩn)",
    executionTimeMs: Date.now() - startTime,
  }
}

/**
 * 2. Chế độ: Tra cứu 12 thì & Ngữ pháp (grammar_lookup)
 */
function handleCategoryGrammarLookup(
  query: string,
  history?: { role: string; content: string }[],
  startTime?: number
): LocalDynamicResult {
  const start = startTime ?? Date.now()
  const clean = extractTargetSentence(query)

  // 1. NẾU NGƯỜI DÙNG NHẬP MỘT CÂU TIẾNG ANH:
  if (isLikelyEnglishSentence(clean)) {
    const parsed = parseEnglishSentence(clean)
    return generateSentenceGrammarAnalysis(parsed, clean, start)
  }

  // 2. NẾU NGƯỜI DÙNG NHẬP CHỦ ĐIỂM NGỮ PHÁP:
  const matchedTopic = findGrammarTopic(clean, history)

  if (matchedTopic) {
    const tableHeader = "| Mục đích / Dạng câu | Cấu trúc công thức | Ví dụ minh họa |\n| :--- | :--- | :--- |"
    const tableRows = matchedTopic.formulas
      .map((f) => `| ${f.use} | \`${f.structure}\` | *${f.example}* |`)
      .join("\n")

    const extData = TOPIC_EXTENDED_DATA[matchedTopic.slug]
    const signalInfo = extData?.signals ? `\n\n---\n\n#### ⏱️ Dấu hiệu nhận biết đặc trưng:\n\`${extData.signals}\`` : ""
    const trapInfo = extData?.traps ? `\n\n${extData.traps}` : ""

    const reply = `### 📘 ${matchedTopic.name} (${matchedTopic.vi})

**Bản chất khái niệm:** ${matchedTopic.intro}

---

#### 📋 Bảng công thức chuẩn
${tableHeader}
${tableRows}

---

#### 💡 Các trường hợp sử dụng chính
${matchedTopic.usage.map((u) => `- ${u}`).join("\n")}

---

#### 🌟 Ví dụ thực tế song ngữ
${matchedTopic.examples.map((e) => `- **${e.en}**<br>➡️ *${e.vi}*`).join("\n")}${signalInfo}${trapInfo}

---

💡 *Mẹo: Bạn có thể chọn loại vấn đề **"Cho ví dụ"** hoặc **"Bài tập"** để tiếp tục luyện tập thì này!*`

    return {
      reply,
      model: `AI Nội bộ (Tra cứu: ${matchedTopic.slug})`,
      executionTimeMs: Date.now() - start,
    }
  }

  // 3. Nếu người dùng hỏi chung chung ("12 thì", "các thì", "ngữ pháp")
  const reply = `### 📘 Tổng quan 12 Thì Trong Tiếng Anh (English Tenses Master Guide)

Dưới đây là bảng tổng hợp cấu trúc cốt lõi của 12 thì tiếng Anh, chia theo 3 mốc thời gian:

---

#### 🟢 1. Nhóm thì Hiện tại (Present Tenses)
| Tên thì | Cấu trúc Khẳng định | Dấu hiệu đặc trưng |
| :--- | :--- | :--- |
| **Hiện tại đơn (Present Simple)** | \`S + V(s/es)\` | *every day, always, usually, often* |
| **Hiện tại tiếp diễn (Present Continuous)** | \`S + am/is/are + V-ing\` | *now, right now, at the moment, Look!* |
| **Hiện tại hoàn thành (Present Perfect)** | \`S + have/has + V3/ed\` | *already, yet, just, since, for, so far* |
| **HTHT tiếp diễn (Present Perfect Cont.)** | \`S + have/has been + V-ing\` | *all day, for 3 hours, how long* |

---

#### 🔵 2. Nhóm thì Quá khứ (Past Tenses)
| Tên thì | Cấu trúc Khẳng định | Dấu hiệu đặc trưng |
| :--- | :--- | :--- |
| **Quá khứ đơn (Past Simple)** | \`S + V2/ed\` | *yesterday, ago, last week, in 2020* |
| **Quá khứ tiếp diễn (Past Continuous)** | \`S + was/were + V-ing\` | *at 8 p.m yesterday, while, when* |
| **Quá khứ hoàn thành (Past Perfect)** | \`S + had + V3/ed\` | *by the time, before, after* |
| **QKHT tiếp diễn (Past Perfect Cont.)** | \`S + had been + V-ing\` | *had been V-ing before QKĐ* |

---

#### 🟣 3. Nhóm thì Tương lai (Future Tenses)
| Tên thì | Cấu trúc Khẳng định | Dấu hiệu đặc trưng |
| :--- | :--- | :--- |
| **Tương lai đơn (Future Simple)** | \`S + will + V-inf\` | *tomorrow, next week, soon, I think* |
| **Tương lai tiếp diễn (Future Continuous)**| \`S + will be + V-ing\` | *at this time tomorrow* |
| **Tương lai hoàn thành (Future Perfect)** | \`S + will have + V3/ed\` | *by tomorrow, by the end of next month* |
| **TLHT tiếp diễn (Future Perfect Cont.)** | \`S + will have been + V-ing\`| *by next year for 10 years* |

---

💡 **Tra cứu chi tiết:** Hãy nhập tên thì cụ thể (Ví dụ: *"thì hiện tại hoàn thành"*, *"thì quá khứ đơn"*, *"câu điều kiện"*, *"mạo từ"*) hoặc nhập trực tiếp câu tiếng Anh của bạn để xem phân tích chi tiết nhé!`

  return {
    reply,
    model: "AI Nội bộ (Tổng quan 12 thì)",
    executionTimeMs: Date.now() - start,
  }
}

/**
 * 3. Chế độ: Cho ví dụ minh họa (examples)
 */
function handleCategoryExamples(
  query: string,
  history?: { role: string; content: string }[],
  startTime?: number
): LocalDynamicResult {
  const start = startTime ?? Date.now()
  const clean = extractTargetSentence(query)

  // 1. NẾU NGƯỜI DÙNG NHẬP MỘT CÂU TIẾNG ANH:
  if (isLikelyEnglishSentence(clean)) {
    const parsed = parseEnglishSentence(clean)
    const forms = generateSentenceForms(parsed)
    const similarExamples = generateSentenceSimilarExamples(parsed)

    const similarBlock = similarExamples
      .map((e, idx) => `**${idx + 1}. ${e.en}**\n➡️ *${e.vi}*`)
      .join("\n\n")

    const reply = `### 💡 Bộ ví dụ & Các thể biến đổi cho câu của bạn:

> **"${parsed.cleanSentence}"**

Hệ thống đã phân tích câu của bạn và tạo ra các thể câu, các thì thời gian cùng các mẫu câu tương đương:

---

#### 🔄 1. Các thể câu chính (Sentence Transformation Forms):
- **Khẳng định (+):** ${forms.affirmative}
- **Phủ định (-):** ${forms.negative}
- **Nghi vấn (?):** ${forms.interrogative}
  - *Trả lời ngắn (Short Answers):* \`${forms.shortAnswer}\`

---

#### ⏱️ 2. Biến thể câu này qua các thì thời gian khác nhau:
- **Hiện tại đơn (Present Simple):** \`${forms.tenses.presentSimple}\` *(Nơi ở cố định, thói quen hoặc sự thật)*
- **Quá khứ đơn (Past Simple):** \`${forms.tenses.pastSimple}\` *(Hành động đã kết thúc trong quá khứ)*
- **Tương lai đơn (Future Simple):** \`${forms.tenses.futureSimple}\` *(Kế hoạch hoặc dự định tương lai)*
- **Hiện tại tiếp diễn (Present Continuous):** \`${forms.tenses.presentContinuous}\` *(Hành động đang tạm thời diễn ra)*
- **Hiện tại hoàn thành (Present Perfect):** \`${forms.tenses.presentPerfect}\` *(Hành động kéo dài từ quá khứ đến nay)*

---

#### 🌟 3. Các câu ví dụ tương tự cùng cấu trúc ngữ pháp:
${similarBlock}

---

💡 *Gợi ý: Bạn có thể chọn nhãn **"Tra cứu ngữ pháp"** để xem bóc tách chi tiết từng từ, hoặc chọn **"Tạo trắc nghiệm"** để làm bài tập trắc nghiệm xây dựng từ câu này!*`

    return {
      reply,
      model: `AI Nội bộ (Ví dụ câu: ${parsed.tense})`,
      executionTimeMs: Date.now() - start,
    }
  }

  // 2. NẾU NGƯỜI DÙNG NHẬP CHỦ ĐIỂM NGỮ PHÁP (ví dụ "mạo từ", "thì quá khứ đơn"):
  const targetTopic = findGrammarTopic(clean, history)

  if (targetTopic) {
    const extData = TOPIC_EXTENDED_DATA[targetTopic.slug]

    let affirmativeBlock = ""
    let negativeBlock = ""
    let interrogativeBlock = ""

    if (extData) {
      affirmativeBlock = extData.affirmative
        .map((e) => `- **${e.en}**\n  ➡️ *${e.vi}* ${e.note ? `\n  *(Lưu ý: ${e.note})*` : ""}`)
        .join("\n\n")

      negativeBlock = extData.negative
        .map((e) => `- **${e.en}**\n  ➡️ *${e.vi}*`)
        .join("\n\n")

      interrogativeBlock = extData.interrogative
        .map((e) => `- **${e.en}**\n  ➡️ *${e.vi}* ${e.note ? `\n  *(${e.note})*` : ""}`)
        .join("\n\n")
    } else {
      affirmativeBlock = targetTopic.examples
        .map((e) => `- **${e.en}**\n  ➡️ *${e.vi}*`)
        .join("\n\n")
    }

    const reply = `### 💡 Bộ ví dụ thực tế chuẩn cho: **${targetTopic.name} (${targetTopic.vi})**

Dưới đây là các câu ví dụ mẫu sinh động, chia theo từng thể câu và tình huống giao tiếp đời sống:

---

#### 🌟 1. Thể Khẳng định (+)
${affirmativeBlock}

---

${
  negativeBlock
    ? `#### 🚫 2. Thể Phủ định (-)
${negativeBlock}

---`
    : ""
}

${
  interrogativeBlock
    ? `#### ❓ 3. Thể Nghi vấn (?)
${interrogativeBlock}

---`
    : ""
}

#### 📋 Cấu trúc & Dấu hiệu nhận biết
- **Công thức:** \`${targetTopic.formulas.map((f) => `${f.use}: ${f.structure}`).join(" | ")}\`
${extData?.signals ? `- **Dấu hiệu thời gian:** \`${extData.signals}\`` : ""}
${extData?.traps ? `\n${extData.traps}\n` : ""}

---

#### 🎯 Thử sức luyện tập nhanh:
Bạn hãy thử đặt 1 câu tiếng Anh về chủ điểm **${targetTopic.vi}** và gửi vào đây nhé, tôi sẽ kiểm tra và sửa lỗi trực tiếp giúp bạn!`

    return {
      reply,
      model: `AI Nội bộ (Ví dụ: ${targetTopic.slug})`,
      executionTimeMs: Date.now() - start,
    }
  }

  // 3. Nếu không xác định được chủ điểm và không phải câu tiếng Anh
  const reply = `Tôi đã tiếp nhận yêu cầu xin ví dụ của bạn: **"${clean}"**

💡 **Để tôi cung cấp ví dụ sát nhất với mong muốn của bạn:**
1. **Nếu bạn muốn phát triển một câu cụ thể:** Hãy dán câu tiếng Anh của bạn (Ví dụ: *"She lives in Hanoi"* hoặc *"I bought a new car"*), tôi sẽ tạo toàn bộ thể phủ định, nghi vấn, các thì và câu tương tự!
2. **Nếu bạn muốn ví dụ theo chủ điểm:** Hãy nhập tên chủ điểm cụ thể (Ví dụ: *"mạo từ"*, *"thì hiện tại hoàn thành"*, *"câu bị động"*...).`

  return {
    reply,
    model: "AI Nội bộ (Gợi ý ví dụ)",
    executionTimeMs: Date.now() - start,
  }
}

/**
 * 4. Chế độ: Tạo bài tập trắc nghiệm (quiz)
 */
function handleCategoryQuiz(
  query: string,
  history?: { role: string; content: string }[],
  startTime?: number
): LocalDynamicResult {
  const start = startTime ?? Date.now()
  const clean = extractTargetSentence(query)

  // 1. NẾU NGƯỜI DÙNG NHẬP MỘT CÂU TIẾNG ANH:
  if (isLikelyEnglishSentence(clean)) {
    const parsed = parseEnglishSentence(clean)
    const questions = generateSentenceQuizQuestions(parsed)

    const quizBlock = questions
      .map(
        (q, idx) =>
          `**Câu ${idx + 1}:** ${q.question}\n${q.options.map((opt) => `  ${opt}`).join("\n")}\n\n> 💡 **Đáp án & Giải thích:** **${q.answer}**\n> *${q.explanation}*`
      )
      .join("\n\n---\n\n")

    const reply = `### 📝 Bài tập trắc nghiệm xây dựng từ câu của bạn:

> **"${parsed.cleanSentence}"**

Dưới đây là 3 câu hỏi trắc nghiệm kiểm tra độ nắm vững ngữ pháp của câu này:

---

${quizBlock}

---

💡 **Gợi ý:** Bạn có thể thử gửi đáp án của mình hoặc nhập câu khác để tôi tạo thêm bài tập nhé!`

    return {
      reply,
      model: `AI Nội bộ (Quiz câu: ${parsed.tense})`,
      executionTimeMs: Date.now() - start,
    }
  }

  // 2. NẾU NGƯỜI DÙNG NHẬP CHỦ ĐIỂM NGỮ PHÁP (ví dụ "mạo từ"):
  const targetTopic = findGrammarTopic(clean, history)

  if (targetTopic) {
    const extData = TOPIC_EXTENDED_DATA[targetTopic.slug]
    let quizQuestions = ""

    if (extData && extData.quiz && extData.quiz.length > 0) {
      quizQuestions = extData.quiz
        .map(
          (q, idx) =>
            `**Câu ${idx + 1}:** ${q.question}\n${q.options.map((opt) => `  ${opt}`).join("\n")}\n\n> 💡 **Đáp án & Giải thích:** **${q.answer}**\n> *${q.explanation}*\n`
        )
        .join("\n---\n\n")
    } else {
      const formula = targetTopic.formulas[0]
      const example = targetTopic.examples[0]
      quizQuestions = `**Câu 1:** Which of the following sentences correctly uses **${targetTopic.name}**?\n  A. ${example?.en || "She works hard every day."}\n  B. She working hard every day.\n  C. She are work hard every day.\n  D. She work hard every day.\n\n> 💡 **Đáp án & Giải thích:** **A**\n> *Cấu trúc chuẩn của ${targetTopic.name}: \`${formula?.structure || "S + V"}\`.*\n\n---\n\n**Câu 2:** Complete the rule for ${targetTopic.name}: What is the correct structure?\n  A. \`${formula?.structure || "S + V"}\`\n  B. \`S + will + V-ing\`\n  C. \`S + had + V-ing\`\n  D. \`S + is + V2\`\n\n> 💡 **Đáp án & Giải thích:** **A**\n> *Theo quy tắc ngữ pháp: ${formula?.use || "Cách dùng cơ bản"} sử dụng cấu trúc \`${formula?.structure || "S + V"}\`.*`
    }

    const reply = `### 📝 Bài tập luyện tập: **${targetTopic.name} (${targetTopic.vi})**

Dưới đây là các câu hỏi trắc nghiệm kiểm tra độ hiểu bài của bạn:

---

${quizQuestions}

---

💡 **Gợi ý:** Bạn có thể thử tự đặt câu bài tập của mình gửi vào đây để tôi kiểm tra ngữ pháp tức thì nhé!`

    return {
      reply,
      model: `AI Nội bộ (Quiz: ${targetTopic.slug})`,
      executionTimeMs: Date.now() - start,
    }
  }

  // 3. Nếu không xác định được chủ đề
  const reply = `Tôi đã tiếp nhận yêu cầu bài tập của bạn: **"${clean}"**

💡 **Để tạo bài tập chính xác nhất:**
1. Hãy nhập câu tiếng Anh bạn muốn luyện (Ví dụ: *"She lives in Hanoi"*), tôi sẽ lập tức tạo 3 câu trắc nghiệm từ câu đó!
2. Hoặc nhập tên chủ điểm ngữ pháp (Ví dụ: *"mạo từ"*, *"câu bị động"*, *"thì quá khứ đơn"*...).`

  return {
    reply,
    model: "AI Nội bộ (Quiz Generator)",
    executionTimeMs: Date.now() - start,
  }
}

/**
 * Trích xuất các từ người dùng muốn phân biệt từ câu truy vấn
 */
export function extractComparingWords(query: string): { word1: string; word2: string; extraWord?: string } | null {
  const clean = query
    .replace(
      /^(?:hãy\s+)?(?:phân\s*biệt|so\s*sánh|giúp\s*(?:tôi|em)\s*phân\s*biệt|sự\s*khác\s*nhau\s*giữa|sự\s*khác\s*biệt\s*giữa|khác\s*nhau\s*(?:như\s*thế\s*nào)?)\s*/i,
      ""
    )
    .replace(/[?!.]+$/, "")
    .trim()

  const match3 = clean.match(
    /^([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s*(?:vs|\/|,|và|với|and)\s*([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s*(?:vs|\/|,|và|với|and)\s*([a-zA-Z]+(?:\s+[a-zA-Z]+)?)$/i
  )
  if (match3) {
    return {
      word1: match3[1].trim().toLowerCase(),
      word2: match3[2].trim().toLowerCase(),
      extraWord: match3[3].trim().toLowerCase(),
    }
  }

  const match2 = clean.match(
    /^([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s*(?:vs|\/|,|và|với|and|hay|hoặc)\s*([a-zA-Z]+(?:\s+[a-zA-Z]+)?)$/i
  )
  if (match2) {
    return {
      word1: match2[1].trim().toLowerCase(),
      word2: match2[2].trim().toLowerCase(),
    }
  }

  const matchGiua = clean.match(/giữa\s+([a-zA-Z]+)\s+(?:và|với)\s+([a-zA-Z]+)/i)
  if (matchGiua) {
    return {
      word1: matchGiua[1].trim().toLowerCase(),
      word2: matchGiua[2].trim().toLowerCase(),
    }
  }

  // Nếu người dùng chỉ gõ 2 từ cách nhau khoảng trắng: ví dụ "hi hello"
  const twoWords = clean.split(/\s+/)
  if (twoWords.length === 2 && /^[a-zA-Z]+$/.test(twoWords[0]) && /^[a-zA-Z]+$/.test(twoWords[1])) {
    return {
      word1: twoWords[0].toLowerCase(),
      word2: twoWords[1].toLowerCase(),
    }
  }

  return null
}

const VOCAB_DIFF_DICT: Record<string, { title: string; table: string; notes: string }> = {
  borrow_lend: {
    title: 'Phân biệt "Borrow" và "Lend" (Mượn và Cho mượn)',
    table: `| Tiêu chí | BORROW (Mượn về) | LEND (Cho mượn) |
| :--- | :--- | :--- |
| **Bản chất hành động** | **Nhận vào (Take in)**: Nhận tài sản/đồ vật từ người khác về dùng tạm rồi hoàn trả | **Đưa ra (Give out)**: Cho người khác dùng tạm tài sản/đồ vật của mình trong một thời gian |
| **Cấu trúc ngữ pháp** | \`Borrow + something + FROM someone\` | \`Lend + something + TO someone\`<br>hoặc \`Lend + someone + something\` |
| **Chủ ngữ trong câu** | Là **người đi mượn** (Borrower) | Là **người sở hữu / cho mượn** (Lender) |
| **Dạng quá khứ / Phân từ** | Borrow – Borrowed – Borrowed (Quy tắc) | Lend – **Lent** – **Lent** (Bất quy tắc) |
| **Ví dụ minh họa** | *Can I **borrow** your dictionary for an hour?*<br>*(Mình có thể mượn cuốn từ điển của bạn một tiếng được không?)* | *She kindly **lent** me her laptop yesterday.*<br>*(Hôm qua cô ấy đã tốt bụng cho tôi mượn laptop của cô ấy.)* |`,
    notes: `#### 💡 Mẹo ghi nhớ siêu tốc (Quy tắc B - L):
- **B**orrow = **B**ack / **B**ring *(Mang đồ vật về phía mình để dùng)*.
- **L**end = **L**eave *(Để đồ vật rời khỏi tay mình đưa cho người khác)*.

---

#### ⚠️ Lỗi sai kinh điển của người học Tiếng Anh:
- ❌ **Sai:** *Can you borrow me 20 dollars?* *(Người Việt rất hay nhầm lẫn "cho mượn" thành "borrow").*
- ✅ **Đúng:** *Can you **lend** me 20 dollars?* *(Bạn có thể cho tôi mượn 20 đô không?)*
- ✅ **Hoặc:** *Can I **borrow** 20 dollars from you?* *(Tôi có thể mượn bạn 20 đô không?)*

---

#### 🌟 Từ liên quan: "Loan"
- **Danh từ:** Khoản tiền vay, nợ ngân hàng (*take out a student loan* - vay vốn sinh viên).
- **Động từ:** Cho vay tiền/tài sản có tính lãi suất hoặc hợp đồng pháp lý trang trọng (*The bank agreed to loan him $50,000*).`,
  },
  make_do: {
    title: 'Phân biệt "Make" và "Do"',
    table: `| Tiêu chí | DO (Làm, thực hiện) | MAKE (Tạo ra, chế tạo) |
| :--- | :--- | :--- |
| **Bản chất hành động** | Thực hiện một hành động, nghĩa vụ, công việc, hoạt động lặp đi lặp lại | Tạo ra, sản xuất, kiến tạo nên sản phẩm mới chưa từng có trước đó |
| **Trọng tâm ý nghĩa** | Tập trung vào **quá trình** thực hiện hành động | Tập trung vào **kết quả / sản phẩm** hữu hình hoặc vô hình sinh ra |
| **Collocations quen thuộc** | - *do homework* (làm bài tập)<br>- *do housework / chores* (làm việc nhà)<br>- *do business* (kinh doanh)<br>- *do research* (nghiên cứu)<br>- *do exercise* (tập thể dục)<br>- *do your best* (cố gắng hết mình) | - *make coffee / a cake* (pha cà phê / làm bánh)<br>- *make a decision* (đưa ra quyết định)<br>- *make a mistake* (phạm sai lầm)<br>- *make money / profit* (kiếm tiền/lợi nhuận)<br>- *make friends* (kết bạn)<br>- *make progress* (tiến bộ) |
| **Ví dụ minh họa** | *I always **do my homework** right after school.* | *She **made a delicious dinner** for the family.* |`,
    notes: `#### 💡 Quy tắc vàng:
1. Nếu hành động tạo ra sản phẩm cụ thể mới (bánh, quyết định, danh sách, lỗi lầm, tiền bạc) ➔ dùng **MAKE**.
2. Nếu hành động là nhiệm vụ, công việc, hoạt động chung chung ➔ dùng **DO**.
3. Đi với đại từ bất định (*something, anything, nothing, everything*) ➔ luôn dùng **DO**:
   - *Is there anything I can **do** for you?*`,
  },
  look_see_watch: {
    title: 'Phân biệt "Look", "See" và "Watch"',
    table: `| Tiêu chí | SEE (Thấy) | LOOK (Nhìn / Ngắm) | WATCH (Theo dõi / Xem) |
| :--- | :--- | :--- | :--- |
| **Bản chất** | **Thụ động (Passive)**: Hình ảnh tự nhiên lọt vào mắt, không cần cố gắng | **Chủ động (Active)**: Cố ý hướng ánh mắt vào một điểm hoặc vật cố định | **Tập trung cao độ (Intense)**: Chăm chú quan sát sự vật/người đang chuyển động |
| **Có chủ ý không?** | Không có chủ ý trước, mở mắt là thấy | Có chủ đích | Rất chú tâm, theo dõi tiến trình biến đổi theo thời gian |
| **Cấu trúc & Giới từ** | \`See + Object\` *(không dùng giới từ)* | \`Look AT + Object\` | \`Watch + Object\` *(không dùng giới từ)* |
| **Ví dụ minh họa** | *I opened the window and **saw** a rainbow.* | *Please **look at** the presentation on screen.* | *Millions of fans **watched** the World Cup final.* |`,
    notes: `#### 💡 Tóm tắt ngắn gọn:
- **See:** Thấy tự nhiên.
- **Look (at):** Nhìn tập trung vào điểm tĩnh.
- **Watch:** Theo dõi vật chuyển động (*watch TV, watch a match, watch birds*).

---

#### 🎬 "See a movie" hay "Watch a movie"?
- **See a film / movie:** Đến rạp chiếu phim công cộng (Cinema).
- **Watch a film / movie:** Xem tại gia trên TV, máy tính hoặc điện thoại.`,
  },
  say_tell_speak_talk: {
    title: 'Phân biệt "Say", "Tell", "Speak" và "Talk"',
    table: `| Tiêu chí | TELL (Kể, bảo) | SAY (Nói rằng) | SPEAK (Nói tiếng, phát biểu) | TALK (Trò chuyện) |
| :--- | :--- | :--- | :--- | :--- |
| **Cấu trúc ngữ pháp** | \`Tell + Người + điều gì\`<br>*(Bắt buộc có tân ngữ chỉ người)* | \`Say + that...\`<br>\`Say something to someone\` | \`Speak + ngôn ngữ\` (\`speak English\`)<br>\`Speak to someone\` | \`Talk to / with someone\` (\`talk about\`) |
| **Tính chất giao tiếp** | Truyền tải thông tin, mệnh lệnh, câu chuyện | Nhấn mạnh vào câu từ hoặc lời nói cụ thể | Mang tính trang trọng (Formal), một chiều, năng lực ngôn ngữ | Thân mật (Informal), trò chuyện đối thoại hai chiều |
| **Cụm từ cố định** | - *tell the truth* (nói thật)<br>- *tell a lie* (nói dối)<br>- *tell a story* (kể chuyện) | - *say hello / goodbye*<br>- *say yes / no*<br>- *say sorry* (xin lỗi) | - *speak fluently* (nói lưu loát)<br>- *speak at the seminar*<br>- *strictly speaking* | - *talk with friends*<br>- *talk business*<br>- *have a nice talk* |
| **Ví dụ** | *He **told me** about his new project.* | *She **said that** she was exhausted.* | *He **speaks** three foreign languages.* | *We **talked** about life for hours.* |`,
    notes: `#### ⚠️ Điểm mấu chốt:
- **TELL** luôn có người nghe đi liền sau: *Tell me*, *Tell John* *(Không bao giờ nói: "He said me" ❌ -> "He told me" ✅)*.
- **SAY** nếu muốn có người nghe phải thêm giới từ *to*: *He said to me that...*`,
  },
  listen_hear: {
    title: 'Phân biệt "Hear" và "Listen"',
    table: `| Tiêu chí | HEAR (Nghe thấy) | LISTEN (Lắng nghe) |
| :--- | :--- | :--- |
| **Bản chất hành động** | **Thụ động (Involuntary)**: Âm thanh tự truyền đến tai mà ta không chủ đích | **Chủ động (Voluntary)**: Dành sự chú ý, tập trung để tiếp thu âm thanh |
| **Mức độ chú ý** | Tình cờ, vô thức nhận biết âm thanh | Có ý thức, tập trung giải mã ý nghĩa |
| **Giới từ đi kèm** | Thường không dùng giới từ: \`Hear + something\` | Bắt buộc dùng giới từ: \`Listen TO + someone/something\` |
| **Ví dụ minh họa** | *Did you **hear** that loud noise outside?* | *I love **listening to** podcasts while cooking.* |`,
    notes: `💡 **Mẹo:** Bạn có thể **hear** một tiếng còi xe ngoài đường khi đang ngủ, nhưng phải **listen to** bài giảng của giáo viên thì mới tiếp thu được kiến thức!
⚠️ **Lỗi phổ biến:** Quên giới từ *to* sau *listen*:
- ❌ *I'm listening music.*
- ✅ *I'm **listening to** music.*`,
  },
  affect_effect: {
    title: 'Phân biệt "Affect" và "Effect"',
    table: `| Tiêu chí | AFFECT (Tác động lên) | EFFECT (Sự tác động, kết quả) |
| :--- | :--- | :--- |
| **Loại từ (Part of Speech)** | **Động từ (Verb)** | **Danh từ (Noun)** |
| **Vị trí & Vai trò** | Làm vị ngữ trong câu: \`S + affect + O\` | Đứng sau mạo từ (*the, an*), tính từ, hoặc trong cụm giới từ |
| **Collocations quen thuộc** | - *adversely affect* (ảnh hưởng tiêu cực)<br>- *directly affect* (tác động trực tiếp) | - *have an effect on* (có ảnh hưởng đến)<br>- *side effect* (tác dụng phụ)<br>- *come into effect* (có hiệu lực) |
| **Ví dụ minh họa** | *Climate change severely **affects** agriculture.* | *The new regulation had an immediate **effect** on traffic.* |`,
    notes: `#### 💡 Mẹo nhớ siêu tốc (Quy tắc A - E):
- **A**ffect = **A**ction *(Hành động ➔ Động từ)*.
- **E**ffect = **E**nd result *(Kết quả cuối cùng ➔ Danh từ)*.
- Hai cách viết tương đương: \`A affects B\` = \`A has an effect on B\`.`,
  },
  since_for: {
    title: 'Phân biệt "Since" và "For" trong các thì hoàn thành',
    table: `| Giới từ | SINCE (Kể từ khi) | FOR (Trong khoảng / Được) |
| :--- | :--- | :--- |
| **Bản chất mốc thời gian** | **Mốc thời gian cụ thể (Point in time)**: Thời điểm khởi đầu của hành động | **Khoảng thời gian (Period of time)**: Độ dài thời gian hành động kéo dài |
| **Dấu hiệu đi kèm** | *since 2018, since yesterday, since Monday, since 7 a.m., since graduation* | *for 3 days, for 2 hours, for 5 years, for a long time, for decades* |
| **Ví dụ minh họa** | *They have been married **since 2010**.* | *They have lived in Tokyo **for 15 years**.* |`,
    notes: `⚠️ **Lỗi người học hay gặp:**
- ❌ *I have lived here since 4 years.*
- ✅ *I have lived here **for 4 years** (vì 4 năm là khoảng thời gian).*
- ✅ *I have lived here **since 2020** (vì 2020 là mốc thời gian).*`,
  },
  advise_advice: {
    title: 'Phân biệt "Advise" và "Advice"',
    table: `| Tiêu chí | ADVICE (Lời khuyên) | ADVISE (Khuyên bảo) |
| :--- | :--- | :--- |
| **Loại từ & Phát âm** | **Danh từ (Noun)** — Phát âm tận cùng là âm **/s/** (/ədˈvaɪs/) | **Động từ (Verb)** — Phát âm tận cùng là âm **/z/** (/ədˈvaɪz/) |
| **Đếm được không?** | **Danh từ không đếm được (Uncountable)**. Không có "an advice" hay "advices" | Động từ chia theo thì và ngôi (*advises, advised, advising*) |
| **Cấu trúc ngữ pháp** | - *give someone advice*<br>- *a piece of advice* (một lời khuyên)<br>- *take / follow someone's advice* | - \`Advise someone to V\` (khuyên ai nên làm gì)<br>- \`Advise someone against V-ing\`<br>- \`Advise that S + (should) V\` |
| **Ví dụ minh họa** | *Thank you for your valuable **advice**.* | *My parents **advised me to learn** computer science.* |`,
    notes: `⚠️ **Cảnh báo lỗi thi cử:**
- Tuyệt đối KHÔNG viết: *He gave me a good advice* ❌
- Viết đúng: *He gave me **a good piece of advice*** hoặc *He gave me **good advice*** ✅.`,
  },
  accept_except: {
    title: 'Phân biệt "Accept" và "Except"',
    table: `| Tiêu chí | ACCEPT (Chấp nhận, đồng ý nhận) | EXCEPT (Ngoại trừ, trừ ra) |
| :--- | :--- | :--- |
| **Loại từ** | **Động từ (Verb)** | **Giới từ / Liên từ (Preposition / Conjunction)** |
| **Ý nghĩa** | Đồng ý nhận một thứ gì đó, tán thành đề xuất | Trừ người/vật đó ra, không bao gồm |
| **Collocations** | - *accept an apology* (chấp nhận lời xin lỗi)<br>- *accept an invitation / offer* | - *except for* (ngoại trừ)<br>- *all days except Sunday* |
| **Ví dụ minh họa** | *He gladly **accepted** the job offer.* | *The store is open every day **except** Mondays.* |`,
    notes: `💡 **Mẹo nhớ:**
- **Ac**cept = **A**gree to receive (Đồng ý nhận).
- **Ex**cept = **Ex**clude (Loại trừ).`,
  },
  lose_loose: {
    title: 'Phân biệt "Lose" và "Loose"',
    table: `| Tiêu chí | LOSE (Đánh mất, thua cuộc) | LOOSE (Rộng, lỏng lẻo) |
| :--- | :--- | :--- |
| **Chính tả & Phát âm** | **1 chữ O** — Phát âm /luːz/ (âm z cuối) | **2 chữ O** — Phát âm /luːs/ (âm s cuối) |
| **Loại từ** | **Động từ (Verb)** (Quá khứ: *lost*) | **Tính từ (Adjective)** |
| **Cụm từ thông dụng** | - *lose weight* (giảm cân)<br>- *lose keys* (mất chìa khóa)<br>- *lose the match* (thua trận) | - *loose clothing* (quần áo rộng rãi)<br>- *a loose tooth* (chiếc răng lung lay)<br>- *let loose* (buông lỏng) |
| **Ví dụ minh họa** | *Don't panic and don't **lose** your temper.* | *This shirt is way too **loose** on me.* |`,
    notes: `💡 **Mẹo:**
- **Lose** (1 chữ O): Thiếu 1 chữ O như là bị "mất mát" ➔ Động từ mất mát, thua cuộc.
- **Loose** (2 chữ O): Thừa 1 chữ O nên rộng rãi, lỏng lẻo ➔ Tính từ rộng.`,
  },
  lie_lay: {
    title: 'Phân biệt "Lie" và "Lay"',
    table: `| Tiêu chí | LIE (Nằm xuống) | LAY (Đặt, để cái gì xuống) |
| :--- | :--- | :--- |
| **Loại động từ** | **Nội động từ (Intransitive)** — Không có tân ngữ phía sau | **Ngoại động từ (Transitive)** — Bắt buộc có tân ngữ phía sau |
| **3 cột động từ** | **Lie – Lay – Lain** (Đang nằm: *lying*) | **Lay – Laid – Laid** (Đang đặt: *laying*) |
| **Cấu trúc câu** | \`S + lie down\` | \`S + lay + Object + down\` |
| **Ví dụ minh họa** | *I was exhausted, so I **lay** down on the sofa.* *(Quá khứ của lie)* | *Please **lay** the baby in the crib gently.* |`,
    notes: `⚠️ **Lỗi gây bối rối nhất trong Tiếng Anh:**
- Từ **Lay** vừa là thì Hiện tại của ngoại động từ "đặt/để", vừa là thì Quá khứ của nội động từ "nằm" (*Lie*)!
- Mẹo kiểm tra: Có đồ vật bị đặt xuống không? Có đồ vật ➔ dùng **LAY**; Tự mình nằm nghỉ ➔ dùng **LIE**.`,
  },
  rise_raise: {
    title: 'Phân biệt "Rise", "Raise" và "Arise"',
    table: `| Tiêu chí | RISE (Tự tăng lên, mọc lên) | RAISE (Nâng lên, tăng cái gì lên) | ARISE (Phát sinh) |
| :--- | :--- | :--- | :--- |
| **Loại động từ** | **Nội động từ (Intransitive)** | **Ngoại động từ (Transitive)** | **Nội động từ (Intransitive)** |
| **Tân ngữ theo sau** | **Không có tân ngữ** (Tự chủ thể di chuyển lên) | **Bắt buộc có tân ngữ** (Có người tác động nâng vật lên) | **Không có tân ngữ** (Vấn đề tự nảy sinh) |
| **3 cột động từ** | **Rise – Rose – Risen** | **Raise – Raised – Raised** | **Arise – Arose – Arisen** |
| **Ví dụ** | *The sun **rises** in the east.*<br>*Prices **rose** by 5% this month.* | *Please **raise your hand** if you have questions.*<br>*The company decided to **raise wages**.* | *If any issues **arise**, please notify me immediately.* |`,
    notes: `💡 **Quy tắc:**
- Mặt trời, nhiệt độ, giá cả tự tăng lên ➔ dùng **RISE**.
- Bạn giơ tay, chính phủ tăng thuế, tăng lương ➔ dùng **RAISE** (có đối tượng bị tác động).`,
  },
  tall_high: {
    title: 'Phân biệt "Tall" và "High"',
    table: `| Tiêu chí | TALL (Cao về chiều dọc / thon dài) | HIGH (Cao so với mặt đất / Mức độ) |
| :--- | :--- | :--- |
| **Đối tượng áp dụng** | Người, cây cối, cột đèn, tòa tháp (vật có bề ngang hẹp, chiều cao vượt trội) | Núi, bức tường, trần nhà, độ cao máy bay, mức độ trừu tượng (giá cả, nhiệt độ, chất lượng) |
| **Từ trái nghĩa** | **Short** (thấp, lùn) | **Low** (thấp) |
| **Collocations** | - *a tall man* (người đàn ông cao lớn)<br>- *a tall building / tree* | - *a high mountain* (ngọn núi cao)<br>- *high prices / temperature*<br>- *high quality* |
| **Ví dụ** | *He is six feet **tall**.* | *Mount Everest is the **highest** mountain in the world.* |`,
    notes: `⚠️ Không bao giờ dùng *tall prices* hay *tall temperature*, chỉ dùng **high prices**, **high temperature**!`,
  },
  economic_economical: {
    title: 'Phân biệt "Economic" và "Economical"',
    table: `| Tiêu chí | ECONOMIC (Thuộc về nền kinh tế) | ECONOMICAL (Tiết kiệm chi phí) |
| :--- | :--- | :--- |
| **Bản chất ý nghĩa** | Liên quan đến tài chính vĩ mô, thị trường, nền kinh tế | Không lãng phí tiền bạc, nhiên liệu hoặc thời gian; mang lại hiệu quả kinh tế cao |
| **Collocations** | - *economic growth* (tăng trưởng kinh tế)<br>- *economic crisis* (khủng hoảng kinh tế)<br>- *economic policies* | - *an economical car* (xe ô tô tiết kiệm xăng)<br>- *economical method* (phương pháp tiết kiệm)<br>- *an economical choice* |
| **Ví dụ minh họa** | *The country is experiencing rapid **economic** growth.* | *Hybrid vehicles are much more **economical** on fuel.* |`,
    notes: `💡 **Mẹo:**
- **Economic** ➔ Kinh tế học / Nền kinh tế.
- **Economical** (có thêm đuôi *-al*) ➔ Tiết kiệm tiền túi (*saving money*).`,
  },
  historic_historical: {
    title: 'Phân biệt "Historic" và "Historical"',
    table: `| Tiêu chí | HISTORIC (Trọng đại, mang tính lịch sử) | HISTORICAL (Thuộc về quá khứ, lịch sử) |
| :--- | :--- | :--- |
| **Bản chất ý nghĩa** | Bước ngoặt quan trọng, sự kiện vĩ đại ghi dấu ấn vào sử sách | Liên quan đến việc nghiên cứu, ghi chép hoặc tài liệu trong quá khứ |
| **Collocations** | - *a historic victory* (chiến thắng lịch sử)<br>- *a historic moment* (khoảnh khắc lịch sử)<br>- *historic day* | - *historical documents* (tài liệu lịch sử)<br>- *historical research* (nghiên cứu lịch sử)<br>- *historical novel* (tiểu thuyết lịch sử) |
| **Ví dụ minh họa** | *The moon landing was a **historic** event for humankind.* | *The museum contains valuable **historical** artifacts from the 18th century.* |`,
    notes: `💡 Một cuốn sách viết về triều đại phong kiến là *historical book*, nhưng khoảnh khắc ký hiệp định hòa bình là *historic moment*.`,
  },
  sensible_sensitive: {
    title: 'Phân biệt "Sensible" và "Sensitive"',
    table: `| Tiêu chí | SENSIBLE (Khôn ngoan, biết suy nghĩ) | SENSITIVE (Nhạy cảm, dễ xúc động) |
| :--- | :--- | :--- |
| **Gốc từ & Bản chất** | Xuất phát từ *Sense* (lý trí, phán đoán đúng đắn, thực tế) | Xuất phát từ *Sensation / Feeling* (cảm xúc, cảm giác giác quan) |
| **Tính chất miêu tả** | Hành động có óc thực tế, sáng suốt, hợp lẽ phải | Dễ bị tổn thương, dễ xúc động, hoặc phản ứng mạnh với môi trường |
| **Collocations** | - *a sensible decision* (quyết định khôn ngoan)<br>- *sensible clothes* (trang phục phù hợp thời tiết) | - *sensitive skin* (làn da nhạy cảm)<br>- *a sensitive topic* (chủ đề nhạy cảm)<br>- *a sensitive person* (người nhạy cảm) |
| **Ví dụ minh họa** | *It was very **sensible** of you to save money for emergencies.* | *She is very **sensitive** to cold weather.* |`,
    notes: `💡 *Sensible = Reasonable (Hợp lý, khôn ngoan); Sensitive = Easily affected / emotional (Nhạy cảm).*`,
  },
  beside_besides: {
    title: 'Phân biệt "Beside" và "Besides"',
    table: `| Tiêu chí | BESIDE (Bên cạnh) | BESIDES (Ngoài ra, hơn nữa) |
| :--- | :--- | :--- |
| **Hình thức chính tả** | Không có chữ "s" cuối | Có thêm chữ **"s"** ở cuối |
| **Loại từ & Ý nghĩa** | **Giới từ vị trí**: Kế bên, ngay sát bên (*Next to*) | **Trạng từ / Giới từ**: Thêm vào đó, ngoài ra (*In addition to*) |
| **Ví dụ minh họa** | *She sat **beside** me during the seminar.* | *What hobbies do you enjoy **besides** reading?* |`,
    notes: `💡 Mẹo nhớ: Từ **Besides** có thêm chữ **S** ➔ giống như thêm một phần bổ sung (*extra*).`,
  },
  shade_shadow: {
    title: 'Phân biệt "Shade" và "Shadow"',
    table: `| Tiêu chí | SHADE (Bóng râm) | SHADOW (Bóng đen của vật/người) |
| :--- | :--- | :--- |
| **Bản chất** | Khu vực mát mẻ, không có ánh nắng mặt trời chiếu rọi trực tiếp | Vùng tối có hình thù cụ thể in lên sàn/tường khi vật che khuất nguồn sáng |
| **Đếm được không?** | Danh từ không đếm được (*sit in the shade*) | Danh từ đếm được (*a shadow, long shadows*) |
| **Ví dụ minh họa** | *The temperature was 38°C, so we rested in the **shade** of a tree.* | *The sunset cast long **shadows** across the courtyard.* |`,
    notes: `💡 Bạn ngồi dưới bóng râm mát mẻ (*the shade*), và nhìn thấy bóng hình của chính mình (*your shadow*) in trên mặt đất.`,
  },
  customer_client: {
    title: 'Phân biệt "Customer" và "Client"',
    table: `| Tiêu chí | CUSTOMER (Khách mua hàng) | CLIENT (Khách hàng dịch vụ) |
| :--- | :--- | :--- |
| **Mối quan hệ** | Mua hàng hóa hữu hình tại cửa hàng, siêu thị; giao dịch ngắn hạn | Sử dụng dịch vụ chuyên nghiệp, tư vấn cá nhân hóa; quan hệ dài hạn |
| **Lĩnh vực phổ biến** | Cửa hàng bán lẻ, quán ăn, siêu thị, sàn thương mại điện tử | Luật sư, kế toán, ngân hàng tư vấn, kiến trúc sư, công ty phần mềm |
| **Ví dụ minh họa** | *The shop offers a 20% discount to all loyal **customers**.* | *The lawyer arranged a meeting to consult with his **client**.* |`,
    notes: `💡 Người mua cốc cà phê tại Starbucks là *customer*; doanh nghiệp thuê chuyên gia pháp lý tư vấn hợp đồng là *client*.`,
  },
  recipe_receipt: {
    title: 'Phân biệt "Recipe", "Receipt" và "Prescription"',
    table: `| Tiêu chí | RECIPE (Công thức nấu ăn) | RECEIPT (Biên lai, hóa đơn) | PRESCRIPTION (Đơn thuốc) |
| :--- | :--- | :--- | :--- |
| **Phát âm** | /ˈres.ə.pi/ (3 âm tiết) | /rɪˈsiːt/ (**chữ P câm**) | /prɪˈskrɪp.ʃən/ |
| **Ý nghĩa** | Hướng dẫn nguyên liệu & các bước nấu món ăn | Giấy biên lai chứng nhận đã thanh toán tiền mua hàng | Giấy của bác sĩ kê các loại thuốc cần uống |
| **Ví dụ** | *Can you share your delicious pancake **recipe**?* | *Always keep your **receipt** in case you need a refund.* | *You cannot buy these antibiotics without a doctor's **prescription**.* |`,
    notes: `⚠️ Chữ **P** trong từ **Receipt** là âm câm, phát âm chính xác là /rɪˈsiːt/.`,
  },
  quiet_quite: {
    title: 'Phân biệt "Quiet", "Quite" và "Quit"',
    table: `| Tiêu chí | QUIET (Yên tĩnh) | QUITE (Khá là, tương đối) | QUIT (Từ bỏ, nghỉ việc) |
| :--- | :--- | :--- | :--- |
| **Loại từ** | Tính từ (Adjective) | Trạng từ mức độ (Adverb) | Động từ (Verb) |
| **Chính tả & Phát âm** | Tận cùng là **-et** (/ˈkwaɪ.ət/ - 2 âm tiết) | Tận cùng là **-te** (/kwaɪt/ - 1 âm tiết) | Bỏ chữ e cuối (/kwɪt/ - âm i ngắn) |
| **Ví dụ minh họa** | *Please be **quiet**; the children are sleeping.* | *The exam was **quite** challenging, but I passed.* | *He decided to **quit** his job to start a company.* |`,
    notes: `💡 Để ý đuôi chữ: *Quiet* kết thúc bằng *-et* (nghe nhẹ nhàng như lời nhắc nhở), *Quite* kết thúc bằng *-te*.`,
  },
  dessert_desert: {
    title: 'Phân biệt "Dessert" và "Desert"',
    table: `| Tiêu chí | DESSERT (Món tráng miệng) | DESERT (Sa mạc / Bỏ rơi) |
| :--- | :--- | :--- |
| **Chính tả & Phát âm** | **2 chữ S** — /dɪˈzɜːrt/ (nhấn trọng âm âm 2) | **1 chữ S** — Danh từ: /ˈdez.ərt/ (nhấn âm 1); Động từ: /dɪˈzɜːrt/ (nhấn âm 2) |
| **Ý nghĩa** | Món ăn ngọt sau bữa chính (kem, bánh ngọt, chè, hoa quả) | Danh từ: Sa mạc khô cằn; Động từ: Rời bỏ, đào ngũ |
| **Ví dụ minh họa** | *Would you like chocolate mousse for **dessert**?* | *The camels crossed the vast **desert** under the scorching sun.* |`,
    notes: `💡 **Mẹo nhớ vui:**
- **Dessert** có 2 chữ **S** vì món tráng miệng rất ngọt ngào (Sweet / Sugar), ai cũng muốn ăn gấp đôi!
- **Desert** chỉ có 1 chữ **S** vì sa mạc thiếu thốn nước và cây cối.`,
  },
  complement_compliment: {
    title: 'Phân biệt "Complement" và "Compliment"',
    table: `| Tiêu chí | COMPLEMENT (Bổ sung, tương hỗ) | COMPLIMENT (Lời khen ngợi) |
| :--- | :--- | :--- |
| **Chữ cái khác nhau** | Chữ **"e"** (giống từ *complete* - làm trọn vẹn) | Chữ **"i"** (giống từ *I like you* - khen ngợi) |
| **Bản chất ý nghĩa** | Hai vật kết hợp ăn ý làm tôn lên vẻ đẹp hoặc hoàn thiện nhau | Lời khen ngợi, lời tán dương người khác |
| **Ví dụ minh họa** | *The red wine **complements** the steak perfectly.* | *He paid her a sincere **compliment** on her stylish dress.* |`,
    notes: `💡 *Compl**e**ment = Compl**e**te (Bổ sung làm hoàn chỉnh); Compl**i**ment = Pra**i**se (Khen ngợi).*`,
  },
  stationery_stationary: {
    title: 'Phân biệt "Stationery" và "Stationary"',
    table: `| Tiêu chí | STATIONERY (Văn phòng phẩm) | STATIONARY (Bất động, đứng yên) |
| :--- | :--- | :--- |
| **Chữ cái khác nhau** | Chữ **"e"** (giống từ *Envelope* - phong bì thư) | Chữ **"a"** |
| **Loại từ & Ý nghĩa** | Danh từ: Đồ dùng học tập, giấy, bút, sổ tay | Tính từ: Đứng yên một chỗ, không di chuyển |
| **Ví dụ minh họa** | *I bought notebooks and pens at the local **stationery** shop.* | *The truck remained **stationary** at the traffic lights.* |`,
    notes: `💡 *Station**e**ry = **E**nvelope (Văn phòng phẩm); Station**a**ry = St**a**nding still (Đứng yên).*`,
  },
  principle_principal: {
    title: 'Phân biệt "Principle" và "Principal"',
    table: `| Tiêu chí | PRINCIPLE (Nguyên tắc, chân lý) | PRINCIPAL (Hiệu trưởng / Chủ yếu) |
| :--- | :--- | :--- |
| **Đuôi từ** | Tận cùng là **-ple** | Tận cùng là **-pal** |
| **Loại từ & Ý nghĩa** | Danh từ: Nguyên tắc đạo đức, luật lệ cơ bản | Danh từ: Hiệu trưởng trường học;<br>Tính từ: Quan trọng nhất, chính yếu (*principal cause*) |
| **Ví dụ minh họa** | *He won't cheat because it goes against his **principles**.* | *The school **principal** welcomed the students back to school.* |`,
    notes: `💡 *The Princi**pal** is your **pal** (Hiệu trưởng là bạn của học sinh); Princi**ple** is a ru**le** (Nguyên tắc là luật lệ).*`,
  },
  emigrate_immigrate: {
    title: 'Phân biệt "Emigrate" và "Immigrate"',
    table: `| Tiêu chí | EMIGRATE (Xuất cảnh, di cư đi) | IMMIGRATE (Nhập cảnh, nhập cư đến) |
| :--- | :--- | :--- |
| **Tiền tố & Ý nghĩa** | **E-** (Exit): Rời khỏi quê hương để đi nơi khác | **Im-** (Into): Chuyển đến sống định cư tại một đất nước mới |
| **Giới từ đi kèm** | \`Emigrate FROM [Quốc gia]\` | \`Immigrate TO [Quốc gia]\` |
| **Ví dụ minh họa** | *His family **emigrated from** Italy in the 1970s.* | *Many skilled workers wish to **immigrate to** Australia.* |`,
    notes: `💡 *Emigrate FROM (Ra đi) ➔ Immigrate TO (Đến nơi).*`,
  },
  assure_ensure_insure: {
    title: 'Phân biệt "Assure", "Ensure" và "Insure"',
    table: `| Tiêu chí | ASSURE (Trấn an tinh thần) | ENSURE (Bảo đảm sự việc) | INSURE (Mua bảo hiểm tài chính) |
| :--- | :--- | :--- | :--- |
| **Tân ngữ theo sau** | Bắt buộc có **người nghe** (\`Assure SOMEONE that...\`) | Mệnh đề hoặc hành động (\`Ensure THAT...\`) | Hợp đồng bảo hiểm, tài sản, tiền tệ |
| **Trọng tâm ý nghĩa** | Trấn an, làm cho ai đó yên lòng | Đảm bảo chắc chắn việc gì sẽ xảy ra | Bảo hiểm phòng ngừa rủi ro tài chính |
| **Ví dụ minh họa** | *The doctor **assured the patient** that the surgery was safe.* | *Please **ensure that** all doors are locked before leaving.* | *You should **insure** your vehicle against theft.* |`,
    notes: `💡 *Assure người, Ensure việc, Insure tiền/tài sản.*`,
  },
  continuous_continual: {
    title: 'Phân biệt "Continuous" và "Continual"',
    table: `| Tiêu chí | CONTINUOUS (Liên tục không ngừng) | CONTINUAL (Liên miên, lặp đi lặp lại) |
| :--- | :--- | :--- |
| **Đặc điểm thời gian** | Diễn ra thông suốt, không gián đoạn dù chỉ một giây | Lặp đi lặp lại nhiều lần nhưng có quãng ngắt nghỉ ở giữa |
| **Sắc thái** | Thường là trung tính (*tiếng nhạc liên tục, dòng nước chảy liên tục*) | Thường mang sắc thái tiêu cực, phiền toái (*tiếng làm phiền liên miên*) |
| **Ví dụ minh họa** | *The machine operated with a **continuous** hum all night.* | *I am tired of his **continual** complaints during the meeting.* |`,
    notes: `💡 *Continuous = Non-stop; Continual = Repeated with breaks.*`,
  },
  fast_quick: {
    title: 'Phân biệt "Fast" và "Quick"',
    table: `| Tiêu chí | FAST (Tốc độ cao) | QUICK (Nhanh chóng, tích tắc) |
| :--- | :--- | :--- |
| **Trọng tâm ý nghĩa** | Vận tốc di chuyển của người hoặc phương tiện | Khoảng thời gian thực hiện diễn ra trong thời gian ngắn |
| **Loại từ** | Vừa là **Tính từ**, vừa là **Trạng từ** (*không có từ fastly*) | **Tính từ** (Trạng từ tương ứng là *quickly*) |
| **Collocations** | - *a fast car / train*<br>- *a fast runner*<br>- *drive fast* | - *a quick shower* (tắm nhanh)<br>- *a quick response / decision*<br>- *a quick look / glance* |
| **Ví dụ minh họa** | *A cheetah can run extraordinarily **fast**.* | *Let's take a **quick** break before the next session.* |`,
    notes: `⚠️ *Fast* nhấn mạnh tốc độ; *Quick* nhấn mạnh tiết kiệm thời gian.`,
  },
  finish_complete: {
    title: 'Phân biệt "Finish" và "Complete"',
    table: `| Tiêu chí | FINISH (Kết thúc hành động) | COMPLETE (Hoàn thiện trọn vẹn) |
| :--- | :--- | :--- |
| **Bản chất ý nghĩa** | Đi đến giai đoạn cuối cùng hoặc dừng làm một việc | Hoàn thành tất cả các bộ phận cấu thành để sản phẩm trở nên trọn vẹn 100% |
| **Collocations** | - *finish homework* (làm xong bài tập)<br>- *finish eating* (ăn xong)<br>- *finish the race* (về đích) | - *complete the application form* (điền đủ mọi mục đơn)<br>- *complete a degree* (hoàn thành chương trình học)<br>- *complete a puzzle* (ghép đủ mọi mảnh) |
| **Ví dụ minh họa** | *I **finished** washing the dishes ten minutes ago.* | *The construction of the airport is now fully **complete**.* |`,
    notes: `💡 *Finish* là dừng lại khi đã xong việc; *Complete* là bổ sung đầy đủ mọi chi tiết để hoàn chỉnh.`,
  },
  salary_wage_income: {
    title: 'Phân biệt "Salary", "Wage" và "Income"',
    table: `| Tiêu chí | SALARY (Lương định kỳ) | WAGE (Tiền công) | INCOME (Thu nhập tổng thể) |
| :--- | :--- | :--- | :--- |
| **Hình thức chi trả** | Trả cố định hàng tháng/năm cho nhân viên chính thức, văn phòng | Trả theo giờ làm việc hoặc theo tuần cho lao động bán thời gian | Tổng số tiền kiếm được từ tất cả các nguồn (lương, kinh doanh, đầu tư) |
| **Ví dụ minh họa** | *She negotiates for an annual **salary** of $75,000.* | *The minimum hourly **wage** in this city is $16.* | *His annual **income** increased significantly after investing.* |`,
    notes: `💡 *Salary* là lương văn phòng hàng tháng; *Wage* là tiền công theo giờ; *Income* là tổng thu nhập.`,
  },
  price_cost_fee_fare: {
    title: 'Phân biệt "Price", "Cost", "Fee" và "Fare"',
    table: `| Từ vựng | Ý nghĩa | Lĩnh vực áp dụng | Ví dụ minh họa |
| :--- | :--- | :--- | :--- |
| **PRICE** | Giá bán niêm yết | Giá của món hàng bán trong cửa hàng hoặc chợ | *The **price** of groceries has increased recently.* |
| **COST** | Chi phí sản xuất, chi phí tổn thất | Tổng số tiền cần thiết để sản xuất, duy trì một thứ | *The total **cost** of building the house exceeded the budget.* |
| **FEE** | Phí dịch vụ chuyên nghiệp | Học phí (*tuition fee*), phí luật sư, phí dịch vụ y tế, vé vào cổng | *Students must pay their tuition **fees** on time.* |
| **FARE** | Giá vé phương tiện | Tiền vé trả khi đi xe buýt, tàu hỏa, taxi, máy bay | *Train **fares** are cheaper during off-peak hours.* |`,
    notes: `💡 *Price* cho hàng hóa; *Cost* cho chi phí gốc; *Fee* cho dịch vụ/học phí; *Fare* cho tàu xe.`,
  },
  wait_expect_hope: {
    title: 'Phân biệt "Wait", "Expect" và "Hope"',
    table: `| Tiêu chí | WAIT (Chờ đợi) | EXPECT (Kỳ vọng, tin chắc) | HOPE (Hy vọng mong ước) |
| :--- | :--- | :--- | :--- |
| **Bản chất** | Hành động thể chất: Để thời gian trôi qua để ai đó đến | Nhận định lý trí: Tin chắc sự việc sẽ diễn ra vì có căn cứ | Cảm xúc tâm lý: Mong muốn điều tốt đẹp xảy ra dù không chắc chắn |
| **Cấu trúc ngữ pháp** | \`Wait FOR someone/something\`<br>\`Wait to V\` | \`Expect someone to V\`<br>\`Expect that...\` | \`Hope to V\`<br>\`Hope that...\` |
| **Ví dụ minh họa** | *I have been **waiting for** the bus for 20 minutes.* | *We **expect** our revenue to grow by 10% this year.* | *I **hope** that you recover quickly from your illness.* |`,
    notes: `💡 *Wait* là ngồi chờ thời gian; *Expect* là tin tưởng có cơ sở; *Hope* là niềm mong ước.`,
  },
  hi_hello: {
    title: 'Phân biệt "Hi" và "Hello" (Lời chào trong Tiếng Anh)',
    table: `| Tiêu chí | HI | HELLO |
| :--- | :--- | :--- |
| **Mức độ trang trọng** | **Thân mật (Informal)**, gần gũi | **Tiêu chuẩn / Lịch sự (Neutral / Formal)** |
| **Đối tượng giao tiếp** | Bạn bè, đồng nghiệp thân thiết, gia đình, người cùng trang lứa | Người lạ, cấp trên, đối tác, khách hàng, người lớn tuổi |
| **Khi nghe điện thoại** | Hầu như không dùng để nhấc máy | Chuẩn mực quốc tế khi nhấc máy (*"Hello, who is calling?"*) |
| **Trong thư từ / Email** | Dùng trong email trò chuyện thân mật (*"Hi Tom,"*) | Dùng trong email công việc tiêu chuẩn (*"Hello Mr. Davis,"*) |`,
    notes: `#### 🌟 Ví dụ ngữ cảnh thực tế:
- ✅ *Thân mật:* "**Hi Sarah**, are you coming to the party tonight?" *(Chào Sarah, tối nay bạn có đi tiệc không?)*
- ✅ *Trang trọng / Lịch sự:* "**Hello, Professor Anderson**. Thank you for meeting with me today." *(Kính chào Giáo sư Anderson. Cảm ơn thầy đã dành thời gian gặp em hôm nay.)*
- ☎️ *Nhấc máy điện thoại:* "**Hello**, LearnSphere customer support, how may I help you?"

---

💡 **Mở rộng thêm:**
- **"Hey"**: Thậm chí còn thân mật hơn *"Hi"*, dùng với bạn rất thân hoặc để thu hút sự chú ý (*"Hey, look at that!"*). Tránh dùng *"Hey"* với người lạ hoặc cấp trên vì có thể bị coi là thiếu trang trọng.`,
  },
  house_home: {
    title: 'Phân biệt "House" và "Home"',
    table: `| Tiêu chí | HOUSE (Ngôi nhà vật lý) | HOME (Tổ ấm / Mái nhà) |
| :--- | :--- | :--- |
| **Bản chất** | Tòa nhà, công trình kiến trúc vật lý (gạch, đá, xi măng) | Nơi chốn gắn liền với cảm xúc, sự gắn bó và gia đình |
| **Loại từ & Ngữ pháp** | Danh từ đếm được (*a house, two houses*) | Danh từ hoặc trạng từ (*go home*, *stay home* - không có giới từ *to*) |
| **Ví dụ minh họa** | *They bought a big **house** in the suburbs.* | *I want to go **home** and relax with my family.* |`,
    notes: `💡 **Mẹo nhớ:** "A house is built by hands, but a home is built by hearts." (Ngôi nhà xây bằng đôi tay, nhưng tổ ấm được dựng bằng trái tim).`,
  },
  job_work: {
    title: 'Phân biệt "Job", "Work" và "Career"',
    table: `| Từ vựng | Loại từ | Đếm được không | Bản chất & Ví dụ |
| :--- | :--- | :--- | :--- |
| **Job** | Danh từ | **Có đếm được** (*a job, jobs*) | Nghề nghiệp cụ thể, vị trí có trả lương (*"She applied for a new **job**."*) |
| **Work** | Danh từ / Động từ | **Không đếm được** | Công việc, hoạt động lao động nói chung (*"I have a lot of **work** to do today."*) |
| **Career** | Danh từ | **Có đếm được** | Sự nghiệp lâu dài, cả chặng đường cống hiến (*"He pursued a successful **career** in medicine."*) |`,
    notes: `⚠️ **Lỗi phổ biến:** Tuyệt đối không nói *"I have many jobs to do today"* khi muốn nói *"Tôi có nhiều việc phải làm"*, mà phải dùng *"I have a lot of work to do"*.`,
  },
  win_beat: {
    title: 'Phân biệt "Win" và "Beat"',
    table: `| Từ vựng | Cấu trúc câu | Đối tượng theo sau | Ví dụ minh họa |
| :--- | :--- | :--- | :--- |
| **WIN** | \`Win + Trò chơi / Giải thưởng / Trận đấu\` | Giải đấu, huy chương, tiền, giải thưởng | *Vietnam **won** the championship.* *(Việt Nam giành chức vô địch.)* |
| **BEAT** | \`Beat + Đối thủ / Đội đối phương\` | Đánh bại một người hoặc một đội cụ thể | *Vietnam **beat** Thailand 2-0.* *(Việt Nam đánh bại Thái Lan 2-0.)* |`,
    notes: `⚠️ **Lỗi thường gặp:**\n- ❌ *Sai:* We won Thailand in the match.\n- ✅ *Đúng:* We **beat** Thailand / We **won** the match.`,
  },
  travel_trip: {
    title: 'Phân biệt "Travel", "Trip" và "Journey"',
    table: `| Từ vựng | Loại từ | Ý nghĩa | Ví dụ |
| :--- | :--- | :--- | :--- |
| **Trip** | Danh từ đếm được | Chuyến đi ngắn/dài (thường có đi và về, có mục đích) | *We had a memorable business **trip** to Singapore.* |
| **Travel** | Động từ / Danh từ không đếm được | Việc du lịch, đi lại nói chung | *Air **travel** has become increasingly affordable.* |
| **Journey** | Danh từ đếm được | Hành trình di chuyển từ nơi này đến nơi khác (thường dài) | *It was an arduous 12-hour train **journey**.* |`,
    notes: `💡 **Collocations:** *go on a business trip*, *safe travels*, *an exciting journey of discovery*.`,
  },
  remember_remind: {
    title: 'Phân biệt "Remember" và "Remind"',
    table: `| Từ vựng | Ý nghĩa | Cấu trúc ngữ pháp | Ví dụ |
| :--- | :--- | :--- | :--- |
| **Remember** | Tự mình nhớ lại (chủ động trong tâm trí) | \`Remember to V\` (nhớ phải làm)<br>\`Remember V-ing\` (nhớ đã làm) | *I **remember** locking the door.* |
| **Remind** | Nhắc nhở người khác làm gì | \`Remind SOMEONE to V\`<br>\`Remind SOMEONE of something\` | *Please **remind me** to call Mom.* |`,
    notes: `💡 *Remind of:* Gợi nhớ về ai/cái gì (*"This song reminds me of my high school days."*).`,
  },
  learn_study: {
    title: 'Phân biệt "Learn" và "Study"',
    table: `| Từ vựng | Bản chất | Trọng tâm | Ví dụ |
| :--- | :--- | :--- | :--- |
| **Study** | Quá trình học tập (đọc sách, lên lớp, nghiên cứu) | Quá trình, nỗ lực hành động | *I am **studying** hard for the upcoming IELTS exam.* |
| **Learn** | Tiếp thu kiến thức/kỹ năng mới thành công | Kết quả, kỹ năng đạt được | *I **learned** how to drive a car last month.* |`,
    notes: `💡 Bạn có thể *study* cả đêm nhưng chưa chắc đã *learn* được gì nếu không thực sự hiểu bài!`,
  },
  bring_take: {
    title: 'Phân biệt "Bring" và "Take"',
    table: `| Từ vựng | Hướng chuyển động | Quy tắc nhớ | Ví dụ |
| :--- | :--- | :--- | :--- |
| **Bring** | Hướng về phía người nói (Come here) | Mang đến / Đem lại đây | *Please **bring** me a glass of water.* |
| **Take** | Rời xa phía người nói (Go away) | Mang đi / Đem đi nơi khác | *Don't forget to **take** your umbrella with you.* |`,
    notes: `💡 **Quy tắc vàng:** *Bring here, Take there.*`,
  },
  fit_suit: {
    title: 'Phân biệt "Fit", "Suit" và "Match"',
    table: `| Từ vựng | Bản chất vừa vặn | Áp dụng cho | Ví dụ |
| :--- | :--- | :--- | :--- |
| **Fit** | Vừa vặn về **kích cỡ, kích thước (Size/Shape)** | Quần áo, giày dép, không gian | *These shoes don't **fit** me; they are too small.* |
| **Suit** | Hợp về **phong cách, diện mạo, màu sắc** | Trang phục làm bạn trông đẹp hơn | *Blue really **suits** you; you look stunning.* |
| **Match** | Hai đồ vật **hợp nhau / đồng điệu** | Màu sắc, hoa văn của 2 vật kết hợp | *Your tie **matches** your jacket perfectly.* |`,
    notes: `💡 *Fit = Size, Suit = Style/Looks, Match = Go together.*`,
  },
  farther_further: {
    title: 'Phân biệt "Farther" và "Further"',
    table: `| Từ vựng | Ý nghĩa | Dùng cho khoảng cách | Ví dụ |
| :--- | :--- | :--- | :--- |
| **Farther** | Xa hơn | **Chỉ khoảng cách vật lý đo đếm được** | *My house is 2 miles **farther** than yours.* |
| **Further** | Sâu hơn, thêm nữa | **Cả khoảng cách vật lý và nghĩa trừu tượng** | *For **further** information, please contact us.* |`,
    notes: `💡 Không bao giờ dùng *farther information*, chỉ dùng *further information / further assistance*.`,
  },
  alone_lonely: {
    title: 'Phân biệt "Alone" và "Lonely"',
    table: `| Từ vựng | Loại từ | Ý nghĩa | Ví dụ |
| :--- | :--- | :--- | :--- |
| **Alone** | Tính từ / Trạng từ | Một mình (trạng thái vật lý, không có người bên cạnh) | *I enjoy living **alone**.* |
| **Lonely** | Tính từ | Cô đơn, lẻ loi (cảm xúc tâm lý buồn bã) | *He felt very **lonely** in the crowded city.* |`,
    notes: `💡 Bạn có thể ở một mình (*alone*) mà không cảm thấy cô đơn (*not lonely*), và ngược lại có thể cảm thấy cô đơn (*lonely*) giữa đám đông!`,
  },
  rob_steal: {
    title: 'Phân biệt "Rob" và "Steal"',
    table: `| Từ vựng | Cấu trúc câu | Trọng tâm hành động | Ví dụ |
| :--- | :--- | :--- | :--- |
| **Steal** | \`Steal + Đồ vật bị lấy trộm\` | Lén lút lấy cắp tài sản | *A thief **stole** my bicycle yesterday.* |
| **Rob** | \`Rob + Người / Ngân hàng / Cửa hàng\` | Cướp bóc đe dọa trực tiếp nạn nhân | *Two masked men **robbed** the local bank.* |`,
    notes: `⚠️ **Quy tắc:** *Steal the money, Rob the bank.* Tuyệt đối không nói *"They robbed my money"*.`,
  },
  fun_funny: {
    title: 'Phân biệt "Fun" và "Funny"',
    table: `| Từ vựng | Ý nghĩa | Tính chất | Ví dụ |
| :--- | :--- | :--- | :--- |
| **Fun** | Vui vẻ, hào hứng, thú vị | Mang lại sự thích thú, giải trí | *The amusement park was so much **fun**!* |
| **Funny** | Buồn cười, khôi hài, kỳ lạ | Khiến bạn bật cười hoặc gây khó hiểu | *That comedian told a very **funny** joke.* |`,
    notes: `💡 *"A fun person"* là người vui tính, hòa đồng; *"A funny person"* là người hay làm trò cười hoặc có hành tung kỳ lạ.`,
  },
  hard_hardly: {
    title: 'Phân biệt "Hard" và "Hardly"',
    table: `| Từ vựng | Ý nghĩa | Loại từ | Ví dụ |
| :--- | :--- | :--- | :--- |
| **Hard** | Chăm chỉ, vất vả, khó khăn, cứng rắn | Tính từ hoặc Trạng từ | *She works **hard** every single day.* |
| **Hardly** | Hầu như không (Mang nghĩa phủ định) | Trạng từ chỉ tần suất | *He was so tired that he could **hardly** speak.* |`,
    notes: `⚠️ *"Work hard"* là làm việc chăm chỉ, còn *"Hardly work"* là hầu như không làm gì cả!`,
  },
}

/**
 * Bảng tra cứu bí danh (Aliases) để bất kể người dùng gõ thứ tự nào hoặc từ khóa nào cũng tìm ra đúng cặp từ
 */
const VOCAB_DIFF_ALIASES: Record<string, string> = {
  // Borrow & Lend
  borrow_lend: "borrow_lend",
  lend_borrow: "borrow_lend",
  borrow: "borrow_lend",
  lend: "borrow_lend",
  loan: "borrow_lend",

  // Make & Do
  make_do: "make_do",
  do_make: "make_do",
  make: "make_do",
  do: "make_do",

  // Look & See & Watch
  look_see_watch: "look_see_watch",
  see_look_watch: "look_see_watch",
  look_see: "look_see_watch",
  see_look: "look_see_watch",
  look_watch: "look_see_watch",
  watch_look: "look_see_watch",
  see_watch: "look_see_watch",
  watch_see: "look_see_watch",
  look: "look_see_watch",
  see: "look_see_watch",
  watch: "look_see_watch",

  // Say & Tell & Speak & Talk
  say_tell_speak_talk: "say_tell_speak_talk",
  say_tell: "say_tell_speak_talk",
  tell_say: "say_tell_speak_talk",
  speak_talk: "say_tell_speak_talk",
  talk_speak: "say_tell_speak_talk",
  say_speak: "say_tell_speak_talk",
  speak_say: "say_tell_speak_talk",
  say_talk: "say_tell_speak_talk",
  talk_say: "say_tell_speak_talk",
  tell_speak: "say_tell_speak_talk",
  tell_talk: "say_tell_speak_talk",
  say: "say_tell_speak_talk",
  tell: "say_tell_speak_talk",
  speak: "say_tell_speak_talk",
  talk: "say_tell_speak_talk",

  // Listen & Hear
  listen_hear: "listen_hear",
  hear_listen: "listen_hear",
  listen: "listen_hear",
  hear: "listen_hear",

  // Affect & Effect
  affect_effect: "affect_effect",
  effect_affect: "affect_effect",
  affect: "affect_effect",
  effect: "affect_effect",

  // Since & For
  since_for: "since_for",
  for_since: "since_for",
  since: "since_for",
  for: "since_for",

  // Advise & Advice
  advise_advice: "advise_advice",
  advice_advise: "advise_advice",
  advise: "advise_advice",
  advice: "advise_advice",

  // Accept & Except
  accept_except: "accept_except",
  except_accept: "accept_except",
  accept: "accept_except",
  except: "accept_except",

  // Lose & Loose
  lose_loose: "lose_loose",
  loose_lose: "lose_loose",
  lose: "lose_loose",
  loose: "lose_loose",

  // Lie & Lay
  lie_lay: "lie_lay",
  lay_lie: "lie_lay",
  lie: "lie_lay",
  lay: "lie_lay",

  // Rise & Raise & Arise
  rise_raise: "rise_raise",
  raise_rise: "rise_raise",
  rise_raise_arise: "rise_raise",
  rise: "rise_raise",
  raise: "rise_raise",
  arise: "rise_raise",

  // Tall & High
  tall_high: "tall_high",
  high_tall: "tall_high",
  tall: "tall_high",
  high: "tall_high",

  // Economic & Economical
  economic_economical: "economic_economical",
  economical_economic: "economic_economical",
  economic: "economic_economical",
  economical: "economic_economical",

  // Historic & Historical
  historic_historical: "historic_historical",
  historical_historic: "historic_historical",
  historic: "historic_historical",
  historical: "historic_historical",

  // Sensible & Sensitive
  sensible_sensitive: "sensible_sensitive",
  sensitive_sensible: "sensible_sensitive",
  sensible: "sensible_sensitive",
  sensitive: "sensible_sensitive",

  // Beside & Besides
  beside_besides: "beside_besides",
  besides_beside: "beside_besides",
  beside: "beside_besides",
  besides: "beside_besides",

  // Shade & Shadow
  shade_shadow: "shade_shadow",
  shadow_shade: "shade_shadow",
  shade: "shade_shadow",
  shadow: "shade_shadow",

  // Customer & Client
  customer_client: "customer_client",
  client_customer: "customer_client",
  customer: "customer_client",
  client: "customer_client",

  // Recipe & Receipt
  recipe_receipt: "recipe_receipt",
  receipt_recipe: "recipe_receipt",
  recipe: "recipe_receipt",
  receipt: "recipe_receipt",
  prescription: "recipe_receipt",

  // Quiet & Quite & Quit
  quiet_quite: "quiet_quite",
  quite_quiet: "quiet_quite",
  quiet_quite_quit: "quiet_quite",
  quiet: "quiet_quite",
  quite: "quiet_quite",

  // Dessert & Desert
  dessert_desert: "dessert_desert",
  desert_dessert: "dessert_desert",
  dessert: "dessert_desert",
  desert: "dessert_desert",

  // Complement & Compliment
  complement_compliment: "complement_compliment",
  compliment_complement: "complement_compliment",
  complement: "complement_compliment",
  compliment: "complement_compliment",

  // Stationery & Stationary
  stationery_stationary: "stationery_stationary",
  stationary_stationery: "stationery_stationary",
  stationery: "stationery_stationary",
  stationary: "stationery_stationary",

  // Principle & Principal
  principle_principal: "principle_principal",
  principal_principle: "principle_principal",
  principle: "principle_principal",
  principal: "principle_principal",

  // Emigrate & Immigrate
  emigrate_immigrate: "emigrate_immigrate",
  immigrate_emigrate: "emigrate_immigrate",
  emigrate: "emigrate_immigrate",
  immigrate: "emigrate_immigrate",

  // Assure & Ensure & Insure
  assure_ensure_insure: "assure_ensure_insure",
  assure_ensure: "assure_ensure_insure",
  ensure_assure: "assure_ensure_insure",
  ensure_insure: "assure_ensure_insure",
  assure: "assure_ensure_insure",
  ensure: "assure_ensure_insure",
  insure: "assure_ensure_insure",

  // Continuous & Continual
  continuous_continual: "continuous_continual",
  continual_continuous: "continuous_continual",
  continuous: "continuous_continual",
  continual: "continuous_continual",

  // Fast & Quick
  fast_quick: "fast_quick",
  quick_fast: "fast_quick",
  fast: "fast_quick",
  quick: "fast_quick",

  // Finish & Complete
  finish_complete: "finish_complete",
  complete_finish: "finish_complete",
  finish: "finish_complete",
  complete: "finish_complete",

  // Salary & Wage & Income
  salary_wage_income: "salary_wage_income",
  salary_wage: "salary_wage_income",
  wage_salary: "salary_wage_income",
  salary_income: "salary_wage_income",
  wage_income: "salary_wage_income",
  salary: "salary_wage_income",
  wage: "salary_wage_income",
  income: "salary_wage_income",

  // Price & Cost & Fee & Fare
  price_cost_fee_fare: "price_cost_fee_fare",
  price_cost: "price_cost_fee_fare",
  cost_price: "price_cost_fee_fare",
  fee_fare: "price_cost_fee_fare",
  fare_fee: "price_cost_fee_fare",
  price_fee: "price_cost_fee_fare",
  cost_fee: "price_cost_fee_fare",
  price: "price_cost_fee_fare",
  cost: "price_cost_fee_fare",
  fee: "price_cost_fee_fare",
  fare: "price_cost_fee_fare",

  // Wait & Expect & Hope
  wait_expect_hope: "wait_expect_hope",
  wait_expect: "wait_expect_hope",
  expect_wait: "wait_expect_hope",
  expect_hope: "wait_expect_hope",
  wait_hope: "wait_expect_hope",
  wait: "wait_expect_hope",
  expect: "wait_expect_hope",
  hope: "wait_expect_hope",

  // Hi & Hello
  hi_hello: "hi_hello",
  hello_hi: "hi_hello",
  hi: "hi_hello",
  hello: "hi_hello",

  // House & Home
  house_home: "house_home",
  home_house: "house_home",
  house: "house_home",
  home: "house_home",

  // Job & Work & Career
  job_work: "job_work",
  work_job: "job_work",
  job_career: "job_work",
  work_career: "job_work",
  job: "job_work",
  work: "job_work",
  career: "job_work",

  // Win & Beat
  win_beat: "win_beat",
  beat_win: "win_beat",
  win: "win_beat",
  beat: "win_beat",

  // Travel & Trip & Journey
  travel_trip: "travel_trip",
  trip_travel: "travel_trip",
  travel_journey: "travel_trip",
  trip_journey: "travel_trip",
  travel: "travel_trip",
  trip: "travel_trip",
  journey: "travel_trip",

  // Remember & Remind
  remember_remind: "remember_remind",
  remind_remember: "remember_remind",
  remember: "remember_remind",
  remind: "remember_remind",

  // Learn & Study
  learn_study: "learn_study",
  study_learn: "learn_study",
  learn: "learn_study",
  study: "learn_study",

  // Bring & Take
  bring_take: "bring_take",
  take_bring: "bring_take",
  bring: "bring_take",
  take: "bring_take",

  // Fit & Suit & Match
  fit_suit: "fit_suit",
  suit_fit: "fit_suit",
  fit_match: "fit_suit",
  suit_match: "fit_suit",
  fit: "fit_suit",
  suit: "fit_suit",
  match: "fit_suit",

  // Farther & Further
  farther_further: "farther_further",
  further_farther: "farther_further",
  farther: "farther_further",
  further: "farther_further",

  // Alone & Lonely
  alone_lonely: "alone_lonely",
  lonely_alone: "alone_lonely",
  alone: "alone_lonely",
  lonely: "alone_lonely",

  // Rob & Steal
  rob_steal: "rob_steal",
  steal_rob: "rob_steal",
  rob: "rob_steal",
  steal: "rob_steal",

  // Fun & Funny
  fun_funny: "fun_funny",
  funny_fun: "fun_funny",
  fun: "fun_funny",
  funny: "fun_funny",

  // Hard & Hardly
  hard_hardly: "hard_hardly",
  hardly_hard: "hard_hardly",
  hard: "hard_hardly",
  hardly: "hard_hardly",
}

/**
 * Kiểm tra xem cặp từ có nằm trong danh bạ biên soạn sẵn hay không
 */
export function isPredefinedVocabDiff(word1: string, word2: string, extraWord?: string): boolean {
  const w1 = word1.toLowerCase()
  const w2 = word2.toLowerCase()
  const extra = extraWord ? extraWord.toLowerCase() : ""

  const keyPair1 = `${w1}_${w2}`
  const keyPair2 = `${w2}_${w1}`
  const keyTriple = extra ? `${w1}_${w2}_${extra}` : ""

  const targetKey =
    VOCAB_DIFF_ALIASES[keyTriple] ||
    VOCAB_DIFF_ALIASES[keyPair1] ||
    VOCAB_DIFF_ALIASES[keyPair2]

  return !!(targetKey && VOCAB_DIFF_DICT[targetKey])
}

type LexiconItem = {
  meaning: string
  posLabel: string
  register: string
  nuance: string
  collocations: string
  samplePattern: string
}

/**
 * Kho ngữ nghĩa từ vựng mở rộng phục vụ đối chiếu các cặp từ bất kỳ (Offline Lexicon)
 */
const LOCAL_SEMANTIC_LEXICON: Record<string, LexiconItem> = {
  inquire: {
    meaning: "Hỏi han, tìm hiểu thông tin một cách lịch sự/chính thức",
    posLabel: "Động từ (Verb)",
    register: "Trang trọng / Lịch sự (Formal)",
    nuance: "Dùng khi hỏi thăm dịch vụ, thủ tục hành chính, giá vé hoặc tin tức",
    collocations: "*inquire about the price/flight*, *inquire after someone's health*, *inquire within*",
    samplePattern: "She phoned the airline to **inquire** about the flight schedule. *(Cô ấy đã gọi điện cho hãng hàng không để hỏi về lịch bay.)*",
  },
  investigate: {
    meaning: "Điều tra, nghiên cứu sâu để tìm ra sự thật / nguyên nhân cốt lõi",
    posLabel: "Động từ (Verb)",
    register: "Trang trọng / Pháp lý (Formal / Investigative)",
    nuance: "Dùng trong điều tra hình sự, điều tra sự cố kỹ thuật hoặc nghiên cứu khoa học",
    collocations: "*investigate a crime/case*, *investigate the cause of accident*, *thoroughly investigate*",
    samplePattern: "The police are **investigating** the mysterious robbery. *(Cảnh sát đang điều tra vụ cướp bí ẩn.)*",
  },
  purchase: {
    meaning: "Mua sắm, giao dịch mua hàng chính thức, giá trị cao",
    posLabel: "Động từ / Danh từ",
    register: "Trang trọng / Thương mại (Formal / Commercial)",
    nuance: "Giao dịch bất động sản, hợp đồng kinh doanh, mua sắm lớn (*make a purchase*)",
    collocations: "*purchase a property*, *proof of purchase*, *purchase order*",
    samplePattern: "They decided to **purchase** a new apartment downtown. *(Họ quyết định mua một căn hộ mới ở trung tâm.)*",
  },
  buy: {
    meaning: "Mua (hàng ngày, đời sống thực tế, thân mật)",
    posLabel: "Động từ (Verb)",
    register: "Đời thường (Everyday Spoken)",
    nuance: "Mua thực phẩm, đồ dùng sinh hoạt hàng ngày",
    collocations: "*buy groceries*, *buy a ticket*, *buy lunch*",
    samplePattern: "Don't forget to **buy** some fresh milk on your way home. *(Đừng quên mua chút sữa tươi trên đường về nhà nhé.)*",
  },
  client: {
    meaning: "Khách hàng sử dụng dịch vụ chuyên nghiệp, tư vấn dài hạn",
    posLabel: "Danh từ (Noun)",
    register: "Chuyên nghiệp / Pháp lý / Tài chính",
    nuance: "Khách hàng của luật sư, kế toán, kiến trúc sư, công ty phần mềm",
    collocations: "*corporate client*, *client satisfaction*, *meet a client*",
    samplePattern: "The lawyer spent two hours advising his **client**. *(Luật sư đã dành hai tiếng tư vấn cho thân chủ của mình.)*",
  },
  user: {
    meaning: "Người dùng hệ thống, công nghệ, ứng dụng, website",
    posLabel: "Danh từ (Noun)",
    register: "Công nghệ / Trung tính",
    nuance: "Người trực tiếp tương tác, thao tác với phần mềm, dịch vụ số",
    collocations: "*active users*, *user interface (UI)*, *user experience (UX)*",
    samplePattern: "The mobile app has reached five million active **users**. *(Ứng dụng di động đã đạt mốc 5 triệu người dùng hoạt động.)*",
  },
  consumer: {
    meaning: "Người tiêu dùng cuối cùng trong chuỗi cung ứng thị trường",
    posLabel: "Danh từ (Noun)",
    register: "Kinh tế học / Xã hội",
    nuance: "Đối tượng trực tiếp sử dụng hàng hóa, được bảo vệ bởi luật tiêu dùng",
    collocations: "*consumer rights*, *consumer behavior*, *consumer goods*",
    samplePattern: "Advertising directly influences **consumer** choices. *(Quảng cáo tác động trực tiếp đến quyết định của người tiêu dùng.)*",
  },
  clever: {
    meaning: "Khôn khéo, lanh lợi, tháo vát, ứng biến nhanh",
    posLabel: "Tính từ (Adjective)",
    register: "Đời thường / Đa dụng",
    nuance: "Giải quyết vấn đề nhanh trí, đôi khi có nét ranh mãnh hoặc mẹo vặt",
    collocations: "*a clever idea*, *a clever solution*, *clever trick*",
    samplePattern: "That was a **clever** solution to the difficult puzzle. *(Đó là một giải pháp khôn khéo cho câu đố khó.)*",
  },
  smart: {
    meaning: "Sáng dạ, thông minh thực tế, biết suy nghĩ chín chắn",
    posLabel: "Tính từ (Adjective)",
    register: "Hiện đại / Thông dụng",
    nuance: "Nhanh nhạy trong đời sống, quyết định sáng suốt; hoặc ăn mặc chỉnh tề (*smart casual*)",
    collocations: "*a smart move*, *smart technology*, *look smart*",
    samplePattern: "Investing in education is always a **smart** decision. *(Đầu tư vào giáo dục luôn là một quyết định sáng suốt.)*",
  },
  intelligent: {
    meaning: "Thông minh xuất chúng, có năng lực tư duy logic và học thuật cao",
    posLabel: "Tính từ (Adjective)",
    register: "Học thuật / Trang trọng (Formal)",
    nuance: "Năng lực bẩm sinh, chỉ số IQ cao, khả năng phân tích lý luận phức tạp",
    collocations: "*an intelligent student*, *artificial intelligence*, *intelligent debate*",
    samplePattern: "She is one of the most **intelligent** researchers in the institute. *(Cô ấy là một trong những nhà nghiên cứu thông minh nhất viện.)*",
  },
  start: {
    meaning: "Bắt đầu, khởi động (động cơ, dự án, kinh doanh)",
    posLabel: "Động từ (Verb)",
    register: "Đời thường / Đa dụng",
    nuance: "Dùng cho xe cộ, động cơ máy móc, khởi nghiệp, hoặc phản xạ giật mình",
    collocations: "*start the car*, *start a business*, *start from scratch*",
    samplePattern: "Turn the key to **start** the engine. *(Vặn chìa khóa để khởi động động cơ xe.)*",
  },
  begin: {
    meaning: "Bắt đầu (tiến trình, nghi lễ, thời gian, sự kiện)",
    posLabel: "Động từ (Verb)",
    register: "Trang trọng hơn start (Neutral / Formal)",
    nuance: "Dùng cho tiến trình tự nhiên, buổi lễ, bài giảng, thời gian trừu tượng",
    collocations: "*the ceremony begins*, *begin to rain*, *to begin with*",
    samplePattern: "The graduation ceremony **begins** at 9 a.m. sharp. *(Lễ tốt nghiệp sẽ bắt đầu chuẩn xác vào lúc 9 giờ sáng.)*",
  },
  commence: {
    meaning: "Bắt đầu, khai mạc (nghi thức, pháp lý, sự kiện trọng đại)",
    posLabel: "Động từ (Verb)",
    register: "Rất trang trọng / Pháp lý (Very Formal)",
    nuance: "Dùng trong thủ tục tòa án, hợp đồng ký kết, năm học đại học chính thức",
    collocations: "*commence proceedings*, *commence work*, *commence operations*",
    samplePattern: "The university term will **commence** next Monday. *(Kỳ học đại học sẽ chính thức khai giảng vào thứ Hai tuần tới.)*",
  },
  help: {
    meaning: "Giúp đỡ (trực tiếp, hàng ngày)",
    posLabel: "Động từ / Danh từ",
    register: "Đời thường (Everyday)",
    nuance: "Hành động phụ giúp thân mật trong sinh hoạt thường nhật",
    collocations: "*help with homework*, *ask for help*, *can't help it*",
    samplePattern: "Could you please **help** me carry these heavy books? *(Bạn có thể giúp mình bê đống sách nặng này được không?)*",
  },
  assist: {
    meaning: "Hỗ trợ chuyên môn, trợ giúp trong quy trình chính thức",
    posLabel: "Động từ (Verb)",
    register: "Trang trọng / Công sở (Formal)",
    nuance: "Vai trò trợ lý, nhân viên hỗ trợ chuyên gia trong môi trường làm việc",
    collocations: "*assist the doctor*, *technical assistance*, *assist in doing*",
    samplePattern: "The nurse **assisted** the surgeon throughout the operation. *(Y tá đã hỗ trợ bác sĩ phẫu thuật trong suốt ca mổ.)*",
  },
  vehicle: {
    meaning: "Phương tiện giao thông nói chung (Từ bao quát / Hypernym)",
    posLabel: "Danh từ (Noun)",
    register: "Trang trọng / Pháp lý (Formal)",
    nuance: "Bao gồm ô tô, xe máy, xe buýt, tàu hỏa, xe tải",
    collocations: "*motor vehicle*, *electric vehicle (EV)*, *vehicle safety*",
    samplePattern: "Emergency **vehicles** have priority on highways. *(Các phương tiện cứu thương có quyền ưu tiên trên đường cao tốc.)*",
  },
  car: {
    meaning: "Xe ô tô (xe con chuyên chở ít người)",
    posLabel: "Danh từ (Noun)",
    register: "Cụ thể / Đời thường (Common)",
    nuance: "Xe 4-7 chỗ phục vụ nhu cầu đi lại cá nhân hoặc gia đình",
    collocations: "*drive a car*, *park the car*, *second-hand car*",
    samplePattern: "He drives his **car** to the office every morning. *(Anh ấy lái ô tô đi làm mỗi sáng.)*",
  },
  apartment: {
    meaning: "Căn hộ trong tòa nhà chung cư (Tiếng Anh - Mỹ / US)",
    posLabel: "Danh từ (Noun)",
    register: "Hiện đại / Đô thị",
    nuance: "Căn hộ độc lập đầy đủ tiện nghi trong một tòa tháp nhiều tầng",
    collocations: "*rent an apartment*, *apartment complex*, *two-bedroom apartment*",
    samplePattern: "She rented a cozy **apartment** near the central station. *(Cô ấy đã thuê một căn hộ ấm cúng gần ga trung tâm.)*",
  },
  flat: {
    meaning: "Căn hộ (Tiếng Anh - Anh / British English)",
    posLabel: "Danh từ (Noun)",
    register: "Chuẩn Anh - Anh (UK)",
    nuance: "Đồng nghĩa với apartment nhưng là từ vựng ưa chuộng tại Anh Quốc",
    collocations: "*a block of flats*, *share a flat*, *furnish a flat*",
    samplePattern: "He lived in a small **flat** in North London during his studies. *(Anh ấy sống trong một căn hộ nhỏ ở Bắc London thời đi học.)*",
  },
  problem: {
    meaning: "Vấn đề rắc rối, khó khăn tiêu cực cần khắc phục",
    posLabel: "Danh từ (Noun)",
    register: "Đời thường / Tiêu cực",
    nuance: "Tình huống xấu gây cản trở, đòi hỏi phải tìm ra giải pháp để xử lý",
    collocations: "*solve a problem*, *have problems with*, *serious problem*",
    samplePattern: "Traffic congestion is a chronic **problem** in major cities. *(Ùn tắc giao thông là một vấn đề nhức nhối ở các thành phố lớn.)*",
  },
  issue: {
    meaning: "Vấn đề thảo luận, đề tài xã hội hoặc sự cố kỹ thuật",
    posLabel: "Danh từ (Noun)",
    register: "Khách quan / Học thuật / Báo chí",
    nuance: "Chủ đề tranh luận mang tính thời sự; hoặc lỗi kỹ thuật phần mềm",
    collocations: "*environmental issue*, *address the issue*, *sensitive issue*",
    samplePattern: "The summit addressed the critical **issue** of carbon emissions. *(Hội nghị thượng đỉnh đã giải quyết vấn đề cấp bách về phát thải carbon.)*",
  },
  mistake: {
    meaning: "Lỗi lầm do sơ suất, bất cẩn hoặc hiểu sai",
    posLabel: "Danh từ (Noun)",
    register: "Đời thường / Phổ biến",
    nuance: "Sai sót cá nhân trong hành động, thi cử, tính toán",
    collocations: "*make a mistake*, *by mistake*, *learn from mistakes*",
    samplePattern: "I made a careless **mistake** in the math test. *(Tôi đã phạm phải một sai lầm bất cẩn trong bài thi toán.)*",
  },
  error: {
    meaning: "Lỗi hệ thống, sai số kỹ thuật, lỗi tính toán",
    posLabel: "Danh từ (Noun)",
    register: "Kỹ thuật / Học thuật (Technical)",
    nuance: "Sai lệch so với chuẩn mực khoa học, lỗi lập trình (*syntax error*)",
    collocations: "*system error*, *margin of error*, *human error*",
    samplePattern: "The software crashed due to an unexpected memory **error**. *(Phần mềm bị sập do lỗi bộ nhớ đột ngột.)*",
  },
  opportunity: {
    meaning: "Cơ hội thuận lợi nhờ nỗ lực hoặc hoàn cảnh tốt",
    posLabel: "Danh từ (Noun)",
    register: "Tích cực / Trang trọng",
    nuance: "Dịp may mắn có thể nắm bắt để thăng tiến, học tập, thành đạt",
    collocations: "*job opportunity*, *seize an opportunity*, *golden opportunity*",
    samplePattern: "Studying abroad provides a splendid **opportunity** to explore the world. *(Du học mang lại cơ hội tuyệt vời để khám phá thế giới.)*",
  },
  chance: {
    meaning: "Cơ hội tình cờ, xác suất may rủi ngẫu nhiên",
    posLabel: "Danh từ (Noun)",
    register: "Đời thường / Xác suất",
    nuance: "Sự việc xảy ra ngẫu nhiên hoặc khả năng thành bại (*take a chance*)",
    collocations: "*by chance*, *take a chance*, *stand a chance*",
    samplePattern: "We met purely by **chance** at an airport café. *(Chúng tôi gặp nhau hoàn toàn ngẫu nhiên tại quán cà phê sân bay.)*",
  },
  teach: {
    meaning: "Dạy học, truyền thụ kiến thức nói chung",
    posLabel: "Động từ (Verb)",
    register: "Phổ quát / Đời thường",
    nuance: "Dạy một môn học, dạy con cái các kỹ năng cơ bản",
    collocations: "*teach English*, *teach someone a lesson*, *teach school*",
    samplePattern: "She **teaches** literature at the local high school. *(Cô ấy dạy văn học tại trường trung học địa phương.)*",
  },
  instruct: {
    meaning: "Chỉ dẫn, hướng dẫn kỹ thuật, ra chỉ thị hành động",
    posLabel: "Động từ (Verb)",
    register: "Trang trọng / Kỹ thuật (Technical)",
    nuance: "Đưa ra từng bước thao tác cụ thể hoặc chỉ đạo mệnh lệnh",
    collocations: "*instruct someone to do*, *follow instructions*, *clearly instruct*",
    samplePattern: "The manual **instructs** staff on safety protocols. *(Sổ tay hướng dẫn nhân viên về các quy tắc an toàn.)*",
  },
  educate: {
    meaning: "Giáo dục toàn diện về học vấn, nhân cách và tư duy",
    posLabel: "Động từ (Verb)",
    register: "Học thuật / Dài hạn",
    nuance: "Quá trình nuôi dưỡng, đào tạo con người xuyên suốt nhiều năm",
    collocations: "*educate children*, *well-educated*, *public education*",
    samplePattern: "Schools must **educate** students not just for tests, but for life. *(Nhà trường phải giáo dục học sinh không chỉ vì bài thi, mà vì cuộc sống.)*",
  },
  rapid: {
    meaning: "Nhanh chóng về sự thay đổi, chuyển biến, gia tăng",
    posLabel: "Tính từ (Adjective)",
    register: "Trang trọng / Học thuật / Báo chí",
    nuance: "Tốc độ thay đổi vĩ mô (kinh tế, công nghệ, dân số, biến đổi)",
    collocations: "*rapid growth*, *rapid change*, *rapid progress*",
    samplePattern: "The region experienced **rapid** industrial expansion. *(Khu vực này đã trải qua sự mở rộng công nghiệp nhanh chóng.)*",
  },
  swift: {
    meaning: "Nhanh lẹ, dứt khoát, phản ứng tức thì",
    posLabel: "Tính từ (Adjective)",
    register: "Trang trọng / Văn phong báo chí",
    nuance: "Hành động ứng phó tức thì, không chậm trễ một giây",
    collocations: "*swift action*, *swift response*, *swift recovery*",
    samplePattern: "The government took **swift** action to halt the epidemic. *(Chính phủ đã hành động nhanh chóng để ngăn chặn dịch bệnh.)*",
  },
}

/**
 * Phân tích hình thái và loại từ (Morphological Analysis) cho bất kỳ từ tiếng Anh nào
 */
function analyzeWordMorphology(word: string): {
  pos: string
  posLabel: string
  register: string
  syntacticRole: string
  collocations: string
  samplePattern: string
} {
  const w = word.toLowerCase()

  // 1. Kiểm tra kho ngữ nghĩa mở rộng trước (Ưu tiên số 1)
  if (LOCAL_SEMANTIC_LEXICON[w]) {
    const item = LOCAL_SEMANTIC_LEXICON[w]
    return {
      pos: item.posLabel.toLowerCase().includes("noun") ? "noun" : item.posLabel.toLowerCase().includes("verb") ? "verb" : "word",
      posLabel: `${item.posLabel} — *${item.meaning}*`,
      register: item.register,
      syntacticRole: item.nuance,
      collocations: item.collocations,
      samplePattern: item.samplePattern,
    }
  }

  // 2. Phân tích hình thái tiếp vĩ ngữ (Suffixes)
  // Danh từ
  if (/(?:tion|sion|ment|ness|ity|ance|ence|ship|hood|dom|ist|ism|er|or)$/.test(w)) {
    return {
      pos: "noun",
      posLabel: "Danh từ (Noun)",
      register: w.length > 7 ? "Trang trọng / Học thuật (Formal)" : "Trung tính (Neutral)",
      syntacticRole: "Đảm nhận vị trí Chủ ngữ (Subject) hoặc Tân ngữ (Object) sau động từ/giới từ",
      collocations: `*the ${w} of*, *significant ${w}*, *manage ${w}*`,
      samplePattern: `The **${w}** played a critical role in their overall success. *(Cái ${w} đóng vai trò thiết yếu.)*`,
    }
  }

  // Động từ
  if (/(?:ize|ise|ate|ify|en)$/.test(w) || /^(?:go|come|take|make|get|give|have|see|know|think|look|want|use|find|tell|ask|work|seem|feel|try|leave|call|reach|lead|hold|stand)$/.test(w)) {
    return {
      pos: "verb",
      posLabel: "Động từ (Verb)",
      register: /(?:ize|ise|ate|ify)/.test(w) ? "Trang trọng / Chuyên môn (Formal/Academic)" : "Giao tiếp đời thường (Everyday English)",
      syntacticRole: "Đảm nhận vị trí Vị ngữ (Predicate), diễn tả hành động hoặc trạng thái chia theo thì",
      collocations: `*need to ${w}*, *${w} carefully*, *${w} the process*`,
      samplePattern: `The team decided to **${w}** the situation thoroughly. *(Cả nhóm quyết định ${w} tình hình một cách thấu đáo.)*`,
    }
  }

  // Tính từ
  if (/(?:able|ible|ful|less|ous|ive|ic|al|ish|ant|ent|ed|ing)$/.test(w)) {
    return {
      pos: "adjective",
      posLabel: "Tính từ (Adjective)",
      register: w.length > 7 ? "Văn phong học thuật / Báo chí" : "Giao tiếp tự nhiên",
      syntacticRole: "Bổ nghĩa cho danh từ (đứng trước danh từ) hoặc đứng sau linking verbs (be, become, feel)",
      collocations: `*a very ${w} approach*, *remain ${w}*, *become ${w}*`,
      samplePattern: `This is a particularly **${w}** perspective on the matter. *(Đây là một góc nhìn đặc biệt ${w} về vấn đề.)*`,
    }
  }

  // Trạng từ
  if (/ly$/.test(w)) {
    return {
      pos: "adverb",
      posLabel: "Trạng từ (Adverb)",
      register: "Trung tính / Học thuật",
      syntacticRole: "Bổ nghĩa cho động từ, tính từ hoặc toàn bộ câu; diễn tả cách thức hoặc mức độ",
      collocations: `*act ${w}*, *${w} understand*, *quite ${w}*`,
      samplePattern: `They carried out the operation **${w}** as planned. *(Họ đã tiến hành hoạt động một cách ${w} như dự định.)*`,
    }
  }

  // Mặc định dựa trên nguồn gốc âm tiết
  const isMultiSyllable = w.length >= 7
  return {
    pos: "word",
    posLabel: isMultiSyllable ? "Từ vựng học thuật / Chuyên môn" : "Từ vựng thông dụng",
    register: isMultiSyllable ? "Trang trọng / Văn viết (Formal / Academic)" : "Giao tiếp tự nhiên (Everyday Spoken)",
    syntacticRole: "Được dùng trong câu theo cấu trúc ngữ pháp tiêu chuẩn tiếng Anh",
    collocations: `*use of ${w}*, *typical ${w}*, *understand ${w}*`,
    samplePattern: `Understanding how to apply **${w}** in appropriate context enhances your fluency.`,
  }
}

/**
 * Sinh phân tích đối chiếu từ vựng động cho các cặp từ bất kỳ (KHÔNG dùng chuỗi giữ chỗ giả lập)
 */
function generateDynamicVocabDiff(word1: string, word2: string, extraWord?: string): string {
  const cap1 = word1.charAt(0).toUpperCase() + word1.slice(1)
  const cap2 = word2.charAt(0).toUpperCase() + word2.slice(1)
  const capExtra = extraWord ? extraWord.charAt(0).toUpperCase() + extraWord.slice(1) : ""

  const m1 = analyzeWordMorphology(word1)
  const m2 = analyzeWordMorphology(word2)
  const mExtra = extraWord ? analyzeWordMorphology(extraWord) : null

  const isPosDifferent = m1.pos !== m2.pos

  const extraHeader = extraWord ? ` | **${capExtra}**` : ""
  const extraSep = extraWord ? " | :---" : ""
  const extraPos = mExtra ? ` | ${mExtra.posLabel}` : ""
  const extraRole = mExtra ? ` | ${mExtra.syntacticRole}` : ""
  const extraRegister = mExtra ? ` | ${mExtra.register}` : ""
  const extraColloc = mExtra ? ` | ${mExtra.collocations}` : ""
  const extraEx = mExtra ? ` | *${mExtra.samplePattern}*` : ""

  let comparisonAdvice = ""
  if (isPosDifferent) {
    comparisonAdvice = `1. **Phân biệt theo Từ loại & Cấu trúc ngữ pháp (Grammar Roles):**
   - **"${word1}"** là **${m1.posLabel}**, giữ vai trò: *${m1.syntacticRole}*.
   - **"${word2}"** là **${m2.posLabel}**, giữ vai trò: *${m2.syntacticRole}*.
   - 👉 *Chiến lược làm bài:* Trong các bài thi TOEIC/IELTS/THPTQG, hãy nhìn vào vị trí chỗ trống trong câu (đứng sau mạo từ, sau động từ to be, hay trước danh từ) để chọn đúng từ loại mà không cần dịch nghĩa.`
  } else {
    comparisonAdvice = `1. **Phân biệt theo Sắc thái & Ngữ cảnh chuyên biệt (Nuance & Register):**
   - Cả hai từ đều cùng nhóm từ loại, nhưng khác nhau về phạm vi áp dụng và mức độ trang trọng.
   - **"${word1}"**: Thường dùng trong bối cảnh: *${m1.syntacticRole}* (Văn phong: *${m1.register}*).
   - **"${word2}"**: Thường dùng trong bối cảnh: *${m2.syntacticRole}* (Văn phong: *${m2.register}*).
   - 👉 *Chiến lược:* Ghi nhớ theo cụm từ cố định (Collocations) thay vì dịch máy móc từng từ sang tiếng Việt.`
  }

  return `### 💡 Phân biệt "${cap1}" và "${cap2}"${extraWord ? ` và "${capExtra}"` : ""}

| Tiêu chí | **${cap1}** | **${cap2}**${extraHeader} |
| :--- | :--- | :---${extraSep} |
| **Bản chất & Nghĩa** | ${m1.posLabel} | ${m2.posLabel}${extraPos} |
| **Sắc thái & Văn phong** | ${m1.register} | ${m2.register}${extraRegister} |
| **Bối cảnh sử dụng** | ${m1.syntacticRole} | ${m2.syntacticRole}${extraRole} |
| **Cụm từ đi kèm (Collocations)** | ${m1.collocations} | ${m2.collocations}${extraColloc} |
| **Ví dụ minh họa chuẩn** | ${m1.samplePattern} | ${m2.samplePattern}${extraEx} |

---

#### 🔍 Lời khuyên học tập & Tránh nhầm lẫn:
${comparisonAdvice}

2. **Thử thách luyện tập thực tế:**
   - Bạn hãy thử đặt 1 câu sử dụng **"${word1}"** và 1 câu sử dụng **"${word2}"** rồi gửi vào đây.
   - Hệ thống sẽ bóc tách cú pháp và chấm điểm ngữ pháp trực tiếp giúp bạn!`
}

/**
 * 5. Chế độ: Phân biệt từ vựng dễ nhầm (vocab_diff)
 */
function handleCategoryVocabDiff(query: string, startTime: number): LocalDynamicResult {
  const lower = query.toLowerCase()

  // 1. Trích xuất cặp từ đang được so sánh (VD: "Borrow vs Lend", "phân biệt make và do", "since và for")
  const extracted = extractComparingWords(query)

  if (extracted) {
    const { word1, word2, extraWord } = extracted
    const keyPair1 = `${word1}_${word2}`
    const keyPair2 = `${word2}_${word1}`
    const keyTriple = extraWord ? `${word1}_${word2}_${extraWord}` : ""

    // Tra cứu qua danh bạ chuẩn và hệ thống bí danh (Aliases)
    const targetKey =
      VOCAB_DIFF_ALIASES[keyTriple] ||
      VOCAB_DIFF_ALIASES[keyPair1] ||
      VOCAB_DIFF_ALIASES[keyPair2] ||
      VOCAB_DIFF_ALIASES[word1] ||
      VOCAB_DIFF_ALIASES[word2]

    if (targetKey && VOCAB_DIFF_DICT[targetKey]) {
      const match = VOCAB_DIFF_DICT[targetKey]
      const reply = `### 💡 ${match.title}

${match.table}

---

${match.notes}

---

*(Phân tích đối chiếu từ vựng nội bộ trên máy, 0ms, không gọi API).*`

      return {
        reply,
        model: `AI Nội bộ (Phân biệt từ: ${match.title.replace(/^Phân biệt\s*/i, "")})`,
        executionTimeMs: Date.now() - startTime,
      }
    }

    // Nếu người dùng so sánh cặp từ bất kỳ nằm ngoài danh bạ có sẵn: Dùng bộ phân tích ngôn ngữ học động
    const reply = `${generateDynamicVocabDiff(word1, word2, extraWord)}

---

*(Phân tích đối chiếu cú pháp & hình thái học động 100% nội bộ, 0ms, không gọi API).*`

    return {
      reply,
      model: `AI Nội bộ (Phân tích đối chiếu: ${word1}/${word2})`,
      executionTimeMs: Date.now() - startTime,
    }
  }

  // 2. Nếu người dùng chỉ gõ một từ hoặc câu hỏi chung có chứa từ khóa (VD: "cách dùng borrow", "affect", "since")
  for (const [kw, dictKey] of Object.entries(VOCAB_DIFF_ALIASES)) {
    // Chỉ kiểm tra các từ đơn lẻ có độ dài >= 3 ký tự (để tránh nhầm 'do', 'hi')
    if (!kw.includes("_") && kw.length >= 3 && new RegExp(`\\b${kw}\\b`, "i").test(lower)) {
      const match = VOCAB_DIFF_DICT[dictKey]
      if (match) {
        const reply = `### 💡 ${match.title}

${match.table}

---

${match.notes}

---

*(Phân tích đối chiếu từ vựng nội bộ trên máy, 0ms, không gọi API).*`

        return {
          reply,
          model: `AI Nội bộ (Phân biệt từ: ${match.title.replace(/^Phân biệt\s*/i, "")})`,
          executionTimeMs: Date.now() - startTime,
        }
      }
    }
  }

  // 3. Mặc định nếu người dùng không gõ từ cụ thể: Hiển thị bảng tổng hợp các cặp từ quan trọng nhất
  const reply = `### 💡 Bảng tổng hợp các cặp từ vựng dễ nhầm lẫn nhất trong Tiếng Anh

Dưới đây là các cặp từ vựng kinh điển mà người học tiếng Anh và thí sinh thi IELTS/TOEIC thường xuyên nhầm lẫn:

| STT | Cặp từ vựng | Điểm khác biệt cốt lõi |
| :--- | :--- | :--- |
| 1 | **Borrow vs Lend** | **Borrow** là mượn về (*borrow from*), **Lend** là cho mượn đi (*lend to*). |
| 2 | **Make vs Do** | **Make** tạo ra sản phẩm mới (*make a cake*), **Do** thực hiện công việc/nhiệm vụ (*do homework*). |
| 3 | **Look vs See vs Watch** | **See** là thấy tự nhiên, **Look (at)** là nhìn chăm chú, **Watch** theo dõi vật chuyển động. |
| 4 | **Say vs Tell vs Speak vs Talk** | **Tell** + người (*tell me*), **Say** + that..., **Speak** + tiếng/trang trọng, **Talk** hội thoại thân mật. |
| 5 | **Affect vs Effect** | **Affect** là động từ (tác động), **Effect** là danh từ (kết quả/ảnh hưởng). |
| 6 | **Since vs For** | **Since** đi với mốc thời gian (*since 2020*), **For** đi với khoảng thời gian (*for 3 years*). |
| 7 | **Listen vs Hear** | **Hear** là nghe thấy thụ động, **Listen to** là chủ động tập trung lắng nghe. |
| 8 | **Advise vs Advice** | **Advise** là động từ (khuyên), **Advice** là danh từ không đếm được (lời khuyên). |
| 9 | **Accept vs Except** | **Accept** là đồng ý nhận (động từ), **Except** là ngoại trừ (giới từ). |
| 10 | **Lose vs Loose** | **Lose** (1 chữ O) là đánh mất/thua cuộc, **Loose** (2 chữ O) là rộng rãi/lỏng lẻo. |
| 11 | **Lie vs Lay** | **Lie** (nội động từ: tự nằm xuống), **Lay** (ngoại động từ: đặt cái gì xuống). |
| 12 | **Rise vs Raise** | **Rise** (nội động từ: tự tăng lên), **Raise** (ngoại động từ: giơ lên, tăng cái gì lên). |
| 13 | **Tall vs High** | **Tall** cho người/cây/tòa tháp thon dài, **High** cho núi/độ cao so với mặt đất/giá cả. |
| 14 | **Economic vs Economical** | **Economic** thuộc về nền kinh tế, **Economical** là tiết kiệm chi phí. |
| 15 | **Historic vs Historical** | **Historic** có ý nghĩa bước ngoặt trọng đại, **Historical** thuộc về quá khứ lịch sử. |

---

💡 **Tra cứu chi tiết:** Hãy gõ tên bất kỳ cặp từ nào bạn muốn phân tích (Ví dụ: *"Borrow vs Lend"*, *"Make vs Do"*, *"Say vs Tell"*, *"Accept vs Except"*...) để nhận bảng giải thích chuyên sâu, cấu trúc câu và bài tập vận dụng!`

  return {
    reply,
    model: "AI Nội bộ (Tổng quan từ vựng)",
    executionTimeMs: Date.now() - startTime,
  }
}

/**
 * 6. Chế độ: Chấm điểm bài viết / Essay (essay_scoring)
 */
function handleCategoryEssayScoring(query: string, startTime: number): LocalDynamicResult {
  const nlpFeatures = extractNLPFeatures(query)
  const mlScore = scoreEssayML(query, 5)
  const strengths = mlScore.strengths.map((s) => `- ${s}`).join("\n")
  const suggestions = mlScore.suggestions.map((s) => `- ${s}`).join("\n")

  const shortWarning =
    nlpFeatures.word_count < 25
      ? `\n> ⚠️ *Lưu ý: Đoạn văn của bạn hiện có ${nlpFeatures.word_count} từ. Để mô hình chấm điểm Machine Learning đạt độ tin cậy cao nhất, khuyến nghị dán bài viết từ 40 - 250 từ.*\n`
      : ""

  const reply = `### 📊 Kết quả chấm điểm & Phân tích bài viết (Local Machine Learning)

> "${query}"

${shortWarning}
---

#### 🏆 Đánh giá chất lượng:
- **Điểm tổng quan:** **${mlScore.score}/100** (\`${mlScore.level}\`)
- **Số lượng từ:** ${nlpFeatures.word_count} từ
- **Độ đa dạng từ vựng (TTR):** ${(nlpFeatures.lexical_diversity * 100).toFixed(1)}%
- **Độ dễ hiểu (Flesch Ease):** ${nlpFeatures.flesch_reading_ease}/100
- **Tỷ lệ từ vựng B1 - C1:** ${(nlpFeatures.advanced_vocab_ratio * 100).toFixed(1)}%
- **Mật độ liên từ:** ${nlpFeatures.cohesive_density.toFixed(1)} liên từ/100 từ

---

#### ✨ Điểm mạnh:
${strengths || "- Bố cục bài viết rõ ràng, mạch lạc."}

---

#### 💡 Khuyến nghị cải thiện:
${suggestions || "- Kết hợp thêm các mệnh đề quan hệ và từ nối học thuật để nâng điểm ngữ pháp."}

---
*(Mô hình ML Nội bộ: Ridge Regression AES Model, 0ms, không gọi API).*`

  return {
    reply,
    model: "AI Nội bộ (Ridge Regression AES Model)",
    executionTimeMs: Date.now() - startTime,
  }
}

/**
 * Xử lý yêu cầu bằng Mô hình ML Nội bộ, JFLEG GEC Knowledge & Bộ Cú pháp NLP Động
 * TUYỆT ĐỐI 100% OFFLINE — KHÔNG GỌI BẤT KỲ API BÊN NGOÀI NÀO.
 */
export function processLocalDynamicQuery(
  query: string,
  history?: { role: string; content: string }[],
  category?: string
): LocalDynamicResult {
  const startTime = Date.now()
  const clean = query.trim()
  const lower = clean.toLowerCase()
  const isVietnamese = isVietnameseText(clean)

  // NẾU NGƯỜI DÙNG CHỦ ĐỘNG CHỌN LOẠI VẤN ĐỀ CỤ THỂ:
  if (category && category !== "auto") {
    switch (category) {
      case "error_correction":
        return handleCategoryErrorCorrection(clean, startTime)
      case "grammar_lookup":
        return handleCategoryGrammarLookup(clean, history, startTime)
      case "examples":
        return handleCategoryExamples(clean, history, startTime)
      case "quiz":
        return handleCategoryQuiz(clean, history, startTime)
      case "vocab_diff":
        return handleCategoryVocabDiff(clean, startTime)
      case "essay_scoring":
        return handleCategoryEssayScoring(clean, startTime)
    }
  }

  // 1. Kiểm tra Chào hỏi tự nhiên & các biến thể gõ dở ("xin ch", "chao", "alo"...)
  if (/^(hi|hello|hey|alo|chào|chào bạn|xin chào|xin\s*ch|chao|good morning|good afternoon|good evening|how are you|bạn là ai|help)[\s!.,?]*$/i.test(lower)) {
    const reply = `Xin chào bạn! 👋 Tôi là **Trợ lý Tiếng Anh AI** được tích hợp trực tiếp trên hệ thống của bạn.

Hệ thống hoạt động **100% nội bộ trên máy**, phản hồi tức thì và không cần internet. Tôi có thể tự động phân tích và hỗ trợ bạn:

- ✍️ **Sửa lỗi câu trực tiếp**: Nhập bất kỳ câu tiếng Anh nào (kể cả câu phức tạp), hệ thống sẽ bóc tách cấu trúc và chỉ ra chính xác từng từ bị sai ngữ pháp.
- 📚 **Tri thức từ 1.501 câu JFLEG**: Tự động so sánh mẫu câu của bạn với các câu thực tế của người học và gợi ý cách sửa mượt mà chuẩn người bản ngữ.
- 🔍 **Giải thích 12 thì ngữ pháp**: Tra cứu công thức, cách nhận biết và ví dụ đối chiếu.
- 💡 **Phân biệt từ vựng**: Tra cứu các cặp từ dễ nhầm lẫn (*affect/effect*, *borrow/lend*, *make/do*...).
- 📊 **Chấm điểm bài luận AES**: Tự động đo độ dễ đọc Flesch, từ vựng học thuật CEFR B1-C1 và tính điểm theo mô hình máy học đã train.

Bạn hãy thử gửi một câu bất kỳ để tôi phân tích nhé!`

    return {
      reply,
      model: "AI Nội bộ (Local Dynamic NLP)",
      executionTimeMs: Date.now() - startTime,
    }
  }

  // 2. Chạy Mô hình Máy Học Phân Loại Ý Định (TF-IDF + Logistic Regression trong ml_engine)
  const prediction = predictChatbotIntent(clean)
  const { intent, confidence } = prediction

  // Nhận biết câu hỏi hội thoại tiếp nối (Follow-up Questions) bằng Machine Learning & Từ khóa
  const isAskingForExamples =
    intent === "follow_up_examples" ||
    /(?:cho|thêm|xin|cần|muốn)\s+(?:tôi\s+)?(?:thêm\s+)?ví\s*dụ/i.test(clean) ||
    /ví\s*dụ\s+(?:về\s+)?(?:thì|này|câu)/i.test(clean) ||
    lower === "cho ví dụ" ||
    lower === "thêm ví dụ"

  const isAskingForExercises =
    intent === "follow_up_quiz" ||
    /(?:cho|làm|cần)\s+(?:tôi\s+)?(?:thêm\s+)?bài\s*tập/i.test(clean) ||
    /luyện\s*tập/i.test(clean) ||
    /cho\s+câu\s+hỏi/i.test(clean)

  // Tìm chủ đề ngữ pháp được nhắc trực tiếp trong câu hoặc suy luận từ ngữ cảnh gần nhất
  const directTopic = grammarTopics.find(
    (t) =>
      lower.includes(t.name.toLowerCase()) ||
      lower.includes(t.vi.toLowerCase()) ||
      lower.includes(t.slug.replace(/-/g, " "))
  )
  const contextTopic = directTopic || findRecentContextTopic(history)

  // A. XỬ LÝ YÊU CẦU: "CHO TÔI VÍ DỤ VỀ THÌ NÀY"
  if (isAskingForExamples) {
    if (isLikelyEnglishSentence(clean)) {
      return handleCategoryExamples(clean, history, startTime)
    }

    if (!contextTopic) {
      return {
        reply: `Bạn đang muốn xin ví dụ cho chủ điểm ngữ pháp nào? 👋\n\n💡 Bạn có thể:\n1. **Gửi câu tiếng Anh của bạn** (Ví dụ: *"She lives in Hanoi"*), tôi sẽ tạo các thể biến đổi và câu tương tự!\n2. **Nhập tên chủ điểm ngữ pháp** (Ví dụ: *"mạo từ"*, *"thì quá khứ đơn"*, *"câu bị động"*...).`,
        model: "AI Nội bộ (Gợi ý ví dụ)",
        executionTimeMs: Date.now() - startTime,
      }
    }

    const targetTopic = contextTopic
    const extData = TOPIC_EXTENDED_DATA[targetTopic.slug]

    let affirmativeBlock = ""
    let negativeBlock = ""
    let interrogativeBlock = ""

    if (extData) {
      affirmativeBlock = extData.affirmative
        .map((e) => `- **${e.en}**\n  ➡️ *${e.vi}* ${e.note ? `\n  *(Lưu ý: ${e.note})*` : ""}`)
        .join("\n\n")

      negativeBlock = extData.negative
        .map((e) => `- **${e.en}**\n  ➡️ *${e.vi}*`)
        .join("\n\n")

      interrogativeBlock = extData.interrogative
        .map((e) => `- **${e.en}**\n  ➡️ *${e.vi}* ${e.note ? `\n  *(${e.note})*` : ""}`)
        .join("\n\n")
    } else {
      affirmativeBlock = targetTopic.examples
        .map((e) => `- **${e.en}**\n  ➡️ *${e.vi}*`)
        .join("\n\n")
    }

    const reply = `### 💡 Bộ ví dụ thực tế chuẩn cho: **${targetTopic.name} (${targetTopic.vi})**

Dưới đây là các câu ví dụ mẫu sinh động, chia theo từng thể câu và tình huống giao tiếp đời sống:

---

#### 🌟 1. Thể Khẳng định (+)
${affirmativeBlock}

---

${
  negativeBlock
    ? `#### 🚫 2. Thể Phủ định (-)
${negativeBlock}

---`
    : ""
}

${
  interrogativeBlock
    ? `#### ❓ 3. Thể Nghi vấn (?)
${interrogativeBlock}

---`
    : ""
}

#### 📋 Cấu trúc & Dấu hiệu nhận biết
- **Công thức:** \`${targetTopic.formulas.map((f) => `${f.use}: ${f.structure}`).join(" | ")}\`
${extData?.signals ? `- **Dấu hiệu thời gian:** \`${extData.signals}\`` : ""}
${extData?.traps ? `\n${extData.traps}\n` : ""}

---

#### 🎯 Thử sức luyện tập nhanh:
Bạn hãy thử đặt 1 câu tiếng Anh bằng thì **${targetTopic.vi}** và gửi vào đây nhé, tôi sẽ kiểm tra và sửa lỗi trực tiếp giúp bạn!

*(Phân tích tự động bởi Tri thức AI Nội bộ theo ngữ cảnh hội thoại, 0ms, không gọi API).*`

    return {
      reply,
      model: `AI Nội bộ (Context: ${targetTopic.slug})`,
      executionTimeMs: Date.now() - startTime,
    }
  }

  // B. XỬ LÝ YÊU CẦU: "CHO BÀI TẬP VỀ THÌ NÀY" / "LUYỆN TẬP"
  if (isAskingForExercises) {
    if (isLikelyEnglishSentence(clean)) {
      return handleCategoryQuiz(clean, history, startTime)
    }

    if (!contextTopic) {
      return {
        reply: `Bạn đang muốn làm bài tập về chủ điểm ngữ pháp nào? 👋\n\n💡 Bạn có thể:\n1. **Gửi câu tiếng Anh của bạn** (Ví dụ: *"She lives in Hanoi"*), tôi sẽ lập tức tạo 3 câu trắc nghiệm từ câu đó!\n2. **Nhập tên chủ điểm ngữ pháp** (Ví dụ: *"mạo từ"*, *"câu bị động"*, *"thì quá khứ đơn"*...).`,
        model: "AI Nội bộ (Gợi ý bài tập)",
        executionTimeMs: Date.now() - startTime,
      }
    }

    const targetTopic = contextTopic
    const extData = TOPIC_EXTENDED_DATA[targetTopic.slug]

    if (extData && extData.quiz && extData.quiz.length > 0) {
      const quizQuestions = extData.quiz
        .map(
          (q, idx) =>
            `**Câu ${idx + 1}:** ${q.question}\n${q.options.map((opt) => `  ${opt}`).join("\n")}\n\n> 💡 **Đáp án & Giải thích:** **${q.answer}**\n> *${q.explanation}*\n`
        )
        .join("\n---\n\n")

      const reply = `### 📝 Bài tập luyện tập: **${targetTopic.name} (${targetTopic.vi})**

Dưới đây là các câu hỏi trắc nghiệm kiểm tra độ hiểu bài của bạn:

---

${quizQuestions}

---

💡 **Gợi ý:** Bạn có thể thử làm các bài tập trên, hoặc tự viết câu bài tập của mình gửi vào đây để tôi kiểm tra ngữ pháp tức thì nhé!`

      return {
        reply,
        model: `AI Nội bộ (Quiz: ${targetTopic.slug})`,
        executionTimeMs: Date.now() - startTime,
      }
    }
  }

  // 3. Phân loại theo Ý Định Dự Đoán từ Machine Learning (đã dự đoán ở bước 2)

  // Cảm ơn / Tạm biệt (thanks_bye)
  if (intent === "thanks_bye" && confidence > 0.3) {
    const reply = `Rất vui được đồng hành cùng bạn! 😊

Chúc bạn học tiếng Anh thật hiệu quả và đạt điểm cao. Bất cứ khi nào bạn gặp câu khó hay bài tập chưa hiểu, hãy nhắn cho tôi nhé!

*(Mô hình ML Nội bộ: TF-IDF + Logistic Regression, 0ms, không gọi API).*`
    return {
      reply,
      model: `AI Nội bộ (Intent: ${intent})`,
      executionTimeMs: Date.now() - startTime,
    }
  }

  // Thông tin Chatbot (bot_info)
  if (intent === "bot_info" && confidence > 0.3) {
    const reply = `### 🤖 Thông tin về Trợ lý Tiếng Anh AI

Tôi là trợ lý AI học tập được phát triển riêng cho ứng dụng **LearnSphere**:
- **Kiến trúc:** 
  1. Mô hình Machine Learning NLP phân loại ý định (TF-IDF + Logistic Regression trong \`ml_engine/\`).
  2. Bộ tri thức **1.501 câu chuẩn JFLEG** (Johns Hopkins University) kèm 4.879 câu sửa chuẩn bản xứ.
  3. Bộ chấm điểm bài viết AES Ridge Regression huấn luyện trên 3.000 bài luận ASAP.
- **Đặc điểm:** Chạy **100% nội bộ trên máy**, phản hồi tức thì (0 - 2ms), bảo mật tuyệt đối và **TUYỆT ĐỐI KHÔNG GỌI API BÊN NGOÀI**.
- **Tính năng chính:** Sửa lỗi câu theo thời gian thực, bóc tách cấu trúc ngữ pháp, tra cứu 12 thì, đối chiếu câu mẫu bản xứ JFLEG và chấm điểm bài luận.

Hãy gửi câu tiếng Anh hoặc câu hỏi của bạn để trải nghiệm ngay!`

    return {
      reply,
      model: `AI Nội bộ (Intent: ${intent})`,
      executionTimeMs: Date.now() - startTime,
    }
  }

  // Mẹo học tập (study_tips)
  if (intent === "study_tips" && confidence > 0.3) {
    const reply = `### 🎯 Bí quyết học Tiếng Anh hiệu quả & nhớ lâu

1. **Học từ vựng theo Cụm (Collocations) thay vì học từ đơn lẻ:**
   - Thay vì chỉ nhớ từ *decision*, hãy học luôn cụm \`make a decision\` (đưa ra quyết định).
   - Não bộ sẽ ghi nhớ ngữ cảnh và giúp bạn phản xạ tự nhiên khi nói.

2. **Áp dụng Kỹ thuật Spaced Repetition (Lặp lại ngắt quãng):**
   - Ôn lại từ mới sau: 1 ngày ➡️ 3 ngày ➡️ 7 ngày ➡️ 14 ngày.
   - Ứng dụng **LearnSphere** đã tích hợp tính năng này trong mục **Luyện tập**.

3. **Nguyên tắc "Input trước, Output sau":**
   - Đọc và nghe nhiều tài liệu tiếng Anh bạn yêu thích (Podcast, YouTube, bài hát).
   - Sau đó tập tóm tắt lại 2-3 câu bằng tiếng Anh vào khung chat này để tôi sửa lỗi giúp bạn!

4. **Đừng sợ mắc lỗi ngữ pháp:**
   - Cứ mạnh dạn viết câu, nếu câu nào chưa chắc chắn, hãy gửi vào đây để tôi phân tích và gợi ý cách diễn đạt hay hơn nhé!

---
*(Phân tích bởi Mô hình ML Nội bộ: TF-IDF + Logistic Regression, không gọi API).*`

    return {
      reply,
      model: `AI Nội bộ (Intent: ${intent})`,
      executionTimeMs: Date.now() - startTime,
    }
  }

  // Phân biệt Từ vựng (vocab_diff_*)
  if (intent === "vocab_diff_affect_effect") {
    const reply = `### 💡 Phân biệt "Affect" và "Effect"

| Tiêu chí | Affect (Động từ) | Effect (Danh từ) |
| :--- | :--- | :--- |
| **Loại từ** | Verb (Tác động, ảnh hưởng đến) | Noun (Kết quả, tác động, hệ quả) |
| **Vai trò trong câu** | Đứng sau chủ ngữ làm vị ngữ | Đứng sau mạo từ (*the, an*), tính từ |
| **Ví dụ minh họa** | *The cold weather **affects** my health.* | *The cold weather had a bad **effect** on my health.* |
| **Mẹo ghi nhớ** | **A**ffect = **A**ction (Hành động) | **E**ffect = **E**nd result (Kết quả) |

---

#### 🌟 Các cụm từ thường gặp:
- **Have an effect on**: Có ảnh hưởng đến (*Smoking has a harmful effect on your lungs.*)
- **Directly affect**: Ảnh hưởng trực tiếp (*Prices directly affect consumers.*)

---
*(Mô hình ML Nội bộ: TF-IDF + Logistic Regression, 0ms, không gọi API).*`

    return {
      reply,
      model: `AI Nội bộ (Intent: ${intent})`,
      executionTimeMs: Date.now() - startTime,
    }
  }

  if (intent === "vocab_diff_since_for") {
    const reply = `### 💡 Phân biệt giới từ "Since" và "For"

| Giới từ | Ý nghĩa | Dùng khi | Ví dụ cụ thể |
| :--- | :--- | :--- | :--- |
| **SINCE** | Từ khi / Kể từ | Mốc thời gian bắt đầu hành động | *since 2020, since Monday, since 2 p.m.* |
| **FOR** | Trong vòng / Được | Khoảng thời gian kéo dài (Duration) | *for 2 hours, for 5 days, for a long time* |

---

#### ⚠️ Lỗi thường gặp:
- ❌ *Sai:* I have waited here since two hours.
- ✅ *Đúng:* I have waited here **for two hours** (vì 2 hours là khoảng thời gian).

---
*(Mô hình ML Nội bộ: TF-IDF + Logistic Regression, 0ms, không gọi API).*`

    return {
      reply,
      model: `AI Nội bộ (Intent: ${intent})`,
      executionTimeMs: Date.now() - startTime,
    }
  }

  if (intent === "vocab_diff_look_see_watch") {
    const reply = `### 💡 Phân biệt "Look", "See" và "Watch"

| Từ vựng | Cách hiểu | Bản chất | Ví dụ |
| :--- | :--- | :--- | :--- |
| **See** | Nhìn thấy | Tự nhiên đập vào mắt, không chủ đích | *I see a bird outside the window.* |
| **Look (at)** | Nhìn ngắm | Có chủ đích, hướng ánh mắt vào vật cố định | *Look at that beautiful painting!* |
| **Watch** | Theo dõi | Chăm chú theo dõi vật/người đang chuyển động | *I watch a football match on TV.* |

---
*(Mô hình ML Nội bộ: TF-IDF + Logistic Regression, 0ms, không gọi API).*`

    return {
      reply,
      model: `AI Nội bộ (Intent: ${intent})`,
      executionTimeMs: Date.now() - startTime,
    }
  }

  if (intent === "vocab_diff_borrow_lend") {
    const reply = `### 💡 Phân biệt "Borrow" và "Lend"

| Từ vựng | Nghĩa | Hướng hành động | Cấu trúc câu | Ví dụ |
| :--- | :--- | :--- | :--- | :--- |
| **Borrow** | Mượn | Nhận vào (Take in) | \`Borrow something FROM someone\` | *Can I **borrow** your pen?* |
| **Lend** | Cho mượn | Đưa ra (Give out) | \`Lend something TO someone\` | *Could you **lend** me 10 dollars?* |

---

💡 **Mẹo nhớ nhanh:**
- **B**orrow = **B**ack (mang về cho mình dùng tạm).
- **L**end = **L**eave (cho đồ vật rời khỏi tay mình).

---
*(Mô hình ML Nội bộ: TF-IDF + Logistic Regression, 0ms, không gọi API).*`

    return {
      reply,
      model: `AI Nội bộ (Intent: ${intent})`,
      executionTimeMs: Date.now() - startTime,
    }
  }

  if (intent === "vocab_diff_make_do") {
    const reply = `### 💡 Phân biệt "Make" và "Do"

| Tiêu chí | DO (Làm, thực hiện) | MAKE (Tạo ra, chế tạo) |
| :--- | :--- | :--- |
| **Bản chất** | Thực hiện hành động, công việc, bổn phận | Tạo ra sản phẩm mới, xây dựng cái mới |
| **Collocations thông dụng** | - *do homework* (làm bài tập)<br>- *do business* (kinh doanh)<br>- *do the dishes* (rửa bát)<br>- *do your best* (cố gắng hết sức) | - *make a decision* (quyết định)<br>- *make a mistake* (phạm sai lầm)<br>- *make money* (kiếm tiền)<br>- *make coffee* (pha cà phê) |

---
*(Mô hình ML Nội bộ: TF-IDF + Logistic Regression, 0ms, không gọi API).*`

    return {
      reply,
      model: `AI Nội bộ (Intent: ${intent})`,
      executionTimeMs: Date.now() - startTime,
    }
  }

  if (intent === "vocab_diff_say_tell_speak_talk") {
    const reply = `### 💡 Phân biệt "Say", "Tell", "Speak" và "Talk"

| Từ vựng | Cấu trúc đặc trưng | Khi nào dùng | Ví dụ |
| :--- | :--- | :--- | :--- |
| **Tell** | \`Tell SOMEONE something\` | Kể/bảo với một người cụ thể | *She **told me** the truth.* |
| **Say** | \`Say SOMETHING (to someone)\` | Nói ra từ ngữ cụ thể | *He **said that** he was happy.* |
| **Speak** | \`Speak a language / speak to\` | Nói ngôn ngữ, phát biểu trang trọng | *I **speak** English fluently.* |
| **Talk** | \`Talk to / with someone\` | Trò chuyện, đàm đạo thân mật | *We **talked** about the movie.* |

---
*(Mô hình ML Nội bộ: TF-IDF + Logistic Regression, 0ms, không gọi API).*`

    return {
      reply,
      model: `AI Nội bộ (Intent: ${intent})`,
      executionTimeMs: Date.now() - startTime,
    }
  }

  if (intent === "vocab_diff_listen_hear") {
    const reply = `### 💡 Phân biệt "Hear" và "Listen (to)"

| Từ vựng | Bản chất | Có chủ ý không | Ví dụ |
| :--- | :--- | :--- | :--- |
| **Hear** | Nghe thấy âm thanh lọt vào tai | **Không** có chủ ý, thụ động | *Did you **hear** that strange noise?* |
| **Listen to** | Lắng nghe, chú tâm | **Có** chủ đích, chủ động | *I **listen to** music every evening.* |

---
*(Mô hình ML Nội bộ: TF-IDF + Logistic Regression, 0ms, không gọi API).*`

    return {
      reply,
      model: `AI Nội bộ (Intent: ${intent})`,
      executionTimeMs: Date.now() - startTime,
    }
  }

  if (intent === "vocab_diff_advise_advice") {
    const reply = `### 💡 Phân biệt "Advise" và "Advice"

| Từ vựng | Loại từ | Phát âm | Nghĩa & Lưu ý | Ví dụ |
| :--- | :--- | :--- | :--- | :--- |
| **Advice** (chữ c) | Danh từ (Noun) | /ədˈvaɪs/ (âm s) | Lời khuyên (**Danh từ không đếm được**, không dùng *an advice*) | *She gave me some good **advice**.* |
| **Advise** (chữ s) | Động từ (Verb) | /ədˈvaɪz/ (âm z) | Khuyên bảo (hành động) | *The doctor **advised** me to rest.* |

---
*(Mô hình ML Nội bộ: TF-IDF + Logistic Regression, 0ms, không gọi API).*`

    return {
      reply,
      model: `AI Nội bộ (Intent: ${intent})`,
      executionTimeMs: Date.now() - startTime,
    }
  }

  // Xử lý các ý định phân biệt từ vựng tổng quát
  if (intent.startsWith("vocab_diff_")) {
    return handleCategoryVocabDiff(clean, startTime)
  }

  // Tra cứu 12 Thì Tổng quan
  if (intent === "grammar_lookup_all_tenses") {
    return handleCategoryGrammarLookup(clean, history, startTime)
  }

  // Chấm điểm bài viết / Luận
  if (intent === "essay_scoring") {
    return handleCategoryEssayScoring(clean, startTime)
  }

  // Yêu cầu bài tập / Quiz
  if (intent === "follow_up_quiz") {
    return handleCategoryQuiz(clean, history, startTime)
  }

  // Yêu cầu ví dụ minh họa
  if (intent === "follow_up_examples") {
    return handleCategoryExamples(clean, history, startTime)
  }

  // Sửa lỗi câu & Ngữ pháp
  if (intent === "error_correction_query") {
    return handleCategoryErrorCorrection(clean, startTime)
  }

  // Tra cứu 12 Thì Ngữ pháp & Cấu trúc ngữ pháp
  const INTENT_TO_TOPIC_SLUG: Record<string, string> = {
    grammar_present_simple: "present-simple",
    grammar_present_continuous: "present-continuous",
    grammar_present_perfect: "present-perfect",
    grammar_present_perfect_continuous: "present-perfect-continuous",
    grammar_past_simple: "past-simple",
    grammar_past_continuous: "past-continuous",
    grammar_past_perfect: "past-perfect",
    grammar_past_perfect_continuous: "past-perfect-continuous",
    grammar_future_simple: "future-simple",
    grammar_future_continuous: "future-continuous",
    grammar_future_perfect: "future-perfect",
    grammar_future_perfect_continuous: "future-perfect-continuous",
    grammar_conditional: "conditionals",
    grammar_passive: "passive-voice",
    grammar_reported_speech: "reported-speech",
    grammar_relative_clauses: "relative-clauses",
    grammar_gerund_infinitive: "gerund-infinitive",
    grammar_comparison: "comparisons",
    grammar_inversion: "inversion",
    grammar_articles: "articles",
    grammar_modal_verbs: "modal-verbs",
  }

  const targetSlug = INTENT_TO_TOPIC_SLUG[intent]
  const matchedTopic = targetSlug
    ? grammarTopics.find((t) => t.slug === targetSlug)
    : grammarTopics.find(
        (t) =>
          lower.includes(t.name.toLowerCase()) ||
          lower.includes(t.vi.toLowerCase()) ||
          lower.includes(t.slug.replace(/-/g, " "))
      )

  if (matchedTopic && (intent.startsWith("grammar_") || !clean.includes("sửa") && !clean.includes("sai") && !clean.includes("check"))) {
    const tableHeader = "| Mục đích | Cấu trúc công thức | Ví dụ minh họa |\n| :--- | :--- | :--- |"
    const tableRows = matchedTopic.formulas
      .map((f) => `| ${f.use} | \`${f.structure}\` | *${f.example}* |`)
      .join("\n")

    const reply = `### 📘 ${matchedTopic.name} (${matchedTopic.vi})

**Bản chất khái niệm:** ${matchedTopic.intro}

---

#### 📋 Bảng công thức chuẩn
${tableHeader}
${tableRows}

---

#### 💡 Các trường hợp sử dụng chính
${matchedTopic.usage.map((u) => `- ${u}`).join("\n")}

---

#### 🌟 Ví dụ thực tế song ngữ
${matchedTopic.examples.map((e) => `- **${e.en}**<br>➡️ *${e.vi}*`).join("\n")}

---
*(Phân tích ngữ pháp tự động bởi Tri thức AI Nội bộ, 0ms, 100% offline không gọi API).*`

    return {
      reply,
      model: `AI Nội bộ (Intent: ${intent})`,
      executionTimeMs: Date.now() - startTime,
    }
  }

  // 4. Phân tích Cú pháp Động cho Câu Tiếng Anh của Người dùng (Dynamic Syntax Analysis & JFLEG Matching)
  const isExplicitErrorCheck =
    /(?:sửa\s*(?:lỗi)?|chỉ\s*(?:giúp\s*)?lỗi|check|kiểm\s*tra\s*(?:lỗi)?|câu\s*(?:này|sau)\s*sai)/i.test(clean) ||
    intent === "error_correction"

  // Trích xuất phần câu tiếng Anh sạch (loại bỏ các từ nối/mệnh lệnh tiếng Việt mở đầu)
  let targetText = clean.trim()
  const prefixRegex =
    /^(?:hãy\s+)?(?:sửa\s*(?:giúp\s*(?:tôi|em))?\s*(?:lỗi)?\s*(?:ngữ\s*pháp)?\s*(?:câu\s*(?:sau|này|dưới\s*đây)?)?|kiểm\s*tra\s*(?:giúp\s*(?:tôi|em))?\s*(?:lỗi)?\s*(?:câu\s*(?:sau|này)?)?|chỉ\s*(?:giúp\s*)?lỗi\s*(?:câu\s*(?:sau|này)?)?|check\s*(?:giúp\s*)?(?:lỗi)?\s*(?:câu\s*(?:sau|này)?)?|câu\s*(?:sau|này)\s*(?:sai|đúng)\s*(?:ở\s*đâu|chỗ\s*nào|không)?|can\s+you\s+(?:check|correct)\s+(?:this\s+sentence|my\s+grammar)?|please\s+(?:check|correct))\s*[:：\-]?\s*["“']?/i
  if (prefixRegex.test(targetText)) {
    targetText = targetText.replace(prefixRegex, "").replace(/["”']\s*$/, "").trim()
  }

  // Nếu câu là tiếng Anh hoặc được yêu cầu sửa lỗi rõ ràng
  if (isExplicitErrorCheck || !isVietnamese) {
    const { errors, correctedSentence } = analyzeGrammarDynamically(targetText)
    const nlpFeatures = extractNLPFeatures(targetText)

    // Tra cứu câu tương đồng từ bộ dữ liệu chuẩn JFLEG (1.501 câu gốc + câu sửa của người bản xứ)
    const jflegMatch = findSimilarJflegSentence(targetText)
    const hasJflegRefinement = Boolean(
      jflegMatch &&
      jflegMatch.similarity >= 0.50 &&
      jflegMatch.learnerSentence.trim().toLowerCase() !== jflegMatch.nativeCorrection.trim().toLowerCase()
    )

    let jflegSection = ""
    if (jflegMatch) {
      jflegSection = `\n\n---\n\n📚 **Tham khảo từ Bộ dữ liệu Chuẩn JFLEG (1.501 mẫu câu người học & bản ngữ):**\n- *Câu người học tương tự:* "${jflegMatch.learnerSentence}"\n- *Bản sửa mượt mà từ người bản xứ:* "**${jflegMatch.nativeCorrection}**"`
    }

    // A. NẾU CÂU CÓ LỖI TỪ BỘ PHÂN TÍCH CÚ PHÁP: Tự động dựng bảng giải thích bóc tách từng lỗi riêng biệt
    if (errors.length > 0) {
      const tableHeader = "| Lỗi phát hiện | Vị trí sai | Cách sửa chuẩn | Nguyên nhân ngữ pháp |\n| :--- | :--- | :--- | :--- |"
      const tableRows = errors
        .map(
          (err, idx) =>
            `| **${idx + 1}. ${err.type}** | \`${err.badPart}\` | **\`${err.goodPart}\`** | ${err.reason} |`
        )
        .join("\n")

      const reply = `Dưới đây là kết quả phân tích ngữ pháp tự động cho câu của bạn:

---

❌ **Câu gốc của bạn:**
> "${targetText}"

---

🔴 **Chi tiết ${errors.length} điểm ngữ pháp cần chỉnh sửa:**

${tableHeader}
${tableRows}

---

✅ **Phiên bản hoàn chỉnh đã sửa:**
> "**${correctedSentence}**"
${jflegSection}

---

💡 **Gợi ý mở rộng & nâng cao:**
- Khi bạn muốn diễn đạt tự nhiên hơn trong giao tiếp hàng ngày, bạn có thể rút gọn các đại từ (ví dụ dùng dạng viết tắt *I've*, *he's*).
- Để tăng điểm từ vựng (Lexical Resource), bạn có thể bổ sung các liên từ chỉ nguyên nhân hoặc kết quả (*because, consequently, therefore*).

---

📊 **Chỉ số khoa học phân tích từ mô hình ML nội bộ (ml_engine):**
- **Độ dễ đọc (Flesch Reading Ease):** \`${nlpFeatures.flesch_reading_ease}/100\`
- **Độ đa dạng từ vựng (TTR):** \`${(nlpFeatures.lexical_diversity * 100).toFixed(1)}%\`
- **Tỷ lệ từ học thuật CEFR:** \`${(nlpFeatures.advanced_vocab_ratio * 100).toFixed(1)}%\`

*(Phân tích động 100% nội bộ trên máy bằng NLP Parser, JFLEG GEC Dataset & Ridge Regression, TUYỆT ĐỐI KHÔNG GỌI API).*`

      return {
        reply,
        model: "AI Nội bộ (Dynamic NLP + JFLEG)",
        executionTimeMs: Date.now() - startTime,
      }
    }

    // B. NẾU CÂU CÓ BẢN SỬA CHUẨN TỪ NGÂN HÀNG JFLEG:
    if (hasJflegRefinement && jflegMatch) {
      const reply = `Dưới đây là kết quả phân tích và hoàn thiện câu của bạn:

---

❌ **Câu gốc của bạn:**
> "${targetText}"

---

✅ **Bản sửa mượt mà chuẩn người bản ngữ (Đối chiếu Ngân hàng JFLEG - Johns Hopkins):**
> "**${jflegMatch.nativeCorrection}**"

---

🔴 **Điểm ngữ pháp & diễn đạt hoàn thiện:**
- **Câu gốc của người học tương đồng:** *"${jflegMatch.learnerSentence}"*
- **Bản sửa từ người bản xứ:** *"${jflegMatch.nativeCorrection}"*
- **Gợi ý ngữ pháp:** Người bản ngữ đã bổ sung mạo từ, dấu câu hoặc chuẩn hóa từ vựng để câu văn mạch lạc, tự nhiên và chuẩn văn phong học thuật.

---

💡 **Gợi ý học tập:**
- Lưu ý sử dụng mạo từ (*a/an*) trước danh từ đếm được số ít khi đi kèm tính từ (*a good university*).
- Sử dụng dấu phẩy (*,*) ngăn cách các mệnh đề trạng ngữ chỉ sự tương phản (*while, whereas*).

---

📊 **Chỉ số khoa học phân tích từ mô hình ML nội bộ (ml_engine):**
- **Độ dễ đọc (Flesch Reading Ease):** \`${nlpFeatures.flesch_reading_ease}/100\`
- **Độ đa dạng từ vựng (TTR):** \`${(nlpFeatures.lexical_diversity * 100).toFixed(1)}%\`
- **Tỷ lệ từ học thuật CEFR:** \`${(nlpFeatures.advanced_vocab_ratio * 100).toFixed(1)}%\`

*(Phân tích động 100% nội bộ trên máy bằng NLP Parser, JFLEG GEC Dataset & Ridge Regression, TUYỆT ĐỐI KHÔNG GỌI API).*`

      return {
        reply,
        model: "AI Nội bộ (JFLEG Native Benchmark)",
        executionTimeMs: Date.now() - startTime,
      }
    }

    // C. CHỈ KÍCH HOẠT CHẤM BÀI LUẬN (ESSAY SCORER) KHI YÊU CẦU RÕ HOẶC LÀ ĐOẠN VĂN DÀI (>= 40 từ và có ít nhất 2 câu)
    const isExplicitEssayScoring =
      /(?:chấm\s*điểm|đánh\s*giá|score)\s+(?:bài\s*viết|đoạn\s*văn|essay|bài\s*luận)/i.test(clean) ||
      intent === "essay_scoring"

    const isLongEssayParagraph =
      !isExplicitErrorCheck &&
      intent !== "error_correction" &&
      !clean.toLowerCase().includes("sửa") &&
      !clean.toLowerCase().includes("check") &&
      nlpFeatures.word_count >= 40 &&
      /[.!?].+[.!?]/.test(targetText)

    if (isExplicitEssayScoring || isLongEssayParagraph) {
      const mlScore = scoreEssayML(targetText, 5)
      const strengths = mlScore.strengths.map((s) => `- ${s}`).join("\n")
      const suggestions = mlScore.suggestions.map((s) => `- ${s}`).join("\n")

      const reply = `### 📊 Kết quả chấm điểm & Phân tích bài viết (Local Machine Learning)

> "${clean}"

---

#### 🏆 Đánh giá chất lượng:
- **Điểm tổng quan:** **${mlScore.score}/100** (\`${mlScore.level}\`)
- **Số lượng từ:** ${nlpFeatures.word_count} từ
- **Độ đa dạng từ vựng (TTR):** ${(nlpFeatures.lexical_diversity * 100).toFixed(1)}%
- **Độ dễ hiểu (Flesch Ease):** ${nlpFeatures.flesch_reading_ease}/100
- **Tỷ lệ từ vựng B1 - C1:** ${(nlpFeatures.advanced_vocab_ratio * 100).toFixed(1)}%
- **Mật độ liên từ:** ${nlpFeatures.cohesive_density.toFixed(1)} liên từ/100 từ

---

#### ✨ Điểm mạnh:
${strengths || "- Câu văn có bố cục rõ ràng, ngữ pháp cơ bản vững vàng."}

---

#### 💡 Khuyến nghị cải thiện:
${suggestions || "- Thử ghép các câu đơn thành câu ghép bằng mệnh đề quan hệ để bài viết học thuật hơn."}
${jflegSection}

---
*(Mô hình ML Nội bộ: Ridge Regression AES Model, 0ms, không gọi API).*`

      return {
        reply,
        model: "AI Nội bộ (Ridge Regression AES Model)",
        executionTimeMs: Date.now() - startTime,
      }
    }

    // Kiểm tra câu quá ngắn hoặc từ gõ dở
    const words = clean.split(/\s+/).filter(Boolean)
    if (/^(?:xin\s*ch|ch|xin\s*cha|chao|alo|helo|hi\s*b|chào\s*b)$/i.test(clean)) {
      return {
        reply: `Chào bạn! 👋 Có vẻ bạn đang định gõ *"xin chào"* đúng không?\n\nTôi là **Trợ lý Tiếng Anh AI** nội bộ trên máy. Bạn cần tôi hỗ trợ gì: sửa lỗi câu tiếng Anh, tra cứu 12 thì ngữ pháp, hay cho bài tập luyện tập?`,
        model: "AI Nội bộ (Local Assistant)",
        executionTimeMs: Date.now() - startTime,
      }
    }

    // Nếu từ/cụm quá ngắn (< 3 từ) và không có cấu trúc câu tiếng Anh
    const hasEnglishVerbOrPronoun = /\b(i|you|he|she|it|we|they|is|am|are|was|were|have|has|had|do|does|did|can|will|would|go|see|come|get|make|take|know|like|live|work|play)\b/i.test(clean)
    if (words.length < 3 && !hasEnglishVerbOrPronoun) {
      return {
        reply: `Tôi đã nhận được nội dung: **"${clean}"**.\n\n💡 Để tôi phân tích cú pháp và chỉ ra lỗi ngữ pháp chính xác nhất, bạn hãy nhập một câu tiếng Anh hoàn chỉnh (có chủ ngữ và vị ngữ, ví dụ: *"She goes to school every day"* hoặc *"I have been waiting here for two hours"* nhé!`,
        model: "AI Nội bộ (Local Assistant)",
        executionTimeMs: Date.now() - startTime,
      }
    }

    // NẾU CÂU TIẾNG ANH NGẮN KHÔNG CÓ LỖI:
    const reply = `### ✅ Câu của bạn: "${clean}"

Hệ thống phân tích cú pháp nội bộ đã kiểm tra: câu văn này có cấu trúc đúng ngữ pháp, không phát hiện thấy lỗi sai về thì hay chia động từ.
${jflegSection}

---

💡 **Gợi ý học tập:**
- Bạn có thể dán cả đoạn văn hoặc bài viết dài để hệ thống chấm điểm CEFR và đo độ mạch lạc.
- Bạn cũng có thể hỏi bất kỳ thắc mắc ngữ pháp nào (ví dụ: *"Khi nào dùng thì quá khứ hoàn thành"*, *"Phân biệt since và for"*).

---
*(Phân tích cú pháp nội bộ trên máy, không gọi API).*`

    return {
      reply,
      model: "AI Nội bộ (Local Syntax Checker)",
      executionTimeMs: Date.now() - startTime,
    }
  }

  // 5. Trường hợp mặc định cho câu hỏi tiếng Việt chưa phân loại được:
  const defaultReply = `Tôi đã tiếp nhận câu hỏi của bạn: **"${clean}"**

Hệ thống trợ lý AI hoạt động **100% nội bộ trên máy (không gọi API bên ngoài)**. Bạn có thể sử dụng các tính năng sau:

1. **Sửa lỗi câu tiếng Anh:** Gửi bất kỳ câu tiếng Anh nào để hệ thống tự động bóc tách lỗi và sửa chuẩn (Ví dụ: *"She don't like apple"*).
2. **Hỏi về 12 thì ngữ pháp:** Hỏi về công thức và cách dùng (Ví dụ: *"Thì hiện tại hoàn thành"*, *"Cho tôi ví dụ về thì này"*).
3. **Phân biệt từ vựng:** Tra cứu các cặp từ dễ nhầm lẫn (Ví dụ: *"Phân biệt since và for"*, *"Phân biệt affect và effect"*).
4. **Chấm điểm bài luận:** Dán đoạn văn tiếng Anh để mô hình Machine Learning AES tính điểm theo thang 100.`

  return {
    reply: defaultReply,
    model: "AI Nội bộ (Local Assistant)",
    executionTimeMs: Date.now() - startTime,
  }
}
