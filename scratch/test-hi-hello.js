const VOCAB_DIFF_DICT = {
  hi_hello: {
    title: 'Phân biệt "Hi" và "Hello" (Lời chào trong Tiếng Anh)',
    table: `| Tiêu chí | HI | HELLO |
| :--- | :--- | :--- |
| **Mức độ trang trọng** | **Thân mật (Informal)**, gần gũi | **Tiêu chuẩn / Lịch sự (Neutral / Formal)** |
| **Đối tượng giao tiếp** | Bạn bè, đồng nghiệp thân thiết, gia đình, cùng trang lứa | Người lạ, cấp trên, đối tác, khách hàng, người lớn tuổi |
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
    notes: `💡 **Mẹo nhớ:** "A house is made of bricks and stones, but a home is made of love and alone." (Ngôi nhà xây bằng gạch đá, nhưng tổ ấm được dựng bằng tình yêu thương).`,
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
| **Trip** | Danh từ đếm được | Chuyến đi (đi rồi về, thường có mục đích) | *We had a business **trip** to Singapore.* |
| **Travel** | Động từ / Danh từ không đếm được | Việc du lịch, đi lại nói chung | *Air **travel** has become much cheaper.* |
| **Journey** | Danh từ đếm được | Hành trình di chuyển từ nơi này đến nơi khác (thường dài) | *It was a long 10-hour train **journey**.* |`,
    notes: `💡 **Collocations:** *go on a business trip*, *safe travels*, *an exciting journey*.`,
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
| **Study** | Quá trình học tập (đọc sách, lên lớp, nghiên cứu) | Quá trình, nỗ lực hành động | *I am **studying** for the upcoming exam.* |
| **Learn** | Tiếp thu kiến thức/kỹ năng mới thành công | Kết quả, khả năng đạt được | *I **learned** how to swim last month.* |`,
    notes: `💡 Bạn có thể *study* cả đêm nhưng chưa chắc đã *learn* được gì nếu không hiểu bài!`,
  },
  bring_take: {
    title: 'Phân biệt "Bring" và "Take"',
    table: `| Từ vựng | Hướng chuyển động | Quy tắc nhớ | Ví dụ |
| :--- | :--- | :--- | :--- |
| **Bring** | Hướng về phía người nói (Come here) | Mang đến / Đem lại đây | *Please **bring** me a cup of tea.* |
| **Take** | Rời xa phía người nói (Go away) | Mang đi / Đem đi nơi khác | *Don't forget to **take** your umbrella with you.* |`,
    notes: `💡 **Quy tắc:** *Bring here, Take there.*`,
  },
}

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

const words = extractComparingWords("hi và hello")
console.log("Extracted:", words)
if (words) {
  const key1 = `${words.word1}_${words.word2}`
  const key2 = `${words.word2}_${words.word1}`
  console.log("Matched key:", key1, "in dict:", Boolean(VOCAB_DIFF_DICT[key1]))
}
