"use client"

import { useState } from "react"
import { Loader2, Sparkles, X } from "lucide-react"

import type { Exercise, PracticeCategory, PracticeQuestionKind } from "@/lib/data/practice"
import { useAuth } from "@/lib/auth-context"
import { saveMyExercise } from "@/lib/user-practice"

const typeOptions: { id: PracticeQuestionKind; label: string }[] = [
  { id: "choice", label: "Trắc nghiệm" },
  { id: "fill", label: "Điền từ" },
  { id: "order", label: "Sắp xếp câu" },
  { id: "reading", label: "Đọc hiểu" },
  { id: "listening", label: "Nghe hiểu" },
  { id: "writing", label: "Viết đoạn" },
  { id: "true-false", label: "Đúng / Sai" },
]

const examOptions: Record<PracticeCategory, { id: string; label: string }[]> = {
  listening: [
    { id: "Hỏi và đáp", label: "Hỏi và đáp" },
    { id: "Hội thoại", label: "Hội thoại" },
    { id: "Bài nói ngắn", label: "Bài nói ngắn" },
  ],
  reading: [
    { id: "Điền từ vào câu", label: "Điền từ vào câu" },
    { id: "Điền từ vào đoạn", label: "Điền từ vào đoạn" },
    { id: "Đọc hiểu", label: "Đọc hiểu" },
  ],
  writing: [
    { id: "Email phản hồi", label: "Email phản hồi" },
    { id: "Bài luận ý kiến", label: "Bài luận ý kiến" },
  ],
}

function questionKindForExamType(category: PracticeCategory, examType: string): PracticeQuestionKind {
  if (category === "writing") return "writing"
  if (category === "listening") return "listening"
  return examType === "Đọc hiểu" ? "reading" : "fill"
}

export function CreateAiPracticeModal({ onClose, onCreated }: { onClose: () => void; onCreated: (exercise: Exercise) => void }) {
  const { user } = useAuth()
  const [topic, setTopic] = useState("")
  const [category, setCategory] = useState<PracticeCategory>("reading")
  const [examType, setExamType] = useState(examOptions.reading[0].id)
  const [level, setLevel] = useState("Cơ bản")
  const [difficulty, setDifficulty] = useState("Cơ bản")
  const [questionCount, setQuestionCount] = useState("8")
  const [request, setRequest] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const selectedQuestionType = questionKindForExamType(category, examType)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user) {
      setError("Bạn cần đăng nhập để lưu bài luyện AI.")
      return
    }
    if (!topic.trim()) {
      setError("Hãy nhập chủ đề luyện tập.")
      return
    }

    setBusy(true)
    setError("")
    try {
      const response = await fetch("/api/ai/practice/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, category, examType, level, difficulty, questionCount: Number(questionCount), questionTypes: [selectedQuestionType], request }),
      })
      const data = (await response.json()) as { exercise?: Exercise; error?: string }
      if (!response.ok || !data.exercise) throw new Error(data.error || "Không tạo được bài luyện.")
      const saved = await saveMyExercise(user.uid, data.exercise)
      onCreated(saved)
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không tạo được bài luyện.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]" onClick={(event) => event.target === event.currentTarget && !busy && onClose()}>
      <form onSubmit={submit} role="dialog" aria-modal="true" aria-label="Tạo bài luyện bằng AI" className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white"><Sparkles className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1"><h2 className="text-lg font-bold text-slate-900">Tạo bài luyện bằng AI</h2><p className="mt-0.5 text-xs text-slate-500">AI tạo bài theo đúng chủ đề và yêu cầu của bạn.</p></div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Đóng" className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
          {error && <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600">{error}</p>}
          <label className="block"><span className="text-xs font-bold text-slate-700">Chủ đề *</span><input required value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="VD: Giao tiếp ở sân bay" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500" /></label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block"><span className="text-xs font-bold text-slate-700">Nhóm chính</span><select value={category} onChange={(event) => { const next = event.target.value as PracticeCategory; setCategory(next); setExamType(examOptions[next][0].id); setQuestionCount(next === "writing" ? "1" : "8") }} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="writing">Viết</option><option value="listening">Nghe</option><option value="reading">Đọc</option></select></label>
            <label className="block"><span className="text-xs font-bold text-slate-700">Dạng bài</span><select value={examType} onChange={(event) => setExamType(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">{examOptions[category].map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
            <label className="block"><span className="text-xs font-bold text-slate-700">Trình độ tiếng Anh</span><select value={level} onChange={(event) => setLevel(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option>Cơ bản</option><option>Trung cấp</option><option>Nâng cao</option></select><span className="mt-1 block text-[10px] leading-relaxed text-slate-400">Quyết định từ vựng và ngữ pháp được sử dụng.</span></label>
            <label className="block"><span className="text-xs font-bold text-slate-700">Mức độ thử thách</span><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option>Cơ bản</option><option>Trung cấp</option><option>Nâng cao</option></select><span className="mt-1 block text-[10px] leading-relaxed text-slate-400">Quyết định độ đánh đố và độ dài câu hỏi.</span></label>
            <label className="block"><span className="text-xs font-bold text-slate-700">{category === "writing" ? "Số đề viết" : "Số câu"}</span><select value={questionCount} onChange={(event) => setQuestionCount(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">{category === "writing" ? <><option value="1">1</option><option value="2">2</option><option value="3">3</option></> : <><option value="5">5</option><option value="8">8</option><option value="10">10</option><option value="15">15</option></>}</select><span className="mt-1 block text-[10px] leading-relaxed text-slate-400">{category === "writing" ? "Giới hạn bài viết là 3 câu." : "Số lượng câu hỏi trong bài luyện."}</span></label>
          </div>
          <div><p className="text-xs font-bold text-slate-700">Loại câu hỏi được tạo</p><p className="mt-2 inline-flex rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1.5 text-xs font-semibold text-orange-700">{typeOptions.find((option) => option.id === selectedQuestionType)?.label}</p><p className="mt-1 text-[11px] text-slate-400">Bài này chỉ tạo đúng loại câu hỏi đã chọn, không trộn dạng khác.</p></div>
          <label className="block"><span className="text-xs font-bold text-slate-700">Yêu cầu riêng</span><textarea value={request} onChange={(event) => setRequest(event.target.value)} rows={3} placeholder="VD: Dùng tình huống phỏng vấn, câu hỏi đa dạng..." className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500" /></label>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4 sm:px-6"><button type="button" onClick={onClose} disabled={busy} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Hủy</button><button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" />} {busy ? "Đang tạo…" : "Tạo bài luyện"}</button></div>
      </form>
    </div>
  )
}
