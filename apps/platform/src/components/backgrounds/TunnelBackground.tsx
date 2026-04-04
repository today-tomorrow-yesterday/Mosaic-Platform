"use client"

import React, { useRef, useEffect } from "react"

// ============================================================================
// TUNNEL BACKGROUND (Canvas 2D)
// Procedural infinite tunnel flight using 2D perspective projection.
// Lightweight alternative to the Three.js simplex noise version.
// ============================================================================

export interface TunnelParams { ecoMode: boolean }
export const DEFAULT_TUNNEL_PARAMS: TunnelParams = { ecoMode: false }

export function TunnelBackground({ params }: { params: TunnelParams }): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let w = 0, h = 0, active = true, time = 0

    const resize = (): void => {
      const parent = canvas.parentElement
      if (!parent) return
      w = canvas.width = parent.offsetWidth
      h = canvas.height = parent.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    const animate = (): void => {
      if (!active) return
      requestAnimationFrame(animate)
      time += 0.015
      ctx.fillStyle = "#b6c2cc"
      ctx.fillRect(0, 0, w, h)

      const cx = w / 2, cy = h / 2
      const layers = 30
      for (let i = layers; i >= 0; i--) {
        const depth = (i + time * 3) % layers
        const scale = 1 / (depth * 0.1 + 0.1)
        const size = Math.min(w, h) * scale * 0.5
        const wobbleX = Math.sin(depth * 0.3 + time) * 20 * (1 / (depth + 1))
        const wobbleY = Math.cos(depth * 0.2 + time * 0.7) * 15 * (1 / (depth + 1))

        const alpha = Math.max(0, 1 - depth / layers)
        const shade = Math.floor(30 + (depth / layers) * 150)
        ctx.strokeStyle = `rgba(${shade}, ${shade + 10}, ${shade + 20}, ${alpha * 0.6})`
        ctx.lineWidth = Math.max(1, 3 - depth * 0.1)
        ctx.beginPath()
        ctx.rect(cx - size / 2 + wobbleX, cy - size / 2 + wobbleY, size, size)
        ctx.stroke()
      }

      // Ground plane lines
      for (let i = 0; i < 20; i++) {
        const z = (i + time * 2) % 20
        const y = cy + (h * 0.4) / (z * 0.15 + 0.5)
        const alpha = Math.max(0, 1 - z / 20)
        ctx.strokeStyle = `rgba(50, 50, 60, ${alpha * 0.4})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }
    }
    animate()

    return () => { active = false; ro.disconnect() }
  }, [])

  return (
    <div className="absolute inset-0 z-0 pointer-events-none" style={{ overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  )
}
