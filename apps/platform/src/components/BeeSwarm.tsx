"use client"

import { useEffect, useState } from "react"

const BEES = [
  { id: 1, size: 28, startX: 8,  startY: 72, path: 1, duration: 7.0, delay: 0.0  },
  { id: 2, size: 22, startX: 78, startY: 82, path: 2, duration: 9.2, delay: 0.4  },
  { id: 3, size: 32, startX: 48, startY: 65, path: 3, duration: 8.1, delay: 1.0  },
  { id: 4, size: 20, startX: 88, startY: 42, path: 4, duration: 11.0, delay: 0.2 },
  { id: 5, size: 26, startX: 22, startY: 88, path: 1, duration: 8.6, delay: 0.7  },
  { id: 6, size: 24, startX: 62, startY: 78, path: 2, duration: 10.3, delay: 1.3 },
  { id: 7, size: 30, startX: 35, startY: 92, path: 3, duration: 7.4, delay: 0.5  },
] as const

export function BeeSwarm() {
  const [fading, setFading] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const fadeTimer  = setTimeout(() => setFading(true),  9000)
    const removeTimer = setTimeout(() => setGone(true),   11000)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  if (gone) return null

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50"
      style={{ transition: "opacity 2s ease", opacity: fading ? 0 : 1 }}
    >
      {BEES.map((bee) => (
        <div
          key={bee.id}
          className="absolute"
          style={{
            left: `${bee.startX}%`,
            top: `${bee.startY}%`,
            animation: `bee-drift-${bee.path} ${bee.duration}s ease-in-out infinite`,
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
  )
}
