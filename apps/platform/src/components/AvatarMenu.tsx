"use client"

import { useEffect, useRef, useState } from "react"
import { useUser, useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { LogOut, UserRound, Sparkles } from "lucide-react"
import { setSeasonOverride } from "@/app/actions"
import type { SeasonId } from "@/lib/season"

const SEASONS: { id: SeasonId; label: string; emoji: string }[] = [
  { id: "spring",    label: "Spring",    emoji: "🌸" },
  { id: "summer",    label: "Summer",    emoji: "☀️" },
  { id: "fall",      label: "Fall",      emoji: "🍂" },
  { id: "winter",    label: "Winter",    emoji: "❄️" },
  { id: "halloween", label: "Halloween", emoji: "🎃" },
  { id: "christmas", label: "Christmas", emoji: "🎄" },
]

interface Props {
  activeSeason: SeasonId | "auto"
}

export function AvatarMenu({ activeSeason }: Props) {
  const { user } = useUser()
  const { signOut, openUserProfile } = useClerk()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<SeasonId | "auto" | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onOutsideClick)
    return () => document.removeEventListener("mousedown", onOutsideClick)
  }, [])

  async function handleSeasonSelect(season: SeasonId | "auto") {
    if (pending !== null) return
    setPending(season)
    await setSeasonOverride(season)
    router.refresh()
    setPending(null)
    setOpen(false)
  }

  const avatarUrl = user?.imageUrl
  const initials = user?.firstName?.[0] ?? user?.lastName?.[0] ?? "?"

  return (
    <div ref={ref} className="relative">
      {/* Avatar trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="block w-8 h-8 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-[var(--s-accent)] focus:outline-none focus:ring-[var(--s-accent)] transition-all duration-200"
        aria-label="Settings"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-zinc-200 flex items-center justify-center text-[11px] font-semibold text-zinc-600">
            {initials}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-10 z-50 w-[220px] rounded-2xl border bg-white shadow-2xl"
          style={{ borderColor: "#e8ecef", boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
        >
          {/* User info */}
          <div className="px-4 py-3" style={{ borderBottom: "1px solid #f0f2f5" }}>
            <p className="text-[13px] font-semibold text-zinc-800 truncate leading-none">
              {user?.fullName ?? user?.firstName ?? "—"}
            </p>
            <p className="text-[11px] text-zinc-400 truncate mt-1">
              {user?.primaryEmailAddress?.emailAddress ?? ""}
            </p>
          </div>

          {/* Season picker */}
          <div className="px-3 pt-3 pb-2">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3 h-3 text-zinc-400" />
              <p
                className="text-[10px] font-semibold uppercase text-zinc-400"
                style={{ letterSpacing: "0.14em" }}
              >
                Season Theme
              </p>
            </div>

            <div className="grid grid-cols-3 gap-1.5 mb-1.5">
              {SEASONS.map((s) => {
                const isActive = activeSeason === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSeasonSelect(s.id)}
                    disabled={pending !== null}
                    className="flex flex-col items-center gap-1 pt-2 pb-1.5 rounded-[10px] transition-all duration-150 hover:scale-105 active:scale-95"
                    style={{
                      background: isActive ? "var(--s-accent)" : "#f7f8fa",
                      opacity: pending !== null && pending !== s.id ? 0.5 : 1,
                    }}
                  >
                    <span style={{ fontSize: 17, lineHeight: 1 }}>{s.emoji}</span>
                    <span
                      className="text-[9px] font-semibold"
                      style={{ color: isActive ? "#fff" : "#5e6e7a", letterSpacing: "0.02em" }}
                    >
                      {s.label}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Auto */}
            <button
              onClick={() => handleSeasonSelect("auto")}
              disabled={pending !== null}
              className="w-full rounded-[10px] py-1.5 text-[11px] font-medium transition-all duration-150"
              style={{
                background: activeSeason === "auto" ? "var(--s-accent)" : "#f0f2f5",
                color: activeSeason === "auto" ? "#fff" : "#5e6e7a",
                opacity: pending === "auto" ? 0.5 : 1,
              }}
            >
              ✨ Auto
            </button>
          </div>

          {/* Actions */}
          <div className="px-2 pb-2 pt-1" style={{ borderTop: "1px solid #f0f2f5" }}>
            <button
              onClick={() => { openUserProfile(); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 transition-colors duration-150"
            >
              <UserRound className="w-3.5 h-3.5" />
              Manage account
            </button>
            <button
              onClick={() => signOut({ redirectUrl: "/" })}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-150"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
