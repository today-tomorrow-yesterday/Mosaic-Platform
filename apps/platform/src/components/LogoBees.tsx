"use client"

import { useEffect, useRef, useState } from "react"
import type { SeasonId } from "@/lib/season"

/* ── Honeycomb geometry ──────────────────────────────────────────── */
const R = 5
const S = R * Math.sqrt(3)

const CELL_CENTERS: [number, number][] = [
  [0, 0],                           // center
  [S * 0.866, S * 0.5],             // right-top
  [0, S],                           // top
  [-S * 0.866, S * 0.5],            // left-top
  [-S * 0.866, -S * 0.5],           // left-bot
  [0, -S],                          // bottom
  [S * 0.866, -S * 0.5],            // right-bot
]

function hexPoints(cx: number, cy: number): string {
  return Array.from({ length: 6 }, (_, k) => {
    const a = (k * Math.PI) / 3
    return `${(cx + R * Math.cos(a)).toFixed(2)},${(cy + R * Math.sin(a)).toFixed(2)}`
  }).join(" ")
}

/* ── Season cell colors ──────────────────────────────────────────── */
interface CellStyle { fill: string; stroke: string }
interface SeasonCells { center: CellStyle; outer: CellStyle; alt?: CellStyle }

const SEASON_CELLS: Record<SeasonId, SeasonCells> = {
  spring: {
    center: { fill: "#FFB7C5", stroke: "#E8879A" },
    outer:  { fill: "#C8E6A0", stroke: "#8FBF5A" },
  },
  summer: {
    center: { fill: "#FFD000", stroke: "#E6A800" },
    outer:  { fill: "#FF8C2A", stroke: "#D4641A" },
  },
  fall: {
    center: { fill: "#D4621A", stroke: "#8B3A0F" },
    outer:  { fill: "#F0A500", stroke: "#B8720A" },
  },
  winter: {
    center: { fill: "#C8E8F5", stroke: "#6BAED6" },
    outer:  { fill: "#EAF6FB", stroke: "#A8D4EC" },
  },
  halloween: {
    center: { fill: "#1a0a2e", stroke: "#6b21a8" },
    outer:  { fill: "#7c2d12", stroke: "#ea580c" },
    alt:    { fill: "#3b0764", stroke: "#a855f7" },  // alternating outer cells
  },
  christmas: {
    center: { fill: "#14532d", stroke: "#166534" },
    outer:  { fill: "#15803d", stroke: "#4ade80" },
  },
}

/* ── Animation classes per season ────────────────────────────────── */
const SEASON_ENTRANCE: Record<SeasonId, string> = {
  spring:    "hc-spring-in",
  summer:    "hc-summer-in",
  fall:      "hc-fall-in",
  winter:    "hc-winter-in",
  halloween: "hc-halloween-in",
  christmas: "hc-christmas-in",
}

const SEASON_IDLE: Record<SeasonId, string | null> = {
  spring:    "hc-idle-spring",
  summer:    "hc-idle-summer",
  fall:      "hc-idle-fall",
  winter:    "hc-idle-winter",
  halloween: "hc-idle-halloween",
  christmas: null,  // fairy lights are the idle animation
}

/* ── Click emoji burst ───────────────────────────────────────────── */
const SEASON_PARTICLES: Record<SeasonId, string[]> = {
  spring:    ["🌸", "🌷", "🌿", "🦋", "🌱"],
  summer:    ["☀️", "🌻", "🍦", "🌊", "🔥"],
  fall:      ["🍂", "🍁", "🌾", "🍄"],
  winter:    ["❄️", "🌨️", "💎", "🫧"],
  halloween: ["🦇", "👻", "🎃", "🕷️", "💀"],
  christmas: ["⭐", "❄️", "🎁", "🔔", "✨"],
}

interface Particle {
  id: number
  tx: number
  ty: number
  rot: number
  emoji: string
  fontSize: number
  duration: number
}

/* ── Christmas fairy lights ──────────────────────────────────────── */
// Each outer cell's 2 outermost vertices — 12 total lights ringing the honeycomb.
// Flat-top hex r=5: outer vertices of each surrounding cell.
const XMAS_LIGHTS = [
  { cx: 12.5, cy:  4.33, color: "#ef4444", delay: "0s",    dur: "1.2s" },
  { cx: 10.0, cy:  8.66, color: "#facc15", delay: "0.35s", dur: "1.5s" },
  { cx:  2.5, cy: 13.0,  color: "#3b82f6", delay: "0.7s",  dur: "1.8s" },
  { cx: -2.5, cy: 13.0,  color: "#22c55e", delay: "0.15s", dur: "1.1s" },
  { cx:-10.0, cy:  8.66, color: "#facc15", delay: "0.55s", dur: "1.6s" },
  { cx:-12.5, cy:  4.33, color: "#ef4444", delay: "0.9s",  dur: "1.3s" },
  { cx:-12.5, cy: -4.33, color: "#3b82f6", delay: "0.25s", dur: "1.9s" },
  { cx:-10.0, cy: -8.66, color: "#22c55e", delay: "0.65s", dur: "1.4s" },
  { cx: -2.5, cy:-13.0,  color: "#facc15", delay: "0.45s", dur: "1.7s" },
  { cx:  2.5, cy:-13.0,  color: "#ef4444", delay: "0.8s",  dur: "1.0s" },
  { cx: 10.0, cy: -8.66, color: "#3b82f6", delay: "0.1s",  dur: "1.5s" },
  { cx: 12.5, cy: -4.33, color: "#22c55e", delay: "0.5s",  dur: "1.2s" },
]

/* ── Bees ────────────────────────────────────────────────────────── */
const BEES = [
  { id: 1, size: 13, path: 1, duration: 7.0,  delay: 0.0 },
  { id: 2, size: 11, path: 2, duration: 9.2,  delay: 0.4 },
  { id: 3, size: 15, path: 3, duration: 8.1,  delay: 1.0 },
  { id: 4, size: 10, path: 1, duration: 10.5, delay: 0.7 },
  { id: 5, size: 12, path: 2, duration: 8.6,  delay: 1.3 },
] as const

/* ── Component ───────────────────────────────────────────────────── */
interface Props {
  season: SeasonId
}

export function LogoBees({ season }: Props) {
  const [fading, setFading] = useState(false)
  const [gone, setGone] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const particleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const fadeTimer   = setTimeout(() => setFading(true), 9000)
    const removeTimer = setTimeout(() => setGone(true),   11000)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  function handleHoneycombClick(e: React.MouseEvent) {
    e.stopPropagation()
    const emojis = SEASON_PARTICLES[season]
    const newParticles: Particle[] = Array.from({ length: 8 }, (_, i) => {
      const baseAngle = (i / 8) * Math.PI * 2
      const jitter    = (Math.random() - 0.5) * 0.8
      const angle     = baseAngle + jitter
      const dist      = 26 + Math.random() * 20
      return {
        id:       Date.now() + i,
        tx:       Math.cos(angle) * dist,
        ty:       Math.sin(angle) * dist,
        rot:      (Math.random() - 0.5) * 360,
        emoji:    emojis[Math.floor(Math.random() * emojis.length)] ?? "✨",
        fontSize: 10 + Math.random() * 6,
        duration: 0.6 + Math.random() * 0.2,
      }
    })
    setParticles(newParticles)
    if (particleTimer.current) clearTimeout(particleTimer.current)
    particleTimer.current = setTimeout(() => setParticles([]), 900)
  }

  const cells       = SEASON_CELLS[season]
  const idleClass   = SEASON_IDLE[season]

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative w-8 h-8 flex items-center justify-center">

        {/*
          key={season} remounts this div when season changes,
          replaying the entrance animation for the new season.
        */}
        <div key={season} className={SEASON_ENTRANCE[season]} style={{ lineHeight: 0 }}>
          <svg
            viewBox="-13 -13 26 26"
            width="32"
            height="32"
            aria-hidden="true"
            className={idleClass ?? undefined}
            onClick={handleHoneycombClick}
            style={{ cursor: "pointer", overflow: "visible", display: "block" }}
          >
            {/* Honeycomb cells */}
            {CELL_CENTERS.map(([cx, cy], i) => {
              let style: CellStyle
              if (i === 0) {
                style = cells.center
              } else if (season === "halloween" && cells.alt && i % 2 === 0) {
                style = cells.alt   // alternating purple cells
              } else {
                style = cells.outer
              }
              return (
                <polygon
                  key={i}
                  points={hexPoints(cx, cy)}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth="0.6"
                />
              )
            })}

            {/* Christmas fairy lights — 12 dots at outer vertices, each blinking independently */}
            {season === "christmas" && XMAS_LIGHTS.map((l, i) => (
              <circle
                key={i}
                cx={l.cx}
                cy={l.cy}
                r="1.4"
                fill={l.color}
                style={{
                  animation: `xmas-blink ${l.dur} ease-in-out ${l.delay} infinite`,
                  filter: `drop-shadow(0 0 1.5px ${l.color})`,
                }}
              />
            ))}
          </svg>
        </div>

        {/* Emoji particles on click */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="hc-particle"
            style={{
              "--tx": `${p.tx}px`,
              "--ty": `${p.ty}px`,
              "--rot": `${p.rot}deg`,
              fontSize: `${p.fontSize}px`,
              animationDuration: `${p.duration}s`,
            } as React.CSSProperties}
          >
            {p.emoji}
          </div>
        ))}

        {/* Orbiting bees — fade out after 9s, unmount after 11s */}
        {!gone && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ transition: "opacity 2s ease", opacity: fading ? 0 : 1 }}
          >
            {BEES.map((bee) => (
              <div
                key={bee.id}
                className="absolute"
                style={{
                  left: "50%",
                  top: "50%",
                  animation: `bee-orbit-${bee.path} ${bee.duration}s ease-in-out infinite`,
                  animationDelay: `${bee.delay}s`,
                }}
              >
                <div
                  style={{
                    animation: "bee-buzz 0.28s ease-in-out infinite",
                    animationDelay: `${bee.delay * 0.3}s`,
                    fontSize: bee.size,
                    lineHeight: 1,
                    userSelect: "none",
                  }}
                >
                  🐝
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <span className="font-body text-[14px] font-semibold tracking-tight text-[var(--s-text-primary)]">
        Mosaic
      </span>
    </div>
  )
}
