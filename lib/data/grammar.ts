export type GrammarLevel = "Cơ bản" | "Trung cấp" | "Nâng cao"

export type FormulaRow = {
  use: string
  structure: string
  example: string
}

export type GrammarExample = {
  /** phần cần highlight đặt trong cặp dấu **, ví dụ: "She **goes** to school." */
  en: string
  vi: string
}

export type GrammarTopic = {
  slug: string
  name: string
  vi: string
  desc: string
  level: GrammarLevel
  /** % đã học */
  progress: number
  accent: string
  intro: string
  usage: string[]
  formulas: FormulaRow[]
  examples: GrammarExample[]
  /** id bài tập liên quan trên trang luyện tập */
  practiceId: string
}

export const grammarLevelClass: Record<GrammarLevel, string> = {
  "Cơ bản": "bg-green-100 text-green-700",
  "Trung cấp": "bg-amber-100 text-amber-700",
  "Nâng cao": "bg-rose-100 text-rose-700",
}

export const grammarTopics: GrammarTopic[] = [
  {
    slug: "present-simple",
    name: "Present Simple",
    vi: "Thì hiện tại đơn",
    desc: "Diễn tả thói quen, sự thật hiển nhiên và lịch trình.",
    level: "Cơ bản",
    progress: 80,
    accent: "bg-purple-600",
    intro:
      "Thì hiện tại đơn dùng để nói về thói quen hằng ngày, sự thật luôn đúng và các lịch trình cố định. Đây là thì cơ bản nhất và xuất hiện trong gần như mọi cuộc hội thoại.",
    usage: [
      "Diễn tả thói quen, hành động lặp đi lặp lại: I wake up at 6 every day.",
      "Diễn tả sự thật hiển nhiên, chân lý: Water boils at 100°C.",
      "Diễn tả lịch trình, thời gian biểu: The train leaves at 8 a.m.",
    ],
    formulas: [
      { use: "Khẳng định", structure: "S + V(s/es)", example: "She goes to school." },
      { use: "Phủ định", structure: "S + do/does + not + V", example: "They do not like coffee." },
      { use: "Nghi vấn", structure: "Do/Does + S + V?", example: "Does he work here?" },
    ],
    examples: [
      { en: "She **goes** to work by bus every morning.", vi: "Cô ấy đi làm bằng xe buýt mỗi sáng." },
      { en: "Water **boils** at 100 degrees Celsius.", vi: "Nước sôi ở 100 độ C." },
      { en: "The movie **starts** at 7 p.m. tonight.", vi: "Bộ phim bắt đầu lúc 7 giờ tối nay." },
    ],
    practiceId: "present-simple-quiz",
  },
  {
    slug: "present-continuous",
    name: "Present Continuous",
    vi: "Thì hiện tại tiếp diễn",
    desc: "Diễn tả hành động đang xảy ra và kế hoạch sắp tới.",
    level: "Cơ bản",
    progress: 55,
    accent: "bg-purple-600",
    intro:
      "Thì hiện tại tiếp diễn dùng khi một hành động đang diễn ra ngay lúc nói, hoặc một kế hoạch chắc chắn sẽ xảy ra trong tương lai gần. Nhận biết qua các trạng từ như now, at the moment, currently.",
    usage: [
      "Hành động đang xảy ra lúc nói: I am studying now.",
      "Kế hoạch đã sắp xếp trong tương lai gần: We are flying to Da Nang tomorrow.",
      "Tình huống tạm thời: She is living with her parents this month.",
    ],
    formulas: [
      { use: "Khẳng định", structure: "S + am/is/are + V-ing", example: "They are playing football." },
      { use: "Phủ định", structure: "S + am/is/are + not + V-ing", example: "He is not sleeping." },
      { use: "Nghi vấn", structure: "Am/Is/Are + S + V-ing?", example: "Are you listening?" },
    ],
    examples: [
      { en: "Look! The baby **is sleeping** peacefully.", vi: "Nhìn kìa! Em bé đang ngủ ngon lành." },
      { en: "I **am meeting** my teacher this afternoon.", vi: "Chiều nay mình sẽ gặp thầy giáo." },
      { en: "**Are** they **coming** to the party tonight?", vi: "Tối nay họ có đến bữa tiệc không?" },
    ],
    practiceId: "mixed-tenses-quiz",
  },
  {
    slug: "past-simple",
    name: "Past Simple",
    vi: "Thì quá khứ đơn",
    desc: "Kể lại sự việc đã xảy ra và kết thúc trong quá khứ.",
    level: "Cơ bản",
    progress: 65,
    accent: "bg-purple-600",
    intro:
      "Thì quá khứ đơn dùng để kể lại hành động đã xảy ra và đã kết thúc hoàn toàn trong quá khứ, thường đi kèm mốc thời gian rõ ràng như yesterday, last week, in 2020.",
    usage: [
      "Hành động xảy ra một lần và đã kết thúc: I visited Hue last year.",
      "Chuỗi hành động nối tiếp nhau: She came home, cooked dinner and watched TV.",
      "Thói quen trong quá khứ: We often played chess when we were kids.",
    ],
    formulas: [
      { use: "Khẳng định", structure: "S + V2/ed", example: "He bought a car." },
      { use: "Phủ định", structure: "S + did + not + V", example: "She did not come." },
      { use: "Nghi vấn", structure: "Did + S + V?", example: "Did you see the film?" },
    ],
    examples: [
      { en: "We **went** to the beach last summer.", vi: "Mùa hè năm ngoái chúng mình đã đi biển." },
      { en: "She **did not finish** her homework yesterday.", vi: "Hôm qua cô ấy đã không làm xong bài tập." },
      { en: "**Did** you **enjoy** the concert?", vi: "Bạn có thích buổi hòa nhạc không?" },
    ],
    practiceId: "past-simple-quiz",
  },
  {
    slug: "future-will-going-to",
    name: "Will & Going to",
    vi: "Thì tương lai đơn và dự định",
    desc: "Phân biệt will và be going to để nói về tương lai.",
    level: "Trung cấp",
    progress: 30,
    accent: "bg-purple-600",
    intro:
      "Cả will và be going to đều nói về tương lai, nhưng khác nhau ở sắc thái: will dùng cho quyết định tức thì và lời hứa, còn be going to dùng cho dự định đã có sẵn và dự đoán có căn cứ.",
    usage: [
      "Quyết định ngay lúc nói: It's hot. I will open the window.",
      "Dự định đã lên kế hoạch: We are going to buy a new house.",
      "Dự đoán có dấu hiệu: Look at those clouds! It's going to rain.",
    ],
    formulas: [
      { use: "Will", structure: "S + will + V", example: "I will help you." },
      { use: "Going to", structure: "S + am/is/are + going to + V", example: "She is going to travel." },
      { use: "Phủ định", structure: "S + will not / am not going to + V", example: "They will not agree." },
    ],
    examples: [
      { en: "Don't worry, I **will call** you tonight.", vi: "Đừng lo, tối nay mình sẽ gọi cho bạn." },
      { en: "We **are going to move** to Hanoi next month.", vi: "Tháng sau chúng mình sẽ chuyển ra Hà Nội." },
      { en: "Watch out! You **are going to drop** your phone.", vi: "Cẩn thận! Bạn sắp làm rơi điện thoại đấy." },
    ],
    practiceId: "mixed-tenses-quiz",
  },
  {
    slug: "present-perfect",
    name: "Present Perfect",
    vi: "Thì hiện tại hoàn thành",
    desc: "Nối quá khứ với hiện tại: đã làm gì và kết quả còn lại.",
    level: "Trung cấp",
    progress: 20,
    accent: "bg-purple-600",
    intro:
      "Thì hiện tại hoàn thành diễn tả hành động đã xảy ra trong quá khứ nhưng kết quả còn ảnh hưởng đến hiện tại, hoặc hành động vừa mới hoàn thành. Dấu hiệu nhận biết: already, just, ever, never, since, for.",
    usage: [
      "Hành động vừa hoàn thành: I have just finished my lunch.",
      "Kinh nghiệm sống đến hiện tại: She has never been abroad.",
      "Hành động bắt đầu trong quá khứ và còn tiếp diễn: We have lived here since 2015.",
    ],
    formulas: [
      { use: "Khẳng định", structure: "S + has/have + V3/ed", example: "He has eaten breakfast." },
      { use: "Phủ định", structure: "S + has/have + not + V3/ed", example: "I have not seen it." },
      { use: "Nghi vấn", structure: "Has/Have + S + V3/ed?", example: "Have you ever tried pho?" },
    ],
    examples: [
      { en: "I **have just finished** reading this book.", vi: "Mình vừa mới đọc xong cuốn sách này." },
      { en: "They **have lived** in this city for ten years.", vi: "Họ đã sống ở thành phố này được mười năm." },
      { en: "**Have** you **ever traveled** by train?", vi: "Bạn đã bao giờ đi du lịch bằng tàu hỏa chưa?" },
    ],
    practiceId: "mixed-tenses-quiz",
  },
  {
    slug: "passive-voice",
    name: "Passive Voice",
    vi: "Câu bị động",
    desc: "Nhấn mạnh hành động và đối tượng chịu tác động.",
    level: "Nâng cao",
    progress: 10,
    accent: "bg-purple-600",
    intro:
      "Câu bị động dùng khi muốn nhấn mạnh hành động hoặc đối tượng chịu tác động hơn là người thực hiện. Công thức chung: động từ to be đúng thì + quá khứ phân từ (V3/ed).",
    usage: [
      "Người thực hiện không quan trọng: The bridge was built in 2000.",
      "Văn phong trang trọng, học thuật: The results will be announced soon.",
      "Nhấn mạnh đối tượng: My phone was stolen yesterday.",
    ],
    formulas: [
      { use: "Hiện tại đơn", structure: "S + am/is/are + V3/ed", example: "English is spoken here." },
      { use: "Quá khứ đơn", structure: "S + was/were + V3/ed", example: "The cake was eaten." },
      { use: "Tương lai đơn", structure: "S + will be + V3/ed", example: "The road will be repaired." },
    ],
    examples: [
      { en: "This house **was built** by my grandfather.", vi: "Ngôi nhà này được xây bởi ông mình." },
      { en: "The homework **has been checked** already.", vi: "Bài tập đã được kiểm tra rồi." },
      { en: "A new hospital **will be opened** next year.", vi: "Một bệnh viện mới sẽ được mở vào năm sau." },
    ],
    practiceId: "mixed-tenses-quiz",
  },
  {
    slug: "conditionals",
    name: "Conditionals",
    vi: "Câu điều kiện loại 1, 2, 3",
    desc: "Giả định, ước muốn và những tình huống không có thật.",
    level: "Nâng cao",
    progress: 5,
    accent: "bg-purple-600",
    intro:
      "Câu điều kiện diễn tả giả thiết và kết quả của nó. Loại 1 nói về khả năng có thật trong tương lai, loại 2 trái với hiện tại, loại 3 trái với quá khứ.",
    usage: [
      "Loại 1 — có thể xảy ra: If it rains, we will stay home.",
      "Loại 2 — trái hiện tại: If I were rich, I would travel the world.",
      "Loại 3 — trái quá khứ: If you had studied, you would have passed.",
    ],
    formulas: [
      { use: "Loại 1", structure: "If + S + V(s/es), S + will + V", example: "If you run, you will catch the bus." },
      { use: "Loại 2", structure: "If + S + V2/ed, S + would + V", example: "If I had time, I would help." },
      { use: "Loại 3", structure: "If + S + had + V3/ed, S + would have + V3/ed", example: "If she had left earlier, she would have arrived." },
    ],
    examples: [
      { en: "**If** it **rains** tomorrow, we **will cancel** the picnic.", vi: "Nếu mai mưa, chúng ta sẽ hủy buổi dã ngoại." },
      { en: "**If** I **were** you, I **would accept** the offer.", vi: "Nếu mình là bạn, mình sẽ nhận lời đề nghị đó." },
      { en: "**If** he **had driven** carefully, he **would not have crashed**.", vi: "Nếu anh ấy lái cẩn thận thì đã không đâm xe." },
    ],
    practiceId: "mixed-tenses-quiz",
  },
]