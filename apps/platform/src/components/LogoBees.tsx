"use client"

import { useEffect, useState } from "react"

/* ── Honeycomb geometry ─────────────────────────────────────────── */
// Flat-top hexagons, circumradius r=5, 7 cells: center + 6 surrounding.
// Adjacent cell distance = r√3 ≈ 8.66. ViewBox "-13 -13 26 26" fits all.

const R = 5
const S = R * Math.sqrt(3) // ≈ 8.66 — center-to-center spacing

const CELL_CENTERS: [number, number][] = [
  [0, 0],
  [S * 0.866, S * 0.5],   // right-top  (30°)
  [0, S],                  // top        (90°)
  [-S * 0.866, S * 0.5],  // left-top   (150°)
  [-S * 0.866, -S * 0.5], // left-bot   (210°)
  [0, -S],                 // bottom     (270°)
  [S * 0.866, -S * 0.5],  // right-bot  (330°)
]

function hexPoints(cx: number, cy: number): string {
  return Array.from({ length: 6 }, (_, k) => {
    const a = (k * Math.PI) / 3
    return `${(cx + R * Math.cos(a)).toFixed(2)},${(cy + R * Math.sin(a)).toFixed(2)}`
  }).join(" ")
}

/* ── Bee data ───────────────────────────────────────────────────── */

const BEES = [
  { id: 1, size: 13, path: 1, duration: 7.0, delay: 0.0 },
  { id: 2, size: 11, path: 2, duration: 9.2, delay: 0.4 },
  { id: 3, size: 15, path: 3, duration: 8.1, delay: 1.0 },
  { id: 4, size: 10, path: 1, duration: 10.5, delay: 0.7 },
  { id: 5, size: 12, path: 2, duration: 8.6, delay: 1.3 },
] as const

/* ── Component ──────────────────────────────────────────────────── */

export function LogoBees() {
  const [fading, setFading] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const fadeTimer   = setTimeout(() => setFading(true), 9000)
    const removeTimer = setTimeout(() => setGone(true),  11000)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  return (
    <div className="flex items-center gap-2.5">
      {/* Honeycomb anchor — bees orbit from its center */}
      <div className="relative w-8 h-8 flex items-center justify-center">
        <svg
          viewBox="-13 -13 26 26"
          width="32"
          height="32"
          aria-hidden="true"
        >
          {CELL_CENTERS.map(([cx, cy], i) => (
            <polygon
              key={i}
              points={hexPoints(cx, cy)}
              fill="#fbbf24"
              fillOpacity={i === 0 ? 1 : 0.72}
              stroke="#b45309"
              strokeWidth="0.6"
            />
          ))}
        </svg>

        {/* Orbiting bees — positioned at honeycomb center, animated outward */}
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
