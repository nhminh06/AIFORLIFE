export type GrammarLevel = "Cơ bản" | "Trung cấp" | "Nâng cao"

/** Nhóm ngữ pháp: 12 thì hay ngữ pháp mở rộng */
export type GrammarGroup = "tense" | "other"

export const grammarGroupLabel: Record<GrammarGroup, string> = {
  tense: "12 thì trong tiếng Anh",
  other: "Ngữ pháp mở rộng",
}

export type FormulaRow = {
  use: string
  structure: string
  example: string
}

export type GrammarExample = {
  en: string
  vi: string
}

export type GrammarTopic = {
  slug: string
  name: string
  vi: string
  desc: string
  level: GrammarLevel
  progress: number
  accent: string
  intro: string
  usage: string[]
  formulas: FormulaRow[]
  examples: GrammarExample[]
  practiceId: string
  group: GrammarGroup
}

export const grammarLevelClass: Record<GrammarLevel, string> = {
  "Cơ bản": "bg-green-100 text-green-700",
  "Trung cấp": "bg-amber-100 text-amber-700",
  "Nâng cao": "bg-rose-100 text-rose-700",
}

export const grammarTopics: GrammarTopic[] = [
  {
    slug: "present-simple",
    group: "tense",
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
    group: "tense",
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
        practiceId: "present-continuous-quiz",
  },
  {
    slug: "present-perfect",
    group: "tense",
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
        practiceId: "present-perfect-quiz",
  },
  {
    slug: "present-perfect-continuous",
    group: "tense",
    name: "Present Perfect Continuous",
    vi: "Thì hiện tại hoàn thành tiếp diễn",
    desc: "Nhấn mạnh thời lượng của hành động bắt đầu từ quá khứ đến hiện tại.",
    level: "Nâng cao",
    progress: 10,
    accent: "bg-purple-600",
    intro:
      "Thì hiện tại hoàn thành tiếp diễn nhấn mạnh thời gian kéo dài của một hành động bắt đầu từ quá khứ và vẫn còn tiếp diễn đến hiện tại. Dấu hiệu: since, for, all day, all morning.",
    usage: [
      "Hành động bắt đầu từ quá khứ và còn tiếp diễn: I have been working here for 5 years.",
      "Nhấn mạnh thời lượng: She has been studying all day.",
      "Gần đây liên tục: It has been raining since Monday.",
    ],
    formulas: [
      { use: "Khẳng định", structure: "S + have/has + been + V-ing", example: "They have been waiting for 2 hours." },
      { use: "Phủ định", structure: "S + have/has + not + been + V-ing", example: "He has not been sleeping well." },
      { use: "Nghi vấn", structure: "Have/Has + S + been + V-ing?", example: "Have you been working today?" },
    ],
    examples: [
      { en: "I **have been studying** English for three years.", vi: "Mình đã học tiếng Anh được ba năm." },
      { en: "It **has been raining** all morning.", vi: "Trời đã mưa cả buổi sáng." },
      { en: "**Have** you **been waiting** long?", vi: "Bạn đã đợi lâu chưa?" },
    ],
        practiceId: "present-perfect-continuous-quiz",
  },
  {
    slug: "past-simple",
    group: "tense",
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
    slug: "past-continuous",
    group: "tense",
    name: "Past Continuous",
    vi: "Thì quá khứ tiếp diễn",
    desc: "Diễn tả hành động đang diễn ra tại một thời điểm trong quá khứ.",
    level: "Cơ bản",
    progress: 30,
    accent: "bg-purple-600",
    intro:
      "Thì quá khứ tiếp diễn dùng để mô tả hành động đang diễn ra tại một thời điểm cụ thể trong quá khứ, hoặc hai hành động xảy ra đồng thời. Nhận biết qua: while, when, at that time.",
    usage: [
      "Hành động đang diễn ra tại một thời điểm: I was reading at 8 p.m. yesterday.",
      "Hành động nền dài hơn + hành động ngắt quãng: While I was cooking, the phone rang.",
      "Hai hành động đồng thời: He was walking and she was running.",
    ],
    formulas: [
      { use: "Khẳng định", structure: "S + was/were + V-ing", example: "They were playing basketball." },
      { use: "Phủ định", structure: "S + was/were + not + V-ing", example: "He was not listening." },
      { use: "Nghi vấn", structure: "Was/Were + S + V-ing?", example: "Were you eating?" },
    ],
    examples: [
      { en: "I **was reading** a book at 9 p.m. yesterday.", vi: "Tối hôm qua lúc 9 giờ mình đang đọc sách." },
      { en: "**While** I **was cooking**, the phone **rang**.", vi: "Trong khi mình đang nấu thì điện thoại reo." },
      { en: "**Were** you **sleeping** when I called?", vi: "Bạn có đang ngủ khi mình gọi không?" },
    ],
        practiceId: "past-continuous-quiz",
  },
  {
    slug: "past-perfect",
    group: "tense",
    name: "Past Perfect",
    vi: "Thì quá khứ hoàn thành",
    desc: "Diễn tả hành động đã hoàn thành trước một hành động khác trong quá khứ.",
    level: "Nâng cao",
    progress: 5,
    accent: "bg-purple-600",
    intro:
      "Thì quá khứ hoàn thành dùng để nói về hành động đã hoàn thành trước một hành động hoặc thời điểm khác trong quá khứ. Thường đi kèm các từ: before, after, by the time, already, just.",
    usage: [
      "Hành động hoàn thành trước: I had already left when he called.",
      "Trình tự sự việc: She had finished dinner before I arrived.",
      "Điều kiện giả định trong quá khứ: If I had known, I would have helped.",
    ],
    formulas: [
      { use: "Khẳng định", structure: "S + had + V3/ed", example: "He had left before I arrived." },
      { use: "Phủ định", structure: "S + had + not + V3/ed", example: "They had not seen that movie." },
      { use: "Nghi vấn", structure: "Had + S + V3/ed?", example: "Had you eaten before?" },
    ],
    examples: [
      { en: "I **had already eaten** when she invited me.", vi: "Mình đã ăn rồi khi cô ấy mời." },
      { en: "**By the time** we **got** there, the movie **had started**.", vi: "Khi chúng mình đến thì phim đã chiếu rồi." },
      { en: "He **had never visited** London before that trip.", vi: "Trước chuyến đi đó anh ấy chưa bao giờ đến London." },
    ],
        practiceId: "past-perfect-quiz",
  },
  {
    slug: "past-perfect-continuous",
    group: "tense",
    name: "Past Perfect Continuous",
    vi: "Thì quá khứ hoàn thành tiếp diễn",
    desc: "Nhấn mạnh thời lượng hành động tiếp diễn trước một thời điểm trong quá khứ.",
    level: "Nâng cao",
    progress: 5,
    accent: "bg-purple-600",
    intro:
      "Thì quá khứ hoàn thành tiếp diễn nhấn mạnh thời gian kéo dài của một hành động đã diễn ra liên tục trước một thời điểm hoặc sự kiện khác trong quá khứ. Dấu hiệu: for, since, all day.",
    usage: [
      "Hành động kéo dài trước một sự kiện: He had been working there for 10 years before he quit.",
      "Nhấn mạnh nguyên nhân: She was tired because she had been running.",
      "Kết quả thể hiện: His eyes were red because he had been crying.",
    ],
    formulas: [
      { use: "Khẳng định", structure: "S + had + been + V-ing", example: "I had been waiting for 30 minutes." },
      { use: "Phủ định", structure: "S + had + not + been + V-ing", example: "He had not been sleeping." },
      { use: "Nghi vấn", structure: "Had + S + been + V-ing?", example: "Had you been studying?" },
    ],
    examples: [
      { en: "She was exhausted because she **had been running** for an hour.", vi: "Cô ấy kiệt sức vì đã chạy bộ một tiếng." },
      { en: "I **had been living** in Hanoi for 5 years before I moved.", vi: "Trước khi chuyển đi, mình đã sống ở Hà Nội 5 năm." },
      { en: "**Had** you **been waiting** long before they arrived?", vi: "Bạn đã đợi lâu bao lâu trước khi họ đến?" },
    ],
    practiceId: "past-perfect-continuous-quiz",
  },
  {
        slug: "future-simple",
    group: "tense",
    name: "Future Simple (Will)",
    vi: "Thì tương lai đơn (Will)",
    desc: "Nói về dự đoán, quyết định tức thì và lời hứa trong tương lai.",
    level: "Cơ bản",
    progress: 40,
    accent: "bg-purple-600",
    intro:
      "Thì tương lai đơn dùng will để nói về dự đoán, quyết định tức thì, lời hứa, hoặc yêu cầu. Khác với be going to, will thường dùng cho quyết định được đưa ra ngay lúc nói.",
    usage: [
      "Quyết định tức thì: It is cold. I will close the window.",
      "Dự đoán: I think she will pass the exam.",
      "Lời hứa: I will always love you.",
    ],
    formulas: [
      { use: "Khẳng định", structure: "S + will + V", example: "I will help you." },
      { use: "Phủ định", structure: "S + will + not + V", example: "They will not come." },
      { use: "Nghi vấn", structure: "Will + S + V?", example: "Will you call me?" },
    ],
    examples: [
      { en: "I **will call** you tomorrow.", vi: "Ngày mai mình sẽ gọi cho bạn." },
      { en: "She **will probably** be late.", vi: "Cô ấy có lẽ sẽ đến muộn." },
      { en: "**Will** you **help** me with this?", vi: "Bạn có giúp mình việc này không?" },
    ],
    practiceId: "future-simple-quiz",
  },
  {
        slug: "future-continuous",
    group: "tense",
    name: "Future Continuous",
    vi: "Thì tương lai tiếp diễn",
    desc: "Diễn tả hành động đang diễn ra tại một thời điểm trong tương lai.",
    level: "Trung cấp",
    progress: 15,
    accent: "bg-purple-600",
    intro:
      "Thì tương lai tiếp diễn dùng để mô tả hành động sẽ đang diễn ra tại một thời điểm cụ thể trong tương lai, hoặc hành động sẽ kéo dài trong một khoảng thời gian trong tương lai.",
    usage: [
      "Hành động đang diễn ra tại một thời điểm tương lai: I will be working at 5 p.m. tomorrow.",
      "Hành động kéo dài trong tương lai: She will be studying all semester.",
      "Kế hoạch đã định: We will be flying to Japan next week.",
    ],
    formulas: [
      { use: "Khẳng định", structure: "S + will be + V-ing", example: "I will be working late." },
      { use: "Phủ định", structure: "S + will not be + V-ing", example: "He will not come." },
      { use: "Nghi vấn", structure: "Will + S + be + V-ing?", example: "Will you be home?" },
    ],
    examples: [
      { en: "This time tomorrow I **will be flying** to London.", vi: "Ngày mai cùng giờ mình sẽ đang bay đến London." },
      { en: "She **will be working** all day on Sunday.", vi: "Cô ấy sẽ làm việc cả ngày Chủ nhật." },
      { en: "**Will** you **be using** the car tonight?", vi: "Tối nay bạn có dùng xe không?" },
    ],
    practiceId: "future-continuous-quiz",
  },
  {
        slug: "future-perfect",
    group: "tense",
    name: "Future Perfect",
    vi: "Thì tương lai hoàn thành",
    desc: "Diễn tả hành động sẽ hoàn thành trước một thời điểm trong tương lai.",
    level: "Nâng cao",
    progress: 5,
    accent: "bg-purple-600",
    intro:
      "Thì tương lai hoàn thành dùng để nói về hành động sẽ đã hoàn thành trước một thời điểm hoặc sự kiện cụ thể trong tương lai. Dấu hiệu: by + thời gian, by the time, before.",
    usage: [
      "Hành động sẽ hoàn thành trước một thời điểm: By next year, I will have graduated.",
      "Trước khi một sự kiện xảy ra: She will have left before we arrive.",
      "Mốc thời gian trong tương lai: They will have built the bridge by December.",
    ],
    formulas: [
      { use: "Khẳng định", structure: "S + will have + V3/ed", example: "I will have finished by 5 p.m." },
      { use: "Phủ định", structure: "S + will have + not + V3/ed", example: "He will have not arrived yet." },
      { use: "Nghi vấn", structure: "Will + S + have + V3/ed?", example: "Will you have completed it?" },
    ],
    examples: [
      { en: "By next month, I **will have saved** enough money.", vi: "Tháng tới mình sẽ đã tiết kiệm đủ tiền." },
      { en: "**By the time** you **get** home, dinner **will be ready**.", vi: "Khi bạn về đến nhà thì bữa tối sẽ đã sẵn sàng." },
      { en: "She **will have retired** by 2030.", vi: "Cô ấy sẽ đã nghỉ hưu vào năm 2030." },
    ],
    practiceId: "future-perfect-quiz",
  },
  {
        slug: "future-perfect-continuous",
    group: "tense",
    name: "Future Perfect Continuous",
    vi: "Thì tương lai hoàn thành tiếp diễn",
    desc: "Nhấn mạnh thời lượng hành động tiếp diễn đến một thời điểm trong tương lai.",
    level: "Nâng cao",
    progress: 5,
    accent: "bg-purple-600",
    intro:
      "Thì tương lai hoàn thành tiếp diễn nhấn mạnh thời gian kéo dài của một hành động sẽ đang diễn ra và tiếp diễn đến một thời điểm cụ thể trong tương lai. Dấu hiệu: for + thời gian, since + thời gian.",
    usage: [
      "Thời lượng đến một mốc tương lai: By next year, I will have been working here for 10 years.",
      "Nhấn mạnh quá trình kéo dài: She will have been studying for 3 hours by dinner.",
      "Kết quả thể hiện ở tương lai: His English will have improved significantly by then.",
    ],
    formulas: [
      { use: "Khẳng định", structure: "S + will have been + V-ing", example: "I will have been working here for 5 years." },
      { use: "Phủ định", structure: "S + will not have been + V-ing", example: "He will not have been sleeping." },
      { use: "Nghi vấn", structure: "Will + S + have been + V-ing?", example: "Will you have been waiting long?" },
    ],
    examples: [
      { en: "By Monday, I **will have been studying** for 3 weeks.", vi: "Thứ Hai tới mình sẽ đã học được 3 tuần." },
      { en: "She **will have been living** there for 10 years by 2025.", vi: "Đến 2025 cô ấy sẽ đã sống ở đó 10 năm." },
      { en: "**Will** he **have been working** here for a year by next month?", vi: "Tháng tới anh ấy có đã làm việc ở đây được 1 năm chưa?" },
    ],
        practiceId: "future-perfect-continuous-quiz",
  },
  {
    slug: "passive-voice",
    name: "Passive Voice",
    vi: "Câu bị động",
    desc: "Chuyển đổi câu tích cực sang câu bị động để nhấn mâm chúng ta hành động chứ không phải chủ thể.",
    level: "Trung cấp",
    progress: 0,
    accent: "bg-purple-600",
    group: "other",
    intro:
      "Câu bị động xuất hiện khi chủ thể không quan trọng hoặt là không biết là ai thực hiện hành động, hoặc muốn nhấn mạnh hành động được thực hiện lên đối tượng. Cấu trúc: be + V3/ed (khẳng định), be + not + V3/ed (phủ định), có bao nhiêu + be + V3/ed? (nghi vấn).",
    usage: [
      "Khi người/thứ thực hiện hành không quan trọng: The movie was watched by millions of people.",
      "Khi muốn nhấn mạnh đối tượng nhận hành động: The new policy will be implemented next month.",
      "Khi chủ thể không xác định: The documents have been signed already.",
    ],
    formulas: [
      { use: "Khẳng định", structure: "S + am/is/are/was/were/have/has/had/will be + V3/ed", example: "The letter is being written by Mary." },
      { use: "Phủ định", structure: "S + not + be + V3/ed", example: "The proposal was not accepted." },
      { use: "Nghi vấn", structure: "Wh- + be + S + V3/ed?", example: "Where was the book written?" },
    ],
    examples: [
      { en: "The homework **was done** by the students yesterday.", vi: "Bài tập về nhà đã được học sinh làm xong hôm qua." },
      { en: "A new bridge **is being built** in the city center.", vi: "Một cây cầu mới đang được xây dựng ở trung tâm thành phố." },
      { en: "**Has** the report **been completed** yet?", vi: "Báo cáo đã được hoàn thành chưa?" },
    ],
    practiceId: "passive-voice-quiz",
  },
  {
    slug: "conditionals",
    name: "Conditionals",
    vi: "Câu điều kiện",
    desc: "Miêu tả những tình huống giả tưởng, khả năng hoặc hoạt động chưa chắc chắn dựa trên điều kiện.",
    level: "Trung cấp",
    progress: 10,
    accent: "bg-purple-600",
    group: "other",
    intro:
      "Câu điều kiện (if-clauses) dùng để để thể hiện những phát biểu dạng \"nếu... thì...\" nhằm diễn tả khả năng, giả thuyết, hoặc hoàn cảnh. Có 3 loại chính: Điều kiện thực tế (loại 1), giả thuyết hiện tại (loại 2), và giả thuyệnh nằm ngoài khả năng xảy ra (loại 3).",
    usage: [
      "Điều kiện thực tế — khả năng là có thật: If it rains tomorrow, I will bring an umbrella.",
      "Giả thuyễn hiện tại — điều chưa có thật: If I had more time, I would travel around the world.",
      "Giả thuyệnh quá khứ — việc đã không xảy ra: If she had studied harder, she would have passed the exam.",
    ],
    formulas: [
      { use: "Loại 1", structure: "If + S + V1(s), S + will + V", example: "If it rains, I will stay at home." },
      { use: "Loại 2", structure: "If + S + V2, S + would + V", example: "If I won the lottery, I would quit my job." },
      { use: "Loại 3", structure: "If + S + had + V3, S + would have + V3", example: "If he had left early, he would have arrived on time." },
    ],
    examples: [
      { en: "If I **study** hard enough, I **will pass** the exam.", vi: "Nếu mình học chăm chỉ đủ, mình sẽ đậu kỳ thi." },
      { en: "She **would buy** a house if she **had** more money.", vi: "Cô ấy sẽ mua nhà nếu cô ấy có nhiều tiền hơn." },
      { en: "If he **had left** earlier, he **would not have missed** the train.", vi: "Nếu anh ấy đi sớm hơn, anh ấy sẽ không bỏ lỡ chuyến tàu." },
    ],
    practiceId: "conditionals-quiz",
  },
  {
    slug: "articles",
    name: "Articles (A, An, The & Zero Article)",
    vi: "Mạo từ (A, An, The và Mạo từ rỗng)",
    desc: "Quy tắc sử dụng mạo từ không xác định (a, an), xác định (the) và khi nào không dùng mạo từ (mạo từ rỗng Ø).",
    level: "Cơ bản",
    progress: 50,
    accent: "bg-purple-600",
    group: "other",
    intro:
      "Mạo từ trong tiếng Anh gồm mạo từ không xác định (A, An) dùng trước danh từ đếm được số ít khi nhắc đến lần đầu; mạo từ xác định (The) dùng khi cả người nói và người nghe đều biết rõ đối tượng; và Mạo từ rỗng (Zero article - Ø) dùng cho danh từ số nhiều nói chung hoặc danh từ không đếm được.",
    usage: [
      "Mạo từ không xác định (A / An): Dùng trước danh từ đếm được số ít khi nhắc đến lần đầu (a cat, a university; an apple, an hour).",
      "Mạo từ xác định (The): Dùng khi danh từ đã được xác định trước, vật thể độc nhất (the sun, the earth), số thứ tự (the first), hoặc so sánh nhất (the best).",
      "Mạo từ rỗng (Zero Article - Ø): Không dùng mạo từ trước danh từ số nhiều/không đếm được nói chung (I love music), tên bữa ăn (have breakfast), môn thể thao (play football), tên nước đơn (Vietnam, Japan).",
    ],
    formulas: [
      { use: "A + Âm phụ âm", structure: "a + consonant sound + N (số ít)", example: "She is a doctor. / He goes to a university." },
      { use: "An + Âm nguyên âm", structure: "an + vowel sound + N (số ít)", example: "I have an apple. / We waited for an hour." },
      { use: "The (Xác định)", structure: "the + N (duy nhất / đã biết / so sánh nhất)", example: "The sun rises in the east. / This is the best book." },
      { use: "Zero Article (Ø)", structure: "Ø + N (số nhiều chung / bữa ăn / thể thao)", example: "Dogs are loyal animals. / She plays tennis." },
    ],
    examples: [
      { en: "I saw **a** cat in the garden. **The** cat was sleeping peacefully.", vi: "Tôi nhìn thấy một con mèo trong vườn. Con mèo đó đang ngủ rất ngoan." },
      { en: "She has been waiting for **an** hour at **the** bus stop.", vi: "Cô ấy đã đợi suốt một tiếng đồng hồ ở trạm xe buýt." },
      { en: "**The** Nile is **the** longest river in **the** world.", vi: "Sông Nile là con sông dài nhất trên thế giới." },
      { en: "Children usually like **Ø** chocolate and **Ø** ice cream.", vi: "Trẻ em thường thích sô-cô-la và kem." },
    ],
    practiceId: "articles-quiz",
  },
  {
    slug: "modal-verbs",
    name: "Modal Verbs",
    vi: "Động từ khuyết thiếu (Can, Could, Must, Should...)",
    desc: "Diễn tả khả năng, sự cho phép, nghĩa vụ bắt buộc, lời khuyên và dự đoán.",
    level: "Trung cấp",
    progress: 40,
    accent: "bg-purple-600",
    group: "other",
    intro:
      "Động từ khuyết thiếu (Modal Verbs) là các động từ đặc biệt đi kèm động từ nguyên mẫu không 'to' (V-bare) để diễn đạt khả năng (can/could), sự bắt buộc (must/have to), lời khuyên (should), hoặc sự cho phép/khả năng (may/might).",
    usage: [
      "Khả năng (Ability): can / could (I can speak English fluently).",
      "Bắt buộc (Obligation): must / have to (You must wear a seatbelt).",
      "Lời khuyên (Advice): should / ought to (You should see a doctor).",
      "Khả năng xảy ra (Possibility): may / might / could (It might rain tonight).",
    ],
    formulas: [
      { use: "Khẳng định", structure: "S + modal + V-bare", example: "She can play the piano." },
      { use: "Phủ định", structure: "S + modal + not + V-bare", example: "You must not park here." },
      { use: "Nghi vấn", structure: "Modal + S + V-bare?", example: "Could you help me, please?" },
    ],
    examples: [
      { en: "You **must wear** a helmet when riding a motorbike.", vi: "Bạn bắt buộc phải đội mũ bảo hiểm khi đi xe máy." },
      { en: "She **can speak** three languages fluently.", vi: "Cô ấy có thể nói trôi chảy ba thứ tiếng." },
      { en: "You **should eat** more fresh vegetables every day.", vi: "Bạn nên ăn nhiều rau tươi hơn mỗi ngày." },
    ],
    practiceId: "modal-verbs-quiz",
  },
  {
    slug: "relative-clauses",
    name: "Relative Clauses",
    vi: "Mệnh đề quan hệ (Who, Whom, Which, That, Whose)",
    desc: "Mệnh đề bổ nghĩa cho danh từ đứng trước bằng các đại từ quan hệ phù hợp.",
    level: "Trung cấp",
    progress: 35,
    accent: "bg-purple-600",
    group: "other",
    intro:
      "Mệnh đề quan hệ dùng để bổ nghĩa cho danh từ đứng trước, giúp ghép hai câu đơn thành một câu ghép mạch lạc. Sử dụng 'who' cho người (chủ ngữ), 'whom' cho người (tân ngữ), 'which' cho vật, 'whose' chỉ sở hữu, và 'that' thay thế cho who/which trong mệnh đề xác định.",
    usage: [
      "Chỉ người làm chủ ngữ: who / that (The man who called you is my uncle).",
      "Chỉ vật: which / that (The book which I bought is fascinating).",
      "Chỉ sở hữu: whose + N (The student whose laptop was stolen).",
      "Chỉ nơi chốn/thời gian: where / when (The city where I was born).",
    ],
    formulas: [
      { use: "Chỉ người", structure: "N(người) + who/that + V + O", example: "The girl who lives next door is a doctor." },
      { use: "Chỉ vật", structure: "N(vật) + which/that + V/S-V", example: "The car which he bought is electric." },
      { use: "Sở hữu", structure: "N + whose + N + V", example: "The author whose book won the prize." },
    ],
    examples: [
      { en: "The teacher **who taught** me English won the national award.", vi: "Người thầy đã dạy tôi tiếng Anh đã giành giải thưởng quốc gia." },
      { en: "This is the best movie **that I have ever watched**.", vi: "Đây là bộ phim hay nhất mà tôi từng xem." },
      { en: "The restaurant **where we had dinner** was fantastic.", vi: "Nhà hàng nơi chúng tôi ăn tối rất tuyệt vời." },
    ],
    practiceId: "relative-clauses-quiz",
  },
  {
    slug: "reported-speech",
    name: "Reported Speech",
    vi: "Câu tường thuật / Gián tiếp",
    desc: "Quy tắc chuyển lời nói trực tiếp sang gián tiếp (lùi thì, đổi đại từ, thời gian).",
    level: "Trung cấp",
    progress: 25,
    accent: "bg-purple-600",
    group: "other",
    intro:
      "Câu tường thuật dùng để thuật lại lời nói của người khác mà không trích nguyên văn. Khi tường thuật, cần thực hiện 3 quy tắc: Lùi thì của động từ, thay đổi đại từ nhân xưng, và đổi các trạng từ chỉ thời gian / nơi chốn (now ➔ then, today ➔ that day, yesterday ➔ the day before).",
    usage: [
      "Tường thuật câu kể: S + said (that) / told + O (that) + S + V(lùi thì).",
      "Tường thuật câu hỏi Yes/No: S + asked + (O) + if/whether + S + V(lùi thì).",
      "Tường thuật câu mệnh lệnh: S + told/asked + O + to V (hoặc not to V).",
    ],
    formulas: [
      { use: "Câu trần thuật", structure: "S + said (that) + S + V(lùi thì)", example: "He said that he was tired." },
      { use: "Câu hỏi Yes/No", structure: "S + asked + if/whether + S + V", example: "She asked if I liked coffee." },
      { use: "Mệnh lệnh / Yêu cầu", structure: "S + told/asked + O + to-V", example: "The teacher told us to open the book." },
    ],
    examples: [
      { en: "\"I am studying for my exam,\" she said. ➔ She said that **she was studying** for her exam.", vi: "\"Tôi đang học bài thi,\" cô ấy nói. ➔ Cô ấy nói rằng cô ấy đang học bài thi." },
      { en: "He asked me: \"Do you live here?\" ➔ He asked me **if I lived there**.", vi: "Anh ấy hỏi tôi: \"Bạn có sống ở đây không?\" ➔ Anh ấy hỏi tôi có sống ở đó không." },
    ],
    practiceId: "reported-speech-quiz",
  },
  {
    slug: "gerund-infinitive",
    name: "Gerund & Infinitive (V-ing & To-V)",
    vi: "Danh động từ & Động từ nguyên mẫu",
    desc: "Quy tắc dùng V-ing hay To-V sau các động từ và giới từ thông dụng.",
    level: "Trung cấp",
    progress: 30,
    accent: "bg-purple-600",
    group: "other",
    intro:
      "Trong tiếng Anh, một số động từ chỉ đi kèm Danh động từ V-ing (enjoy, avoid, mind, practice, suggest), một số chỉ đi kèm Động từ nguyên mẫu To-V (decide, want, hope, promise, plan, refuse), và một số mang nghĩa khác nhau khi dùng V-ing hay To-V (remember, forget, stop, try).",
    usage: [
      "Đi sau giới từ: Giới từ luôn đi kèm V-ing (interested in learning, good at playing).",
      "Động từ theo sau là V-ing: enjoy, admit, avoid, consider, finish, practice.",
      "Động từ theo sau là To-V: decide, hope, manage, promise, refuse, tend, plan.",
      "Đổi nghĩa: remember to V (nhớ phải làm gì) vs remember V-ing (nhớ đã làm gì).",
    ],
    formulas: [
      { use: "V + V-ing", structure: "S + V(enjoy/avoid...) + V-ing", example: "I enjoy reading books." },
      { use: "V + To-V", structure: "S + V(decide/want...) + to-V", example: "She decided to study abroad." },
      { use: "Giới từ + V-ing", structure: "Preposition + V-ing", example: "He is famous for painting portraits." },
    ],
    examples: [
      { en: "I **enjoy listening** to classical music in the evening.", vi: "Tôi thích nghe nhạc cổ điển vào buổi tối." },
      { en: "They **decided to travel** to Japan this spring.", vi: "Họ đã quyết định đi du lịch Nhật Bản vào mùa xuân này." },
      { en: "Please **remember to lock** the door before you leave.", vi: "Xin hãy nhớ khóa cửa trước khi bạn rời đi." },
    ],
    practiceId: "gerund-infinitive-quiz",
  },
  {
    slug: "comparisons",
    name: "Comparisons",
    vi: "Câu so sánh (Bằng, Hơn, Nhất, Kép)",
    desc: "Cấu trúc so sánh bằng (as...as), so sánh hơn (-er/more), so sánh nhất (-est/most) và so sánh kép.",
    level: "Trung cấp",
    progress: 40,
    accent: "bg-purple-600",
    group: "other",
    intro:
      "Câu so sánh dùng để đối chiếu tính chất, mức độ giữa 2 hoặc nhiều đối tượng. Gồm: So sánh bằng (as + adj/adv + as), So sánh hơn (adj-er / more + adj + than), So sánh nhất (the + adj-est / the most + adj), và So sánh kép (The more... the more...).",
    usage: [
      "So sánh bằng: as + adj/adv + as (She is as smart as her sister).",
      "So sánh hơn: tính từ ngắn thêm -er, tính từ dài dùng more (faster, more expensive).",
      "So sánh nhất: the + adj-est / the most + adj (the fastest, the most beautiful).",
      "So sánh kép: The + comp, the + comp (The more you practice, the better you speak).",
    ],
    formulas: [
      { use: "So sánh bằng", structure: "S1 + be/V + as + adj/adv + as + S2", example: "He is as tall as his father." },
      { use: "So sánh hơn", structure: "S1 + be/V + adj-er / more adj + than + S2", example: "Gold is more expensive than silver." },
      { use: "So sánh nhất", structure: "S + be/V + the + adj-est / the most adj", example: "Mount Everest is the highest mountain." },
      { use: "So sánh kép", structure: "The + comparative..., the + comparative...", example: "The harder you work, the more you earn." },
    ],
    examples: [
      { en: "Traveling by plane is **much faster than** traveling by train.", vi: "Di chuyển bằng máy bay nhanh hơn nhiều so với đi tàu hỏa." },
      { en: "This is **the most challenging** project I have ever undertaken.", vi: "Đây là dự án thử thách nhất mà tôi từng đảm nhận." },
      { en: "**The more you read**, **the more knowledge** you gain.", vi: "Bạn càng đọc nhiều, bạn càng tích lũy được nhiều kiến thức." },
    ],
    practiceId: "comparisons-quiz",
  },
  {
    slug: "inversion",
    name: "Inversion",
    vi: "Đảo ngữ trong tiếng Anh",
    desc: "Đảo trợ động từ lên trước chủ ngữ khi đứng đầu câu bằng từ phủ định hoặc điều kiện.",
    level: "Nâng cao",
    progress: 15,
    accent: "bg-purple-600",
    group: "other",
    intro:
      "Đảo ngữ (Inversion) là hiện tượng đảo trợ động từ lên trước chủ ngữ nhằm mục đích nhấn mạnh. Thường xuất hiện sau các trạng từ phủ định hoặc bán phủ định (Never, Rarely, Seldom, Hardly... when, No sooner... than, Not only... but also).",
    usage: [
      "Với trạng từ phủ định: Never, Rarely, Seldom, Hardly, Scarcely (Never have I heard such a story).",
      "Not only... but also: Not only did he pass, but he also got the top score.",
      "No sooner... than: No sooner had she arrived than the rain started.",
      "Đảo ngữ câu điều kiện: Were S to V (Loại 2), Had S + V3 (Loại 3).",
    ],
    formulas: [
      { use: "Phủ định đứng đầu", structure: "Negative word + Aux + S + V", example: "Rarely do we see such enthusiasm." },
      { use: "Not only... but also", structure: "Not only + Aux + S + V, but S also...", example: "Not only is he kind, but he is also smart." },
      { use: "No sooner... than", structure: "No sooner + had + S + V3 + than + S + V2", example: "No sooner had I slept than the alarm rang." },
    ],
    examples: [
      { en: "**Never in my life have I seen** such a magnificent aurora.", vi: "Chưa bao giờ trong đời tôi lại được chứng kiến một dải cực quang lộng lẫy đến vậy." },
      { en: "**Not only did she finish** the marathon, **but she also set** a new record.", vi: "Cô ấy không những hoàn thành chặng chạy ma-ra-tông mà còn thiết lập một kỷ lục mới." },
      { en: "**Had you told me earlier**, I **would have helped** you immediately.", vi: "Nếu bạn nói với tôi sớm hơn, tôi đã giúp bạn ngay lập tức. (Đảo ngữ điều kiện loại 3)." },
    ],
    practiceId: "inversion-quiz",
  },
]

/** Lấy grammar topic theo slug */
export function getGrammarTopic(slug: string): GrammarTopic | undefined {
  return grammarTopics.find((t) => t.slug === slug)
}
