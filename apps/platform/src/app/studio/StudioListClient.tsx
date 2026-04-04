"use client"

import React, { useState } from "react"
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

  const filtered = (prototypes ?? []).filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filter === "all") return true
    if (filter === "prototype") return p.status === "saved" || p.status === "draft"
    return p.status === filter
  })

  return (
    <div style={{
      minHeight: "100vh", background: "radial-gradient(ellipse 120% 80% at 50% -10%, #16133a 0%, #0c0b18 38%, #07060e 70%, #060509 100%)",
      color: "white", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "24px 32px", borderBottom: "1px solid rgba(255,255,255,0.06)",
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
      <div style={{ padding: "20px 32px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
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
      <div style={{ padding: "0 32px 64px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
        {/* New App card */}
        <Link
          href="/studio/new"
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            minHeight: 220, borderRadius: 20, textDecoration: "none",
            background: "rgba(96,165,250,0.06)", border: "2px dashed rgba(96,165,250,0.25)",
            color: "#60a5fa", cursor: "pointer", gap: 12,
            transition: "all 0.2s ease",
          }}
          className="hover:bg-blue-500/10 hover:border-blue-400/40"
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
        {filtered.map(proto => {
          const status = STATUS_CONFIG[proto.status] ?? { label: "Prototype", color: "#60a5fa", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.2)" }
          return (
            <Link
              key={proto._id}
              href={`/studio/${proto._id}`}
              style={{
                display: "flex", flexDirection: "column", minHeight: 220,
                borderRadius: 20, textDecoration: "none", overflow: "hidden",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                transition: "all 0.2s ease", cursor: "pointer",
              }}
              className="hover:bg-white/[0.06] hover:border-white/15"
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
