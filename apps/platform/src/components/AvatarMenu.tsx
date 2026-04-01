"use client"

import { useEffect, useRef, useState } from "react"
import { useUser, useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Check, Loader2, LogOut, Sparkles, UserRound } from "lucide-react"
import { setSeasonOverride } from "@/app/actions"
import { SEASON_META } from "@/lib/season"
import type { SeasonId } from "@/lib/season"

const SEASONS = Object.values(SEASON_META).map((m, i) => ({
  ...m,
  id: Object.keys(SEASON_META)[i] as SeasonId,
}))

interface Props {
  activeSeason: SeasonId | "auto"
}

export function AvatarMenu({ activeSeason }: Props) {
  const { user } = useUser()
  const { signOut, openUserProfile } = useClerk()
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)

  const [open, setOpen] = useState(false)
  // Optimistic — updates instantly on click; syncs back when server re-renders
  const [displaySeason, setDisplaySeason] = useState<SeasonId | "auto">(activeSeason)
  const [pending, setPending] = useState<SeasonId | "auto" | null>(null)

  // Sync when server re-renders with the new cookie value
  useEffect(() => {
    setDisplaySeason(activeSeason)
  }, [activeSeason])

  // Close on outside click
  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onOutsideClick)
    return () => document.removeEventListener("mousedown", onOutsideClick)
  }, [])

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    if (open) document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open])

  async function handleSeasonSelect(season: SeasonId | "auto") {
    if (pending !== null) return
    setDisplaySeason(season)   // optimistic — instant visual update
    setPending(season)
    await setSeasonOverride(season)
    router.refresh()           // re-renders layout with new CSS vars
    setPending(null)
    // intentionally no setOpen(false) — user stays in the menu
  }

  const avatarUrl = user?.imageUrl
  const initials = (user?.firstName?.[0] ?? user?.lastName?.[0] ?? "?").toUpperCase()

  const currentMeta = displaySeason !== "auto" ? SEASON_META[displaySeason] : null
  const currentLabel = currentMeta
    ? `${currentMeta.emoji} ${currentMeta.label}`
    : "✨ Auto"

  return (
    <div ref={ref} className="relative">

      {/* ── Avatar trigger ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open settings"
        aria-expanded={open}
        className="block w-8 h-8 rounded-full overflow-hidden focus:outline-none transition-all duration-200"
        style={{
          boxShadow: open
            ? "0 0 0 2.5px var(--s-accent)"
            : "0 0 0 2px transparent",
        }}
        onMouseEnter={(e) => {
          if (!open) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 0 2px var(--s-accent)"
        }}
        onMouseLeave={(e) => {
          if (!open) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 0 2px transparent"
        }}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-zinc-200 flex items-center justify-center text-[11px] font-bold text-zinc-600">
            {initials}
          </div>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div
          className="animate-dropdown-in absolute right-0 top-11 z-50 w-[252px] rounded-2xl bg-white"
          style={{
            border: "1px solid #e4e7eb",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 16px 48px -8px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.03)",
          }}
        >

          {/* User info */}
          <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid #f0f2f5" }}>
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-500">
                  {initials}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-zinc-800 truncate leading-tight">
                {user?.fullName ?? user?.firstName ?? "—"}
              </p>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                {user?.primaryEmailAddress?.emailAddress ?? ""}
              </p>
            </div>
          </div>

          {/* Season picker */}
          <div className="px-3 pt-3 pb-2.5">

            {/* Section header with live current label */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-zinc-400" />
                <span
                  className="text-[10px] font-semibold uppercase text-zinc-400"
                  style={{ letterSpacing: "0.13em" }}
                >
                  Theme
                </span>
              </div>
              <span
                className="text-[11px] font-semibold transition-colors duration-300"
                style={{ color: currentMeta?.accent ?? "#6b7280" }}
              >
                {currentLabel}
              </span>
            </div>

            {/* 3 × 2 season grid */}
            <div className="grid grid-cols-3 gap-1.5 mb-1.5">
              {SEASONS.map((s) => {
                const isActive  = displaySeason === s.id
                const isPending = pending === s.id

                return (
                  <button
                    key={s.id}
                    onClick={() => handleSeasonSelect(s.id)}
                    disabled={isPending}
                    className="relative flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl border-2 transition-all duration-200 hover:scale-[1.04] active:scale-[0.97]"
                    style={{
                      background:   isActive ? s.tint    : "#f7f8fa",
                      borderColor:  isActive ? s.accent  : "transparent",
                    }}
                  >
                    {/* Check or spinner in top-right */}
                    {isPending ? (
                      <Loader2
                        className="absolute top-1 right-1 w-3 h-3 animate-spin"
                        style={{ color: s.accent }}
                      />
                    ) : isActive ? (
                      <div
                        className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                        style={{ background: s.accent }}
                      >
                        <Check className="w-2 h-2 text-white" strokeWidth={3} />
                      </div>
                    ) : null}

                    <span style={{ fontSize: 18, lineHeight: 1 }}>{s.emoji}</span>
                    <span
                      className="text-[9px] font-semibold"
                      style={{
                        color:          isActive ? s.accent : "#9ca3af",
                        letterSpacing:  "0.04em",
                      }}
                    >
                      {s.label.toUpperCase()}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Auto button */}
            <button
              onClick={() => handleSeasonSelect("auto")}
              disabled={pending === "auto"}
              className="relative w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 text-[11px] font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
              style={{
                background:  displaySeason === "auto" ? "rgba(107,114,128,0.08)" : "#f3f4f6",
                borderColor: displaySeason === "auto" ? "#9ca3af"                : "transparent",
                color:       displaySeason === "auto" ? "#374151"                : "#9ca3af",
              }}
            >
              {pending === "auto" && (
                <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />
              )}
              {displaySeason === "auto" && pending !== "auto" && (
                <Check className="w-3 h-3" strokeWidth={3} style={{ color: "#6b7280" }} />
              )}
              ✨ Auto (follow calendar)
            </button>
          </div>

          {/* Actions */}
          <div className="px-2 pb-2 pt-0.5" style={{ borderTop: "1px solid #f0f2f5" }}>
            <button
              onClick={() => { openUserProfile(); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 transition-colors duration-150"
            >
              <UserRound className="w-3.5 h-3.5 shrink-0" />
              Manage account
            </button>
            <button
              onClick={() => signOut({ redirectUrl: "/" })}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-150"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              Sign out
            </button>
          </div>

        </div>
      )}
    </div>
  )
}
