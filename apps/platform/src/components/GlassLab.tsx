"use client"

import React, { useMemo, useState, useRef, useEffect, useCallback } from "react"
import { X, Layers, Image as ImageIcon, Sparkles, Battery } from "lucide-react"

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

export type BackgroundType = "image" | "fluid" | "abstract" | "particles" | "lasers" | "waves" | "tunnel" | "pattern" | "rain" | "forest"

export type GlassParams = {
  engine: EngineType
  blur: number
  refraction: number
  opacity: number
  tint: "light" | "dark"
  bgImage: BgSelection
  stackBackgrounds: Record<string, { backgroundType: BackgroundType; bgImage: BgSelection }>
  bgMotion: boolean
  bgMotionSpeed: number
  backgroundType: BackgroundType
  ecoMode: boolean
  // Fluid
  fluidSpeed: number
  fluidZoom: number
  fluidComplexity: number
  fluidMorphSpeed: number
  fluidMorphIntensity: number
  fluidTheme: string
  // Abstract
  abstractSpeed: number
  abstractTheme: string
  // Rain
  rainOpacity: number
  rainBgColor: string
  // Waves
  waveSpeed: number
  waveHeight: number
  waveFreqX: number
  waveFreqZ: number
  waveChaos: number
  // Lasers
  laserSpeed: number
  laserColorSpeed: number
  // Forest
  forestSpeed: number
  forestFogDensity: number
  forestCamHeight: number
  forestSway: number
  forestFogColor: string
  forestLightInt: number
  // Particles
  particleBgColor: string
  particleCount: number
  particleMinWind: number
  particleMaxWind: number
  particleGravity: number
  particleTurbulence: number
  // Tunnel
  tunnelSpeed: number
  tunnelBgColor: string
  tunnelFogDensity: number
  // Pattern
  patternSpeed: number
  // Card animations & physics
  ambientFloat: boolean
  floatSpeed: number
  tilt3d: boolean
  tilt3dStrength: number          // multiplier for 3D tilt intensity (0-3)
  magnetic: boolean
  magneticStrength: number        // multiplier for magnetic pull intensity (0-3)
}

export const DEFAULT_GLASS: GlassParams = {
  engine: ENGINE.LINEAR,
  blur: 6,
  refraction: 0.10,
  opacity: 0.08,
  tint: "dark",
  bgImage: null,
  stackBackgrounds: {},
  bgMotion: false,
  bgMotionSpeed: 12,
  backgroundType: "image",
  ecoMode: false,
  fluidSpeed: 0.6,
  fluidZoom: 0.9193,
  fluidComplexity: 0.7007,
  fluidMorphSpeed: 0.834,
  fluidMorphIntensity: 0.7005,
  fluidTheme: "Original Holographic",
  abstractSpeed: 0.72,
  abstractTheme: "blue",
  rainOpacity: 0.9,
  rainBgColor: "#000000",
  waveSpeed: 0.0033,
  waveHeight: 0.60,
  waveFreqX: 0.27,
  waveFreqZ: 0.52,
  waveChaos: 2.30,
  laserSpeed: 1.0,
  laserColorSpeed: 0.2,
  forestSpeed: 0.15,
  forestFogDensity: 0.03,
  forestCamHeight: 25,
  forestSway: 0.0,
  forestFogColor: "#b7cdd7",
  forestLightInt: 0.0,
  particleBgColor: "#000000",
  particleCount: 100,
  particleMinWind: 1.5,
  particleMaxWind: 18,
  particleGravity: 0.6,
  particleTurbulence: 0.8,
  tunnelSpeed: 6.0,
  tunnelBgColor: "#b6c2cc",
  tunnelFogDensity: 0.0104,
  patternSpeed: 0.03,
  ambientFloat: false,
  floatSpeed: 6,
  tilt3d: false,
  tilt3dStrength: 1.0,
  magnetic: false,
  magneticStrength: 1.0,
}

// ── Background image registry ────────────────────────────────────────────────

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
  { label: "Off",         engine: ENGINE.OFF,       params: { blur: 0,  refraction: 0,    opacity: 0    } },
  { label: "Frost",       engine: ENGINE.LINEAR,    params: { blur: 20, refraction: 0.01, opacity: 0.15 } },
  { label: "Linear",      engine: ENGINE.LINEAR,    params: { blur: 6,  refraction: 0.10, opacity: 0.08 } },
  { label: "Radial",      engine: ENGINE.RADIAL,    params: { blur: 8,  refraction: 0.08, opacity: 0.10 } },
  { label: "Crystal",     engine: ENGINE.CRYSTAL,   params: { blur: 2,  refraction: 0.60, opacity: 0.06 } },
  { label: "Bit-Packed",  engine: ENGINE.BITPACKED, params: { blur: 4,  refraction: 0.20, opacity: 0.05 } },
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
  profiles: StackProfile[]       // ordered front-to-back; profiles[0] = currently active stack
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const D = {
  bg:      "rgba(9, 9, 19, 0.96)",
  border:  "rgba(255,255,255,0.08)",
  text1:   "rgba(255,255,255,0.88)",
  text2:   "rgba(255,255,255,0.40)",
  text3:   "rgba(255,255,255,0.22)",
  accent:  "#60a5fa",
  accent2: "#93c5fd",
  rowHover: "rgba(255,255,255,0.05)",
  rowActive: "rgba(255,255,255,0.08)",
  pill:    "rgba(255,255,255,0.07)",
  pillBorder: "rgba(255,255,255,0.1)",
  divider: "rgba(255,255,255,0.07)",
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LabSlider({ label, value, display, min, max, step, onChange }: {
  label: string; value: number; display: string; min: number; max: number; step: number; onChange: (v: number) => void
}): React.ReactElement {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: D.text2, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 500, color: D.accent2, fontVariantNumeric: "tabular-nums" }}>{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: D.accent, cursor: "pointer", height: 3 }} />
    </div>
  )
}

function DarkToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }): React.ReactElement {
  return (
    <div onClick={() => onChange(!checked)}
      style={{ width: 34, height: 18, borderRadius: 9, padding: 2, flexShrink: 0, cursor: "pointer",
        background: checked ? D.accent : "rgba(255,255,255,0.15)", transition: "background 0.2s ease" }}>
      <div style={{ width: 14, height: 14, borderRadius: "50%", background: "white",
        boxShadow: "0 1px 3px rgba(0,0,0,0.4)", transition: "transform 0.2s ease",
        transform: checked ? "translateX(16px)" : "translateX(0)" }} />
    </div>
  )
}

function ToggleRow({ label, sub, checked, onChange }: {
  label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void
}): React.ReactElement {
  return (
    <div onClick={() => onChange(!checked)}
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "9px 12px", borderRadius: 10, cursor: "pointer",
        background: checked ? D.rowActive : "transparent",
        border: `1px solid ${checked ? "rgba(255,255,255,0.1)" : "transparent"}`,
        transition: "all 0.15s ease" }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: D.text1, lineHeight: 1.2 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: D.text2, marginTop: 2 }}>{sub}</div>}
      </div>
      <DarkToggle checked={checked} onChange={onChange} />
    </div>
  )
}

function SegControl({ options, value, onChange }: {
  options: string[]; value: string; onChange: (v: string) => void
}): React.ReactElement {
  return (
    <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: 2, gap: 2 }}>
      {options.map(opt => (
        <button key={opt} onClick={() => onChange(opt)}
          style={{ flex: 1, padding: "4px 0", borderRadius: 6, border: "none", cursor: "pointer",
            fontSize: 11, fontWeight: 600,
            background: value === opt ? "rgba(255,255,255,0.12)" : "transparent",
            color: value === opt ? D.text1 : D.text2,
            boxShadow: value === opt ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
            transition: "all 0.15s ease" }}>
          {opt}
        </button>
      ))}
    </div>
  )
}

function SecLabel({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div style={{ fontSize: 9, fontWeight: 700, color: D.text3, letterSpacing: "0.14em",
      textTransform: "uppercase", marginBottom: 8 }}>
      {children}
    </div>
  )
}

const BG_TYPE_DOTS: Record<BackgroundType, string> = {
  image: "#a1a1aa", fluid: "#818cf8", abstract: "#34d399", particles: "#fbbf24",
  lasers: "#f87171", waves: "#38bdf8", tunnel: "#a78bfa", pattern: "#fb923c",
  rain: "#60a5fa", forest: "#4ade80",
}

const BG_TYPE_LABELS: Record<BackgroundType, string> = {
  image: "Image", fluid: "Fluid", abstract: "Abstract", particles: "Particles",
  lasers: "Lasers", waves: "Waves", tunnel: "Tunnel", pattern: "Pattern",
  rain: "Rain", forest: "Forest",
}

function BgTypeControls({ params, onChange }: { params: GlassParams; onChange: (p: GlassParams) => void }): React.ReactElement {
  const upd = <K extends keyof GlassParams>(k: K, v: GlassParams[K]): void => onChange({ ...params, [k]: v })
  const t = params.backgroundType

  if (t === "image") return (
    <p style={{ color: D.text2, fontSize: 12, margin: 0, paddingTop: 4, lineHeight: 1.5 }}>
      Choose a card background image in the Card Look tab.
    </p>
  )

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {t === "fluid" && <>
        <LabSlider label="Speed"      value={params.fluidSpeed}         display={params.fluidSpeed.toFixed(1)}         min={0}   max={2}   step={0.1}  onChange={v => upd("fluidSpeed", v)} />
        <LabSlider label="Zoom"       value={params.fluidZoom}          display={params.fluidZoom.toFixed(2)}          min={0.1} max={3}   step={0.01} onChange={v => upd("fluidZoom", v)} />
        <LabSlider label="Complexity" value={params.fluidComplexity}    display={params.fluidComplexity.toFixed(2)}    min={0.1} max={2}   step={0.01} onChange={v => upd("fluidComplexity", v)} />
        <LabSlider label="Morph Spd"  value={params.fluidMorphSpeed}    display={params.fluidMorphSpeed.toFixed(2)}    min={0}   max={2}   step={0.01} onChange={v => upd("fluidMorphSpeed", v)} />
        <LabSlider label="Morph Int"  value={params.fluidMorphIntensity} display={params.fluidMorphIntensity.toFixed(2)} min={0}  max={2}   step={0.01} onChange={v => upd("fluidMorphIntensity", v)} />
      </>}
      {t === "abstract" && <>
        <LabSlider label="Speed" value={params.abstractSpeed} display={params.abstractSpeed.toFixed(2)} min={0} max={2} step={0.01} onChange={v => upd("abstractSpeed", v)} />
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: D.text2, letterSpacing: "0.1em", textTransform: "uppercase" }}>Theme</span>
          <div style={{ display: "flex", gap: 4 }}>
            {["blue","purple","orange","green","crimson"].map(th => (
              <button key={th} onClick={() => onChange({ ...params, abstractTheme: th })}
                style={{ flex: 1, height: 22, borderRadius: 5, border: `2px solid ${params.abstractTheme === th ? D.accent : "transparent"}`, cursor: "pointer",
                  background: th==="blue"?"#3b82f6":th==="purple"?"#a855f7":th==="orange"?"#f97316":th==="green"?"#22c55e":"#ef4444" }} />
            ))}
          </div>
        </div>
      </>}
      {t === "rain" && <>
        <LabSlider label="Opacity" value={params.rainOpacity} display={params.rainOpacity.toFixed(2)} min={0} max={1} step={0.01} onChange={v => upd("rainOpacity", v)} />
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: D.text2, letterSpacing: "0.1em", textTransform: "uppercase" }}>BG Color</span>
          <input type="color" value={params.rainBgColor} onChange={e => onChange({ ...params, rainBgColor: e.target.value })}
            style={{ width: "100%", height: 28, borderRadius: 6, cursor: "pointer", border: `1px solid ${D.border}`, background: "transparent" }} />
        </div>
      </>}
      {t === "waves" && <>
        <LabSlider label="Speed"     value={params.waveSpeed}  display={params.waveSpeed.toFixed(4)}  min={0}    max={0.05} step={0.0001} onChange={v => upd("waveSpeed", v)} />
        <LabSlider label="Amplitude" value={params.waveHeight} display={params.waveHeight.toFixed(2)} min={0.1}  max={5}    step={0.01}   onChange={v => upd("waveHeight", v)} />
        <LabSlider label="Freq X"    value={params.waveFreqX}  display={params.waveFreqX.toFixed(2)}  min={0.01} max={1}    step={0.01}   onChange={v => upd("waveFreqX", v)} />
        <LabSlider label="Freq Z"    value={params.waveFreqZ}  display={params.waveFreqZ.toFixed(2)}  min={0.01} max={1}    step={0.01}   onChange={v => upd("waveFreqZ", v)} />
        <LabSlider label="Chaos"     value={params.waveChaos}  display={params.waveChaos.toFixed(2)}  min={0}    max={5}    step={0.01}   onChange={v => upd("waveChaos", v)} />
      </>}
      {t === "lasers" && <>
        <LabSlider label="Speed"       value={params.laserSpeed}      display={params.laserSpeed.toFixed(1)}      min={0} max={3} step={0.1}  onChange={v => upd("laserSpeed", v)} />
        <LabSlider label="Color Speed" value={params.laserColorSpeed} display={params.laserColorSpeed.toFixed(1)} min={0} max={1} step={0.01} onChange={v => upd("laserColorSpeed", v)} />
      </>}
      {t === "particles" && <>
        <LabSlider label="Count"       value={params.particleCount}       display={String(params.particleCount)}           min={10} max={300} step={1}   onChange={v => upd("particleCount", v)} />
        <LabSlider label="Min Wind"    value={params.particleMinWind}     display={params.particleMinWind.toFixed(1)}      min={0}  max={10}  step={0.1}  onChange={v => upd("particleMinWind", v)} />
        <LabSlider label="Max Wind"    value={params.particleMaxWind}     display={params.particleMaxWind.toFixed(1)}      min={1}  max={30}  step={0.1}  onChange={v => upd("particleMaxWind", v)} />
        <LabSlider label="Gravity"     value={params.particleGravity}     display={params.particleGravity.toFixed(1)}      min={0}  max={3}   step={0.1}  onChange={v => upd("particleGravity", v)} />
        <LabSlider label="Turbulence"  value={params.particleTurbulence}  display={params.particleTurbulence.toFixed(1)}   min={0}  max={3}   step={0.1}  onChange={v => upd("particleTurbulence", v)} />
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: D.text2, letterSpacing: "0.1em", textTransform: "uppercase" }}>BG Color</span>
          <input type="color" value={params.particleBgColor} onChange={e => onChange({ ...params, particleBgColor: e.target.value })}
            style={{ width: "100%", height: 28, borderRadius: 6, cursor: "pointer", border: `1px solid ${D.border}`, background: "transparent" }} />
        </div>
      </>}
      {t === "forest" && <>
        <LabSlider label="Speed"       value={params.forestSpeed}      display={params.forestSpeed.toFixed(2)}      min={0}     max={0.6}  step={0.01}  onChange={v => upd("forestSpeed", v)} />
        <LabSlider label="Altitude"    value={params.forestCamHeight}  display={params.forestCamHeight.toFixed(1)}  min={5}     max={50}   step={0.5}   onChange={v => upd("forestCamHeight", v)} />
        <LabSlider label="Wind"        value={params.forestSway}       display={params.forestSway.toFixed(1)}       min={0}     max={5}    step={0.1}   onChange={v => upd("forestSway", v)} />
        <LabSlider label="Light"       value={params.forestLightInt}   display={params.forestLightInt.toFixed(2)}   min={0}     max={3}    step={0.01}  onChange={v => upd("forestLightInt", v)} />
        <LabSlider label="Fog Density" value={params.forestFogDensity} display={params.forestFogDensity.toFixed(3)} min={0.001} max={0.05} step={0.001} onChange={v => upd("forestFogDensity", v)} />
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: D.text2, letterSpacing: "0.1em", textTransform: "uppercase" }}>Fog Color</span>
          <input type="color" value={params.forestFogColor} onChange={e => onChange({ ...params, forestFogColor: e.target.value })}
            style={{ width: "100%", height: 28, borderRadius: 6, cursor: "pointer", border: `1px solid ${D.border}`, background: "transparent" }} />
        </div>
      </>}
      {t === "tunnel" && <>
        <LabSlider label="Speed"       value={params.tunnelSpeed}      display={params.tunnelSpeed.toFixed(1)}       min={0} max={50}  step={0.1}    onChange={v => upd("tunnelSpeed", v)} />
        <LabSlider label="Fog Density" value={params.tunnelFogDensity} display={params.tunnelFogDensity.toFixed(4)} min={0} max={0.1} step={0.0001} onChange={v => upd("tunnelFogDensity", v)} />
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: D.text2, letterSpacing: "0.1em", textTransform: "uppercase" }}>BG Color</span>
          <input type="color" value={params.tunnelBgColor} onChange={e => onChange({ ...params, tunnelBgColor: e.target.value })}
            style={{ width: "100%", height: 28, borderRadius: 6, cursor: "pointer", border: `1px solid ${D.border}`, background: "transparent" }} />
        </div>
      </>}
      {t === "pattern" && <>
        <LabSlider label="Speed" value={params.patternSpeed} display={params.patternSpeed.toFixed(3)} min={0} max={0.2} step={0.001} onChange={v => upd("patternSpeed", v)} />
      </>}
    </div>
  )
}

// ── Panel component ──────────────────────────────────────────────────────────

export function GlassLabPanel({ params, onChange, onClose, profiles }: GlassLabPanelProps): React.ReactElement {
  const [closing, setClosing] = useState(false)
  const [tab, setTab] = useState<"look" | "bg" | "motion">("look")
  const [selIdx, setSelIdx] = useState(0)           // which stack is being edited in Background tab
  const [userImages, setUserImages] = useState<BgEntry[]>([])
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const uploadRef = useRef<HTMLInputElement>(null)

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current) }, [])
  // Keep selIdx in bounds if profiles change
  useEffect(() => { setSelIdx(i => Math.min(i, Math.max(0, profiles.length - 1))) }, [profiles.length])

  const handleClose = useCallback(() => {
    setClosing(true)
    closeTimer.current = setTimeout(onClose, 450)
  }, [onClose])

  const upd = <K extends keyof GlassParams>(k: K, v: GlassParams[K]): void => onChange({ ...params, [k]: v })
  const anyMotion = params.ambientFloat || params.tilt3d || params.magnetic

  // ── Per-stack background helpers ─────────────────────────────────────────────
  const selectedProfile = profiles[selIdx] ?? profiles[0]

  const getStackBg = (profileId: string) =>
    params.stackBackgrounds[profileId] ?? { backgroundType: params.backgroundType, bgImage: params.bgImage }

  const setStackBg = (profileId: string, patch: Partial<{ backgroundType: BackgroundType; bgImage: BgSelection }>) => {
    const existing = getStackBg(profileId)
    onChange({
      ...params,
      stackBackgrounds: {
        ...params.stackBackgrounds,
        [profileId]: { ...existing, ...patch },
      },
    })
  }

  // ── Image upload handler ──────────────────────────────────────────────────────
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setUserImages(prev => [...prev, { label: file.name.replace(/\.[^.]+$/, ""), url }])
    e.target.value = ""
  }

  // ── Image picker (built-in + user-uploaded) ──────────────────────────────────
  const allImages = [...BG_IMAGES, ...userImages]

  const renderImgPicker = (current: BgSelection, onSelect: (v: BgSelection) => void, noneLabel = "None"): React.ReactElement => (
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
      <button onClick={() => onSelect(null)}
        style={{ width: 44, height: 34, borderRadius: 7, border: `2px solid ${current === null ? D.accent : D.pillBorder}`,
          background: D.pill, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, fontWeight: 600, color: current === null ? D.accent2 : D.text2 }}>
        {noneLabel}
      </button>
      {allImages.map(bg => {
        const pos = bg.position ?? "center"
        const isOn = current !== null && current.url === bg.url
        return (
          <button key={`${bg.label}-${bg.url}`} onClick={() => onSelect({ url: bg.url, position: pos })}
            style={{ width: 44, height: 34, borderRadius: 7, border: `2px solid ${isOn ? D.accent : D.pillBorder}`,
              cursor: "pointer", overflow: "hidden", padding: 0,
              backgroundImage: `url(${bg.url})`, backgroundSize: "cover", backgroundPosition: pos,
              transition: "border-color 0.12s ease" }}
            title={bg.label} />
        )
      })}
      {/* Upload button */}
      <button onClick={() => uploadRef.current?.click()}
        style={{ width: 44, height: 34, borderRadius: 7, border: `2px dashed ${D.pillBorder}`, background: "transparent",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          color: D.text2, fontSize: 18, fontWeight: 300, lineHeight: 1 }}
        title="Upload image">
        +
      </button>
      <input ref={uploadRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleUpload} />
    </div>
  )

  const tabs = [
    { id: "look"   as const, label: "Card Look",   icon: <Layers size={12} /> },
    { id: "bg"     as const, label: "Background",  icon: <ImageIcon size={12} /> },
    { id: "motion" as const, label: "Motion",      icon: <Sparkles size={12} /> },
  ]

  // Panel expands from the button's exact dimensions (44×110) anchored at bottom-right.
  // scaleX = 44/362 ≈ 0.122,  scaleY = 110/682 ≈ 0.161  (362/682 = panel + 1px shimmer padding)
  const PANEL_W = 360
  const PANEL_H = 680
  const HEADER_H = 42
  const TABBAR_H = 38

  return (
    <>
      <style>{`
        @keyframes glabIn {
          0%   { width: 45px;  height: 112px; border-radius: 12px 0 0 12px; animation-timing-function: cubic-bezier(0.25,0.1,0.25,1); }
          33%  { width: 361px; height: 112px; border-radius: 16px 0 0 16px; animation-timing-function: cubic-bezier(0.16,1,0.3,1); }
          100% { width: 361px; height: 682px; border-radius: 16px 0 0 16px; }
        }
        @keyframes glabOut {
          0%   { width: 361px; height: 682px; border-radius: 16px 0 0 16px; animation-timing-function: cubic-bezier(0.4,0,0.6,0); }
          52%  { width: 361px; height: 112px; border-radius: 16px 0 0 16px; animation-timing-function: cubic-bezier(0.4,0,0.2,1); }
          100% { width: 45px;  height: 112px; border-radius: 12px 0 0 12px; }
        }
        @keyframes glabElIn {
          from { opacity: 0; transform: translateY(-22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes glabElOut {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(-8px); }
        }
        .glab-tab {
          position: relative;
          border-radius: 6px 6px 0 0;
          transition: color 0.15s ease, background 0.18s ease;
        }
        .glab-tab::after {
          content: '';
          position: absolute;
          bottom: -1px; left: 8px; right: 8px;
          height: 2px;
          border-radius: 2px 2px 0 0;
          background: rgba(147,197,253,0.45);
          transform: scaleX(0);
          transition: transform 0.2s cubic-bezier(0.22,1,0.36,1), opacity 0.2s ease;
          opacity: 0;
        }
        .glab-tab:hover {
          background: rgba(255,255,255,0.07) !important;
          color: rgba(255,255,255,0.78) !important;
        }
        .glab-tab:hover::after {
          transform: scaleX(1);
          opacity: 1;
        }
        .glab-tab.glab-tab-active::after {
          display: none;
        }
        .glab-tab:active {
          background: rgba(255,255,255,0.11) !important;
          transform: translateY(1px);
        }
      `}</style>

      {/* Click-away backdrop */}
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, zIndex: 199 }} />

      {/* Shimmer wrapper — same class as the button, same anchor position */}
      <div
        className="lab-shimmer-wrap"
        style={{
          position: "fixed", right: 0, bottom: "12%",
          zIndex: 200,
          padding: "1px 0 1px 1px",
          overflow: "hidden",
          boxSizing: "border-box",
          animation: closing ? "glabOut 450ms linear both" : "glabIn 900ms linear both",
        }}
      >
        <div style={{
          width: "100%", height: "100%",
          background: D.bg, backdropFilter: "blur(28px)",
          borderRadius: "inherit",
          boxShadow: "0 32px 80px rgba(0,0,0,0.75), inset 0 0 0 0.5px rgba(255,255,255,0.05)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>

          {/* Header */}
          <div style={{ height: HEADER_H, flexShrink: 0, display: "flex", alignItems: "center",
            justifyContent: "space-between", padding: "0 16px", borderBottom: `1px solid ${D.divider}`,
            animation: closing
              ? "glabElOut 100ms ease both"
              : "glabElIn 360ms cubic-bezier(0.22,1,0.36,1) 880ms both",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 24, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.12)" }} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: D.text2 }}>Glass Lab</span>
            </div>
            <button onClick={handleClose}
              style={{ width: 26, height: 26, borderRadius: 8, border: `1px solid ${D.border}`,
                background: D.pill, cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", color: D.text2 }}>
              <X size={12} />
            </button>
          </div>

          {/* Tab bar */}
          <div style={{ height: TABBAR_H, flexShrink: 0, display: "flex", alignItems: "stretch",
            padding: "0 8px", gap: 2, borderBottom: `1px solid ${D.divider}`,
            animation: closing
              ? "glabElOut 80ms ease both"
              : "glabElIn 360ms cubic-bezier(0.22,1,0.36,1) 960ms both",
          }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`glab-tab${tab === t.id ? " glab-tab-active" : ""}`}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 10px",
                  border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
                  background: "transparent",
                  color: tab === t.id ? D.text1 : D.text2,
                  borderBottom: `2px solid ${tab === t.id ? D.accent : "transparent"}`,
                  marginBottom: -1 }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column",
            animation: closing
              ? "glabElOut 60ms ease both"
              : "glabElIn 360ms cubic-bezier(0.22,1,0.36,1) 1040ms both",
          }}>

            {/* ── Card Look ── */}
            {tab === "look" && (
              <div style={{ flex: 1, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 14, overflow: "hidden" }}>
                <div>
                  <SecLabel>Glass Preset</SecLabel>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7 }}>
                    {PRESETS.map(preset => {
                      const isOn = preset.engine === params.engine
                        && preset.params.blur === params.blur
                        && preset.params.refraction === params.refraction
                      const pOp = (preset.params.opacity ?? 0.08) * 3
                      const pBlur = Math.min((preset.params.blur ?? 0) * 0.35, 5)
                      return (
                        <button key={preset.label}
                          onClick={() => onChange({ ...params, engine: preset.engine, ...preset.params })}
                          style={{ height: 52, borderRadius: 10, border: `1.5px solid ${isOn ? D.accent : D.pillBorder}`,
                            cursor: "pointer", position: "relative", overflow: "hidden", padding: 0,
                            background: "linear-gradient(135deg, #1e2a4a, #2d1b4e)",
                            boxShadow: isOn ? `0 0 0 2px ${D.accent}30` : "none",
                            transition: "all 0.15s ease", display: "flex", flexDirection: "column",
                            alignItems: "center", justifyContent: "flex-end" }}>
                          <div style={{ position: "absolute", inset: 0, borderRadius: 9,
                            backdropFilter: pBlur > 0 ? `blur(${pBlur}px)` : "none",
                            background: `rgba(255,255,255,${pOp})` }} />
                          <span style={{ position: "relative", zIndex: 1, fontSize: 9, fontWeight: 700,
                            color: isOn ? D.accent2 : D.text2, padding: "3px 0 4px", letterSpacing: "0.04em" }}>
                            {preset.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div style={{ height: 1, background: D.divider }} />

                <div>
                  <SecLabel>Fine Tune</SecLabel>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    <LabSlider label="Blur"       value={params.blur}       display={`${params.blur}px`}                     min={0} max={40}  step={1}    onChange={v => upd("blur", v)} />
                    <LabSlider label="Refraction" value={params.refraction} display={params.refraction.toFixed(2)}           min={0} max={params.engine === ENGINE.CRYSTAL ? 2 : 0.5} step={0.01} onChange={v => upd("refraction", v)} />
                    <LabSlider label="Opacity"    value={params.opacity}    display={`${Math.round(params.opacity * 100)}%`} min={0} max={0.4}  step={0.01} onChange={v => upd("opacity", v)} />
                  </div>
                </div>

                <div style={{ height: 1, background: D.divider }} />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <SecLabel>Tint</SecLabel>
                  <div style={{ width: 140 }}>
                    <SegControl options={["Light", "Dark"]} value={params.tint === "light" ? "Light" : "Dark"}
                      onChange={v => upd("tint", v === "Light" ? "light" : "dark")} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Background ── */}
            {tab === "bg" && profiles.length > 0 && selectedProfile && (() => {
              const pid = selectedProfile.id
              const sb = getStackBg(pid)
              const effectiveBgType = sb.backgroundType
              const effectiveBgImage = sb.bgImage

              return (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

                  {/* Stack carousel */}
                  <div style={{ flexShrink: 0, padding: "10px 16px 0", borderBottom: `1px solid ${D.divider}` }}>
                    <SecLabel>Stack</SecLabel>
                    <div style={{ display: "flex", gap: 5, paddingBottom: 10 }}>
                      {profiles.map((p, i) => (
                        <button key={p.id} onClick={() => setSelIdx(i)}
                          style={{ flex: 1, padding: "6px 8px", borderRadius: 9, border: `1px solid ${i === selIdx ? D.accent : D.pillBorder}`,
                            background: i === selIdx ? "rgba(96,165,250,0.14)" : D.pill,
                            cursor: "pointer", fontSize: 11, fontWeight: 600,
                            color: i === selIdx ? D.accent2 : D.text2,
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                            transition: "all 0.12s ease" }}>
                          <span>{p.name}</span>
                          {i === 0 && <span style={{ fontSize: 8, color: i === selIdx ? D.accent2 : D.text3, letterSpacing: "0.06em" }}>FRONT</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scrollable content for this stack */}
                  <div style={{ flex: 1, overflow: "hidden", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 14 }}>

                    {/* Page Background type */}
                    <div>
                      <SecLabel>Page Background</SecLabel>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 5 }}>
                        {(Object.keys(BG_TYPE_LABELS) as BackgroundType[]).map(type => {
                          const isOn = effectiveBgType === type
                          return (
                            <button key={type} onClick={() => setStackBg(pid, { backgroundType: type })}
                              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                                padding: "7px 4px", borderRadius: 9, border: `1px solid ${isOn ? D.accent : D.pillBorder}`,
                                background: isOn ? "rgba(96,165,250,0.12)" : D.pill, cursor: "pointer",
                                transition: "all 0.12s ease" }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: BG_TYPE_DOTS[type] }} />
                              <span style={{ fontSize: 9, fontWeight: 600, color: isOn ? D.accent2 : D.text2 }}>
                                {BG_TYPE_LABELS[type]}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Type-specific settings (global params, displayed for current type) */}
                    {effectiveBgType !== "image" && (
                      <>
                        <div style={{ height: 1, background: D.divider }} />
                        <div>
                          <SecLabel>{BG_TYPE_LABELS[effectiveBgType]} Settings</SecLabel>
                          <BgTypeControls params={{ ...params, backgroundType: effectiveBgType }} onChange={onChange} />
                        </div>
                      </>
                    )}

                    <div style={{ height: 1, background: D.divider }} />

                    {/* Card background image */}
                    <div>
                      <SecLabel>Card Image</SecLabel>
                      {renderImgPicker(effectiveBgImage, v => setStackBg(pid, { bgImage: v }))}
                    </div>

                    <div style={{ height: 1, background: D.divider }} />

                    {/* BG motion (global) */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: D.text1 }}>Background Motion</div>
                        <div style={{ fontSize: 10, color: D.text2, marginTop: 1 }}>Parallax scroll · global</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {params.bgMotion && (
                          <div style={{ width: 100 }}>
                            <LabSlider label="Speed" value={params.bgMotionSpeed} display={`${params.bgMotionSpeed}s`} min={3} max={30} step={1} onChange={v => upd("bgMotionSpeed", v)} />
                          </div>
                        )}
                        <DarkToggle checked={params.bgMotion} onChange={v => upd("bgMotion", v)} />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* ── Background: no profiles fallback ── */}
            {tab === "bg" && profiles.length === 0 && (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ color: D.text2, fontSize: 12, textAlign: "center" }}>No stacks available.</p>
              </div>
            )}

            {/* ── Motion ── */}
            {tab === "motion" && (
              <div style={{ flex: 1, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4,
                  opacity: anyMotion ? 1 : 0.55, transition: "opacity 0.2s ease" }}>
                  <div onClick={() => upd("ambientFloat", !params.ambientFloat)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "9px 12px", borderRadius: 10, cursor: "pointer",
                      background: params.ambientFloat ? D.rowActive : "transparent",
                      border: `1px solid ${params.ambientFloat ? "rgba(255,255,255,0.1)" : "transparent"}`,
                      transition: "all 0.15s ease" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: D.text1, lineHeight: 1.2 }}>Ambient Float</div>
                      <div style={{ fontSize: 10, color: D.text2, marginTop: 2 }}>Cards gently bob up and down</div>
                    </div>
                    <DarkToggle checked={params.ambientFloat} onChange={v => upd("ambientFloat", v)} />
                  </div>
                  {params.ambientFloat && (
                    <div style={{ padding: "4px 12px 8px" }}>
                      <SegControl options={["Slow","Medium","Fast"]}
                        value={params.floatSpeed >= 9 ? "Slow" : params.floatSpeed >= 5 ? "Medium" : "Fast"}
                        onChange={v => upd("floatSpeed", v === "Slow" ? 10 : v === "Medium" ? 6 : 3)} />
                    </div>
                  )}
                  <ToggleRow label="3D Tilt"  sub="Cards tilt toward your cursor"  checked={params.tilt3d}  onChange={v => upd("tilt3d", v)} />
                  {params.tilt3d && (
                    <div style={{ padding: "4px 12px 8px" }}>
                      <SegControl options={["Light", "Medium", "Heavy"]}
                        value={params.tilt3dStrength <= 0.5 ? "Light" : params.tilt3dStrength <= 1.5 ? "Medium" : "Heavy"}
                        onChange={v => upd("tilt3dStrength", v === "Light" ? 0.3 : v === "Medium" ? 1.0 : 2.5)} />
                    </div>
                  )}
                  <ToggleRow label="Magnetic" sub="Cards pull toward your cursor"   checked={params.magnetic} onChange={v => upd("magnetic", v)} />
                  {params.magnetic && (
                    <div style={{ padding: "4px 12px 8px" }}>
                      <SegControl options={["Light", "Medium", "Heavy"]}
                        value={params.magneticStrength <= 0.5 ? "Light" : params.magneticStrength <= 1.5 ? "Medium" : "Heavy"}
                        onChange={v => upd("magneticStrength", v === "Light" ? 0.3 : v === "Medium" ? 1.0 : 2.5)} />
                    </div>
                  )}
                </div>

                <div style={{ height: 1, background: D.divider, margin: "4px 0" }} />

                <div onClick={() => upd("ecoMode", !params.ecoMode)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "9px 12px", borderRadius: 10, cursor: "pointer",
                    background: params.ecoMode ? "rgba(16,185,129,0.1)" : "transparent",
                    border: `1px solid ${params.ecoMode ? "rgba(16,185,129,0.3)" : "transparent"}`,
                    transition: "all 0.15s ease" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Battery size={14} color={params.ecoMode ? "#10b981" : D.text2} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: params.ecoMode ? "#34d399" : D.text1, lineHeight: 1.2 }}>Battery Saver</div>
                      <div style={{ fontSize: 10, color: D.text2, marginTop: 2 }}>Reduces animation to 30fps</div>
                    </div>
                  </div>
                  <DarkToggle checked={params.ecoMode} onChange={v => upd("ecoMode", v)} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
