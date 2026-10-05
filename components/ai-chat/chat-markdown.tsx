"use client"

import React, { useState } from "react"
import { Check, Copy } from "lucide-react"

type ChatMarkdownProps = {
  content: string
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative my-2.5 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 text-slate-100 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-400">
        <span className="font-mono uppercase">{language || "text"}</span>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Đã sao chép</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Sao chép</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed sm:text-sm">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function formatInline(text: string): React.ReactNode {
  // Thay thế <br> và <br/> trước
  const brSegments = text.split(/<br\s*\/?>/gi)

  return brSegments.map((seg, brIndex) => {
    // Tách token inline code, bold, italic
    const tokens = seg.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g)
    const formatted = tokens.map((part, index) => {
      if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
        return (
          <code
            key={index}
            className="mx-0.5 rounded-md bg-blue-100/80 px-1.5 py-0.5 font-mono text-[0.88em] font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
          >
            {part.slice(1, -1)}
          </code>
        )
      }
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return (
          <strong key={index} className="font-bold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        )
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return (
          <em key={index} className="italic text-slate-700 dark:text-slate-300">
            {part.slice(1, -1)}
          </em>
        )
      }
      return part
    })

    return (
      <React.Fragment key={brIndex}>
        {formatted}
        {brIndex < brSegments.length - 1 && <br className="my-1" />}
      </React.Fragment>
    )
  })
}

function parseTable(lines: string[]): { headers: string[]; rows: string[][] } | null {
  if (lines.length < 2) return null
  const headerLine = lines[0].trim()
  const sepLine = lines[1].trim()

  // Kiểm tra hàng ngăn cách table | :--- | :--- |
  if (!headerLine.startsWith("|") || !sepLine.startsWith("|") || !sepLine.includes("---")) {
    return null
  }

  const splitRow = (line: string) =>
    line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim())

  const headers = splitRow(headerLine)
  const rows: string[][] = []

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith("|") && line.endsWith("|")) {
      rows.push(splitRow(line))
    }
  }

  return { headers, rows }
}

export function ChatMarkdown({ content }: ChatMarkdownProps) {
  // Xử lý các khối code block ``` trước
  const segments = content.split(/(```[\s\S]*?```)/g)

  return (
    <div className="space-y-2.5 text-sm leading-relaxed text-slate-800 dark:text-slate-200 sm:text-[15px]">
      {segments.map((segment, segIndex) => {
        if (segment.startsWith("```") && segment.endsWith("```")) {
          const match = segment.match(/```(\w*)\n?([\s\S]*?)```/)
          const language = match?.[1] || ""
          const code = match?.[2] || ""
          return <CodeBlock key={segIndex} language={language} code={code.trim()} />
        }

        const lines = segment.split("\n")
        const renderedElements: React.ReactNode[] = []

        let i = 0
        while (i < lines.length) {
          const line = lines[i]
          const trimmed = line.trim()
          const key = `seg-${segIndex}-line-${i}`

          // 1. Phân tích Bảng Markdown (| ... |)
          if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
            const tableLines: string[] = []
            while (i < lines.length && lines[i].trim().startsWith("|")) {
              tableLines.push(lines[i].trim())
              i++
            }

            const tableData = parseTable(tableLines)
            if (tableData) {
              renderedElements.push(
                <div
                  key={key}
                  className="my-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/80"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="border-b border-slate-200 bg-slate-100/90 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                        <tr>
                          {tableData.headers.map((h, hIdx) => (
                            <th
                              key={hIdx}
                              className="px-3.5 py-2.5 font-semibold tracking-wide whitespace-nowrap text-slate-900 dark:text-white"
                            >
                              {formatInline(h)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800/60 dark:bg-slate-950/40">
                        {tableData.rows.map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-900/50"
                          >
                            {row.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                className="px-3.5 py-2.5 align-top text-slate-700 dark:text-slate-300"
                              >
                                {formatInline(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
              continue
            } else {
              // Nếu không phải bảng hợp lệ, in từng dòng
              tableLines.forEach((tl, tlIdx) => {
                renderedElements.push(
                  <p key={`${key}-fallback-${tlIdx}`} className="my-0.5">
                    {formatInline(tl)}
                  </p>
                )
              })
              continue
            }
          }

          // 2. Đường kẻ phân cách --- hoặc ***
          if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
            renderedElements.push(
              <hr
                key={key}
                className="my-3 border-t border-slate-200/80 dark:border-slate-800"
              />
            )
            i++
            continue
          }

          // 3. Khối trích dẫn (Blockquote)
          if (trimmed.startsWith(">")) {
            const quoteLines: string[] = []
            while (i < lines.length && lines[i].trim().startsWith(">")) {
              quoteLines.push(lines[i].trim().replace(/^>\s*/, ""))
              i++
            }
            renderedElements.push(
              <blockquote
                key={key}
                className="my-2.5 rounded-r-xl border-l-4 border-blue-500 bg-blue-50/70 py-2 pl-3.5 pr-3 text-slate-700 italic dark:border-blue-400 dark:bg-blue-950/30 dark:text-slate-300"
              >
                {quoteLines.map((q, qIdx) => (
                  <p key={qIdx} className="my-0.5">
                    {formatInline(q)}
                  </p>
                ))}
              </blockquote>
            )
            continue
          }

          // 4. Danh sách gạch đầu dòng (- hoặc *)
          if (/^[-*]\s+/.test(trimmed)) {
            const listItems: string[] = []
            while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
              listItems.push(lines[i].trim().replace(/^[-*]\s+/, ""))
              i++
            }
            renderedElements.push(
              <ul key={key} className="my-1.5 space-y-1 pl-4">
                {listItems.map((item, lIdx) => (
                  <li key={lIdx} className="list-disc pl-1 text-slate-800 dark:text-slate-200">
                    {formatInline(item)}
                  </li>
                ))}
              </ul>
            )
            continue
          }

          // 5. Danh sách đánh số (1., 2., 3.)
          if (/^\d+\.\s+/.test(trimmed)) {
            renderedElements.push(
              <div key={key} className="my-1 flex items-start gap-2 pl-1">
                <span className="shrink-0 font-semibold text-blue-600 dark:text-blue-400">
                  {trimmed.match(/^\d+\./)?.[0]}
                </span>
                <span className="flex-1">{formatInline(trimmed.replace(/^\d+\.\s+/, ""))}</span>
              </div>
            )
            i++
            continue
          }

          // 6. Tiêu đề Markdown (#, ##, ###)
          if (trimmed.startsWith("### ")) {
            renderedElements.push(
              <h4
                key={key}
                className="mt-3.5 mb-1.5 text-base font-bold text-slate-900 dark:text-white"
              >
                {formatInline(trimmed.replace(/^###\s+/, ""))}
              </h4>
            )
            i++
            continue
          }

          if (trimmed.startsWith("## ")) {
            renderedElements.push(
              <h3
                key={key}
                className="mt-4 mb-2 text-lg font-bold text-slate-900 dark:text-white"
              >
                {formatInline(trimmed.replace(/^##\s+/, ""))}
              </h3>
            )
            i++
            continue
          }

          if (trimmed.startsWith("# ")) {
            renderedElements.push(
              <h2
                key={key}
                className="mt-4 mb-2 text-xl font-extrabold text-slate-900 dark:text-white"
              >
                {formatInline(trimmed.replace(/^#\s+/, ""))}
              </h2>
            )
            i++
            continue
          }

          // 7. Hộp nhấn mạnh đặc biệt (Câu gốc, Câu đúng chuẩn)
          if (trimmed.includes("❌ Câu gốc") || trimmed.includes("🔴 Phân tích")) {
            renderedElements.push(
              <div
                key={key}
                className="mt-2.5 font-semibold text-rose-600 dark:text-rose-400"
              >
                {formatInline(trimmed)}
              </div>
            )
            i++
            continue
          }

          if (trimmed.includes("✅ Câu đúng chuẩn") || trimmed.includes("💡 Gợi ý")) {
            renderedElements.push(
              <div
                key={key}
                className="mt-2.5 font-semibold text-emerald-600 dark:text-emerald-400"
              >
                {formatInline(trimmed)}
              </div>
            )
            i++
            continue
          }

          // 8. Dòng trống
          if (trimmed.length === 0) {
            renderedElements.push(<div key={key} className="h-1.5" />)
            i++
            continue
          }

          // 9. Đoạn văn thông thường
          renderedElements.push(
            <p key={key} className="my-0.5">
              {formatInline(trimmed)}
            </p>
          )
          i++
        }

        return <React.Fragment key={segIndex}>{renderedElements}</React.Fragment>
      })}
    </div>
  )
}
