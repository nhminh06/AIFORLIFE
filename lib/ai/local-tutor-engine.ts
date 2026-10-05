/**
 * Local AI English Tutor Engine — Chạy 100% nội bộ trên máy
 * Tích hợp mô hình Machine Learning phân loại ý định (ml_engine/chatbot_model.json)
 * và mô hình chấm điểm bài viết (ml_engine/model_weights.json).
 *
 * TUYỆT ĐỐI KHÔNG GỌI API BÊN NGOÀI — Phản hồi siêu tốc trong 0 mili-giây.
 */

import { scoreEssayML, extractNLPFeatures } from "./local-scorer"
import { predictChatbotIntent } from "./local-chatbot-predictor"
import { grammarTopics } from "@/lib/data/grammar"

export type LocalAnalysisResult = {
  reply: string
  model: string
  executionTimeMs: number
}

// Danh sách quy tắc ngữ pháp thường gặp
type ErrorRule = {
  id: string
  regex: RegExp
  name: string
  explain: string
  correction: string
  replacement?: (match: string) => string
}

const ERROR_RULES: ErrorRule[] = [
  {
    id: "sva-i-has",
    regex: /\bI\s+has\b/i,
    name: "Sai chia động từ 'to be' / 'have'",
    explain: "Chủ ngữ **I** luôn đi với **have** (không phải has - *has* chỉ dùng cho He/She/It).",
    correction: "I have",
  },
  {
    id: "since-duration",
    regex: /\bsince\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|many|a\s+few|several)\s+(hours?|days?|months?|years?|minutes?|weeks?)\b/i,
    name: "Sai giới từ chỉ khoảng thời gian (Since vs For)",
    explain: "**Since** chỉ dùng cho mốc thời gian bắt đầu (*since 2020, since Monday*).<br>➡️ Dùng **for** để chỉ khoảng thời gian (*for two hours, for 5 years*).",
    correction: "for $1 $2",
  },
  {
    id: "for-point-in-time",
    regex: /\bfor\s+(19\d\d|20\d\d|yesterday|last\s+(week|month|year)|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    name: "Sai giới từ chỉ mốc thời gian (For vs Since)",
    explain: "**For** dùng cho khoảng thời gian.<br>➡️ Phải dùng **since** khi đứng trước mốc thời gian cố định.",
    correction: "since $1",
  },
  {
    id: "she-he-dont",
    regex: /\b(he|she|it)\s+don't\b/i,
    name: "Sai trợ động từ phủ định",
    explain: "Chủ ngữ ngôi thứ ba số ít (He/She/It) phải đi với trợ động từ **doesn't** (hoặc does not).",
    correction: "$1 doesn't",
  },
  {
    id: "interested-on",
    regex: /\binterested\s+on\b/i,
    name: "Sai giới từ đi kèm tính từ",
    explain: "Cụm tính từ chính xác là **be interested in** (hứng thú với cái gì), không dùng giới từ *on*.",
    correction: "interested in",
  },
  {
    id: "good-in",
    regex: /\bgood\s+in\s+([a-zA-Z]+ing|[a-zA-Z]+)\b/i,
    name: "Sai giới từ chỉ kỹ năng/sở trường",
    explain: "Để diễn tả giỏi một môn hoặc kỹ năng nào đó, dùng **good at**, không dùng *good in*.",
    correction: "good at $1",
  },
  {
    id: "they-is",
    regex: /\b(they|we|you)\s+is\b/i,
    name: "Sai hòa hợp chủ ngữ - to be",
    explain: "Chủ ngữ số nhiều (They/We/You) phải đi với động từ to be **are** ở hiện tại.",
    correction: "$1 are",
  },
  {
    id: "double-negative",
    regex: /\bdon't\s+have\s+no\b/i,
    name: "Lỗi phủ định kép (Double Negative)",
    explain: "Trong tiếng Anh chuẩn, không dùng hai từ phủ định cùng lúc. Dùng **don't have any**.",
    correction: "don't have any",
  },
]

// Ánh xạ Intent sang Grammar Topic slug
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

/**
 * Xử lý câu hỏi bằng mô hình ML Chatbot Intent Classifier đã huấn luyện trong ml_engine
 */
export function processLocalQuery(query: string): LocalAnalysisResult {
  const startTime = Date.now()
  const clean = query.trim()

  // 1. Dự đoán ý định bằng mô hình ML đã train (TF-IDF + Logistic Regression)
  const prediction = predictChatbotIntent(clean)
  const { intent, confidence } = prediction

  // A. Xử lý Chào hỏi (greeting)
  if (intent === "greeting") {
    const reply = `Chào bạn! 👋 Tôi là **Trợ lý Tiếng Anh AI** của LearnSphere (Mô hình Chatbot ML huấn luyện nội bộ trên máy).

Tôi sẵn sàng hỗ trợ bạn học tập:
- ✍️ **Sửa lỗi câu & ngữ pháp**: Gửi cho tôi bất kỳ câu nào bạn viết (ví dụ: *"She don't like apple"*).
- 🔍 **Giải thích ngữ pháp**: Tra cứu 12 thì, câu điều kiện, câu bị động, đảo ngữ...
- 💡 **Phân biệt từ vựng & giới từ**: Phân biệt *affect/effect*, *look/see/watch*, *since/for*...
- 📝 **Chấm điểm bài luận**: Dán đoạn văn để mô hình Machine Learning nội bộ phân tích độ dễ đọc và từ vựng.

Bạn đang gặp thắc mắc ở câu nào? Hãy gửi cho tôi nhé!`

    return {
      reply,
      model: `AI Nội bộ (Intent: ${intent} - Độ tin cậy: ${(confidence * 100).toFixed(0)}%)`,
      executionTimeMs: Date.now() - startTime,
    }
  }

  // B. Xử lý Cảm ơn / Tạm biệt (thanks_bye)
  if (intent === "thanks_bye") {
    const reply = `Rất vui được đồng hành cùng bạn! 😊

Chúc bạn học tiếng Anh thật hiệu quả và đạt điểm cao. Bất cứ khi nào bạn gặp câu khó hay bài tập chưa hiểu, hãy nhắn cho tôi nhé!`
    return {
      reply,
      model: `AI Nội bộ (Intent: ${intent} - Độ tin cậy: ${(confidence * 100).toFixed(0)}%)`,
      executionTimeMs: Date.now() - startTime,
    }
  }

  // C. Xử lý Thông tin Chatbot (bot_info)
  if (intent === "bot_info") {
    const reply = `### 🤖 Thông tin về Trợ lý Tiếng Anh AI

Tôi là trợ lý AI học tập được phát triển riêng cho ứng dụng **LearnSphere**:
- **Kiến trúc:** Mô hình Machine Learning NLP phân loại ý định (TF-IDF + Logistic Regression) kết hợp bộ chấm điểm bài viết (AES Ridge Regression) đã được huấn luyện trong thư mục \`ml_engine/\`.
- **Đặc điểm:** Chạy **100% nội bộ trên máy**, phản hồi tức thì (0 - 2ms), bảo mật tuyệt đối và không phụ thuộc vào internet hay API bên ngoài.
- **Tính năng chính:** Sửa lỗi câu, tra cứu 12 thì ngữ pháp, phân biệt từ vựng, chấm điểm bài luận và hướng dẫn mẹo thi.

Hãy gõ câu hỏi hoặc câu bạn muốn sửa để trải nghiệm ngay!`

    return {
      reply,
      model: `AI Nội bộ (Intent: ${intent})`,
      executionTimeMs: Date.now() - startTime,
    }
  }

  // D. Xử lý Phân biệt từ vựng (vocab_diff_*)
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
- **Directly affect**: Ảnh hưởng trực tiếp (*Prices directly affect consumers.*)`

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
- ✅ *Đúng:* I have waited here **for two hours** (vì 2 hours là khoảng thời gian).`

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
| **Watch** | Theo dõi | Chăm chú theo dõi vật/người đang chuyển động | *I watch a football match on TV.* |`

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
- **L**end = **L**eave (cho đồ vật rời khỏi tay mình).`

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
| **Collocations thông dụng** | - *do homework* (làm bài tập)<br>- *do business* (kinh doanh)<br>- *do the dishes* (rửa bát)<br>- *do your best* (cố gắng hết sức) | - *make a decision* (quyết định)<br>- *make a mistake* (phạm sai lầm)<br>- *make money* (kiếm tiền)<br>- *make coffee* (pha cà phê) |`

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
| **Talk** | \`Talk to / with someone\` | Trò chuyện, đàm đạo thân mật | *We **talked** about the movie.* |`

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
| **Listen to** | Lắng nghe, chú tâm | **Có** chủ đích, chủ động | *I **listen to** music every evening.* |`

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
| **Advise** (chữ s) | Động từ (Verb) | /ədˈvaɪz/ (âm z) | Khuyên bảo (hành động) | *The doctor **advised** me to rest.* |`

    return {
      reply,
      model: `AI Nội bộ (Intent: ${intent})`,
      executionTimeMs: Date.now() - startTime,
    }
  }

  if (intent === "study_tips") {
    const reply = `### 🎯 Bí quyết học Tiếng Anh hiệu quả & nhớ lâu

1. **Học từ vựng theo Cụm (Collocations) thay vì học từ đơn lẻ:**
   - Thay vì học từ *decision*, hãy học luôn cụm \`make a decision\` (đưa ra quyết định).
   - Não bộ sẽ ghi nhớ ngữ cảnh và giúp bạn phản xạ tự nhiên khi nói.

2. **Áp dụng Kỹ thuật Spaced Repetition (Lặp lại ngắt quãng):**
   - Ôn lại từ mới sau: 1 ngày ➡️ 3 ngày ➡️ 7 ngày ➡️ 14 ngày.
   - Ứng dụng **LearnSphere** đã tích hợp tính năng này trong mục **Luyện tập**.

3. **Nguyên tắc "Input trước, Output sau":**
   - Đọc và nghe nhiều tài liệu tiếng Anh bạn yêu thích (Podcast, YouTube, bài hát).
   - Sau đó tập tóm tắt lại 2-3 câu bằng tiếng Anh vào khung chat này để tôi sửa lỗi giúp bạn!

4. **Đừng sợ mắc lỗi ngữ pháp:**
   - Cứ mạnh dạn viết câu, nếu câu nào chưa chắc chắn, hãy gửi vào đây để tôi phân tích và gợi ý cách diễn đạt hay hơn nhé!`

    return {
      reply,
      model: `AI Nội bộ (Intent: ${intent})`,
      executionTimeMs: Date.now() - startTime,
    }
  }

  // E. Xử lý các chủ điểm ngữ pháp (grammar_*)
  const targetSlug = INTENT_TO_TOPIC_SLUG[intent]
  const matchedTopic = targetSlug
    ? grammarTopics.find((t) => t.slug === targetSlug)
    : grammarTopics.find(
        (t) =>
          clean.toLowerCase().includes(t.name.toLowerCase()) ||
          clean.toLowerCase().includes(t.vi.toLowerCase())
      )

  if (matchedTopic) {
    const tableHeader = "| Mục đích | Cấu trúc | Ví dụ minh họa |\n| :--- | :--- | :--- |"
    const tableRows = matchedTopic.formulas
      .map((f) => `| ${f.use} | \`${f.structure}\` | *${f.example}* |`)
      .join("\n")

    const reply = `### 📘 ${matchedTopic.name} (${matchedTopic.vi})

**Khái niệm:** ${matchedTopic.intro}

---

#### 📋 Bảng công thức chuẩn
${tableHeader}
${tableRows}

---

#### 💡 Cách sử dụng chính
${matchedTopic.usage.map((u) => `- ${u}`).join("\n")}

---

#### 🌟 Ví dụ thực tế song ngữ
${matchedTopic.examples.map((e) => `- **${e.en}**<br>➡️ *${e.vi}*`).join("\n")}`

    return {
      reply,
      model: `AI Nội bộ (Intent: ${intent} - ${(confidence * 100).toFixed(0)}%)`,
      executionTimeMs: Date.now() - startTime,
    }
  }

  // F. Sửa lỗi câu & Ngữ pháp (error_correction hoặc có phát hiện lỗi theo luật)
  const detectedErrors: { name: string; position: string; explain: string }[] = []
  let correctedText = clean

  const sentenceMatch = clean.match(/(?:sửa(?: câu)?|chỉ lỗi|check|câu:?)\s*["“']?([^"”']+)["”']?/i)
  const targetSentence = sentenceMatch ? sentenceMatch[1].trim() : clean

  ERROR_RULES.forEach((rule) => {
    const match = targetSentence.match(rule.regex)
    if (match) {
      detectedErrors.push({
        name: rule.name,
        position: match[0],
        explain: rule.explain,
      })
      correctedText = correctedText.replace(rule.regex, rule.correction)
    }
  })

  const nlpFeatures = extractNLPFeatures(targetSentence)
  const mlEvaluation = scoreEssayML(targetSentence, 5)

  if (detectedErrors.length > 0) {
    const tableHeader = "| Lỗi | Vị trí | Giải thích |\n| :--- | :--- | :--- |"
    const tableRows = detectedErrors
      .map((e, idx) => `| ${idx + 1}. ${e.name} | \`${e.position}\` | ${e.explain} |`)
      .join("\n")

    let advancedSuggestions = ""
    if (clean.toLowerCase().includes("waiting") && clean.toLowerCase().includes("two hours")) {
      advancedSuggestions = `
1. **Dùng mốc thời gian cụ thể (giữ nguyên \`since\`):**
   *"I have been waiting here since 2 p.m."* (Tôi chờ từ 14h - mốc thời gian cụ thể).

2. **Nhấn mạnh sự chờ đợi kéo dài (Cấu trúc nhấn mạnh):**
   *"It has been two hours since I started waiting here."* (Đã 2 giờ trôi qua kể từ khi tôi bắt đầu chờ ở đây).

3. **Giao tiếp tự nhiên hàng ngày (Spoken English):**
   *"I've been waiting here for a couple of hours."* (Dùng dạng viết tắt *I've* và *a couple of*).`
    } else {
      advancedSuggestions = `
1. **Tăng cường liên từ:** Thêm liên từ kết nối như *furthermore, consequently, on the other hand* để tăng tính mạch lạc.
2. **Từ vựng học thuật:** Thay thế các từ cơ bản bằng từ vựng cấp độ B2/C1 để nâng cao tính trang trọng.`
    }

    const reply = `Chào bạn, đây là phân tích chi tiết và sửa lỗi cho câu của bạn:

---

❌ **Câu gốc**
> "${targetSentence}"

---

🔴 **Phân tích ${detectedErrors.length} lỗi chính**

${tableHeader}
${tableRows}

---

✅ **Câu đúng chuẩn**
> "**${correctedText}**"

---

💡 **Gợi ý nâng cao (Tự nhiên hơn / IELTS Speaking & Writing)**
${advancedSuggestions}

---

📝 **Tóm tắt quy tắc nhớ nhanh (Cheat Sheet)**
| Cấu trúc | Cách dùng | Ví dụ |
| :--- | :--- | :--- |
| **FOR + khoảng thời gian** | Duration (Kéo dài bao lâu) | *for 2 hours, for 5 days, for a long time* |
| **SINCE + mốc thời gian** | Starting point (Từ thời điểm nào) | *since 2020, since Monday, since 2 p.m.* |
| **Chủ ngữ I / You / We / They** | Hiện tại hoàn thành tiếp diễn | **have been V-ing** |
| **Chủ ngữ He / She / It** | Hiện tại hoàn thành tiếp diễn | **has been V-ing** |

---

📊 **Đánh giá từ Mô hình Machine Learning nội bộ (ml_engine):**
- **Điểm chất lượng câu:** \`${mlEvaluation.score}/100\` (${mlEvaluation.level})
- **Độ dễ đọc (Flesch Ease):** \`${nlpFeatures.flesch_reading_ease}/100\`
- **Tỷ lệ từ học thuật CEFR:** \`${(nlpFeatures.advanced_vocab_ratio * 100).toFixed(1)}%\``

    return {
      reply,
      model: `AI Nội bộ (Model: ${intent} - ${(confidence * 100).toFixed(0)}%)`,
      executionTimeMs: Date.now() - startTime,
    }
  }

  // G. Nếu người dùng yêu cầu chấm bài hoặc đoạn văn dài (>= 8 từ)
  if (intent === "essay_scoring" || nlpFeatures.word_count >= 8) {
    const strengthsText = mlEvaluation.strengths.map((s) => `- ${s}`).join("\n")
    const suggestionsText = mlEvaluation.suggestions.map((s) => `- ${s}`).join("\n")

    const reply = `### 📊 Kết quả phân tích bài viết (Local ML Essay Scorer)

> "${clean}"

---

#### 🏆 Điểm số & Xếp loại:
- **Điểm tổng quan:** **${mlEvaluation.score}/100** (\`${mlEvaluation.level}\`)
- **Số từ:** ${nlpFeatures.word_count} từ
- **Độ phong phú từ vựng (TTR):** ${(nlpFeatures.lexical_diversity * 100).toFixed(1)}%
- **Độ dễ đọc Flesch:** ${nlpFeatures.flesch_reading_ease}/100
- **Tỷ lệ từ học thuật CEFR:** ${(nlpFeatures.advanced_vocab_ratio * 100).toFixed(1)}%
- **Mật độ liên từ:** ${nlpFeatures.cohesive_density.toFixed(1)} liên từ/100 từ

---

#### ✨ Điểm mạnh:
${strengthsText || "- Câu văn cấu trúc rõ ràng, đúng ngữ pháp cơ bản."}

---

#### 💡 Gợi ý cải thiện:
${suggestionsText || "- Bạn có thể mở rộng thêm mệnh đề quan hệ hoặc trạng từ để câu văn sinh động hơn."}`

    return {
      reply,
      model: `AI Nội bộ (Ridge Regression AES)`,
      executionTimeMs: Date.now() - startTime,
    }
  }

  // H. Mặc định cho câu ngắn không phát hiện lỗi
  const reply = `### ✅ Câu của bạn: "${clean}"

Câu này có cấu trúc ngắn gọn, đúng ngữ pháp cơ bản và không phát hiện thấy lỗi sai.

---

💡 **Gợi ý sử dụng:**
- **Để sửa lỗi câu hoặc đoạn văn:** Bạn hãy nhập cả câu hoàn chỉnh (ví dụ: *"She don't go to school"*).
- **Để tra cứu ngữ pháp:** Hãy gõ tên chủ điểm (ví dụ: *"Thì hiện tại hoàn thành"*, *"Phân biệt affect và effect"*, *"Câu điều kiện"*).
- **Để chấm điểm bài viết:** Hãy dán đoạn văn từ 15 từ trở lên để mô hình Machine Learning nội bộ phân tích độ phong phú từ vựng và cấp độ CEFR.`

  return {
    reply,
    model: `AI Nội bộ (Local Assistant)`,
    executionTimeMs: Date.now() - startTime,
  }
}
