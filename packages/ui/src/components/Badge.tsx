import * as React from "react"
import { cn } from "../lib/utils"

type BadgeVariant = "default" | "green" | "blue" | "orange" | "red" | "pink"

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
}

const variantMap: Record<BadgeVariant, string> = {
  default: "bg-zinc-100 text-zinc-500 border-zinc-200",
  green: "bg-emerald-50 text-emerald-600 border-emerald-200",
  blue: "bg-blue-50 text-blue-600 border-blue-200",
  orange: "bg-orange-50 text-orange-600 border-orange-200",
  red: "bg-red-50 text-red-600 border-red-200",
  pink: "bg-pink-50 text-pink-600 border-pink-200",
}

export function Badge({ children, variant = "default" }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", variantMap[variant])}>
      {children}
    </span>
  )
}
