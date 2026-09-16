"use client"

type Props = {
  prompt: string
  hint?: string
  value: string
  checked: boolean
  onChange: (v: string) => void
  onSubmit: () => void
}

export function FillQuestion({ prompt, hint, value, checked, onChange, onSubmit }: Props) {
  return (
    <>
      <p className="text-lg font-bold leading-relaxed text-slate-900">{prompt}</p>
      {hint && (
        <p className="mt-1 text-sm text-slate-500">
          Gợi ý nghĩa: <span className="font-medium text-slate-700">{hint}</span>
        </p>
      )}
      <input
        value={value}
        disabled={checked}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit()
        }}
        placeholder="Gõ đáp án của bạn…"
        className="mt-4 w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none"
      />
      {!checked && (
        <button
          type="button"
          onClick={onSubmit}
          disabled={!value.trim()}
          className="mt-3 w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-40"
        >
          Kiểm tra
        </button>
      )}
    </>
  )
}
