import { NextResponse } from "next/server"
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"
import type { MistakeRecord } from "@/lib/ai/mistake-tracker"

export const runtime = "nodejs"

function mistakeDocRef(uid: string) {
  return doc(db, "users", uid, "mistakes", "records")
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      uid?: string
      mistakes?: MistakeRecord[]
    }
    const uid = body.uid?.trim()
    const incoming = Array.isArray(body.mistakes) ? body.mistakes : []

    if (!uid) {
      return NextResponse.json({ error: "Thiếu uid" }, { status: 400 })
    }

    const ref = mistakeDocRef(uid)
    const snap = await getDoc(ref)
    const existing = (snap.exists() ? snap.data().records : []) as MistakeRecord[]

    // Gộp theo key giữa Local và Cloud
    const map = new Map<string, MistakeRecord>()

    // 1. Nạp cloud trước
    for (const item of existing) {
      map.set(item.key, item)
    }

    // 2. Gộp local với cloud: lấy wrongCount lớn hơn, lastAt mới hơn
    for (const item of incoming) {
      const prev = map.get(item.key)
      if (!prev) {
        map.set(item.key, item)
      } else {
        map.set(item.key, {
          ...prev,
          ...item,
          wrongCount: Math.max(prev.wrongCount, item.wrongCount),
          correctStreak: Math.max(prev.correctStreak, item.correctStreak),
          lastAt: Math.max(prev.lastAt, item.lastAt),
          firstAt: Math.min(prev.firstAt || item.firstAt, item.firstAt || prev.firstAt),
          isMastered: prev.isMastered || item.isMastered,
        })
      }
    }

    let merged = Array.from(map.values())

    // Giới hạn 500 bản ghi
    if (merged.length > 500) {
      merged.sort((a, b) => {
        if (a.isMastered !== b.isMastered) return a.isMastered ? 1 : -1
        return b.lastAt - a.lastAt
      })
      merged = merged.slice(0, 500)
    }

    await setDoc(
      ref,
      {
        records: merged,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )

    return NextResponse.json({ mistakes: merged })
  } catch (err) {
    console.error("[api/mistakes] Lỗi xử lý POST:", err)
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi đồng bộ lỗi ngầm." },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get("uid")?.trim()

    if (!uid) {
      return NextResponse.json({ error: "Thiếu uid" }, { status: 400 })
    }

    const snap = await getDoc(mistakeDocRef(uid))
    const records = (snap.exists() ? snap.data().records : []) as MistakeRecord[]

    return NextResponse.json({ mistakes: records })
  } catch (err) {
    console.error("[api/mistakes] Lỗi xử lý GET:", err)
    return NextResponse.json(
      { error: "Không đọc được lịch sử lỗi." },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get("uid")?.trim()

    if (!uid) {
      return NextResponse.json({ error: "Thiếu uid" }, { status: 400 })
    }

    await deleteDoc(mistakeDocRef(uid))
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[api/mistakes] Lỗi xử lý DELETE:", err)
    return NextResponse.json(
      { error: "Không xóa được lịch sử lỗi." },
      { status: 500 }
    )
  }
}
