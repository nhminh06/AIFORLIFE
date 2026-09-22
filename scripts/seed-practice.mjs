import { initializeApp } from "firebase/app"
import { getFirestore, doc, setDoc } from "firebase/firestore"
import dotenv from "dotenv"
import path from "node:path"

// Seed 9 bai luyen mac dinh cho trang /luyen-tap.
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

if (!config.projectId) throw new Error("Thieu NEXT_PUBLIC_FIREBASE_PROJECT_ID trong .env.local")

const app = initializeApp(config)
const db = getFirestore(app)

const choice = (prompt, options, correctIndex) => ({ kind: "choice", prompt, options, correctIndex })
const fill = (prompt, answer, hint) => ({ kind: "fill", prompt, answer, hint })
const listen = (prompt, options, correctIndex) => ({ kind: "listen", prompt, options, correctIndex })
const order = (sentence, words) => ({ kind: "order", sentence, words })

const exercises = [
  {
    id: "present-simple-quiz", name: "Present Simple Basics", vi: "Hiện tại đơn - cơ bản", desc: "Ôn công thức và dấu hiệu thì hiện tại đơn.", typeId: "trac-nghiem", minutes: 10, status: "Chưa làm",
    items: [choice("She ___ to work every day.", ["go", "goes", "going", "gone"], 1), choice("They ___ coffee in the morning.", ["drinks", "drink", "drinking", "drank"], 1), choice("___ he live in Hanoi?", ["Do", "Does", "Is", "Has"], 1), choice("Water ___ at 100 degrees.", ["boil", "boils", "boiling", "boiled"], 1)],
  },
  {
    id: "past-simple-quiz", name: "Past Simple Practice", vi: "Quá khứ đơn - thực hành", desc: "Kể lại sự việc đã xảy ra trong quá khứ.", typeId: "trac-nghiem", minutes: 8, status: "Chưa làm",
    items: [choice("We ___ to Hue last summer.", ["go", "went", "gone", "going"], 1), choice("She ___ her homework yesterday.", ["didn't finished", "didn't finish", "doesn't finish", "not finished"], 1), choice("___ you see the match?", ["Did", "Do", "Does", "Have"], 0), choice("They ___ a new house in 2020.", ["buy", "buys", "bought", "buying"], 2)],
  },
  {
    id: "mixed-tenses-quiz", name: "Mixed Tenses", vi: "Tổng hợp các thì", desc: "Phân biệt các thì trong cùng một bài.", typeId: "trac-nghiem", minutes: 10, status: "Chưa làm",
    items: [choice("Look! The baby ___.", ["sleeps", "is sleeping", "slept", "sleep"], 1), choice("I ___ my keys.", ["lose", "lost", "have lost", "am losing"], 2), choice("If it rains, we ___ at home.", ["stay", "will stay", "stayed", "staying"], 1), choice("He ___ here since 2018.", ["lives", "has lived", "lived", "is living"], 1)],
  },
  {
    id: "daily-vocab-fill", name: "Fill the Missing Word", vi: "Điền từ vựng đời sống", desc: "Điền từ phù hợp vào câu giao tiếp.", typeId: "dien-tu", minutes: 7, status: "Chưa làm",
    items: [fill("My morning ___ starts at 6 a.m.", "routine", "thói quen"), fill("Please give me your boarding ___.", "pass", "thẻ"), fill("Keep your room ___ and clean.", "neat", "gọn gàng"), fill("I have to run some ___ this afternoon.", "errands", "việc vặt")],
  },
  {
    id: "work-vocab-fill", name: "Work Words in Context", vi: "Từ vựng công sở", desc: "Điền từ đúng vào ngữ cảnh công việc.", typeId: "dien-tu", minutes: 8, status: "Chưa làm",
    items: [fill("The project ___ is Friday.", "deadline", "hạn chót"), fill("Please ___ up with the client.", "follow", "follow ___"), fill("She will ___ the tasks to the team.", "delegate", "phân công"), fill("Let's ___ a meeting.", "schedule", "lên lịch")],
  },
  {
    id: "travel-listening", name: "Listen: At the Airport", vi: "Nghe: ở sân bay", desc: "Nghe phát âm rồi chọn nghĩa đúng.", typeId: "nghe-chon", minutes: 6, status: "Chưa làm",
    items: [listen("boarding pass", ["thẻ lên máy bay", "hành lý ký gửi", "cửa khởi hành", "vé khứ hồi"], 0), listen("luggage", ["hộ chiếu", "hành lý", "lịch trình", "khách sạn"], 1), listen("layover", ["chuyến bay thẳng", "thời gian quá cảnh", "giờ cất cánh", "sân bay đến"], 1), listen("refund", ["tiền đặt cọc", "tiền tip", "tiền hoàn lại", "tiền phạt"], 2)],
  },
  {
    id: "restaurant-listening", name: "Listen: Ordering Food", vi: "Nghe: gọi món ăn", desc: "Nghe mẫu câu trong nhà hàng.", typeId: "nghe-chon", minutes: 6, status: "Chưa làm",
    items: [listen("A table for two, please.", ["Cho mình bàn hai người.", "Cho mình thực đơn.", "Tính tiền giúp mình.", "Món này ngon quá."], 0), listen("Could we have the bill, please?", ["Món ăn rất ngon.", "Cho mình thêm nước.", "Cho mình xin hóa đơn.", "Mình muốn đặt bàn."], 2), listen("What do you recommend?", ["Bạn ăn món gì?", "Bạn gợi ý món nào?", "Món này bao nhiêu?", "Mình ăn chay."], 1), listen("Keep the change.", ["Giữ chỗ giúp mình.", "Không cần thối lại.", "Đổi món khác.", "Thêm đá giúp mình."], 1)],
  },
  {
    id: "greetings-order", name: "Build Greetings", vi: "Ghép câu chào hỏi", desc: "Sắp xếp từ thành câu hoàn chỉnh.", typeId: "sap-xep-cau", minutes: 5, status: "Chưa làm",
    items: [order("Nice to meet you", ["you", "meet", "to", "Nice"]), order("Where are you from", ["from", "you", "are", "Where"]), order("I hope we can meet again soon", ["again", "meet", "I", "soon", "we", "can", "hope"]), order("What do you do for a living", ["a", "do", "What", "living", "you", "do", "for"])],
  },
  {
    id: "directions-order", name: "Build Direction Sentences", vi: "Ghép câu chỉ đường", desc: "Ghép từ thành câu chỉ đường chính xác.", typeId: "sap-xep-cau", minutes: 5, status: "Chưa làm",
    items: [order("Go straight ahead then turn left", ["left", "ahead", "straight", "then", "turn", "Go"]), order("Is it far from here", ["from", "far", "it", "here", "Is"]), order("How do I get to the station", ["the", "How", "get", "I", "to", "do", "station"]), order("It is about a ten minute walk", ["ten", "minute", "about", "a", "is", "It", "walk"])],
  },
]

for (const exercise of exercises) {
  await setDoc(doc(db, "practiceExercises", exercise.id), exercise)
  console.log(`Da seed: ${exercise.id}`)
}

console.log(`Hoan tat ${exercises.length} bai vao collection practiceExercises.`)
