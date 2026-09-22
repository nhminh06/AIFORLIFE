"use client"

import { useEffect, useState } from "react"
import { BookText, CheckCircle2, Flame } from "lucide-react"
import { getAllVocabSets } from "@/lib/vocab-service"
import { loadVocabProgress } from "@/lib/vocab-progress"
import { useAuth } from "@/lib/auth-context"
import { loadDailyVocabDays, todayKey } from "@/lib/daily-vocab"
import { getMyVocabSets } from "@/lib/user-vocab"
import { getAllPhraseSets } from "@/lib/phrase-service"
import { getMyPhraseSets } from "@/lib/user-phrases"
import { loadPhraseProgress } from "@/lib/phrase-progress"
import { grammarTopics } from "@/lib/data/grammar"
import { getMyGrammarSets } from "@/lib/user-grammar"
import { loadDefaultExercises, loadMyExercises } from "@/lib/practice-service"
import { countGrammarLearned } from "@/lib/grammar-progress"

const RADIUS = 52
const CIRC = 2 * Math.PI * RADIUS

function getStreak(uid?: string | null): number {
  const days = new Set(loadDailyVocabDays(uid).map((day) => day.date))
  let streak = 0
  const cursor = new Date()
  while (days.has(todayKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function StudyStatsCard() {
  const { user } = useAuth()
  const [stats, setStats] = useState([
    { label: "Từ đã học", value: "0", icon: BookText, color: "text-blue-600 bg-blue-50" },
    { label: "Đã hoàn thành", value: "0", icon: CheckCircle2, color: "text-green-600 bg-green-50" },
    { label: "Ngày liên tiếp", value: "0", icon: Flame, color: "text-orange-500 bg-orange-50" },
  ])
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const load = () => Promise.all([
      getAllVocabSets(), user ? getMyVocabSets(user.uid) : Promise.resolve([]),
      getAllPhraseSets(), user ? getMyPhraseSets(user.uid) : Promise.resolve([]),
      user ? getMyGrammarSets(user.uid) : Promise.resolve([]),
      loadDefaultExercises(), user ? loadMyExercises(user.uid) : Promise.resolve([]),
    ]).then(([systemSets, mySets, systemPhrases, myPhrases, myGrammar, defaultExercises, myExercises]) => {
      const sets = [...mySets, ...systemSets]
      const learnedCounts = sets.map((set) => loadVocabProgress(set.slug, user?.uid).size)
      const learned = learnedCounts.reduce((sum, count) => sum + count, 0)
      const total = sets.reduce((sum, set) => sum + set.total, 0)
      const phrases = [...myPhrases, ...systemPhrases]
      const phraseLearned = phrases.reduce((sum, set) => sum + loadPhraseProgress(set.slug, user?.uid).size, 0)
      const grammarCount = grammarTopics.length + myGrammar.length
      const completedExercises = [...defaultExercises, ...myExercises].filter((exercise) => exercise.status === "Hoàn thành").length
      const completedVocab = sets.filter((set, index) => set.total > 0 && learnedCounts[index] >= set.total).length
      const completedPhrases = phrases.filter((set) => set.total > 0 && loadPhraseProgress(set.slug, user?.uid).size >= set.total).length
      const completedGrammar = countGrammarLearned([...grammarTopics.map((topic) => topic.slug), ...myGrammar.map((set) => set.slug)], user?.uid)
      const overallTotal = total + phrases.reduce((sum, set) => sum + set.total, 0) + grammarCount
      const overallLearned = learned + phraseLearned + myGrammar.filter((set) => set.progress >= 100).length
      setProgress(overallTotal ? Math.min(100, Math.round((overallLearned / overallTotal) * 100)) : 0)
      setStats([
        { label: "Từ đã học", value: learned.toLocaleString("vi-VN"), icon: BookText, color: "text-blue-600 bg-blue-50" },
        { label: "Đã hoàn thành", value: (completedVocab + completedPhrases + completedGrammar + completedExercises).toString(), icon: CheckCircle2, color: "text-green-600 bg-green-50" },
        { label: "Ngày liên tiếp", value: getStreak(user?.uid).toString(), icon: Flame, color: "text-orange-500 bg-orange-50" },
      ])
    })
    load()
    const refresh = () => { load() }
    window.addEventListener("afl-vocab-progress-updated", refresh)
    window.addEventListener("afl-phrase-progress-updated", refresh)
    window.addEventListener("afl-grammar-progress-updated", refresh)
    window.addEventListener("focus", refresh)
    return () => {
      window.removeEventListener("afl-vocab-progress-updated", refresh)
      window.removeEventListener("afl-phrase-progress-updated", refresh)
      window.removeEventListener("afl-grammar-progress-updated", refresh)
      window.removeEventListener("focus", refresh)
    }
  }, [user?.uid])
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <h3 className="text-base font-bold text-slate-900 dark:text-white">Thống kê học tập</h3>
      <div className="mt-4 flex justify-center">
        <div className="relative flex h-36 w-36 items-center justify-center">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-slate-100 dark:text-slate-800"
            />
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC - (progress / 100) * CIRC}
              className="text-teal-500"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">{progress}%</span>
            <span className="text-xs text-slate-400 dark:text-slate-400">Hoàn thành</span>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="flex flex-col items-center rounded-xl bg-slate-50 p-2.5 text-center dark:bg-slate-800/60"
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.color}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="mt-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">{s.value}</span>
              <span className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">{s.label}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
