"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Maximize2,
  Minimize2,
  X,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Pencil,
  Languages,
  MessageCircle,
  Cpu,
  Zap,
  BarChart3,
  Lightbulb,
} from "lucide-react"
import Link from "next/link"
import { ChatMarkdown } from "./chat-markdown"

export type QuestionCategory =
  | "auto"
  | "error_correction"
  | "grammar_lookup"
  | "examples"
  | "quiz"
  | "vocab_diff"
  | "essay_scoring"

export type CategoryMeta = {
  id: QuestionCategory
  label: string
  shortLabel: string
  icon: React.ElementType
  placeholder: string
  hint: string
}

export const QUESTION_CATEGORIES: CategoryMeta[] = [
  {
    id: "auto",
    label: "Tự động nhận diện",
    shortLabel: "Tự động",
    icon: Sparkles,
    placeholder: "Hỏi đáp về ngữ pháp, từ vựng, sửa câu... (Enter để gửi)",
    hint: "AI tự động phân tích ý định bằng Machine Learning",
  },
  {
    id: "error_correction",
    label: "Sửa lỗi câu & Ngữ pháp",
    shortLabel: "Sửa lỗi câu",
    icon: Pencil,
    placeholder: "Dán câu tiếng Anh cần kiểm tra sửa lỗi (VD: She don't like apple)...",
    hint: "Bóc tách từng lỗi sai & đối chiếu 1.501 câu bản ngữ JFLEG",
  },
  {
    id: "grammar_lookup",
    label: "Tra cứu 12 thì",
    shortLabel: "Tra cứu 12 thì",
    icon: BookOpen,
    placeholder: "Nhập tên thì hoặc cấu trúc ngữ pháp (VD: thì hiện tại hoàn thành, câu bị động)...",
    hint: "Bảng công thức chuẩn, cách dùng & dấu hiệu nhận biết",
  },
  {
    id: "examples",
    label: "Cho ví dụ minh họa",
    shortLabel: "Cho ví dụ",
    icon: Lightbulb,
    placeholder: "Nhập thì hoặc chủ đề cần ví dụ (VD: ví dụ thì quá khứ tiếp diễn)...",
    hint: "Ví dụ câu khẳng định (+), phủ định (-), nghi vấn (?) song ngữ",
  },
  {
    id: "quiz",
    label: "Tạo bài tập trắc nghiệm",
    shortLabel: "Bài tập",
    icon: HelpCircle,
    placeholder: "Nhập thì muốn tạo bài tập trắc nghiệm (VD: bài tập thì hiện tại đơn)...",
    hint: "Bộ câu hỏi kiểm tra kèm đáp án và giải thích ngữ pháp",
  },
  {
    id: "vocab_diff",
    label: "Phân biệt từ vựng",
    shortLabel: "Phân biệt từ",
    icon: Languages,
    placeholder: "Nhập cặp từ cần phân biệt (VD: affect và effect, since và for, make và do)...",
    hint: "Bảng so sánh chi tiết các cặp từ dễ nhầm lẫn nhất",
  },
  {
    id: "essay_scoring",
    label: "Chấm điểm bài viết",
    shortLabel: "Chấm bài viết",
    icon: BarChart3,
    placeholder: "Dán đoạn văn hoặc bài luận tiếng Anh vào đây để mô hình ML chấm điểm...",
    hint: "Mô hình Ridge Regression AES: Flesch Reading Ease, CEFR B1-C1",
  },
]

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  category?: QuestionCategory
  createdAt: number
}

type AiTutorViewProps = {
  mode?: "compact" | "full"
  onClose?: () => void
  onExpand?: () => void
}

const STORAGE_KEY = "learnsphere_ai_tutor_messages_v1"

const QUICK_PROMPTS: {
  icon: React.ElementType
  label: string
  prompt: string
  category: QuestionCategory
}[] = [
  {
    icon: Pencil,
    label: "Sửa lỗi câu",
    prompt: "I has been waiting here since two hours",
    category: "error_correction",
  },
  {
    icon: Languages,
    label: "Phân biệt Affect & Effect",
    prompt: "phân biệt affect và effect",
    category: "vocab_diff",
  },
  {
    icon: BookOpen,
    label: "Thì Hiện tại hoàn thành",
    prompt: "thì hiện tại hoàn thành",
    category: "grammar_lookup",
  },
  {
    icon: Lightbulb,
    label: "Ví dụ câu Hiện tại tiếp diễn",
    prompt: "cho ví dụ về thì hiện tại tiếp diễn",
    category: "examples",
  },
  {
    icon: HelpCircle,
    label: "Bài tập thì Quá khứ đơn",
    prompt: "bài tập thì quá khứ đơn",
    category: "quiz",
  },
  {
    icon: BarChart3,
    label: "Chấm bài luận",
    prompt:
      "Learning a foreign language improves memory and cognitive flexibility. It also creates valuable international job opportunities.",
    category: "essay_scoring",
  },
]

export function AiTutorView({ mode = "compact", onClose, onExpand }: AiTutorViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory>("auto")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeModel, setActiveModel] = useState<string>("AI Nội bộ (Local ML & NLP)")

  const currentCategory =
    QUESTION_CATEGORIES.find((c) => c.id === selectedCategory) || QUESTION_CATEGORIES[0]

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Khôi phục lịch sử chat từ localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as ChatMessage[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  // Tự động lưu vào localStorage khi messages thay đổi
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
      }
    } catch {
      // ignore
    }
  }, [messages])

  // Cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const handleClearHistory = () => {
    if (window.confirm("Bạn có chắc muốn xoá toàn bộ lịch sử hỏi đáp này không?")) {
      setMessages([])
      localStorage.removeItem(STORAGE_KEY)
      setError(null)
    }
  }

  const handleCopyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // ignore
    }
  }

  const sendMessage = async (textToSend?: string, overrideCategory?: QuestionCategory) => {
    const cat = overrideCategory || selectedCategory
    const question = (textToSend ?? input).trim()
    if (!question || isLoading) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: "user",
      content: question,
      category: cat,
      createdAt: Date.now(),
    }

    const nextHistory = [...messages, userMsg]
    setMessages(nextHistory)
    setInput("")
    setError(null)
    setIsLoading(true)

    // Reset chiều cao textarea nếu dùng textToSend
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextHistory.map((m) => ({
            role: m.role,
            content: m.content,
            category: m.category,
          })),
          category: cat,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Không nhận được phản hồi từ AI.")
      }

      if (data.model) {
        setActiveModel(data.model)
      }

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: "assistant",
        content: data.reply || "Xin lỗi, tôi chưa thể trả lời câu hỏi này.",
        createdAt: Date.now(),
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Đã có lỗi xảy ra trong quá trình hỏi đáp."
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = "auto"
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`
  }

  const isCompact = mode === "compact"

  return (
    <div
      className={`flex flex-col overflow-hidden bg-white text-slate-900 transition-all dark:bg-slate-900 dark:text-slate-100 ${
        isCompact
          ? "h-full w-full rounded-2xl border border-slate-200/80 shadow-2xl dark:border-slate-800"
          : "min-h-[620px] flex-1 rounded-2xl border border-slate-200/80 shadow-sm dark:border-slate-800"
      }`}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-slate-50/90 px-4 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-blue-500/20">
            <Bot className="h-5 w-5" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold tracking-tight text-slate-900 dark:text-white">
                Trợ lý Tiếng Anh AI
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                <Cpu className="h-2.5 w-2.5" />
                AI Nội bộ • 0ms
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mô hình ML huấn luyện trên máy • Phản hồi tức thì, 100% offline
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              title="Xoá lịch sử trò chuyện"
              type="button"
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

          {isCompact && (
            <Link
              href="/tro-ly-ai"
              title="Mở toàn màn hình"
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <Maximize2 className="h-4 w-4" />
            </Link>
          )}

          {onClose && (
            <button
              onClick={onClose}
              title="Thu nhỏ"
              type="button"
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 scroll-smooth">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center sm:py-8">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400">
              <Sparkles className="h-7 w-7 animate-pulse" />
            </div>
            <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              Bạn đang gặp khó khăn gì với tiếng Anh?
            </h4>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-sm">
              Hãy hỏi bất kỳ câu hỏi ngữ pháp, dán câu cần sửa, bài tập chưa hiểu hoặc tra cứu cụm từ
              thông dụng.
            </p>

            {/* Quick prompts */}
            <div className="mt-5 w-full max-w-md space-y-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Gợi ý câu hỏi nhanh:
              </span>
              <div className="flex flex-col gap-1.5">
                {QUICK_PROMPTS.map((item, idx) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedCategory(item.category)
                        sendMessage(item.prompt, item.category)
                      }}
                      type="button"
                      className="group flex items-center justify-between rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 py-2 text-left text-xs text-slate-700 transition-all hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:border-blue-900/60 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Icon className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-500">
                        Hỏi ngay →
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === "user"
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 sm:gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`group relative max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm sm:max-w-[80%] ${
                    isUser
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/10 dark:bg-blue-600"
                      : "border border-slate-200/80 bg-slate-50/80 text-slate-800 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200"
                  }`}
                >
                  {isUser ? (
                    <div>
                      {msg.category && msg.category !== "auto" && (
                        <div className="mb-1 flex items-center gap-1">
                          <span className="inline-flex items-center gap-1 rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white/95">
                            {(() => {
                              const cat = QUESTION_CATEGORIES.find((c) => c.id === msg.category)
                              if (!cat) return null
                              const CatIcon = cat.icon
                              return (
                                <>
                                  <CatIcon className="h-3 w-3" />
                                  <span>{cat.shortLabel}</span>
                                </>
                              )
                            })()}
                          </span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  ) : (
                    <div>
                      <ChatMarkdown content={msg.content} />
                      <div className="mt-2.5 flex items-center justify-between border-t border-slate-200/50 pt-1.5 text-[11px] text-slate-400 dark:border-slate-800/60">
                        <span>{activeModel.split("/").pop() || "AI"}</span>
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          type="button"
                          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          title="Sao chép câu trả lời"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-500" />
                              <span className="text-emerald-500">Đã sao chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Sao chép</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            )
          })
        )}

        {/* Loading shimmer indicator */}
        {isLoading && (
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-xs text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600 dark:text-blue-400" />
              <span>Trợ lý đang suy nghĩ và soạn câu trả lời...</span>
            </div>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <div className="flex-1">
              <p className="font-semibold">Lỗi phản hồi:</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form with Category Selector */}
      <div className="shrink-0 border-t border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-3.5">
        {/* Category Selector Chips */}
        <div className="mb-2.5">
          <div className="flex items-center justify-between pb-1.5 px-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <span>Loại vấn đề:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {currentCategory.label}
              </span>
            </div>
            {selectedCategory !== "auto" && (
              <button
                type="button"
                onClick={() => setSelectedCategory("auto")}
                className="text-[10px] text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
              >
                Đặt lại tự động ↺
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {QUESTION_CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const isSelected = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`group flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/25 ring-2 ring-blue-500/20"
                      : "border border-slate-200/90 bg-slate-50/80 text-slate-600 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  }`}
                  title={cat.hint}
                >
                  <Icon
                    className={`h-3.5 w-3.5 transition-transform group-hover:scale-110 ${
                      isSelected ? "text-white" : "text-slate-500 dark:text-slate-400"
                    }`}
                  />
                  <span>{cat.shortLabel}</span>
                </button>
              )
            })}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            sendMessage()
          }}
          className="relative flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950/60 dark:focus-within:border-blue-400"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleInputResize}
            onKeyDown={handleKeyDown}
            placeholder={currentCategory.placeholder}
            className="max-h-32 min-h-[38px] flex-1 resize-none bg-transparent px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 sm:text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition-all hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600"
            title="Gửi câu hỏi"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 px-1 text-[11px] text-slate-400 dark:text-slate-500">
          <span className="truncate max-w-[280px] sm:max-w-none">
            💡 {currentCategory.hint}
          </span>
          <span className="hidden sm:inline">Enter gửi • Shift+Enter xuống dòng</span>
        </div>
      </div>
    </div>
  )
}
