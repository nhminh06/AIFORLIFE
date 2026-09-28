export function speak(text: string, lang = "en-US") {
  if (typeof window === "undefined") return
  const synth = window.speechSynthesis
  if (!synth) return
  synth.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = lang
  utter.rate = 0.95
  synth.speak(utter)
}

/**
 * Hiệu ứng âm thanh khi trả lời đúng/sai (cài đặt "Hiệu ứng âm thanh").
 * Dùng Web Audio API nên không cần file ngoài.
 * Lưu ý: AudioContext phải được tạo/khởi động trong thao tác của người dùng
 * để không bị trình duyệt chặn (autoplay policy).
 */

let audioCtx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  const Ctor = window.AudioContext || (window as any).webkitAudioContext
  if (!Ctor) return null
  if (!audioCtx) audioCtx = new Ctor()
  return audioCtx
}

/** Mở khoá AudioContext sau khi người dùng tương tác (gọi 1 lần khi vào app). */
export function unlockAudio() {
  const ctx = getContext()
  if (ctx && ctx.state === "suspended") void ctx.resume()
}

type ToneSpec = { freq: number; start: number; dur: number; type: OscillatorType }

function playTones(tones: ToneSpec[], peak = 0.15) {
  const ctx = getContext()
  if (!ctx) return
  if (ctx.state === "suspended") void ctx.resume()

  const master = ctx.createGain()
  master.gain.setValueAtTime(peak, ctx.currentTime)
  master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45)
  master.connect(ctx.destination)

  for (const t of tones) {
    const osc = ctx.createOscillator()
    const at = ctx.currentTime + t.start
    osc.type = t.type
    osc.frequency.setValueAtTime(t.freq, at)
    osc.connect(master)
    osc.start(at)
    osc.stop(at + t.dur)
  }
}

/** Âm "ting" khi trả lời đúng (nốt lên). */
export function playCorrectSound() {
  try {
    playTones([
      { freq: 659.25, start: 0, dur: 0.18, type: "sine" }, // E5
      { freq: 880, start: 0.11, dur: 0.3, type: "sine" }, // A5
    ])
  } catch {
    /* im lặng — âm thanh là tuỳ chọn */
  }
}

/** Âm "bùng" ngắn khi trả lời sai (nốt xuống). */
export function playWrongSound() {
  try {
    playTones([
      { freq: 233.08, start: 0, dur: 0.16, type: "triangle" }, // Bb3
      { freq: 174.61, start: 0.13, dur: 0.32, type: "triangle" }, // F3
    ])
  } catch {
    /* im lặng — âm thanh là tuỳ chọn */
  }
}

/** Âm chúc mừng khi hoàn thành bài (3 nốt lên). */
export function playSuccessSound() {
  try {
    playTones([
      { freq: 523.25, start: 0, dur: 0.16, type: "sine" }, // C5
      { freq: 659.25, start: 0.12, dur: 0.16, type: "sine" }, // E5
      { freq: 783.99, start: 0.24, dur: 0.16, type: "sine" }, // G5
      { freq: 1046.5, start: 0.36, dur: 0.45, type: "sine" }, // C6
    ])
  } catch {
    /* im lặng — âm thanh là tuỳ chọn */
  }
}