export type GrammarLevel = "Cơ bản" | "Trung cấp" | "Nâng cao"

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
    practiceId: "present-continuous-quiz",
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
    practiceId: "present-perfect-quiz",
  },
  {
    slug: "present-perfect-continuous",
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
]

/** Lấy grammar topic theo slug */
export function getGrammarTopic(slug: string): GrammarTopic | undefined {
  return grammarTopics.find((t) => t.slug === slug)
}
