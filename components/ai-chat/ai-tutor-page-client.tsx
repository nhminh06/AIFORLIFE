"use client"

import React, { useState } from "react"
import {
  Sparkles,
  Pencil,
  BookOpen,
  Languages,
  HelpCircle,
  MessageCircle,
  Lightbulb,
  CheckCircle2,
  Cpu,
  ArrowRight,
} from "lucide-react"
import { AiTutorView } from "./ai-tutor-view"

const TOPIC_SUGGESTIONS = [
  {
    category: "Sửa lỗi & Viết lại câu",
    icon: Pencil,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-900/50",
    items: [
      "Sửa giúp tôi câu này: \"She don't go to school yesterday because she was sick.\"",
      "Viết lại câu sau theo phong cách học thuật/IELTS: \"A lot of people think that pollution is getting worse.\"",
      "Kiểm tra xem câu này dùng giới từ đúng chưa: \"I am interested on learning new languages.\"",
    ],
  },
  {
    category: "Ngữ pháp & Cấu trúc",
    icon: Languages,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    border: "border-purple-200 dark:border-purple-900/50",
    items: [
      "Giải thích cấu trúc Đảo ngữ với 'Not only... but also' kèm 3 ví dụ cụ thể.",
      "Khi nào dùng 'Since' và khi nào dùng 'For' trong thì hoàn thành?",
      "Quy tắc chuyển câu trực tiếp sang gián tiếp (Reported Speech) cần nhớ những gì?",
    ],
  },
  {
    category: "Phân biệt từ vựng",
    icon: BookOpen,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-900/50",
    items: [
      "Phân biệt 'Affect' và 'Effect' — làm sao để không bao giờ nhầm?",
      "Khác biệt giữa 'Look', 'See' và 'Watch' khi nào dùng từ nào?",
      "Gợi ý 5 collocations thông dụng nhất của từ 'Decision'.",
    ],
  },
  {
    category: "Trợ giảng giải đề thi",
    icon: HelpCircle,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-900/50",
    items: [
      "Giải thích vì sao câu điều kiện loại 3 dùng Had + V3/ed?",
      "Phân tích đáp án câu: \"Neither the teacher nor the students ___ present.\" (was/were)?",
    ],
  },
]

export function AiTutorPageClient() {
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null)

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Cột trái: Gợi ý chủ đề & Mẹo hỏi */}
      <div className="space-y-6 lg:col-span-4">
        {/* Card hướng dẫn */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold">Mẹo đặt câu hỏi hiệu quả</h3>
          </div>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400 sm:text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span>Dán cả câu văn hoàn chỉnh để AI hiểu rõ ngữ cảnh.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span>
                Nêu mục tiêu cụ thể (ví dụ: <em>"viết lại cho trang trọng hơn"</em> hoặc{" "}
                <em>"giải thích ngắn gọn cho người mới bắt đầu"</em>).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span>Có thể chat 100% bằng tiếng Anh để luyện phản xạ giao tiếp tự nhiên.</span>
            </li>
          </ul>
        </div>

        {/* Danh sách chủ đề mẫu */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Câu hỏi mẫu theo chủ điểm
          </h4>

          {TOPIC_SUGGESTIONS.map((topic, i) => {
            const Icon = topic.icon
            return (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className={`flex items-center gap-2 border-b border-slate-100 px-4 py-2.5 dark:border-slate-800 ${topic.bg}`}>
                  <Icon className={`h-4 w-4 ${topic.color}`} />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {topic.category}
                  </span>
                </div>
                <div className="divide-y divide-slate-100 p-2 dark:divide-slate-800/60">
                  {topic.items.map((item, j) => (
                    <button
                      key={j}
                      onClick={() => {
                        // Sao chép vào clipboard hoặc thông báo cho người dùng
                        navigator.clipboard.writeText(item)
                        setSelectedPrompt(item)
                        setTimeout(() => setSelectedPrompt(null), 2500)
                      }}
                      type="button"
                      className="group flex w-full items-start justify-between gap-2 rounded-xl p-2.5 text-left text-xs text-slate-600 transition-colors hover:bg-slate-50 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-blue-400"
                    >
                      <span className="line-clamp-2">{item}</span>
                      <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {selectedPrompt && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800 animate-in fade-in dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            ✓ Đã sao chép câu hỏi mẫu! Hãy dán (Ctrl+V) vào ô chat và chọn loại vấn đề tương ứng phía trên khung nhập để AI trả lời chuẩn xác nhất.
          </div>
        )}
      </div>

      {/* Cột phải: Khung chat chính */}
      <div className="flex flex-col lg:col-span-8">
        <AiTutorView mode="full" />
      </div>
    </div>
  )
}
