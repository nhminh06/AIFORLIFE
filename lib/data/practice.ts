import {
  Headphones,
  ListChecks,
  PencilLine,
  Shuffle,
  type LucideIcon,
} from "lucide-react"

export type PracticeTypeId = "trac-nghiem" | "dien-tu" | "nghe-chon" | "sap-xep-cau"
export type PracticeCategory = "writing" | "listening" | "reading"
export type PracticeQuestionKind = "choice" | "fill" | "order" | "reading" | "listening" | "writing" | "true-false"

export type PracticeType = {
  id: PracticeTypeId
  label: string
  desc: string
  icon: LucideIcon
  chipClass: string
  iconClass: string
}

export type PracticeStatus = "Chưa làm" | "Đang làm" | "Hoàn thành"

export type Question =
  | { kind: "choice"; prompt: string; options: [string, string, string, string]; correctIndex: number }
  | { kind: "listen"; prompt: string; options: [string, string, string, string]; correctIndex: number }
  | { kind: "fill"; prompt: string; answer: string; hint?: string }
  | { kind: "order"; sentence: string; words: string[] }
  | { kind: "reading"; passage: string; prompt: string; options: [string, string, string, string]; correctIndex: number }
  | { kind: "listening"; transcript: string; prompt: string; options: [string, string, string, string]; correctIndex: number }
  | { kind: "writing"; prompt: string; minWords?: number; sampleAnswer?: string }
  | { kind: "true-false"; statement: string; answer: boolean; explanation?: string }

export type Exercise = {
  id: string
  name: string
  vi: string
  desc: string
  typeId: PracticeTypeId
  minutes: number
  status: PracticeStatus
  /** điểm cao nhất dạng "đúng/tổng", chỉ khi đã làm */
  bestScore?: string
  items: Question[]
  category?: PracticeCategory
  examType?: string
  grammarSlug?: string
}

export type PracticeResult = {
  score: number
  total: number
}

export function getPracticeCategory(exercise: Pick<Exercise, "category" | "typeId" | "items">): PracticeCategory {
  if (exercise.category) return exercise.category
  if (exercise.typeId === "nghe-chon" || exercise.items.some((item) => item.kind === "listen" || item.kind === "listening")) return "listening"
  if (exercise.items.some((item) => item.kind === "writing")) return "writing"
  return "reading"
}

const practiceIconColors = [
  "bg-blue-600",
  "bg-teal-600",
  "bg-purple-600",
  "bg-orange-500",
  "bg-green-600",
  "bg-pink-500",
  "bg-sky-500",
  "bg-indigo-600",
  "bg-rose-500",
]

export function getPracticeIconClass(exercise: Pick<Exercise, "id">): string {
  const hash = [...exercise.id].reduce((total, character) => total + character.charCodeAt(0), 0)
  return practiceIconColors[hash % practiceIconColors.length]
}

export const practiceTypes: PracticeType[] = [
  {
    id: "trac-nghiem",
    label: "Trắc nghiệm",
    desc: "Chọn đáp án đúng nhất",
    icon: ListChecks,
    chipClass: "border-orange-200 bg-orange-50 text-orange-700",
    iconClass: "bg-orange-500",
  },
  {
    id: "dien-tu",
    label: "Điền từ",
    desc: "Gõ từ còn thiếu",
    icon: PencilLine,
    chipClass: "border-blue-200 bg-blue-50 text-blue-700",
    iconClass: "bg-blue-600",
  },
  {
    id: "nghe-chon",
    label: "Nghe – chọn đáp án",
    desc: "Nghe rồi chọn nghĩa đúng",
    icon: Headphones,
    chipClass: "border-purple-200 bg-purple-50 text-purple-700",
    iconClass: "bg-purple-600",
  },
  {
    id: "sap-xep-cau",
    label: "Sắp xếp câu",
    desc: "Ghép từ thành câu đúng",
    icon: Shuffle,
    chipClass: "border-teal-200 bg-teal-50 text-teal-700",
    iconClass: "bg-teal-600",
  },
]

export const statusClass: Record<PracticeStatus, string> = {
  "Chưa làm": "bg-slate-100 text-slate-500",
  "Đang làm": "bg-amber-100 text-amber-700",
  "Hoàn thành": "bg-green-100 text-green-700",
}

export function getPracticeType(typeId: PracticeTypeId): PracticeType {
  return practiceTypes.find((t) => t.id === typeId) ?? practiceTypes[0]
}

export const exercises: Exercise[] = [
  // --- TRẮC NGHIỆM ---
  {
    id: "ex-01",
    name: "Basic 12 Tenses Quiz",
    vi: "Trắc nghiệm 12 thì cơ bản",
    desc: "Củng cố kiến thức nhận biết dấu hiệu và cấu trúc các thì trọng tâm.",
    typeId: "trac-nghiem",
    minutes: 10,
    status: "Chưa làm",
    items: [
      { kind: "choice", prompt: "By the time he arrived, the film ___ already.", options: ["started", "had started", "has started", "starts"], correctIndex: 1 },
      { kind: "choice", prompt: "She usually ___ up at 6 a.m., but today she slept in.", options: ["wakes", "woke", "is waking", "has woken"], correctIndex: 0 },
      { kind: "choice", prompt: "They ___ English for three years now.", options: ["study", "are studying", "have been studying", "studied"], correctIndex: 2 },
      { kind: "choice", prompt: "While I ___ down the street, I met an old friend.", options: ["walked", "was walking", "have walked", "am walking"], correctIndex: 1 },
      { kind: "choice", prompt: "Tomorrow at this time, we ___ on the beach.", options: ["will relax", "will be relaxing", "are relaxing", "have relaxed"], correctIndex: 1 },
      { kind: "choice", prompt: "He ___ never ___ to Japan before.", options: ["has / been", "did / go", "was / been", "had / went"], correctIndex: 0 },
      { kind: "choice", prompt: "Look at those dark clouds! It ___ rain.", options: ["is going to", "will", "shall", "is raining"], correctIndex: 0 },
      { kind: "choice", prompt: "She ___ here since last September.", options: ["works", "has worked", "worked", "is working"], correctIndex: 1 },
    ],
  },
  {
    id: "present-simple-quiz",
    name: "Present Simple Basics",
    vi: "Hiện tại đơn — cơ bản",
    desc: "Ôn công thức và dấu hiệu thì hiện tại đơn.",
    typeId: "trac-nghiem",
    minutes: 10,
    status: "Hoàn thành",
    bestScore: "8/8",
    items: [
      { kind: "choice", prompt: "She ___ to work every day.", options: ["go", "goes", "going", "gone"], correctIndex: 1 },
      { kind: "choice", prompt: "They ___ coffee in the morning.", options: ["drinks", "drink", "drinking", "drank"], correctIndex: 1 },
      { kind: "choice", prompt: "___ he live in Hanoi?", options: ["Do", "Does", "Is", "Has"], correctIndex: 1 },
      { kind: "choice", prompt: "Water ___ at 100°C.", options: ["boil", "boils", "boiling", "boiled"], correctIndex: 1 },
      { kind: "choice", prompt: "My parents ___ in Da Nang.", options: ["lives", "living", "live", "lived"], correctIndex: 2 },
      { kind: "choice", prompt: "She ___ TV in the evening.", options: ["doesn't watches", "don't watch", "doesn't watch", "not watch"], correctIndex: 2 },
      { kind: "choice", prompt: "The train ___ at 7 a.m.", options: ["leave", "leaves", "leaving", "left"], correctIndex: 1 },
      { kind: "choice", prompt: "___ your sister like music?", options: ["Does", "Do", "Is", "Are"], correctIndex: 0 },
    ],
  },
  {
    id: "past-simple-quiz",
    name: "Past Simple Practice",
    vi: "Quá khứ đơn — thực hành",
    desc: "Kể lại chuyện đã qua bằng thì quá khứ đơn.",
    typeId: "trac-nghiem",
    minutes: 8,
    status: "Đang làm",
    bestScore: "4/6",
    items: [
      { kind: "choice", prompt: "We ___ to Hue last summer.", options: ["go", "went", "gone", "going"], correctIndex: 1 },
      { kind: "choice", prompt: "She ___ her homework yesterday.", options: ["didn't finished", "didn't finish", "doesn't finish", "not finished"], correctIndex: 1 },
      { kind: "choice", prompt: "___ you see the match?", options: ["Did", "Do", "Does", "Have"], correctIndex: 0 },
      { kind: "choice", prompt: "They ___ a new house in 2020.", options: ["buy", "buys", "bought", "buying"], correctIndex: 2 },
      { kind: "choice", prompt: "I ___ very tired last night.", options: ["am", "is", "was", "were"], correctIndex: 2 },
      { kind: "choice", prompt: "He ___ me a letter last week.", options: ["writes", "wrote", "written", "writing"], correctIndex: 1 },
    ],
  },
  {
    id: "mixed-tenses-quiz",
    name: "Mixed Tenses",
    vi: "Tổng hợp các thì",
    desc: "Phân biệt các thì trong cùng một bài.",
    typeId: "trac-nghiem",
    minutes: 10,
    status: "Chưa làm",
    items: [
      { kind: "choice", prompt: "Look! The baby ___.", options: ["sleeps", "is sleeping", "slept", "sleep"], correctIndex: 1 },
      { kind: "choice", prompt: "I ___ my keys. I can't find them.", options: ["lose", "lost", "have lost", "am losing"], correctIndex: 2 },
      { kind: "choice", prompt: "If it rains, we ___ at home.", options: ["stay", "will stay", "stayed", "staying"], correctIndex: 1 },
      { kind: "choice", prompt: "English ___ in many countries.", options: ["speaks", "is spoken", "spoke", "speaking"], correctIndex: 1 },
      { kind: "choice", prompt: "We ___ to Da Nang tomorrow.", options: ["fly", "are flying", "flew", "flies"], correctIndex: 1 },
      { kind: "choice", prompt: "He ___ here since 2018.", options: ["lives", "has lived", "lived", "is living"], correctIndex: 1 },
    ],
  },
  {
    id: "modal-verbs-quiz",
    name: "Modal Verbs in Context",
    vi: "Động từ khuyết thiếu thông dụng",
    desc: "Phân biệt can, could, should, must theo ngữ cảnh.",
    typeId: "trac-nghiem",
    minutes: 8,
    status: "Chưa làm",
    items: [
      { kind: "choice", prompt: "You ___ touch that wire; it is extremely dangerous.", options: ["mustn't", "needn't", "don't have to", "might not"], correctIndex: 0 },
      { kind: "choice", prompt: "I ___ speak French when I was younger, but I've forgotten most of it.", options: ["can", "could", "should", "must"], correctIndex: 1 },
      { kind: "choice", prompt: "You ___ see a doctor if your headache continues.", options: ["should", "could", "might", "would"], correctIndex: 0 },
      { kind: "choice", prompt: "We ___ have brought an umbrella; it didn't rain at all.", options: ["mustn't", "needn't", "couldn't", "shouldn't"], correctIndex: 1 },
      { kind: "choice", prompt: "___ I borrow your pen for a moment?", options: ["May", "Must", "Should", "Will"], correctIndex: 0 },
    ],
  },
  {
    id: "conditionals-quiz",
    name: "Conditionals Practice",
    vi: "Câu điều kiện loại 1 & 2",
    desc: "Luyện tập cấu trúc câu điều kiện thực tế và giả định.",
    typeId: "trac-nghiem",
    minutes: 8,
    status: "Chưa làm",
    items: [
      { kind: "choice", prompt: "If it rains tomorrow, we ___ our trip.", options: ["cancel", "will cancel", "would cancel", "cancelled"], correctIndex: 1 },
      { kind: "choice", prompt: "If I ___ you, I would accept that offer immediately.", options: ["am", "was", "were", "had been"], correctIndex: 2 },
      { kind: "choice", prompt: "If she studies harder, she ___ the final exam easily.", options: ["passes", "will pass", "would pass", "passed"], correctIndex: 1 },
      { kind: "choice", prompt: "What would you do if you ___ a million dollars?", options: ["won", "win", "had won", "will win"], correctIndex: 0 },
      { kind: "choice", prompt: "Unless you practice every day, you ___ improve your pronunciation.", options: ["don't", "won't", "wouldn't", "haven't"], correctIndex: 1 },
    ],
  },

  // --- ĐIỀN TỪ ---
  {
    id: "ex-02",
    name: "Verb Forms & Conjunctions Fill",
    vi: "Điền từ dạng động từ & Liên từ",
    desc: "Điền dạng đúng của động từ hoặc liên từ phù hợp để hoàn thành câu.",
    typeId: "dien-tu",
    minutes: 8,
    status: "Chưa làm",
    items: [
      { kind: "fill", prompt: "She decided ___ (take) a break after studying for four hours straight.", answer: "to take", hint: "dạng to-infinitive sau decide" },
      { kind: "fill", prompt: "We enjoy ___ (listen) to acoustic music on weekends.", answer: "listening", hint: "dạng V-ing sau enjoy" },
      { kind: "fill", prompt: "I like coffee, ___ my brother prefers green tea.", answer: "but", hint: "từ nối mang ý nghĩa nhưng/ngược lại" },
      { kind: "fill", prompt: "___ it was raining heavily, they decided to go hiking.", answer: "Although", hint: "liên từ chỉ sự nhượng bộ (mặc dù)" },
      { kind: "fill", prompt: "He looks forward to ___ (meet) his new team members tomorrow.", answer: "meeting", hint: "dạng V-ing sau cụm look forward to" },
      { kind: "fill", prompt: "You should turn off the computer ___ leaving the office.", answer: "before", hint: "liên từ thời gian (trước khi)" },
    ],
  },
  {
    id: "daily-vocab-fill",
    name: "Fill the Missing Word",
    vi: "Điền từ còn thiếu",
    desc: "Điền từ vựng về đời sống và du lịch vào chỗ trống.",
    typeId: "dien-tu",
    minutes: 7,
    status: "Hoàn thành",
    bestScore: "5/6",
    items: [
      { kind: "fill", prompt: "My morning ___ starts at 6 a.m.", answer: "routine", hint: "thói quen" },
      { kind: "fill", prompt: "Please give me your boarding ___ at the gate.", answer: "pass", hint: "thẻ" },
      { kind: "fill", prompt: "She is a ___ student; she always finishes early.", answer: "diligent", hint: "siêng năng" },
      { kind: "fill", prompt: "I have to run some ___ this afternoon.", answer: "errands", hint: "việc vặt" },
      { kind: "fill", prompt: "The ___ of the hotel is five stars.", answer: "cuisine", hint: "ẩm thực" },
      { kind: "fill", prompt: "Keep your room ___ and clean.", answer: "neat", hint: "gọn gàng" },
    ],
  },
  {
    id: "work-vocab-fill",
    name: "Work Words in Context",
    vi: "Từ vựng công sở theo ngữ cảnh",
    desc: "Điền từ đúng vào email và cuộc họp mẫu.",
    typeId: "dien-tu",
    minutes: 8,
    status: "Chưa làm",
    items: [
      { kind: "fill", prompt: "The project ___ is Friday. We must finish.", answer: "deadline", hint: "hạn chót" },
      { kind: "fill", prompt: "Please ___ up with the client tomorrow.", answer: "follow", hint: "follow ___" },
      { kind: "fill", prompt: "She will ___ the tasks to the team.", answer: "delegate", hint: "phân công" },
      { kind: "fill", prompt: "Let's ___ a meeting for Monday morning.", answer: "schedule", hint: "lên lịch" },
      { kind: "fill", prompt: "I work ___ behalf of our manager today.", answer: "on", hint: "thay mặt" },
    ],
  },
  {
    id: "grammar-tenses-fill",
    name: "Verb Tense Conjugation",
    vi: "Chia thì động từ vào chỗ trống",
    desc: "Rèn luyện chia dạng động từ chuẩn xác theo ngữ cảnh câu.",
    typeId: "dien-tu",
    minutes: 7,
    status: "Chưa làm",
    items: [
      { kind: "fill", prompt: "They have ___ (live) in this neighborhood since 2015.", answer: "lived", hint: "quá khứ phân từ của live" },
      { kind: "fill", prompt: "Yesterday, she ___ (write) a thank-you letter to her teacher.", answer: "wrote", hint: "quá khứ đơn của write" },
      { kind: "fill", prompt: "Listen! Someone is ___ (sing) in the garden.", answer: "singing", hint: "thì hiện tại tiếp diễn" },
      { kind: "fill", prompt: "If he ___ (work) harder, he will get promoted.", answer: "works", hint: "hiện tại đơn sau mệnh đề If" },
      { kind: "fill", prompt: "The sun ___ (rise) in the east.", answer: "rises", hint: "chân lý hiển nhiên thì hiện tại đơn" },
    ],
  },

  // --- NGHE - CHỌN ĐÁP ÁN ---
  {
    id: "ex-03",
    name: "Core Listening Reflex",
    vi: "Nghe - chọn đáp án cơ bản",
    desc: "Luyện phản xạ nhận biết từ vựng và câu giao tiếp thường gặp qua âm thanh.",
    typeId: "nghe-chon",
    minutes: 6,
    status: "Chưa làm",
    items: [
      { kind: "listen", prompt: "How may I help you today?", options: ["Tôi có thể giúp gì cho bạn?", "Bạn đang đi đâu thế?", "Bao nhiêu tiền một cái?", "Hẹn gặp lại bạn ngày mai."], correctIndex: 0 },
      { kind: "listen", prompt: "I would like to make a reservation.", options: ["Tôi muốn đặt chỗ trước.", "Tôi muốn thanh toán ngay.", "Tôi muốn đổi thực đơn.", "Tôi muốn hủy chuyến bay."], correctIndex: 0 },
      { kind: "listen", prompt: "Excuse me, where is the restroom?", options: ["Xin lỗi, nhà vệ sinh ở đâu vậy?", "Xin lỗi, cho tôi hỏi giờ?", "Xin lỗi, bến xe buýt ở đâu?", "Xin lỗi, có wifi không?"], correctIndex: 0 },
      { kind: "listen", prompt: "Could you please speak a little slower?", options: ["Bạn có thể nói chậm hơn một chút không?", "Bạn có thể nhắc lại câu hỏi không?", "Bạn có thể nói to hơn không?", "Bạn có hiểu ý tôi không?"], correctIndex: 0 },
      { kind: "listen", prompt: "Have a safe flight!", options: ["Chúc bạn chuyến bay an toàn!", "Chúc bạn ngon miệng!", "Chúc mừng sinh nhật bạn!", "Hẹn gặp bạn tuần sau!"], correctIndex: 0 },
    ],
  },
  {
    id: "travel-listening",
    name: "Listen: At the Airport",
    vi: "Nghe: ở sân bay",
    desc: "Nghe phát âm rồi chọn nghĩa tiếng Việt đúng.",
    typeId: "nghe-chon",
    minutes: 6,
    status: "Đang làm",
    bestScore: "3/5",
    items: [
      { kind: "listen", prompt: "boarding pass", options: ["thẻ lên máy bay", "hành lý ký gửi", "cửa khởi hành", "vé khứ hồi"], correctIndex: 0 },
      { kind: "listen", prompt: "luggage", options: ["hộ chiếu", "hành lý", "lịch trình", "khách sạn"], correctIndex: 1 },
      { kind: "listen", prompt: "layover", options: ["chuyến bay thẳng", "thời gian quá cảnh", "giờ cất cánh", "sân bay đến"], correctIndex: 1 },
      { kind: "listen", prompt: "itinerary", options: ["bản đồ", "lịch trình chuyến đi", "giá vé", "hóa đơn"], correctIndex: 1 },
      { kind: "listen", prompt: "refund", options: ["tiền đặt cọc", "tiền tip", "tiền hoàn lại", "tiền phạt"], correctIndex: 2 },
    ],
  },
  {
    id: "restaurant-listening",
    name: "Listen: Ordering Food",
    vi: "Nghe: gọi món ăn",
    desc: "Nghe mẫu câu trong nhà hàng và chọn nghĩa đúng.",
    typeId: "nghe-chon",
    minutes: 6,
    status: "Chưa làm",
    items: [
      { kind: "listen", prompt: "A table for two, please.", options: ["Cho mình bàn hai người.", "Cho mình thực đơn.", "Tính tiền giúp mình.", "Món này ngon quá."], correctIndex: 0 },
      { kind: "listen", prompt: "Could we have the bill, please?", options: ["Món ăn rất ngon.", "Cho mình thêm nước.", "Cho mình xin hóa đơn.", "Mình muốn đặt bàn."], correctIndex: 2 },
      { kind: "listen", prompt: "What do you recommend?", options: ["Bạn ăn món gì?", "Bạn gợi ý món nào?", "Món này bao nhiêu?", "Mình ăn chay."], correctIndex: 1 },
      { kind: "listen", prompt: "Keep the change.", options: ["Giữ chỗ giúp mình.", "Không cần thối lại.", "Đổi món khác.", "Thêm đá giúp mình."], correctIndex: 1 },
    ],
  },
  {
    id: "office-listening",
    name: "Listen: Office Communication",
    vi: "Nghe: Giao tiếp văn phòng",
    desc: "Nghe các mẫu câu trao đổi công việc và lịch họp.",
    typeId: "nghe-chon",
    minutes: 6,
    status: "Chưa làm",
    items: [
      { kind: "listen", prompt: "Let's reschedule the meeting for tomorrow afternoon.", options: ["Hãy đổi lịch họp sang chiều mai.", "Hãy hủy cuộc họp chiều nay.", "Hãy bắt đầu cuộc họp ngay.", "Hãy chuẩn bị tài liệu họp."], correctIndex: 0 },
      { kind: "listen", prompt: "I will send you the updated report by end of day.", options: ["Tôi sẽ gửi bạn báo cáo cập nhật trước cuối ngày.", "Tôi cần bạn gửi báo cáo gấp.", "Báo cáo này đã hoàn thành tuần trước.", "Tôi không tìm thấy báo cáo."], correctIndex: 0 },
      { kind: "listen", prompt: "Are you available for a quick call?", options: ["Bạn có rảnh để trao đổi nhanh qua điện thoại không?", "Bạn có số điện thoại này không?", "Bạn vừa gọi cho ai vậy?", "Bạn có muốn gửi email không?"], correctIndex: 0 },
      { kind: "listen", prompt: "Thank you for your timely feedback.", options: ["Cảm ơn phản hồi kịp thời của bạn.", "Cảm ơn vì đã đến đúng giờ.", "Bạn có phản hồi gì không?", "Bản thảo này cần chỉnh sửa thêm."], correctIndex: 0 },
    ],
  },

  // --- SẮP XẾP CÂU ---
  {
    id: "ex-04",
    name: "Sentence Structure Level 1",
    vi: "Luyện sắp xếp câu cấp độ 1",
    desc: "Rèn luyện phản xạ ghép các từ thành câu hoàn chỉnh đúng trật tự từ S-V-O cơ bản.",
    typeId: "sap-xep-cau",
    minutes: 8,
    status: "Chưa làm",
    items: [
      { kind: "order", sentence: "She goes to school by bus every day", words: ["by", "school", "every", "She", "bus", "goes", "to", "day"] },
      { kind: "order", sentence: "I would like a cup of hot coffee", words: ["like", "hot", "a", "I", "coffee", "would", "cup", "of"] },
      { kind: "order", sentence: "Where is the nearest train station", words: ["nearest", "the", "Where", "train", "is", "station"] },
      { kind: "order", sentence: "They have lived in Hanoi for ten years", words: ["years", "lived", "in", "ten", "They", "Hanoi", "for", "have"] },
      { kind: "order", sentence: "Can you help me with this exercise", words: ["with", "me", "this", "help", "Can", "exercise", "you"] },
      { kind: "order", sentence: "We are going to visit our grandparents this weekend", words: ["this", "our", "are", "grandparents", "going", "visit", "to", "We", "weekend"] },
    ],
  },
  {
    id: "greetings-order",
    name: "Build Greetings",
    vi: "Ghép câu chào hỏi",
    desc: "Sắp xếp từ thành câu chào hỏi hoàn chỉnh.",
    typeId: "sap-xep-cau",
    minutes: 5,
    status: "Hoàn thành",
    bestScore: "4/4",
    items: [
      { kind: "order", sentence: "Nice to meet you", words: ["you", "meet", "to", "Nice"] },
      { kind: "order", sentence: "Where are you from", words: ["from", "you", "are", "Where"] },
      { kind: "order", sentence: "I hope we can meet again soon", words: ["again", "meet", "I", "soon", "we", "can", "hope"] },
      { kind: "order", sentence: "What do you do for a living", words: ["a", "do", "What", "living", "you", "do", "for"] },
    ],
  },
  {
    id: "directions-order",
    name: "Build Direction Sentences",
    vi: "Ghép câu chỉ đường",
    desc: "Ghép các từ thành câu chỉ đường chính xác.",
    typeId: "sap-xep-cau",
    minutes: 5,
    status: "Chưa làm",
    items: [
      { kind: "order", sentence: "Go straight ahead then turn left", words: ["left", "ahead", "straight", "then", "turn", "Go"] },
      { kind: "order", sentence: "Is it far from here", words: ["from", "far", "it", "here", "Is"] },
      { kind: "order", sentence: "How do I get to the station", words: ["the", "How", "get", "I", "to", "do", "station"] },
      { kind: "order", sentence: "It is about a ten minute walk", words: ["ten", "minute", "about", "a", "is", "It", "walk"] },
    ],
  },
  {
    id: "sentence-order-daily",
    name: "Daily Routine Sentences",
    vi: "Sắp xếp câu: Sinh hoạt hằng ngày",
    desc: "Ghép các từ thành câu miêu tả thói quen và sinh hoạt thường nhật.",
    typeId: "sap-xep-cau",
    minutes: 6,
    status: "Chưa làm",
    items: [
      { kind: "order", sentence: "I wake up at six thirty every morning", words: ["wake", "at", "morning", "I", "up", "thirty", "every", "six"] },
      { kind: "order", sentence: "He usually takes a walk after dinner", words: ["after", "a", "takes", "dinner", "walk", "He", "usually"] },
      { kind: "order", sentence: "My sister loves reading books before going to bed", words: ["books", "sister", "going", "before", "My", "bed", "reading", "to", "loves"] },
      { kind: "order", sentence: "They always have breakfast together with their family", words: ["breakfast", "with", "together", "always", "have", "family", "their", "They"] },
    ],
  },
  {
    id: "sentence-order-work",
    name: "Workplace & Email Sentences",
    vi: "Sắp xếp câu: Công sở & Email",
    desc: "Rèn luyện trật tự câu văn viết thư và giao tiếp trong công việc.",
    typeId: "sap-xep-cau",
    minutes: 7,
    status: "Chưa làm",
    items: [
      { kind: "order", sentence: "Please find attached the file you requested", words: ["the", "Please", "attached", "file", "find", "requested", "you"] },
      { kind: "order", sentence: "I look forward to hearing from you soon", words: ["from", "hearing", "forward", "I", "to", "soon", "look", "you"] },
      { kind: "order", sentence: "Could we schedule a short meeting tomorrow afternoon", words: ["short", "afternoon", "we", "meeting", "tomorrow", "Could", "schedule", "a"] },
      { kind: "order", sentence: "Thank you very much for your kind support", words: ["very", "your", "kind", "Thank", "support", "for", "much", "you"] },
    ],
  },
  {
    id: "sentence-order-complex",
    name: "Complex Sentences & Clauses",
    vi: "Sắp xếp câu: Mệnh đề quan hệ & Câu ghép",
    desc: "Nâng cao phản xạ ghép các cấu trúc câu dài với liên từ và đại từ quan hệ.",
    typeId: "sap-xep-cau",
    minutes: 8,
    status: "Chưa làm",
    items: [
      { kind: "order", sentence: "The man who is standing over there is my teacher", words: ["is", "who", "standing", "The", "over", "there", "my", "teacher", "man", "is"] },
      { kind: "order", sentence: "Although it was raining hard we decided to go out", words: ["decided", "out", "was", "hard", "raining", "to", "Although", "we", "go", "it"] },
      { kind: "order", sentence: "This is the most interesting book that I have ever read", words: ["book", "ever", "that", "the", "read", "interesting", "is", "I", "This", "have", "most"] },
      { kind: "order", sentence: "She did not come to the party because she felt sick", words: ["party", "because", "felt", "not", "to", "She", "come", "did", "the", "sick", "she"] },
    ],
  },
]