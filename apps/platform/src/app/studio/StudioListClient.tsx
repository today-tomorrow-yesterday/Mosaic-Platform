"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { ArrowLeft, Plus, Wand2, Clock, Rocket, Archive, Search } from "lucide-react"

// ============================================================================
// STUDIO LIST VIEW
// Shows all saved prototypes in a grid with status badges, search, and
// a prominent "New App" card. Entry point for the AI app builder.
// ============================================================================

type StatusFilter = "all" | "prototype" | "live" | "archived"

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  draft:     { label: "Draft",     color: "#9ca3af", bg: "rgba(156,163,175,0.1)", border: "rgba(156,163,175,0.2)" },
  saved:     { label: "Prototype", color: "#60a5fa", bg: "rgba(96,165,250,0.1)",  border: "rgba(96,165,250,0.2)" },
  prototype: { label: "Prototype", color: "#60a5fa", bg: "rgba(96,165,250,0.1)",  border: "rgba(96,165,250,0.2)" },
  live:      { label: "Live",      color: "#34d399", bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.2)" },
  archived:  { label: "Archived",  color: "#6b7280", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.2)" },
}

export function StudioListClient(): React.ReactElement {
  const prototypes = useQuery(api.features.studio.queries.listSaved)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<StatusFilter>("all")

  // ── Magnetic dot canvas — draws displaced dots near the cursor ──────────
  const magnetCanvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const rafRef = useRef(0)

  useEffect(() => {
    const canvas = magnetCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let active = true

    const resize = (): void => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    const GRID = 28          // must match CSS grid size
    const RADIUS = 150       // magnetic influence radius in px
    const PULL_STRENGTH = 12 // max displacement toward cursor in px
    const DOT_BASE = 1.5     // base dot radius
    const DOT_GLOW = 3       // max dot radius at cursor center

    const draw = (): void => {
      if (!active) return
      rafRef.current = requestAnimationFrame(draw)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const mx = mouseRef.current.x
      const my = mouseRef.current.y
      if (mx < -500) return // cursor not on page

      // Only draw dots within the influence radius for performance
      const startCol = Math.max(0, Math.floor((mx - RADIUS) / GRID))
      const endCol = Math.min(Math.ceil(canvas.width / GRID), Math.ceil((mx + RADIUS) / GRID))
      const startRow = Math.max(0, Math.floor((my - RADIUS) / GRID))
      const endRow = Math.min(Math.ceil(canvas.height / GRID), Math.ceil((my + RADIUS) / GRID))

      for (let col = startCol; col <= endCol; col++) {
        for (let row = startRow; row <= endRow; row++) {
          const gridX = col * GRID
          const gridY = row * GRID
          const dx = mx - gridX
          const dy = my - gridY
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist > RADIUS) continue

          const intensity = Math.pow(1 - dist / RADIUS, 1.5)
          // Pull the dot toward the cursor
          const pullX = (dx / (dist || 1)) * PULL_STRENGTH * intensity
          const pullY = (dy / (dist || 1)) * PULL_STRENGTH * intensity
          const dotR = DOT_BASE + (DOT_GLOW - DOT_BASE) * intensity
          const alpha = 0.15 + intensity * 0.6

          ctx.beginPath()
          ctx.arc(gridX + pullX, gridY + pullY, dotR, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(96, 165, 250, ${alpha})`
          ctx.fill()
        }
      }
    }
    draw()

    return () => {
      active = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener("resize", resize)
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    mouseRef.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -1000, y: -1000 }
  }, [])

  const filtered = (prototypes ?? []).filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filter === "all") return true
    if (filter === "prototype") return p.status === "saved" || p.status === "draft"
    return p.status === filter
  })

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        minHeight: "100vh", background: "#0c0b18", position: "relative", overflow: "hidden",
        color: "white", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Graph canvas background — dot grid with radial vignette */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
      }}>
        {/* Dot grid */}
        <div className="studio-graph-grid" />
        {/* Magnetic dot canvas — displaced dots follow cursor */}
        <canvas
          ref={magnetCanvasRef}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1 }}
        />
        {/* Radial vignette — visible center, blurred/shadowed edges */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 60% 50% at 50% 50%, transparent 0%, rgba(12,11,24,0.6) 50%, rgba(12,11,24,0.95) 80%, #0c0b18 100%)",
        }} />
      </div>

      <style>{`
        .studio-graph-grid {
          position: absolute;
          inset: -20%;
          width: 140%;
          height: 140%;
          background-image: radial-gradient(circle, rgba(96,165,250,0.35) 1.5px, transparent 1.5px);
          background-size: 28px 28px;
          animation: graphDrift 20s ease-in-out infinite;
          will-change: transform;
        }
        @keyframes graphDrift {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-8px, 5px); }
          50% { transform: translate(5px, -8px); }
          75% { transform: translate(-3px, -4px); }
        }
      `}</style>
      <style>{`
        @keyframes studioElIn {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .studio-card-enter {
          animation: studioCardIn 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes studioCardIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "24px 32px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "relative", zIndex: 1,
        animation: "studioElIn 360ms cubic-bezier(0.22, 1, 0.36, 1) 100ms both",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link
            href="/"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.6)", textDecoration: "none",
            }}
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>AI Studio</h1>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "2px 0 0", fontWeight: 500 }}>
              Build apps from plain English
            </p>
          </div>
        </div>
        <Link
          href="/studio/new"
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
            borderRadius: 12, background: "#60a5fa", color: "white",
            fontSize: 13, fontWeight: 600, textDecoration: "none",
            border: "none", cursor: "pointer",
          }}
        >
          <Plus size={16} /> New App
        </Link>
      </header>

      {/* Toolbar */}
      <div style={{
        padding: "20px 32px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        position: "relative", zIndex: 1,
        animation: "studioElIn 360ms cubic-bezier(0.22, 1, 0.36, 1) 180ms both",
      }}>
        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
          borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
          flex: "1 1 200px", maxWidth: 320,
        }}>
          <Search size={14} color="rgba(255,255,255,0.3)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search apps..."
            style={{
              background: "none", border: "none", outline: "none", color: "white",
              fontSize: 13, fontWeight: 500, width: "100%",
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "prototype", "live", "archived"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 14px", borderRadius: 9999, border: "1px solid",
                borderColor: filter === f ? "rgba(96,165,250,0.4)" : "rgba(255,255,255,0.08)",
                background: filter === f ? "rgba(96,165,250,0.12)" : "rgba(255,255,255,0.03)",
                color: filter === f ? "#93c5fd" : "rgba(255,255,255,0.45)",
                fontSize: 12, fontWeight: 500, cursor: "pointer", textTransform: "capitalize",
              }}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{
        padding: "0 32px 64px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20,
        position: "relative", zIndex: 1,
      }}>
        {/* New App card */}
        <Link
          href="/studio/new"
          className="studio-card-enter hover:bg-blue-500/10 hover:border-blue-400/40 transition-colors duration-200"
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            minHeight: 220, borderRadius: 20, textDecoration: "none",
            animationDelay: "260ms",
            background: "rgba(96,165,250,0.06)", border: "2px dashed rgba(96,165,250,0.25)",
            color: "#60a5fa", cursor: "pointer", gap: 12,
          }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Plus size={22} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Create New App</span>
          <span style={{ fontSize: 11, color: "rgba(96,165,250,0.6)" }}>Describe it in plain English</span>
        </Link>

        {/* Prototype cards */}
        {filtered.map((proto, i) => {
          const status = STATUS_CONFIG[proto.status] ?? { label: "Prototype", color: "#60a5fa", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.2)" }
          return (
            <Link
              key={proto._id}
              href={`/studio/${proto._id}`}
              className="studio-card-enter hover:bg-white/[0.06] hover:border-white/15 transition-colors duration-200"
              style={{
                display: "flex", flexDirection: "column", minHeight: 220,
                borderRadius: 20, textDecoration: "none", overflow: "hidden",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer",
                animationDelay: `${330 + i * 60}ms`,
              }}
            >
              {/* Preview area */}
              <div style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(0,0,0,0.2)", borderBottom: "1px solid rgba(255,255,255,0.05)",
                minHeight: 120,
              }}>
                <Wand2 size={28} color="rgba(255,255,255,0.15)" />
              </div>

              {/* Footer */}
              <div style={{ padding: "14px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "white", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {proto.name}
                  </h3>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 9999,
                    background: status.bg, color: status.color, border: `1px solid ${status.border}`,
                  }}>
                    {status.label}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={11} color="rgba(255,255,255,0.3)" />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                    {new Date(proto.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>
            </Link>
          )
        })}

        {/* Empty state */}
        {prototypes && prototypes.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 0" }}>
            <Wand2 size={40} color="rgba(255,255,255,0.15)" style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>No apps yet</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>Create your first app to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
