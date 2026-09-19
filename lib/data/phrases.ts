export type PhraseSituation = {
  id: string
  label: string
  chipClass: string
}

export type PhraseItem = {
  en: string
  vi: string
}

export type PhraseSet = {
  slug: string
  name: string
  vi: string
  desc: string
  situationId: string
  /** nhãn tình huống tùy chỉnh khi người dùng tự nhập (không thuộc danh sách có sẵn) */
  situationLabel?: string
  level: "Cơ bản" | "Trung cấp" | "Nâng cao"
  total: number
  learned: number
  accent: string
  items: PhraseItem[]
}

export const levelClass: Record<PhraseSet["level"], string> = {
  "Cơ bản": "bg-green-100 text-green-700",
  "Trung cấp": "bg-amber-100 text-amber-700",
  "Nâng cao": "bg-rose-100 text-rose-700",
}

export const phraseSituations: PhraseSituation[] = [
  { id: "daily", label: "Giao tiếp hàng ngày", chipClass: "border-green-200 bg-green-50 text-green-700" },
  { id: "directions", label: "Hỏi đường", chipClass: "border-blue-200 bg-blue-50 text-blue-700" },
  { id: "restaurant", label: "Nhà hàng", chipClass: "border-orange-200 bg-orange-50 text-orange-700" },
  { id: "interview", label: "Phỏng vấn", chipClass: "border-purple-200 bg-purple-50 text-purple-700" },
  { id: "shopping", label: "Mua sắm", chipClass: "border-pink-200 bg-pink-50 text-pink-700" },
  { id: "hotel", label: "Khách sạn & Sân bay", chipClass: "border-sky-200 bg-sky-50 text-sky-700" },
]

/**
 * Lấy tình huống hiển thị theo id.
 * Nếu id không thuộc danh sách có sẵn (bộ do người dùng tạo với tình huống
 * tùy chỉnh), dùng nhãn người dùng đã nhập — fallback cuối cùng là "Khác".
 */
export function getPhraseSituation(
  situationId: string,
  customLabel?: string
): PhraseSituation {
  return (
    phraseSituations.find((s) => s.id === situationId) ?? {
      id: "khac",
      label: customLabel?.trim() || "Khác",
      chipClass: "border-slate-200 bg-slate-50 text-slate-700",
    }
  )
}

export const phraseSets: PhraseSet[] = [
  {
    slug: "greetings-introductions",
    name: "Greetings & Introductions",
    vi: "Chào hỏi và giới thiệu",
    desc: "Mở lời tự nhiên trong mọi cuộc gặp đầu tiên.",
    situationId: "daily",
    level: "Cơ bản",
    total: 60,
    learned: 42,
    accent: "bg-green-600",
    items: [
      { en: "Hello! How are you doing?", vi: "Chào bạn! Dạo này bạn thế nào?" },
      { en: "It's nice to meet you.", vi: "Rất vui được gặp bạn." },
      { en: "My name is Anna. What's yours?", vi: "Mình tên là Anna. Còn bạn?" },
      { en: "Where are you from?", vi: "Bạn đến từ đâu?" },
      { en: "What do you do for a living?", vi: "Bạn làm nghề gì?" },
      { en: "I hope we can meet again soon.", vi: "Mong sớm gặp lại bạn." },
    ],
  },
  {
    slug: "small-talk",
    name: "Daily Small Talk",
    vi: "Chuyện trò xã giao hằng ngày",
    desc: "Thời tiết, cuối tuần, sở thích — những câu chuyện ngắn mà hiệu quả.",
    situationId: "daily",
    level: "Cơ bản",
    total: 52,
    learned: 33,
    accent: "bg-green-600",
    items: [
      { en: "Lovely weather today, isn't it?", vi: "Hôm nay thời tiết đẹp quá, phải không?" },
      { en: "Did you do anything fun this weekend?", vi: "Cuối tuần bạn có làm gì vui không?" },
      { en: "How was your trip?", vi: "Chuyến đi của bạn thế nào?" },
      { en: "I totally agree with you.", vi: "Mình hoàn toàn đồng ý với bạn." },
      { en: "That sounds amazing!", vi: "Nghe tuyệt quá!" },
      { en: "Let's grab a coffee sometime.", vi: "Hôm nào mình đi cà phê nhé." },
    ],
  },
  {
    slug: "asking-directions",
    name: "Asking for Directions",
    vi: "Hỏi đường và chỉ đường",
    desc: "Không bao giờ lạc khi đi du lịch với những mẫu câu này.",
    situationId: "directions",
    level: "Cơ bản",
    total: 44,
    learned: 18,
    accent: "bg-green-600",
    items: [
      { en: "Excuse me, how do I get to the station?", vi: "Xin lỗi, làm sao để đến ga tàu ạ?" },
      { en: "Is it far from here?", vi: "Chỗ đó có xa đây không?" },
      { en: "Go straight ahead, then turn left.", vi: "Đi thẳng, rồi rẽ trái." },
      { en: "It's about a ten-minute walk.", vi: "Đi bộ khoảng mười phút." },
      { en: "Could you show me on the map?", vi: "Bạn chỉ giúp mình trên bản đồ được không?" },
      { en: "Am I on the right way?", vi: "Mình đi đường này có đúng không?" },
    ],
  },
  {
    slug: "at-restaurant",
    name: "At the Restaurant",
    vi: "Gọi món trong nhà hàng",
    desc: "Đặt bàn, gọi món và thanh toán một cách lịch sự.",
    situationId: "restaurant",
    level: "Cơ bản",
    total: 56,
    learned: 29,
    accent: "bg-green-600",
    items: [
      { en: "A table for two, please.", vi: "Cho mình bàn hai người." },
      { en: "Could I see the menu, please?", vi: "Cho mình xem thực đơn được không?" },
      { en: "What do you recommend?", vi: "Bạn gợi ý món nào ngon?" },
      { en: "I'd like the grilled chicken, please.", vi: "Cho mình món gà nướng." },
      { en: "Could we have the bill, please?", vi: "Cho mình xin hóa đơn nhé." },
      { en: "Keep the change.", vi: "Không cần thối lại đâu." },
    ],
  },
  {
    slug: "work-meetings",
    name: "Meetings at Work",
    vi: "Họp và trao đổi công việc",
    desc: "Trình bày ý kiến, đồng ý và phản đối một cách chuyên nghiệp.",
    situationId: "interview",
    level: "Trung cấp",
    total: 48,
    learned: 12,
    accent: "bg-green-600",
    items: [
      { en: "Shall we get started?", vi: "Chúng ta bắt đầu nhé?" },
      { en: "I'd like to add something here.", vi: "Mình muốn bổ sung thêm ý này." },
      { en: "Could you clarify that point?", vi: "Bạn làm rõ ý đó giúp mình được không?" },
      { en: "Let's circle back to this later.", vi: "Để sau mình quay lại vấn đề này nhé." },
      { en: "The deadline has been moved up.", vi: "Hạn chót đã được dời lên sớm hơn." },
      { en: "I'll follow up with you by email.", vi: "Mình sẽ trao đổi tiếp với bạn qua email." },
    ],
  },
  {
    slug: "interview-answers",
    name: "Interview Answers",
    vi: "Trả lời phỏng vấn xin việc",
    desc: "Mẫu câu ghi điểm với nhà tuyển dụng trong buổi phỏng vấn.",
    situationId: "interview",
    level: "Nâng cao",
    total: 36,
    learned: 8,
    accent: "bg-green-600",
    items: [
      { en: "I have three years of experience in marketing.", vi: "Mình có ba năm kinh nghiệm trong lĩnh vực marketing." },
      { en: "My greatest strength is problem-solving.", vi: "Điểm mạnh lớn nhất của mình là giải quyết vấn đề." },
      { en: "I'm looking for a role where I can grow.", vi: "Mình tìm một vị trí để bản thân phát triển." },
      { en: "I work well under pressure.", vi: "Mình làm việc tốt dưới áp lực." },
      { en: "Why do you want to work here?", vi: "Vì sao bạn muốn làm việc ở đây?" },
      { en: "When can I expect to hear from you?", vi: "Khi nào mình có thể nhận phản hồi từ công ty?" },
    ],
  },
  {
    slug: "shopping-bargaining",
    name: "Shopping & Bargaining",
    vi: "Mua sắm và trả giá",
    desc: "Hỏi giá, mặc cả và mua sắm tự tin như người bản xứ.",
    situationId: "shopping",
    level: "Cơ bản",
    total: 40,
    learned: 24,
    accent: "bg-green-600",
    items: [
      { en: "How much is this?", vi: "Cái này giá bao nhiêu?" },
      { en: "Can I try it on?", vi: "Mình thử được không?" },
      { en: "Do you have a smaller size?", vi: "Bạn có size nhỏ hơn không?" },
      { en: "That's a bit expensive. Any discount?", vi: "Hơi đắt. Có giảm giá không?" },
      { en: "I'll take it.", vi: "Mình lấy cái này." },
      { en: "Can I return this if it doesn't fit?", vi: "Mình có thể đổi trả nếu không vừa không?" },
    ],
  },
  {
    slug: "hotel-airport",
    name: "Hotel & Airport",
    vi: "Khách sạn và sân bay",
    desc: "Đặt phòng, làm thủ tục và xử lý sự cố khi đi xa.",
    situationId: "hotel",
    level: "Trung cấp",
    total: 42,
    learned: 10,
    accent: "bg-green-600",
    items: [
      { en: "I'd like to check in, please.", vi: "Mình muốn nhận phòng." },
      { en: "My flight has been delayed.", vi: "Chuyến bay của mình bị hoãn." },
      { en: "Could I have a wake-up call at 6?", vi: "Gọi báo thức giúp mình lúc 6 giờ được không?" },
      { en: "The air conditioner isn't working.", vi: "Điều hòa không hoạt động." },
      { en: "Where is the baggage claim?", vi: "Khu nhận hành lý ở đâu?" },
      { en: "I'd like to check out. Here's the key.", vi: "Mình trả phòng. Đây là chìa khóa." },
    ],
  },
  {
    slug: "doctor-pharmacy",
    name: "Doctor & Pharmacy",
    vi: "Khám bác sĩ và hiệu thuốc",
    desc: "Diễn tả tình trạng sức khoẻ, đi khám và mua thuốc khi ở nước ngoài.",
    situationId: "daily",
    level: "Trung cấp",
    total: 38,
    learned: 5,
    accent: "bg-green-600",
    items: [
      { en: "I'd like to make an appointment, please.", vi: "Mình muốn đặt lịch hẹn khám." },
      { en: "I've had a sore throat for three days.", vi: "Mình bị đau họng ba ngày rồi." },
      { en: "Do I need a prescription for this?", vi: "Mua thuốc này cần đơn bác sĩ không?" },
      { en: "How often should I take this medicine?", vi: "Mình phải uống thuốc này bao lâu một lần?" },
      { en: "The pain gets worse at night.", vi: "Cơn đau nặng hơn vào ban đêm." },
      { en: "I'm allergic to penicillin.", vi: "Mình bị dị ứng với thuốc penicillin." },
      { en: "Is it serious, doctor?", vi: "Bác sĩ ơi, tình trạng có nghiêm trọng không?" },
      { en: "How long until I feel better?", vi: "Bao lâu thì mình sẽ khoẻ lại?" },
      { en: "Could you write me a sick note?", vi: "Bác sĩ viết giúp mình giấy nghỉ ốm được không?" },
      { en: "Where can I get this prescription filled?", vi: "Mình có thể lấy thuốc theo đơn này ở đâu?" },
      { en: "Take one tablet twice a day after meals.", vi: "Uống một viên, ngày hai lần, sau khi ăn." },
      { en: "I feel much better now, thank you.", vi: "Giờ mình thấy khoẻ hơn nhiều, cảm ơn bác sĩ." },
    ],
  },
]