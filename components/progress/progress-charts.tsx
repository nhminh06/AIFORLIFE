"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { DailyPoint, WeeklyPoint } from "@/lib/progress-service"

export function DailyChart({ data }: { data: DailyPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(v) => [`${v} phút`, "Thời gian học"]}
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
          />
          <Bar dataKey="minutes" name="Phút học" fill="#2563eb" radius={[8, 8, 4, 4]} maxBarSize={44} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function WeeklyChart({ data }: { data: WeeklyPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
          />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          <Line type="monotone" dataKey="words" name="Từ đã học" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="lessons" name="Bài hoàn thành" stroke="#9333ea" strokeWidth={2.5} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
