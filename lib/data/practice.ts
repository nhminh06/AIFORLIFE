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
]