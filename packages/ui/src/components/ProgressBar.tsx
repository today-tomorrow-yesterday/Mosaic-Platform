import * as React from "react"

interface ProgressBarProps {
  value: number
  max: number
  color?: "green" | "blue" | "orange" | "red" | "pink" | "zinc"
}

const colorMap = {
  green: "bg-emerald-500",
  blue: "bg-blue-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
  pink: "bg-pink-500",
  zinc: "bg-zinc-400",
}

export function ProgressBar({ value, max, color = "zinc" }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const isOver = value > max
  return (
    <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${isOver ? "bg-red-500" : colorMap[color]}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
