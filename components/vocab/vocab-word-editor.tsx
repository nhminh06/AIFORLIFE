"use client"

import { Trash2 } from "lucide-react"

import type { VocabWord } from "@/lib/data/vocabulary"

/** Nhãn tiếng Việt cho từ loại, dùng chung cho form tạo bộ từ */
export const wordTypeOptions: { value: VocabWord["type"]; label: string }[] = [
  { value: "n", label: "n · Danh từ" },
  { value: "v", label: "v · Động từ" },
  { value: "adj", label: "adj · Tính từ" },
  { value: "adv", label: "adv · Trạng từ" },
  { value: "prep", label: "prep · Giới từ" },
  { value: "phr", label: "phr · Cụm từ" },
]

export const emptyWord: VocabWord = { en: "", ipa: "", type: "n", vi: "" }

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-800"

type VocabWordEditorProps = {
  word: VocabWord
  index: number
  onChange: (word: VocabWord) => void
  onRemove: () => void
  /** cho phép xóa dòng hay không (luôn giữ tối thiểu 1 dòng) */
  canRemove: boolean
}

export function VocabWordEditor({ word, index, onChange, onRemove, canRemove }: VocabWordEditorProps) {
  const set = (patch: Partial<VocabWord>) => onChange({ ...word, ...patch })

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-600">
          {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label={`Xóa từ thứ ${index + 1}`}
          title={canRemove ? "Xóa từ này" : "Cần giữ ít nhất 1 từ"}
          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:pointer-events-none disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1.1fr_1fr_auto_1.3fr]">
        <label className="block">
          <span className="sr-only">Từ tiếng Anh</span>
          <input
            value={word.en}
            onChange={(e) => set({ en: e.target.value })}
            placeholder="Từ tiếng Anh *"
            aria-label="Từ tiếng Anh"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="sr-only">Phiên âm</span>
          <input
            value={word.ipa}
            onChange={(e) => set({ ipa: e.target.value })}
            placeholder="/phiên âm/"
            aria-label="Phiên âm"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="sr-only">Từ loại</span>
          <select
            value={word.type}
            onChange={(e) => set({ type: e.target.value as VocabWord["type"] })}
            aria-label="Từ loại"
            className={`${inputClass} sm:w-full lg:w-32`}
          >
            {wordTypeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="sr-only">Nghĩa tiếng Việt</span>
          <input
            value={word.vi}
            onChange={(e) => set({ vi: e.target.value })}
            placeholder="Nghĩa tiếng Việt *"
            aria-label="Nghĩa tiếng Việt"
            className={inputClass}
          />
        </label>
      </div>
    </li>
  )
}