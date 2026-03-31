import * as React from "react"

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: "default" | "green" | "red" | "blue" | "orange"
}

const accentMap = {
  default: "text-zinc-900",
  green: "text-emerald-600",
  red: "text-red-500",
  blue: "text-blue-600",
  orange: "text-orange-500",
}

export function StatCard({ label, value, sub, accent = "default" }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400 mb-1">{label}</p>
      <p className={`text-3xl font-bold tracking-tight ${accentMap[accent]}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
    </div>
  )
}
