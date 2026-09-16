import { Volume2 } from "lucide-react"

const words = [
  { word: "accomplish", ipa: "/əˈkʌm.plɪʃ/", type: "v" },
  { word: "diligent", ipa: "/ˈdɪl.ɪ.dʒənt/", type: "adj" },
  { word: "milestone", ipa: "/ˈmaɪl.stoʊn/", type: "n" },
  { word: "gradually", ipa: "/ˈɡrædʒ.u.ə.li/", type: "adv" },
  { word: "confidence", ipa: "/ˈkɑːn.fə.dəns/", type: "n" },
]

export function TodayVocabulary() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
      <h3 className="text-base font-bold text-slate-900">Từ vựng hôm nay</h3>
      <ul className="mt-3 divide-y divide-slate-100">
        {words.map((w) => (
          <li key={w.word} className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="flex items-baseline gap-1.5">
                <span className="font-semibold text-slate-900">{w.word}</span>
                <span className="text-xs text-slate-400">({w.type})</span>
              </p>
              <p className="text-xs text-slate-500">{w.ipa}</p>
            </div>
            <button
              type="button"
              aria-label={`Phát âm từ ${w.word}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-blue-600 transition-colors hover:bg-blue-50"
            >
              <Volume2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
