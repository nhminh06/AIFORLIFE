/**
 * Seed script — đẩy 9 bộ từ vựng mặc định lên Firestore.
 *
 * Cách chạy:
 *   npx tsx scripts/seed-vocab.ts
 *
 * Script này sử dụng Firebase Admin SDK–free approach:
 * dùng firebase client SDK với env vars từ .env.local
 */

import { initializeApp } from "firebase/app"
import {
  getFirestore,
  doc,
  setDoc,
  collection,
} from "firebase/firestore"
import * as dotenv from "dotenv"
import * as path from "path"

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Kiểm tra config
if (!firebaseConfig.projectId) {
  console.error("❌ Thiếu NEXT_PUBLIC_FIREBASE_PROJECT_ID trong .env.local")
  process.exit(1)
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

/* ------------------------------------------------------------------ */
/*  9 bộ từ vựng mặc định (không chứa icon / class — chỉ data thuần) */
/* ------------------------------------------------------------------ */

type VocabWord = {
  en: string
  ipa: string
  type: "n" | "v" | "adj" | "adv" | "prep" | "phr"
  vi: string
}

type VocabSetData = {
  slug: string
  name: string
  vi: string
  desc: string
  topicId: string
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
  total: number
  accent: string
  words: VocabWord[]
}

const vocabSetsData: VocabSetData[] = [
  {
    slug: "daily-life",
    name: "Daily Life",
    vi: "Từ vựng về cuộc sống hằng ngày",
    desc: "Những từ quen thuộc nhất khi kể về một ngày của bạn.",
    topicId: "doi-song",
    level: "A2",
    total: 20,
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
      { en: "household", ipa: "/ˈhaʊs.hoʊld/", type: "n", vi: "hộ gia đình" },
      { en: "commute", ipa: "/kəˈmjuːt/", type: "v", vi: "đi lại hằng ngày (đi làm/học)" },
      { en: "convenient", ipa: "/kənˈviː.ni.ənt/", type: "adj", vi: "thuận tiện, tiện lợi" },
      { en: "habit", ipa: "/ˈhæb.ɪt/", type: "n", vi: "thói quen" },
      { en: "organize", ipa: "/ˈɔːr.ɡə.naɪz/", type: "v", vi: "sắp xếp, tổ chức" },
      { en: "budget", ipa: "/ˈbʌdʒ.ɪt/", type: "n", vi: "ngân sách" },
      { en: "neighborhood", ipa: "/ˈneɪ.bər.hʊd/", type: "n", vi: "khu phố, vùng lân cận" },
      { en: "appointment", ipa: "/əˈpɔɪnt.mənt/", type: "n", vi: "cuộc hẹn" },
      { en: "efficient", ipa: "/ɪˈfɪʃ.ənt/", type: "adj", vi: "hiệu quả" },
      { en: "laundry", ipa: "/ˈlɑːn.dri/", type: "n", vi: "quần áo cần giặt, việc giặt đồ" },
      { en: "groceries", ipa: "/ˈɡroʊ.sər.iz/", type: "n", vi: "thực phẩm, hàng tạp hóa" },
      { en: "oversleep", ipa: "/ˌoʊ.vərˈsliːp/", type: "v", vi: "ngủ quên, ngủ nướng" },
    ],
  },
  {
    slug: "travel-essentials",
    name: "Travel Essentials",
    vi: "Từ vựng thiết yếu cho chuyến đi",
    desc: "Hành lý, phương tiện và những từ cần biết trước khi lên đường.",
    topicId: "du-lich",
    level: "A2",
    total: 20,
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
      { en: "destination", ipa: "/ˌdes.tɪˈneɪ.ʃən/", type: "n", vi: "điểm đến" },
      { en: "passport", ipa: "/ˈpæs.pɔːrt/", type: "n", vi: "hộ chiếu" },
      { en: "currency", ipa: "/ˈkɝː.ən.si/", type: "n", vi: "tiền tệ" },
      { en: "souvenir", ipa: "/ˌsuː.vəˈnɪr/", type: "n", vi: "quà lưu niệm" },
      { en: "explore", ipa: "/ɪkˈsplɔːr/", type: "v", vi: "khám phá" },
      { en: "accommodation", ipa: "/əˌkɑː.məˈdeɪ.ʃən/", type: "n", vi: "chỗ ở, nơi lưu trú" },
      { en: "round trip", ipa: "/raʊnd trɪp/", type: "n", vi: "chuyến đi khứ hồi" },
      { en: "departure", ipa: "/dɪˈpɑːr.tʃər/", type: "n", vi: "sự khởi hành" },
      { en: "arrival", ipa: "/əˈraɪ.vəl/", type: "n", vi: "sự đến nơi" },
      { en: "landmark", ipa: "/ˈlænd.mɑːrk/", type: "n", vi: "địa danh nổi tiếng" },
      { en: "backpacker", ipa: "/ˈbæk.pæk.ər/", type: "n", vi: "người du lịch bụi" },
      { en: "jet lag", ipa: "/ˈdʒet læɡ/", type: "n", vi: "lệch múi giờ" },
    ],
  },
  {
    slug: "office-communication",
    name: "Office Communication",
    vi: "Giao tiếp công sở",
    desc: "Từ vựng dùng trong họp, email và trao đổi với đồng nghiệp.",
    topicId: "cong-viec",
    level: "B1",
    total: 20,
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
      { en: "agenda", ipa: "/əˈdʒen.də/", type: "n", vi: "chương trình nghị sự" },
      { en: "collaborate", ipa: "/kəˈlæb.ə.reɪt/", type: "v", vi: "hợp tác, cộng tác" },
      { en: "feedback", ipa: "/ˈfiːd.bæk/", type: "n", vi: "phản hồi, nhận xét" },
      { en: "proposal", ipa: "/prəˈpoʊ.zəl/", type: "n", vi: "đề xuất, đề án" },
      { en: "implement", ipa: "/ˈɪm.plə.ment/", type: "v", vi: "triển khai, thực hiện" },
      { en: "productive", ipa: "/prəˈdʌk.tɪv/", type: "adj", vi: "năng suất, hiệu quả" },
      { en: "prioritize", ipa: "/praɪˈɔːr.ə.taɪz/", type: "v", vi: "ưu tiên" },
      { en: "promote", ipa: "/prəˈmoʊt/", type: "v", vi: "thăng chức, quảng bá" },
      { en: "resign", ipa: "/rɪˈzaɪn/", type: "v", vi: "từ chức" },
      { en: "overtime", ipa: "/ˈoʊ.vər.taɪm/", type: "n", vi: "giờ làm thêm" },
      { en: "salary", ipa: "/ˈsæl.ər.i/", type: "n", vi: "lương tháng" },
      { en: "responsibility", ipa: "/rɪˌspɑːn.səˈbɪl.ə.ti/", type: "n", vi: "trách nhiệm" },
    ],
  },
  {
    slug: "study-skills",
    name: "Study Skills",
    vi: "Học tập và trường học",
    desc: "Từ vựng về lớp học, bài kiểm tra và phương pháp học hiệu quả.",
    topicId: "hoc-tap",
    level: "A2",
    total: 20,
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
      { en: "scholarship", ipa: "/ˈskɑː.lər.ʃɪp/", type: "n", vi: "học bổng" },
      { en: "concentrate", ipa: "/ˈkɑːn.sən.treɪt/", type: "v", vi: "tập trung" },
      { en: "deadline", ipa: "/ˈded.laɪn/", type: "n", vi: "hạn nộp bài" },
      { en: "presentation", ipa: "/ˌprez.ənˈteɪ.ʃən/", type: "n", vi: "bài thuyết trình" },
      { en: "research", ipa: "/rɪˈsɜːrtʃ/", type: "n", vi: "nghiên cứu" },
      { en: "semester", ipa: "/sɪˈmes.tər/", type: "n", vi: "học kỳ" },
      { en: "tutor", ipa: "/ˈtuː.tər/", type: "n", vi: "gia sư" },
      { en: "lecture", ipa: "/ˈlek.tʃər/", type: "n", vi: "bài giảng" },
      { en: "graduate", ipa: "/ˈɡrædʒ.u.eɪt/", type: "v", vi: "tốt nghiệp" },
      { en: "major", ipa: "/ˈmeɪ.dʒər/", type: "n", vi: "chuyên ngành" },
      { en: "summarize", ipa: "/ˈsʌm.ə.raɪz/", type: "v", vi: "tóm tắt" },
      { en: "brainstorm", ipa: "/ˈbreɪn.stɔːrm/", type: "v", vi: "động não, tìm ý tưởng" },
    ],
  },
  {
    slug: "food-drinks",
    name: "Food & Drinks",
    vi: "Ẩm thực và đồ uống",
    desc: "Gọi món, nhận xét mùi vị và nấu nướng bằng tiếng Anh.",
    topicId: "am-thuc",
    level: "A2",
    total: 20,
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
      { en: "appetizer", ipa: "/ˈæp.ə.taɪ.zər/", type: "n", vi: "món khai vị" },
      { en: "beverage", ipa: "/ˈbev.ər.ɪdʒ/", type: "n", vi: "đồ uống" },
      { en: "ingredient", ipa: "/ɪnˈɡriː.di.ənt/", type: "n", vi: "nguyên liệu" },
      { en: "spicy", ipa: "/ˈspaɪ.si/", type: "adj", vi: "cay" },
      { en: "bland", ipa: "/blænd/", type: "adj", vi: "nhạt, vô vị" },
      { en: "stir-fry", ipa: "/ˈstɜːr.fraɪ/", type: "v", vi: "xào" },
      { en: "marinate", ipa: "/ˈmær.ɪ.neɪt/", type: "v", vi: "ướp (gia vị)" },
      { en: "dessert", ipa: "/dɪˈzɜːrt/", type: "n", vi: "món tráng miệng" },
      { en: "vegetarian", ipa: "/ˌvedʒ.əˈter.i.ən/", type: "n", vi: "người ăn chay" },
      { en: "delicious", ipa: "/dɪˈlɪʃ.əs/", type: "adj", vi: "ngon" },
      { en: "serve", ipa: "/sɜːrv/", type: "v", vi: "phục vụ, dọn ra" },
      { en: "feast", ipa: "/fiːst/", type: "n", vi: "bữa tiệc lớn" },
    ],
  },
  {
    slug: "health-body",
    name: "Health & Body",
    vi: "Sức khỏe và cơ thể",
    desc: "Mô tả triệu chứng, thói quen sống khỏe mỗi ngày.",
    topicId: "suc-khoe",
    level: "B1",
    total: 20,
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
      { en: "prescription", ipa: "/prɪˈskrɪp.ʃən/", type: "n", vi: "đơn thuốc" },
      { en: "allergy", ipa: "/ˈæl.ər.dʒi/", type: "n", vi: "dị ứng" },
      { en: "workout", ipa: "/ˈwɜːrk.aʊt/", type: "n", vi: "buổi tập thể dục" },
      { en: "nutrition", ipa: "/nuːˈtrɪʃ.ən/", type: "n", vi: "dinh dưỡng" },
      { en: "injury", ipa: "/ˈɪn.dʒər.i/", type: "n", vi: "chấn thương" },
      { en: "sore", ipa: "/sɔːr/", type: "adj", vi: "đau nhức" },
      { en: "contagious", ipa: "/kənˈteɪ.dʒəs/", type: "adj", vi: "hay lây, truyền nhiễm" },
      { en: "remedy", ipa: "/ˈrem.ə.di/", type: "n", vi: "phương thuốc, cách chữa" },
      { en: "hygiene", ipa: "/ˈhaɪ.dʒiːn/", type: "n", vi: "vệ sinh" },
      { en: "fatigue", ipa: "/fəˈtiːɡ/", type: "n", vi: "sự mệt mỏi" },
      { en: "diagnose", ipa: "/ˈdaɪ.əɡ.noʊz/", type: "v", vi: "chẩn đoán" },
      { en: "well-being", ipa: "/ˌwel ˈbiː.ɪŋ/", type: "n", vi: "sự khỏe mạnh, hạnh phúc" },
    ],
  },
  {
    slug: "family-relationships",
    name: "Family & Friends",
    vi: "Gia đình và bạn bè",
    desc: "Từ vựng nói về người thân, tình bạn và các mối quan hệ.",
    topicId: "gia-dinh",
    level: "A2",
    total: 20,
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
      { en: "ancestor", ipa: "/ˈæn.ses.tər/", type: "n", vi: "tổ tiên, ông bà" },
      { en: "upbringing", ipa: "/ˈʌp.brɪŋ.ɪŋ/", type: "n", vi: "sự nuôi dạy" },
      { en: "relative", ipa: "/ˈrel.ə.tɪv/", type: "n", vi: "họ hàng, người thân" },
      { en: "nurture", ipa: "/ˈnɜːr.tʃər/", type: "v", vi: "nuôi dưỡng, chăm sóc" },
      { en: "loyalty", ipa: "/ˈlɔɪ.əl.ti/", type: "n", vi: "lòng trung thành" },
      { en: "generation", ipa: "/ˌdʒen.əˈreɪ.ʃən/", type: "n", vi: "thế hệ" },
      { en: "companion", ipa: "/kəmˈpæn.jən/", type: "n", vi: "bạn đồng hành" },
      { en: "mutual", ipa: "/ˈmjuː.tʃu.əl/", type: "adj", vi: "chung, lẫn nhau" },
      { en: "respect", ipa: "/rɪˈspekt/", type: "n", vi: "sự tôn trọng" },
      { en: "get along", ipa: "/ɡet əˈlɔːŋ/", type: "phr", vi: "hòa thuận, hợp nhau" },
      { en: "childhood", ipa: "/ˈtʃaɪld.hʊd/", type: "n", vi: "thời thơ ấu" },
      { en: "inheritance", ipa: "/ɪnˈher.ɪ.təns/", type: "n", vi: "tài sản thừa kế" },
    ],
  },
  {
    slug: "technology-basics",
    name: "Technology Basics",
    vi: "Công nghệ cơ bản",
    desc: "Từ vựng về máy tính, điện thoại, internet và thế giới số.",
    topicId: "cong-nghe",
    level: "B1",
    total: 20,
    accent: "bg-indigo-600",
    words: [
      { en: "device", ipa: "/dɪˈvaɪs/", type: "n", vi: "thiết bị" },
      { en: "software", ipa: "/ˈsɑːft.wer/", type: "n", vi: "phần mềm" },
      { en: "hardware", ipa: "/ˈhɑːrd.wer/", type: "n", vi: "phần cứng" },
      { en: "update", ipa: "/ʌpˈdeɪt/", type: "v", vi: "cập nhật" },
      { en: "download", ipa: "/ˈdaʊn.loʊd/", type: "v", vi: "tải xuống" },
      { en: "upload", ipa: "/ʌpˈloʊd/", type: "v", vi: "tải lên" },
      { en: "password", ipa: "/ˈpæs.wɜːrd/", type: "n", vi: "mật khẩu" },
      { en: "network", ipa: "/ˈnet.wɜːrk/", type: "n", vi: "mạng lưới" },
      { en: "storage", ipa: "/ˈstɔːr.ɪdʒ/", type: "n", vi: "bộ nhớ, lưu trữ" },
      { en: "browser", ipa: "/ˈbraʊ.zər/", type: "n", vi: "trình duyệt web" },
      { en: "application", ipa: "/ˌæp.lɪˈkeɪ.ʃən/", type: "n", vi: "ứng dụng" },
      { en: "backup", ipa: "/ˈbæk.ʌp/", type: "n", vi: "bản sao lưu" },
      { en: "crash", ipa: "/kræʃ/", type: "v", vi: "sập, treo (máy)" },
      { en: "encrypt", ipa: "/ɪnˈkrɪpt/", type: "v", vi: "mã hóa" },
      { en: "artificial intelligence", ipa: "/ˌɑːr.tɪˈfɪʃ.əl ɪnˈtel.ɪ.dʒəns/", type: "n", vi: "trí tuệ nhân tạo (AI)" },
      { en: "algorithm", ipa: "/ˈæl.ɡə.rɪ.ðəm/", type: "n", vi: "thuật toán" },
      { en: "database", ipa: "/ˈdeɪ.tə.beɪs/", type: "n", vi: "cơ sở dữ liệu" },
      { en: "cybersecurity", ipa: "/ˌsaɪ.bər.sɪˈkjʊr.ə.ti/", type: "n", vi: "an ninh mạng" },
      { en: "compatible", ipa: "/kəmˈpæt.ə.bəl/", type: "adj", vi: "tương thích" },
      { en: "troubleshoot", ipa: "/ˈtrʌb.əl.ʃuːt/", type: "v", vi: "khắc phục sự cố" },
    ],
  },
  {
    slug: "entertainment",
    name: "Entertainment",
    vi: "Giải trí và sở thích",
    desc: "Phim ảnh, âm nhạc, thể thao và những hoạt động giải trí yêu thích.",
    topicId: "giai-tri",
    level: "A2",
    total: 20,
    accent: "bg-rose-500",
    words: [
      { en: "genre", ipa: "/ˈʒɑːn.rə/", type: "n", vi: "thể loại (phim, nhạc)" },
      { en: "binge-watch", ipa: "/ˈbɪndʒ wɑːtʃ/", type: "v", vi: "xem liền mạch nhiều tập" },
      { en: "soundtrack", ipa: "/ˈsaʊnd.træk/", type: "n", vi: "nhạc phim" },
      { en: "performance", ipa: "/pərˈfɔːr.məns/", type: "n", vi: "buổi biểu diễn" },
      { en: "audience", ipa: "/ˈɑː.di.əns/", type: "n", vi: "khán giả" },
      { en: "rehearse", ipa: "/rɪˈhɜːrs/", type: "v", vi: "tập dượt, diễn tập" },
      { en: "lyrics", ipa: "/ˈlɪr.ɪks/", type: "n", vi: "lời bài hát" },
      { en: "plot", ipa: "/plɑːt/", type: "n", vi: "cốt truyện" },
      { en: "hobby", ipa: "/ˈhɑː.bi/", type: "n", vi: "sở thích" },
      { en: "tournament", ipa: "/ˈtʊr.nə.mənt/", type: "n", vi: "giải đấu" },
      { en: "celebrity", ipa: "/səˈleb.rə.ti/", type: "n", vi: "người nổi tiếng" },
      { en: "streaming", ipa: "/ˈstriː.mɪŋ/", type: "n", vi: "phát trực tuyến" },
      { en: "review", ipa: "/rɪˈvjuː/", type: "n", vi: "bài đánh giá" },
      { en: "entertaining", ipa: "/ˌen.tərˈteɪ.nɪŋ/", type: "adj", vi: "giải trí, thú vị" },
      { en: "fiction", ipa: "/ˈfɪk.ʃən/", type: "n", vi: "tiểu thuyết, truyện hư cấu" },
      { en: "documentary", ipa: "/ˌdɑː.kjəˈmen.tər.i/", type: "n", vi: "phim tài liệu" },
      { en: "release", ipa: "/rɪˈliːs/", type: "v", vi: "phát hành, ra mắt" },
      { en: "fan", ipa: "/fæn/", type: "n", vi: "người hâm mộ" },
      { en: "blockbuster", ipa: "/ˈblɑːk.bʌs.tər/", type: "n", vi: "phim bom tấn" },
      { en: "pastime", ipa: "/ˈpæs.taɪm/", type: "n", vi: "trò tiêu khiển, thú vui" },
    ],
  },
]

/* ------------------------------------------------------------------ */
/*  Seed function                                                     */
/* ------------------------------------------------------------------ */

async function seed() {
  console.log("🚀 Bắt đầu seed 9 bộ từ vựng vào Firestore...\n")

  const colRef = collection(db, "vocabSets")

  for (const setData of vocabSetsData) {
    const docRef = doc(colRef, setData.slug)
    await setDoc(docRef, {
      ...setData,
      createdAt: new Date().toISOString(),
    })
    console.log(`  ✅ ${setData.slug} — ${setData.words.length} từ`)
  }

  console.log(`\n🎉 Hoàn tất! Đã seed ${vocabSetsData.length} bộ từ vựng.`)
  process.exit(0)
}

seed().catch((err) => {
  console.error("❌ Lỗi khi seed:", err)
  process.exit(1)
})
