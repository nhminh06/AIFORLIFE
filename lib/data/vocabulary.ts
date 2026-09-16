import {
  BookText,
  Briefcase,
  GraduationCap,
  HeartPulse,
  Home,
  Plane,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react"

export type VocabLevel = "Cơ bản" | "Trung cấp" | "Nâng cao"

export type VocabTopic = {
  id: string
  label: string
  icon: LucideIcon
  /** màu pastel cho chip đang chọn */
  chipClass: string
  /** màu đậm cho ô icon */
  iconClass: string
}

export type VocabWord = {
  en: string
  ipa: string
  type: "n" | "v" | "adj" | "adv" | "prep" | "phr"
  vi: string
}

export type VocabSet = {
  slug: string
  name: string
  vi: string
  desc: string
  topicId: string
  level: VocabLevel
  /** tổng số từ của bộ */
  total: number
  /** số từ đã học */
  learned: number
  /** màu progress bar của bộ */
  accent: string
  words: VocabWord[]
}

export const levelClass: Record<VocabLevel, string> = {
  "Cơ bản": "bg-green-100 text-green-700",
  "Trung cấp": "bg-amber-100 text-amber-700",
  "Nâng cao": "bg-rose-100 text-rose-700",
}

export const vocabTopics: VocabTopic[] = [
  {
    id: "doi-song",
    label: "Đời sống",
    icon: Home,
    chipClass: "border-teal-200 bg-teal-50 text-teal-700",
    iconClass: "bg-teal-600",
  },
  {
    id: "du-lich",
    label: "Du lịch",
    icon: Plane,
    chipClass: "border-blue-200 bg-blue-50 text-blue-700",
    iconClass: "bg-blue-600",
  },
  {
    id: "cong-viec",
    label: "Công việc",
    icon: Briefcase,
    chipClass: "border-orange-200 bg-orange-50 text-orange-700",
    iconClass: "bg-orange-500",
  },
  {
    id: "hoc-tap",
    label: "Học tập",
    icon: GraduationCap,
    chipClass: "border-purple-200 bg-purple-50 text-purple-700",
    iconClass: "bg-purple-600",
  },
  {
    id: "am-thuc",
    label: "Ẩm thực",
    icon: UtensilsCrossed,
    chipClass: "border-green-200 bg-green-50 text-green-700",
    iconClass: "bg-green-600",
  },
  {
    id: "suc-khoe",
    label: "Sức khỏe",
    icon: HeartPulse,
    chipClass: "border-pink-200 bg-pink-50 text-pink-700",
    iconClass: "bg-pink-500",
  },
  {
    id: "gia-dinh",
    label: "Gia đình",
    icon: Users,
    chipClass: "border-sky-200 bg-sky-50 text-sky-700",
    iconClass: "bg-sky-500",
  },
]

export function getVocabTopic(topicId: string): VocabTopic {
  return (
    vocabTopics.find((t) => t.id === topicId) ?? {
      id: "khac",
      label: "Khác",
      icon: BookText,
      chipClass: "border-slate-200 bg-slate-50 text-slate-700",
      iconClass: "bg-slate-500",
    }
  )
}

export const vocabSets: VocabSet[] = [
  {
    slug: "daily-life",
    name: "Daily Life",
    vi: "Từ vựng về cuộc sống hằng ngày",
    desc: "Những từ quen thuộc nhất khi kể về một ngày của bạn.",
    topicId: "doi-song",
    level: "Cơ bản",
    total: 120,
    learned: 72,
    accent: "bg-teal-600",
    words: [
      { en: "routine", ipa: "/ruːˈtiːn/", type: "n", vi: "thói quen, lịch trình hằng ngày" },
      { en: "accomplish", ipa: "/əˈkʌm.plɪʃ/", type: "v", vi: "hoàn thành, đạt được" },
      { en: "diligent", ipa: "/ˈdɪl.ɪ.dʒənt/", type: "adj", vi: "siêng năng, chăm chỉ" },
      { en: "errand", ipa: "/ˈer.ənd/", type: "n", vi: "việc vặt phải đi ra ngoài" },
      { en: "chore", ipa: "/tʃɔːr/", type: "n", vi: "việc nhà" },
      { en: "neat", ipa: "/niːt/", type: "adj", vi: "gọn gàng, ngăn nắp" },
      { en: "tidy up", ipa: "/ˈtaɪ.di ʌp/", type: "phr", vi: "dọn dẹp gọn gàng" },
      { en: "gradually", ipa: "/ˈɡrædʒ.u.ə.li/", type: "adv", vi: "dần dần" },
    ],
  },
  {
    slug: "travel-essentials",
    name: "Travel Essentials",
    vi: "Từ vựng thiết yếu cho chuyến đi",
    desc: "Hành lý, phương tiện và những từ cần biết trước khi lên đường.",
    topicId: "du-lich",
    level: "Cơ bản",
    total: 96,
    learned: 43,
    accent: "bg-blue-600",
    words: [
      { en: "itinerary", ipa: "/aɪˈtɪn.ə.rer.i/", type: "n", vi: "lịch trình chuyến đi" },
      { en: "luggage", ipa: "/ˈlʌɡ.ɪdʒ/", type: "n", vi: "hành lý" },
      { en: "board", ipa: "/bɔːrd/", type: "v", vi: "lên máy bay, lên tàu" },
      { en: "layover", ipa: "/ˈleɪ.oʊ.vər/", type: "n", vi: "thời gian quá cảnh" },
      { en: "sightseeing", ipa: "/ˈsaɪtˌsiː.ɪŋ/", type: "n", vi: "việc tham quan" },
      { en: "book a room", ipa: "/bʊk ə ruːm/", type: "phr", vi: "đặt phòng" },
      { en: "breathtaking", ipa: "/ˈbreθˌteɪ.kɪŋ/", type: "adj", vi: "đẹp đến ngỡ ngàng" },
      { en: "abroad", ipa: "/əˈbrɔːd/", type: "adv", vi: "ở nước ngoài" },
    ],
  },
  {
    slug: "airport-hotel",
    name: "Airport & Hotel",
    vi: "Ở sân bay và khách sạn",
    desc: "Check-in, đổi chuyến, nhận phòng — xử lý mọi tình huống trôi chảy.",
    topicId: "du-lich",
    level: "Trung cấp",
    total: 64,
    learned: 13,
    accent: "bg-blue-600",
    words: [
      { en: "boarding pass", ipa: "/ˈbɔːr.dɪŋ pæs/", type: "n", vi: "thẻ lên máy bay" },
      { en: "delay", ipa: "/dɪˈleɪ/", type: "v", vi: "hoãn, trì hoãn" },
      { en: "reservation", ipa: "/ˌrez.ərˈveɪ.ʃən/", type: "n", vi: "sự đặt chỗ trước" },
      { en: "deposit", ipa: "/dɪˈpɑː.zɪt/", type: "n", vi: "tiền đặt cọc" },
      { en: "vacancy", ipa: "/ˈveɪ.kən.si/", type: "n", vi: "phòng còn trống" },
      { en: "refund", ipa: "/ˈriː.fʌnd/", type: "n", vi: "tiền hoàn lại" },
      { en: "declare", ipa: "/dɪˈkler/", type: "v", vi: "khai báo (hải quan)" },
      { en: "departure gate", ipa: "/dɪˈpɑːr.tʃər ɡeɪt/", type: "n", vi: "cửa khởi hành" },
    ],
  },
  {
    slug: "office-communication",
    name: "Office Communication",
    vi: "Giao tiếp công sở",
    desc: "Từ vựng dùng trong họp, email và trao đổi với đồng nghiệp.",
    topicId: "cong-viec",
    level: "Trung cấp",
    total: 88,
    learned: 31,
    accent: "bg-orange-500",
    words: [
      { en: "deadline", ipa: "/ˈded.laɪn/", type: "n", vi: "hạn chót" },
      { en: "schedule", ipa: "/ˈskedʒ.uːl/", type: "v", vi: "lên lịch, sắp xếp" },
      { en: "colleague", ipa: "/ˈkɑː.liːɡ/", type: "n", vi: "đồng nghiệp" },
      { en: "delegate", ipa: "/ˈdel.ɪ.ɡeɪt/", type: "v", vi: "phân công, uỷ nhiệm" },
      { en: "follow up", ipa: "/ˈfɑː.loʊ ʌp/", type: "phr", vi: "theo dõi, nhắc lại" },
      { en: "brief", ipa: "/briːf/", type: "adj", vi: "ngắn gọn" },
      { en: "turnover", ipa: "/ˈtɜːr.noʊ.vər/", type: "n", vi: "doanh thu, tỉ lệ thay nhân sự" },
      { en: "on behalf of", ipa: "/ɑːn bɪˈhæf əv/", type: "prep", vi: "thay mặt cho" },
    ],
  },
  {
    slug: "job-interview",
    name: "Job Interview",
    vi: "Phỏng vấn xin việc",
    desc: "Từ vựng giúp bạn tự tin trả lời mọi câu hỏi của nhà tuyển dụng.",
    topicId: "cong-viec",
    level: "Nâng cao",
    total: 60,
    learned: 9,
    accent: "bg-orange-500",
    words: [
      { en: "strength", ipa: "/streŋθ/", type: "n", vi: "điểm mạnh" },
      { en: "weakness", ipa: "/ˈwiːk.nəs/", type: "n", vi: "điểm yếu" },
      { en: "qualification", ipa: "/ˌkwɑː.lɪ.fɪˈkeɪ.ʃən/", type: "n", vi: "trình độ, bằng cấp" },
      { en: "negotiate", ipa: "/nɪˈɡoʊ.ʃi.eɪt/", type: "v", vi: "thương lượng, đàm phán" },
      { en: "prospective", ipa: "/prəˈspek.tɪv/", type: "adj", vi: "tiềm năng, dự kiến" },
      { en: "shortlist", ipa: "/ˈʃɔːrt.lɪst/", type: "v", vi: "đưa vào danh sách rút gọn" },
      { en: "proactive", ipa: "/proʊˈæk.tɪv/", type: "adj", vi: "chủ động" },
      { en: "track record", ipa: "/træk ˈrek.ərd/", type: "n", vi: "thành tích đã đạt được" },
    ],
  },
  {
    slug: "study-skills",
    name: "Study Skills",
    vi: "Học tập và trường học",
    desc: "Từ vựng về lớp học, bài kiểm tra và phương pháp học hiệu quả.",
    topicId: "hoc-tap",
    level: "Cơ bản",
    total: 72,
    learned: 36,
    accent: "bg-purple-600",
    words: [
      { en: "assignment", ipa: "/əˈsaɪn.mənt/", type: "n", vi: "bài tập, bài luận" },
      { en: "curriculum", ipa: "/kəˈrɪk.jə.ləm/", type: "n", vi: "chương trình học" },
      { en: "revise", ipa: "/rɪˈvaɪz/", type: "v", vi: "ôn tập lại" },
      { en: "memorize", ipa: "/ˈmem.ə.raɪz/", type: "v", vi: "học thuộc lòng" },
      { en: "fluent", ipa: "/ˈfluː.ənt/", type: "adj", vi: "trôi chảy" },
      { en: "take notes", ipa: "/teɪk noʊts/", type: "phr", vi: "ghi chép" },
      { en: "shy", ipa: "/ʃaɪ/", type: "adj", vi: "rụt rè, nhút nhát" },
      { en: "confidence", ipa: "/ˈkɑːn.fə.dəns/", type: "n", vi: "sự tự tin" },
    ],
  },
  {
    slug: "food-drinks",
    name: "Food & Drinks",
    vi: "Ẩm thực và đồ uống",
    desc: "Gọi món, nhận xét mùi vị và nấu nướng bằng tiếng Anh.",
    topicId: "am-thuc",
    level: "Cơ bản",
    total: 84,
    learned: 21,
    accent: "bg-green-600",
    words: [
      { en: "cuisine", ipa: "/kwɪˈziːn/", type: "n", vi: "ẩm thực, cách nấu ăn" },
      { en: "craving", ipa: "/ˈkreɪ.vɪŋ/", type: "n", vi: "cơn thèm ăn" },
      { en: "savory", ipa: "/ˈseɪ.vər.i/", type: "adj", vi: "mặn, đậm đà" },
      { en: "tender", ipa: "/ˈten.dər/", type: "adj", vi: "mềm (thịt)" },
      { en: "portion", ipa: "/ˈpɔːr.ʃən/", type: "n", vi: "khẩu phần ăn" },
      { en: "recipe", ipa: "/ˈres.ə.pi/", type: "n", vi: "công thức nấu ăn" },
      { en: "sip", ipa: "/sɪp/", type: "v", vi: "nhấp từng ngụm" },
      { en: "takeaway", ipa: "/ˈteɪk.ə.weɪ/", type: "n", vi: "món ăn mang đi" },
    ],
  },
  {
    slug: "health-body",
    name: "Health & Body",
    vi: "Sức khỏe và cơ thể",
    desc: "Mô tả triệu chứng, thói quen sống khỏe mỗi ngày.",
    topicId: "suc-khoe",
    level: "Trung cấp",
    total: 68,
    learned: 7,
    accent: "bg-pink-500",
    words: [
      { en: "symptom", ipa: "/ˈsɪmp.təm/", type: "n", vi: "triệu chứng" },
      { en: "stamina", ipa: "/ˈstæm.ɪ.nə/", type: "n", vi: "sức bền, sức chịu đựng" },
      { en: "dizzy", ipa: "/ˈdɪz.i/", type: "adj", vi: "chóng mặt" },
      { en: "recover", ipa: "/rɪˈkʌv.ər/", type: "v", vi: "hồi phục" },
      { en: "immune system", ipa: "/ɪˈmjuːn ˈsɪs.təm/", type: "n", vi: "hệ miễn dịch" },
      { en: "check-up", ipa: "/ˈtʃek.ʌp/", type: "n", vi: "lần khám sức khỏe định kỳ" },
      { en: "prevent", ipa: "/prɪˈvent/", type: "v", vi: "phòng ngừa" },
      { en: "balanced diet", ipa: "/ˈbæl.ənst ˈdaɪ.ət/", type: "n", vi: "chế độ ăn cân bằng" },
    ],
  },
  {
    slug: "family-relationships",
    name: "Family & Friends",
    vi: "Gia đình và bạn bè",
    desc: "Từ vựng nói về người thân, tình bạn và các mối quan hệ.",
    topicId: "gia-dinh",
    level: "Cơ bản",
    total: 56,
    learned: 39,
    accent: "bg-sky-500",
    words: [
      { en: "sibling", ipa: "/ˈsɪb.lɪŋ/", type: "n", vi: "anh chị em ruột" },
      { en: "milestone", ipa: "/ˈmaɪl.stoʊn/", type: "n", vi: "cột mốc quan trọng" },
      { en: "bond", ipa: "/bɑːnd/", type: "n", vi: "sự gắn kết" },
      { en: "cherish", ipa: "/ˈtʃer.ɪʃ/", type: "v", vi: "trân trọng, nâng niu" },
      { en: "supportive", ipa: "/səˈpɔːr.tɪv/", type: "adj", vi: "hay giúp đỡ, ủng hộ" },
      { en: "reunion", ipa: "/riːˈjuː.njən/", type: "n", vi: "cuộc đoàn tụ, họp mặt" },
      { en: "trustworthy", ipa: "/ˈtrʌstˌwɜːr.ði/", type: "adj", vi: "đáng tin cậy" },
      { en: "look up to", ipa: "/lʊk ʌp tuː/", type: "phr", vi: "ngưỡng mộ, coi trọng ai" },
    ],
  },
  {
    slug: "ielts-advanced",
    name: "Advanced Words",
    vi: "Từ vựng nâng cao cho IELTS",
    desc: "Từ học thuật và cụm từ giúp bài viết, bài nói lên band cao.",
    topicId: "hoc-tap",
    level: "Nâng cao",
    total: 150,
    learned: 8,
    accent: "bg-purple-600",
    words: [
      { en: "phenomenon", ipa: "/fəˈnɑː.mə.nən/", type: "n", vi: "hiện tượng" },
      { en: "inevitable", ipa: "/ɪˈnev.ɪ.tə.bəl/", type: "adj", vi: "không thể tránh khỏi" },
      { en: "sustainable", ipa: "/səˈsteɪ.nə.bəl/", type: "adj", vi: "bền vững" },
      { en: "controversy", ipa: "/ˈkɑːn.trə.vɝː.si/", type: "n", vi: "tranh cãi" },
      { en: "alleviate", ipa: "/əˈliː.vi.eɪt/", type: "v", vi: "làm giảm nhẹ" },
      { en: "precedent", ipa: "/ˈpres.ə.dənt/", type: "n", vi: "tiền lệ" },
      { en: "drastically", ipa: "/ˈdræs.tɪ.kəl.i/", type: "adv", vi: "một cách mạnh mẽ" },
      { en: "come to terms with", ipa: "/kʌm tuː tɜːrmz wɪð/", type: "phr", vi: "chấp nhận, thích nghi với" },
    ],
  },
]