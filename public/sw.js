/* eslint-disable no-restricted-globals */
/**
 * Service Worker của LearnEnglish.
 *
 * Nhiệm vụ duy nhất: hỗ trợ nhắc nhở học tập hằng ngày khi app đã đóng.
 * - Nhận "periodic sync" (Chrome/Android) → kiểm tra đã tới giờ nhắc chưa thì báo.
 * - Nhận tin nhắn từ tab để đăng ký/huỷ lịch.
 *
 * Không cache tài nguyên: app dùng Next.js, việc cache ở đây có thể gây lỗi.
 */

const PERIODIC_TAG = "afl-daily-reminder"
const LAST_FIRED_KEY = "afl:reminder:last-fired"
const REMINDER_TIME_KEY = "afl:reminder:time"

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function parseTime(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || "").trim())
  if (!match) return null
  const h = Number(match[1])
  const m = Number(match[2])
  if (h > 23 || m > 59) return null
  return h * 60 + m
}

async function showReminder() {
  await self.registration.showNotification("Đã tới giờ học tiếng Anh!", {
    body: "Dành 20 phút hôm nay để giữ chuỗi học liên tiếp nhé. Bạn cũng có 5 từ mới đang chờ!",
    icon: "/icon-light-32x32.png",
    badge: "/icon.svg",
    tag: PERIODIC_TAG,
  })
}

self.addEventListener("install", () => {
  // Không pre-cache gì — chỉ cần kích hoạt ngay.
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

/** Tab chủ động gửi giờ nhắc để SW biết khi nào nên báo. */
self.addEventListener("message", (event) => {
  const data = event.data || {}
  if (data.type === "SET_REMINDER_TIME") {
    event.waitUntil(
      (async () => {
        await self.registration.periodicSync?.register(PERIODIC_TAG, {
          minInterval: 60 * 60 * 1000,
        })
        if (data.time) await setStored(REMINDER_TIME_KEY, data.time)
        else await clearStored(REMINDER_TIME_KEY)
      })(),
    )
  }
  if (data.type === "DISABLE_REMINDER") {
    event.waitUntil(self.registration.periodicSync?.unregister(PERIODIC_TAG))
  }
})

self.addEventListener("periodicsync", (event) => {
  if (event.tag !== PERIODIC_TAG) return
  event.waitUntil(
    (async () => {
      const time = parseTime(await getStored(REMINDER_TIME_KEY))
      if (time === null) return

      const now = new Date()
      const current = now.getHours() * 60 + now.getMinutes()
      // Chỉ báo khi đã tới giờ trong cửa sổ 1 tiếng gần nhất (Periodic Sync chạy mỗi giờ).
      if (current < time || current - time > 60) return

      if (await getStored(LAST_FIRED_KEY)) return
      await setStored(LAST_FIRED_KEY, todayKey())
      await showReminder()
    })(),
  )
})

/** Bấm vào thông báo → mở app. */
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true })
      for (const client of all) {
        if ("focus" in client) return client.focus()
      }
      return self.clients.openWindow("/tien-do")
    })(),
  )
})

/* localStorage không dùng được trong SW → dùng Cache API như kho key-value */
async function getStored(key) {
  try {
    const cache = await caches.open("afl-reminder-store")
    const res = await cache.match(key)
    if (!res) return null
    const value = await res.json()
    return value?.value ?? null
  } catch {
    return null
  }
}

async function setStored(key, value) {
  try {
    const cache = await caches.open("afl-reminder-store")
    await cache.put(key, new Response(JSON.stringify({ value }), { headers: { "Content-Type": "application/json" } }))
  } catch {
    /* im lặng */
  }
}

async function clearStored(key) {
  try {
    const cache = await caches.open("afl-reminder-store")
    await cache.delete(key)
  } catch {
    /* im lặng */
  }
}