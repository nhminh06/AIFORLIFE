/**
 * Script đẩy toàn bộ bộ mẫu câu (phraseSets) từ lib/data/phrases.ts
 * lên Firestore — collection "phraseSets", mỗi bộ 1 document với id = slug.
 *
 * Cách chạy:  pnpm push:phrases
 * (Node đọc cấu hình Firebase từ .env.local — các biến NEXT_PUBLIC_FIREBASE_*)
 */
import fs from "node:fs"
import path from "node:path"
import url from "node:url"
import { createRequire } from "node:module"
import ts from "typescript"

const require = createRequire(import.meta.url)

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")

/* ---------------------------------------------------------------- */
/* 1. Đọc biến môi trường từ .env.local                              */
/* ---------------------------------------------------------------- */
function loadEnvFile(file) {
  if (!fs.existsSync(file)) return {}
  const env = {}
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith("#")) continue
    const eq = line.indexOf("=")
    if (eq === -1) continue
    env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "")
  }
  return env
}

const env = {
  ...loadEnvFile(path.join(root, ".env")),
  ...loadEnvFile(path.join(root, ".env.local")),
}

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("✗ Thiếu NEXT_PUBLIC_FIREBASE_API_KEY / NEXT_PUBLIC_FIREBASE_PROJECT_ID trong .env.local")
  process.exit(1)
}

/* ---------------------------------------------------------------- */
/* 2. Transpile lib/data/phrases.ts → import được trong Node         */
/* ---------------------------------------------------------------- */
function importPhraseSets() {
  const source = fs.readFileSync(path.join(root, "lib", "data", "phrases.ts"), "utf8")
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  })
  const tmpFile = path.join(root, "scripts", ".phrases.tmp.cjs")
  fs.writeFileSync(tmpFile, outputText)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(tmpFile)
    return mod.phraseSets
  } finally {
    fs.rmSync(tmpFile, { force: true })
  }
}

const phraseSets = importPhraseSets()
if (!Array.isArray(phraseSets) || phraseSets.length === 0) {
  console.error("✗ Không đọc được phraseSets từ lib/data/phrases.ts")
  process.exit(1)
}
console.log(`✓ Đọc được ${phraseSets.length} bộ mẫu câu từ lib/data/phrases.ts`)

/* ---------------------------------------------------------------- */
/* 3. Khởi tạo Firebase client SDK + đẩy lên Firestore               */
/* ---------------------------------------------------------------- */
const { initializeApp } = await import("firebase/app")
const { getFirestore, doc, setDoc, collection, getDocs } = await import("firebase/firestore")

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

console.log(`\n→ Đang đẩy lên Firestore project "${firebaseConfig.projectId}" (collection: phraseSets)…`)

let pushed = 0
for (const set of phraseSets) {
  await setDoc(doc(db, "phraseSets", set.slug), {
    slug: set.slug,
    name: set.name,
    vi: set.vi,
    desc: set.desc,
    situationId: set.situationId,
    level: set.level,
    total: set.total,
    learned: set.learned,
    accent: set.accent,
    items: set.items,
  })
  pushed++
  console.log(`  ✓ ${set.slug} (${set.items.length} câu)`)
}

/* Đọc lại để kiểm chứng */
const snapshot = await getDocs(collection(db, "phraseSets"))
console.log(`\n✓ Hoàn tất! Đã đẩy ${pushed}/${phraseSets.length} bộ. Firestore hiện có ${snapshot.size} bộ mẫu câu.`)
process.exit(0)
