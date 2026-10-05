"use client"

import React, { useState } from "react"
import { usePathname } from "next/navigation"
import { Sparkles, Bot, X } from "lucide-react"
import { AiTutorView } from "./ai-tutor-view"

export function FloatingAiTutor() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Ẩn nút nổi nếu người dùng đang ở trang chat toàn màn hình /tro-ly-ai
  if (pathname === "/tro-ly-ai") {
    return null
  }

  return (
    <div className="fixed bottom-5 left-5 z-50 flex flex-col items-start">
      {/* Cửa sổ chat nổi */}
      {isOpen && (
        <div className="mb-3 h-[580px] max-h-[82vh] w-[94vw] max-w-[420px] animate-in fade-in slide-in-from-bottom-5 duration-200">
          <AiTutorView mode="compact" onClose={() => setIsOpen(false)} />
        </div>
      )}

      {/* Nút bấm tròn mở/đóng */}
      <div className="relative group">
        {!isOpen && (
          <div className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900/90 px-2.5 py-1 text-xs font-medium text-white shadow-md opacity-0 transition-opacity group-hover:opacity-100 dark:bg-slate-800">
            Hỏi đáp tiếng Anh cùng AI ✨
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          aria-label={isOpen ? "Đóng trợ lý AI" : "Mở trợ lý AI"}
          className={`relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
            isOpen
              ? "bg-slate-800 text-slate-200 hover:bg-slate-700 dark:bg-slate-700"
              : "bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-blue-500/30 hover:shadow-blue-500/50"
          }`}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <>
              <Bot className="h-6 w-6" />
              {/* Pulse effect */}
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
