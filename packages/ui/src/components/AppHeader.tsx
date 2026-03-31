import * as React from "react"
import { ArrowLeft } from "lucide-react"

interface AppHeaderProps {
  name: string
  actions?: React.ReactNode
  backHref?: string
  backLabel?: string
}

export function AppHeader({
  name,
  actions,
  backHref = "https://atlas-homevault.com",
  backLabel = "Mosaic",
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-zinc-200">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <a
            href={backHref}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 transition-colors text-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{backLabel}</span>
          </a>
          <div className="w-px h-4 bg-zinc-200" />
          <span className="font-semibold text-[15px] tracking-tight text-zinc-900">{name}</span>
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </header>
  )
}
