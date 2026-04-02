"use client"

import React, { useMemo } from "react"
import { X, FlaskConical, ImageIcon, Play, Pause } from "lucide-react"

// ── Engine types ─────────────────────────────────────────────────────────────

export const ENGINE = {
  OFF:       "off",
  LINEAR:    "linear",
  RADIAL:    "radial",
  CRYSTAL:   "crystal",
  BITPACKED: "bitpacked",
} as const

export type EngineType = (typeof ENGINE)[keyof typeof ENGINE]

export type BgSelection = { url: string; position: string } | null

export type GlassParams = {
  engine: EngineType
  blur: number
  refraction: number
  opacity: number
  tint: "light" | "dark"
  bgImage: BgSelection                    // background image behind bento cards
  stackBgImages: Record<string, BgSelection>  // per-profile background images for the stack
  bgMotion: boolean                       // slow drift animation on background images
  bgMotionSpeed: number                   // drift animation duration in seconds (lower = faster)
}

export const DEFAULT_GLASS: GlassParams = {
  engine: ENGINE.LINEAR,
  blur: 6,
  refraction: 0.10,
  opacity: 0.08,
  tint: "dark",
  bgImage: null,
  stackBgImages: {},
  bgMotion: false,
  bgMotionSpeed: 12,
}

// ── Background image registry ────────────────────────────────────────────────
// Add new entries here to make them available in the Lab panel.

export type BgEntry = { label: string; url: string; position?: string }

export const BG_IMAGES: BgEntry[] = [
  { label: "Tulips",     url: "/glass/tulips.png" },
  { label: "Tulips Alt", url: "/glass/tulips-alt.png" },
  { label: "Tahoe",      url: "/glass/tahoe.png" },
  { label: "Sonoma",     url: "/glass/sonoma.jpeg" },
  { label: "Apple",      url: "/glass/apple.jpg" },
]

// ── Presets ───────────────────────────────────────────────────────────────────

const PRESETS: { label: string; engine: EngineType; params: Partial<GlassParams> }[] = [
  { label: "Off",          engine: ENGINE.OFF,       params: { blur: 0, refraction: 0, opacity: 0 } },
  { label: "Frost",        engine: ENGINE.LINEAR,    params: { blur: 20, refraction: 0.01, opacity: 0.15 } },
  { label: "Linear",       engine: ENGINE.LINEAR,    params: { blur: 6, refraction: 0.10, opacity: 0.08 } },
  { label: "Radial Lens",  engine: ENGINE.RADIAL,    params: { blur: 8, refraction: 0.08, opacity: 0.10 } },
  { label: "Crystal",      engine: ENGINE.CRYSTAL,   params: { blur: 2, refraction: 0.60, opacity: 0.06 } },
  { label: "Bit-Packed",   engine: ENGINE.BITPACKED, params: { blur: 4, refraction: 0.20, opacity: 0.05 } },
]

// ── SVG map generators ───────────────────────────────────────────────────────

function buildLinearMap(radius: number): string {
  const sz = 1000
  const m = 20
  const r = Math.min(radius * 2.5, sz / 2)
  const p = `M${m + r} ${m} L${sz - m - r} ${m} Q${sz - m} ${m} ${sz - m} ${m + r} L${sz - m} ${sz - m - r} Q${sz - m} ${sz - m} ${sz - m - r} ${sz - m} L${m + r} ${sz - m} Q${m} ${sz - m} ${m} ${sz - m - r} L${m} ${m + r} Q${m} ${m} ${m + r} ${m} Z`
  const svg = [
    `<svg width='${sz}' height='${sz}' xmlns='http://www.w3.org/2000/svg'>`,
    `<filter id='b'><feGaussianBlur stdDeviation='15'/></filter>`,
    `<linearGradient id='gx' x1='0' y1='0' x2='1' y2='0'><stop offset='0%' stop-color='red'/><stop offset='100%' stop-color='black'/></linearGradient>`,
    `<linearGradient id='gy' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='blue'/><stop offset='100%' stop-color='black'/></linearGradient>`,
    `<rect width='100%' height='100%' fill='#000'/>`,
    `<rect width='100%' height='100%' fill='url(#gx)' style='mix-blend-mode:screen'/>`,
    `<rect width='100%' height='100%' fill='url(#gy)' style='mix-blend-mode:screen'/>`,
    `<path d='${p}' fill='white' filter='url(#b)' opacity='0.8'/>`,
    `</svg>`,
  ].join("")
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

// ── Filter SVG for a single card ─────────────────────────────────────────────

export function GlassFilterSvg({
  cardId,
  params,
}: {
  cardId: string
  params: GlassParams
}): React.ReactElement | null {
  const linearMap = useMemo(() => buildLinearMap(32), [])

  if (params.engine === ENGINE.OFF) return null

  return (
    <svg style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}>
      <defs>
        {params.engine === ENGINE.LINEAR && (
          <filter id={`glass-${cardId}`} primitiveUnits="objectBoundingBox">
            <feImage href={linearMap} x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="map" />
            <feDisplacementMap in="SourceGraphic" scale={params.refraction} xChannelSelector="R" yChannelSelector="B" />
          </filter>
        )}

        {params.engine === ENGINE.RADIAL && (
          <filter id={`glass-${cardId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feImage
              x="0" y="0" result="normalMap"
              xlinkHref="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><radialGradient id='nmap' cx='50%25' cy='50%25' r='50%25'><stop offset='0%25' stop-color='rgb(128,128,255)'/><stop offset='100%25' stop-color='rgb(255,255,255)'/></radialGradient><rect width='100%25' height='100%25' fill='url(%23nmap)'/></svg>"
            />
            <feDisplacementMap in="SourceGraphic" in2="normalMap" scale={params.refraction * 400} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        )}

        {params.engine === ENGINE.CRYSTAL && (
          <filter id={`glass-${cardId}`} x="-50%" y="-50%" width="200%" height="200%" primitiveUnits="objectBoundingBox">
            <feImage href="https://essykings.github.io/JavaScript/map.png" x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="map" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.02" result="blur" />
            <feDisplacementMap in="blur" in2="map" scale={params.refraction} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        )}

        {params.engine === ENGINE.BITPACKED && (
          <filter id={`glass-${cardId}`} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feComponentTransfer result="SourceBackground" in="SourceGraphic">
              <feFuncR type="discrete" tableValues="0.000 0.008 0.016 0.024 0.031 0.039 0.047 0.055 0.063 0.071 0.079 0.087 0.094 0.102 0.110 0.118 0.126 0.134 0.142 0.150 0.157 0.165 0.173 0.181 0.189 0.197 0.205 0.213 0.220 0.228 0.236 0.244 0.252 0.260 0.268 0.276 0.283 0.291 0.299 0.307 0.315 0.323 0.331 0.339 0.346 0.354 0.362 0.370 0.378 0.386 0.394 0.402 0.409 0.417 0.425 0.433 0.441 0.449 0.457 0.465 0.472 0.480 0.488 0.496 0.504 0.512 0.520 0.528 0.535 0.543 0.551 0.559 0.567 0.575 0.583 0.591 0.598 0.606 0.614 0.622 0.630 0.638 0.646 0.654 0.661 0.669 0.677 0.685 0.693 0.701 0.709 0.717 0.724 0.732 0.740 0.748 0.756 0.764 0.772 0.780 0.787 0.795 0.803 0.811 0.819 0.827 0.835 0.843 0.850 0.858 0.866 0.874 0.882 0.890 0.898 0.906 0.913 0.921 0.929 0.937 0.945 0.953 0.961 0.969 0.976 0.984 0.992 1.000" />
              <feFuncG type="discrete" tableValues="0.000 0.008 0.016 0.024 0.031 0.039 0.047 0.055 0.063 0.071 0.079 0.087 0.094 0.102 0.110 0.118 0.126 0.134 0.142 0.150 0.157 0.165 0.173 0.181 0.189 0.197 0.205 0.213 0.220 0.228 0.236 0.244 0.252 0.260 0.268 0.276 0.283 0.291 0.299 0.307 0.315 0.323 0.331 0.339 0.346 0.354 0.362 0.370 0.378 0.386 0.394 0.402 0.409 0.417 0.425 0.433 0.441 0.449 0.457 0.465 0.472 0.480 0.488 0.496 0.504 0.512 0.520 0.528 0.535 0.543 0.551 0.559 0.567 0.575 0.583 0.591 0.598 0.606 0.614 0.622 0.630 0.638 0.646 0.654 0.661 0.669 0.677 0.685 0.693 0.701 0.709 0.717 0.724 0.732 0.740 0.748 0.756 0.764 0.772 0.780 0.787 0.795 0.803 0.811 0.819 0.827 0.835 0.843 0.850 0.858 0.866 0.874 0.882 0.890 0.898 0.906 0.913 0.921 0.929 0.937 0.945 0.953 0.961 0.969 0.976 0.984 0.992 1.000" />
              <feFuncB type="discrete" tableValues="0.000 0.008 0.016 0.024 0.031 0.039 0.047 0.055 0.063 0.071 0.079 0.087 0.094 0.102 0.110 0.118 0.126 0.134 0.142 0.150 0.157 0.165 0.173 0.181 0.189 0.197 0.205 0.213 0.220 0.228 0.236 0.244 0.252 0.260 0.268 0.276 0.283 0.291 0.299 0.307 0.315 0.323 0.331 0.339 0.346 0.354 0.362 0.370 0.378 0.386 0.394 0.402 0.409 0.417 0.425 0.433 0.441 0.449 0.457 0.465 0.472 0.480 0.488 0.496 0.504 0.512 0.520 0.528 0.535 0.543 0.551 0.559 0.567 0.575 0.583 0.591 0.598 0.606 0.614 0.622 0.630 0.638 0.646 0.654 0.661 0.669 0.677 0.685 0.693 0.701 0.709 0.717 0.724 0.732 0.740 0.748 0.756 0.764 0.772 0.780 0.787 0.795 0.803 0.811 0.819 0.827 0.835 0.843 0.850 0.858 0.866 0.874 0.882 0.890 0.898 0.906 0.913 0.921 0.929 0.937 0.945 0.953 0.961 0.969 0.976 0.984 0.992 1.000" />
            </feComponentTransfer>
            <feColorMatrix type="luminanceToAlpha" />
            <feGaussianBlur stdDeviation="2" />
            <feColorMatrix values="1 0 0 0 1 0 1 0 0 1 0 0 1 0 1 0 0 0 8 -2" />
            <feComposite result="SourceMask" />
            <feDiffuseLighting result="diffuse-lighting-0" in="SourceMask" diffuseConstant="1" surfaceScale="100">
              <feDistantLight azimuth="90" elevation="180" />
            </feDiffuseLighting>
            <feColorMatrix result="color-matrix-0" in="diffuse-lighting-0" type="luminanceToAlpha" />
            <feColorMatrix result="side-red" in="color-matrix-0" values="0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 255 0" />
            <feDiffuseLighting result="diffuse-lighting-1" in="SourceMask" diffuseConstant="1" surfaceScale="100">
              <feDistantLight azimuth="0" elevation="180" />
            </feDiffuseLighting>
            <feColorMatrix result="color-matrix-3" in="diffuse-lighting-1" type="luminanceToAlpha" />
            <feColorMatrix result="side-green" in="color-matrix-3" values="0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 255 0" />
            <feBlend result="NormalMapFull" in="side-green" in2="side-red" mode="screen" />
            <feDisplacementMap result="displacement" in="SourceBackground" in2="NormalMapFull" scale={params.refraction * 600} xChannelSelector="R" yChannelSelector="G" />
            <feComposite in2="SourceMask" operator="in" />
          </filter>
        )}
      </defs>
    </svg>
  )
}

// ── Backdrop-filter string builder ───────────────────────────────────────────

export function glassBackdropFilter(cardId: string, params: GlassParams): string {
  if (params.engine === ENGINE.OFF) return "none"
  const blur = params.blur > 0 ? `blur(${params.blur}px)` : ""
  const filter = `url(#glass-${cardId})`
  return [blur, filter].filter(Boolean).join(" ") || "none"
}

// ── Lab panel component ──────────────────────────────────────────────────────

export type StackProfile = { id: string; name: string }

interface GlassLabPanelProps {
  params: GlassParams
  onChange: (params: GlassParams) => void
  onClose: () => void
  profiles: StackProfile[]    // profile list for per-stack background pickers
}

function Slider({
  label, value, display, min, max, step, onChange,
}: {
  label: string; value: number; display: string; min: number; max: number; step: number; onChange: (v: number) => void
}): React.ReactElement {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 2px" }}>
        <span style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 800, opacity: 0.4, color: "white" }}>{label}</span>
        <span style={{ fontSize: 10, fontFamily: "monospace", color: "#60a5fa", fontWeight: 700 }}>{display}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", height: 4, borderRadius: 10, outline: "none", WebkitAppearance: "none", background: "rgba(255,255,255,0.1)" }}
      />
    </div>
  )
}

export function GlassLabPanel({ params, onChange, onClose, profiles }: GlassLabPanelProps): React.ReactElement {
  const update = <K extends keyof GlassParams>(key: K, value: GlassParams[K]): void => {
    onChange({ ...params, [key]: value })
  }

  const renderImagePicker = (
    field: string,
    current: BgSelection,
    onSelect: (v: BgSelection) => void,
    noneLabel = "None",
  ): React.ReactElement => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button
        onClick={() => onSelect(null)}
        style={{
          width: 56, height: 40, borderRadius: 10, border: "2px solid",
          borderColor: current === null ? "#a78bfa" : "rgba(255,255,255,0.1)",
          background: field === "stackBgImage" ? "linear-gradient(135deg, #0d1f15, #1b422a, #070d09)" : "rgba(255,255,255,0.05)",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "rgba(255,255,255,0.4)", fontSize: 9, fontWeight: 700,
        }}
      >
        {noneLabel}
      </button>
      {BG_IMAGES.map((bg) => {
        const pos = bg.position ?? "center"
        const isActive = current !== null && current.url === bg.url && current.position === pos
        return (
          <button
            key={`${bg.label}-${pos}`}
            onClick={() => onSelect({ url: bg.url, position: pos })}
            style={{
              width: 56, height: 40, borderRadius: 10, border: "2px solid",
              borderColor: isActive ? "#a78bfa" : "rgba(255,255,255,0.1)",
              backgroundImage: `url(${bg.url})`,
              backgroundSize: "cover",
              backgroundPosition: pos,
              cursor: "pointer", overflow: "hidden", padding: 0,
            }}
            title={bg.label}
          />
        )
      })}
    </div>
  )

  return (
    <div style={{
      position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
      zIndex: 200, width: "100%", maxWidth: 920, padding: "0 16px",
    }}>
      <div style={{
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.15)", borderRadius: 40,
        padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
        animation: "dropdown-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) both",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 16, marginBottom: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <FlaskConical size={14} color="#a78bfa" />
            <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.25em", fontWeight: 800, color: "rgba(255,255,255,0.35)" }}>Glass Laboratory</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>
              {PRESETS.find(p => p.engine === params.engine)?.label ?? "Custom"}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: "50%", border: "none",
              background: "rgba(255,255,255,0.05)", color: "white", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Engine presets */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {PRESETS.map((preset) => {
            const isActive = params.engine === preset.engine &&
              (preset.engine === ENGINE.OFF || Math.abs(params.blur - (preset.params.blur ?? 0)) < 2)
            return (
              <button
                key={preset.label}
                onClick={() => onChange({ ...params, engine: preset.engine, ...preset.params })}
                style={{
                  padding: "6px 14px", borderRadius: 9999, border: "1px solid",
                  borderColor: isActive ? "rgba(167,139,250,0.5)" : "rgba(255,255,255,0.08)",
                  background: isActive ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.03)",
                  color: isActive ? "#c4b5fd" : "rgba(255,255,255,0.5)",
                  fontSize: 11, fontWeight: 600, cursor: "pointer",
                }}
              >
                {preset.label}
              </button>
            )
          })}
        </div>

        {/* Sliders */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 20, marginBottom: 20 }}>
          <Slider label="Blur" value={params.blur} display={`${params.blur}px`} min={0} max={40} step={1} onChange={(v) => update("blur", v)} />
          <Slider
            label="Refraction" value={params.refraction} display={params.refraction.toFixed(2)}
            min={0} max={params.engine === ENGINE.CRYSTAL ? 2 : 0.5} step={0.01}
            onChange={(v) => update("refraction", v)}
          />
          <Slider label="Tint" value={params.opacity} display={`${Math.round(params.opacity * 100)}%`} min={0} max={0.4} step={0.01} onChange={(v) => update("opacity", v)} />
        </div>

        {/* Card background picker */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <ImageIcon size={12} color="rgba(255,255,255,0.4)" />
            <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 800, color: "rgba(255,255,255,0.35)" }}>
              Card Background
            </span>
          </div>
          {renderImagePicker("bgImage", params.bgImage, (v) => update("bgImage", v))}
        </div>

        {/* Per-profile stack background pickers */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16, marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ImageIcon size={12} color="rgba(255,255,255,0.4)" />
              <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 800, color: "rgba(255,255,255,0.35)" }}>
                Stack Backgrounds
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => update("bgMotion", !params.bgMotion)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 9999,
                  border: "1px solid",
                  borderColor: params.bgMotion ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.08)",
                  background: params.bgMotion ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.03)",
                  color: params.bgMotion ? "#34d399" : "rgba(255,255,255,0.4)",
                  fontSize: 10, fontWeight: 700, cursor: "pointer", flexShrink: 0,
                }}
              >
                {params.bgMotion ? <Pause size={10} /> : <Play size={10} />}
                Motion
              </button>
              {params.bgMotion && (
                <div style={{ width: 100 }}>
                  <Slider
                    label="Speed"
                    value={params.bgMotionSpeed}
                    display={`${params.bgMotionSpeed}s`}
                    min={3}
                    max={30}
                    step={1}
                    onChange={(v) => update("bgMotionSpeed", v)}
                  />
                </div>
              )}
            </div>
          </div>
          {profiles.map((p) => (
            <div key={p.id} style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 6, display: "block" }}>
                {p.name}
              </span>
              {renderImagePicker(
                "stackBgImages",
                params.stackBgImages[p.id] ?? null,
                (v) => onChange({ ...params, stackBgImages: { ...params.stackBgImages, [p.id]: v } }),
                "Grad",
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
