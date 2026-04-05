"use client"

import React, { useState, useRef, useEffect, useCallback, useMemo, createPortal } from 'react'
import {
  ArrowUpRight, Home, Wallet, Baby, CalendarDays,
  Hexagon, Users, X, Plus, ChevronRight, LogOut, UserRound, FlaskConical, Wand2,
} from 'lucide-react'
import Link from 'next/link'
import { useUser, useClerk } from '@clerk/nextjs'
import { GlassFilterSvg, GlassLabPanel, glassBackdropFilter, DEFAULT_GLASS } from './GlassLab'
import type { GlassParams } from './GlassLab'
import { StudioClient } from '../app/studio/StudioClient'
import { FluidBackground } from './backgrounds/FluidBackground'
import { RainBackground } from './backgrounds/RainBackground'
import { AbstractBackground } from './backgrounds/AbstractBackground'
import { ParticleBackground } from './backgrounds/ParticleBackground'
import { LaserBackground } from './backgrounds/LaserBackground'
import { WaveBackground } from './backgrounds/WaveBackground'
import { TunnelBackground } from './backgrounds/TunnelBackground'
import { PatternBackground } from './backgrounds/PatternBackground'
import { ForestBackground } from './backgrounds/ForestBackground'

// ── Constants ─────────────────────────────────────────────────────────────────

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  ⚠️  LOCKED VALUES — DO NOT MODIFY WITHOUT EXPLICIT REQUEST                ║
// ║  These constants control hand-tuned transitions and positioning.            ║
// ║  Changing any value will break the timing, feel, or alignment of the UI.    ║
// ║  Each value was iteratively tested and approved.                            ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

/** Chrome panel fill color — deep indigo matching the page gradient's darkest corner
 *  so the chrome cutout SVGs blend seamlessly into the background.
 *  ⚠️ LOCKED — must match the radial-gradient top-corner in the render section. */
const CHROME_BG = '#0c0b18'

/** Stack swipe animation: base duration (ms) + distance-scaled bonus for natural pacing.
 *  ⚠️ LOCKED — controls the feel of profile card swipe-out. Tuned to 300+350ms. */
const SWIPE_BASE_DURATION_MS = 300
const SWIPE_MAX_EXTRA_MS = 350

/** Bento card expand/collapse: fallback duration when no expand state is active.
 *  ⚠️ LOCKED — 500ms balances speed and readability during card morph. */
const CARD_EXPAND_FALLBACK_MS = 500

/** Layout: approximate height of the chrome header panels so studio content clears them. */
const CHROME_HEADER_HEIGHT_PX = 72

/** Profile stack: rotation angles for the "scattered paper" effect on stacked cards.
 *  Position 0 (front) = 0°, position 1 = slight tilt, position 2 = more tilt.
 *  Creates organic depth — cards un-rotate as they transition to front.
 *  ⚠️ LOCKED — these angles were visually tuned. Changing them misaligns the swipe arc. */
const STACK_ROTATION_DEG = { front: 0, middle: 2, back: 3.5 }

/** Profile stack: left offset (px) to pull stacked cards inward, preventing edge overflow.
 *  ⚠️ LOCKED — pixel-tuned to keep the bottom stack on-screen at all viewport widths. */
const STACK_INSET_PX = { middle: 11, back: 16 }

/** Proximity Hover Engine: edge-distance detection radius (px) and max scale/lift values.
 *  Uses power-1.5 easing curve for organic ramp-up (see specimen diagnostics pattern).
 *  ⚠️ LOCKED — maxScaleIncrease=0.02 is the agreed maximum. Do not exceed. */
const PROXIMITY_CONFIG = {
  triggerDistancePx: 75,     // how far from a card's bounding box the effect begins
  maxScaleIncrease: 0.02,    // 1.02 at closest approach — DO NOT EXCEED
  maxLiftPx: -4,             // 4px upward lift at closest approach
  easingPower: 1.5,          // power curve for smooth organic ramp
}

/** Shared easing curve — smooth ease-out with no spring/overshoot.
 *  ⚠️ LOCKED — replaces the old springy cubic-bezier(0.34, 1.56, 0.64, 1). No bounce. */
const EASE_SMOOTH = 'cubic-bezier(0.25, 0.1, 0.25, 1)'

/** Transition durations for interactive states.
 *  ⚠️ LOCKED — 300ms hover / 480ms stack were tested at multiple speeds and approved. */
const HOVER_TRANSITION_MS = 300
const STACK_TRANSITION_MS = 480

// ── Types ─────────────────────────────────────────────────────────────────────

/** A user profile rendered as a card in the profile stack (Trey, Sarah, Family). */
type Profile = {
  id: string
  name: string
  greetingColor: string           // accent dot color for the greeting line
  avatar?: string                 // Clerk user image URL
  icon?: React.ComponentType<{ size?: number; color?: string }>
  gradStart: string               // 3-stop gradient background
  gradMid: string
  gradEnd: string
  baseColor: string               // solid fallback used as card backgroundColor
}

/** A visual clone created during the "swipe-out" animation when switching profiles. */
type SwipingClone = Profile & { _cloneIdx: number }

/**
 * Bento card expand lifecycle — a 5-phase state machine:
 *   locked     → card pinned at origin, waiting for browser to paint
 *   expanding  → animating from origin to full-screen target
 *   open       → fully expanded, content visible
 *   collapsing → animating back from target to origin
 *   settling   → final frame before unmounting expand state
 */
type ExpandPhase = 'locked' | 'expanding' | 'open' | 'collapsing' | 'settling'

type CardRect = { top: number; left: number; width: number; height: number }

type ExpandState = {
  id: string
  phase: ExpandPhase
  origin: CardRect    // the card's resting position in the bento grid
  target: CardRect    // the full-screen position to expand into
  dur: number         // distance-scaled animation duration
}

/** One of the four bento grid app cards (Home, Calendar, Budget, Baby). */
type BentoCard = {
  id: string
  label: string
  bgColor: string                  // icon badge background
  borderColor: string              // icon badge border
  icon: React.ComponentType<{ size?: number; color?: string }>
  iconColor: string
  glassTint: string                // accent color at very low opacity for the glass surface
  pos: React.CSSProperties         // CSS grid position (top/left/bottom/right)
  href: string                     // cross-app navigation URL
  activities: string[]             // placeholder activity items for the expanded view
  statusLabel: string
  statusValue: string
  illus: () => React.ReactNode     // decorative doodle illustration
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Calculate distance-proportional animation duration for bento card expand/collapse.
 *  Cards farther from the center take slightly longer, creating natural pacing. */
function calcExpandDuration(cardRect: CardRect, viewportW: number, viewportH: number): number {
  const maxDist = Math.max(
    cardRect.left,
    viewportW - (cardRect.left + cardRect.width),
    cardRect.top,
    viewportH - (cardRect.top + cardRect.height),
  )
  return SWIPE_BASE_DURATION_MS + (maxDist / Math.max(viewportW, viewportH)) * SWIPE_MAX_EXTRA_MS
}

function getGreeting(): string {
  const h = new Date().getHours()
  return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening'
}

function getDateStr(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// ── SvgCorner ─────────────────────────────────────────────────────────────────
/** Concave corner mask — fills the gap between the chrome panel's rounded edge
 *  and the profile card's border-radius. Prevents background bleed-through. */
function SvgCorner({
  position, rotation = 0, color = CHROME_BG, size = 28,
}: {
  position: React.CSSProperties
  rotation?: number
  color?: string
  size?: number
}) {
  return (
    <svg
      className="absolute z-10 pointer-events-none"
      style={{ ...position, width: size, height: size, transform: `rotate(${rotation}deg)` }}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M40 0H0V40C0 17.9086 17.9086 0 40 0Z" fill={color} />
    </svg>
  )
}

// ── Static data (env vars inlined at build time by Next.js) ───────────────────

const BENTO_CARDS: BentoCard[] = [
  {
    id: 'home', label: 'Home',
    bgColor: 'rgba(249,115,22,0.1)', borderColor: 'rgba(249,115,22,0.2)',
    icon: Home, iconColor: '#fb923c', glassTint: 'rgba(251,146,60,0.09)',
    pos: { top: '0%', left: '0%', bottom: 'calc(50% + 8px)', right: 'calc(33.33% + 8px)' },
    href: process.env.NEXT_PUBLIC_HOME_URL ?? 'http://localhost:3004',
    activities: ['Living Room Light', 'Thermostat', 'Coffee Maker'],
    statusLabel: 'Devices', statusValue: '5 active',
    illus: () => (
      <>
        <div className="absolute -top-16 -right-16 w-64 h-64 border-[24px] border-orange-400 rounded-full pointer-events-none" />
        <div className="absolute -top-8 -right-8 w-40 h-40 border-[20px] border-orange-400 rounded-full pointer-events-none" />
      </>
    ),
  },
  {
    id: 'calendar', label: 'Calendar',
    bgColor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.2)',
    icon: CalendarDays, iconColor: '#60a5fa', glassTint: 'rgba(96,165,250,0.09)',
    pos: { top: '0%', bottom: '0%', left: 'calc(66.66% + 8px)', right: '0%' },
    href: process.env.NEXT_PUBLIC_CALENDAR_URL ?? 'http://localhost:3002',
    activities: ["Doctor's Appt", 'School Pickup', 'Date Night'],
    statusLabel: 'This week', statusValue: '3 events',
    illus: () => (
      <div
        className="absolute top-8 right-8 w-24 h-24 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 2px, transparent 2px)', backgroundSize: '12px 12px' }}
      />
    ),
  },
  {
    id: 'budget', label: 'Budget',
    bgColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)',
    icon: Wallet, iconColor: '#34d399', glassTint: 'rgba(52,211,153,0.09)',
    pos: { bottom: '0%', left: '0%', top: 'calc(50% + 8px)', right: 'calc(66.66% + 8px)' },
    href: process.env.NEXT_PUBLIC_BUDGET_URL ?? 'http://localhost:3001',
    activities: ['Groceries', 'Utilities', 'Transport'],
    statusLabel: 'Spent', statusValue: '$1,240',
    illus: () => (
      <div className="absolute -bottom-2 right-6 flex items-end gap-[6px] pointer-events-none">
        <div className="w-3 h-8 bg-emerald-400 rounded-t-full" />
        <div className="w-3 h-14 bg-emerald-400 rounded-t-full" />
        <div className="w-3 h-10 bg-emerald-400 rounded-t-full" />
      </div>
    ),
  },
  {
    id: 'baby', label: 'Baby',
    bgColor: 'rgba(236,72,153,0.1)', borderColor: 'rgba(236,72,153,0.2)',
    icon: Baby, iconColor: '#f472b6', glassTint: 'rgba(244,114,182,0.09)',
    pos: { bottom: '0%', left: 'calc(33.33% + 8px)', top: 'calc(50% + 8px)', right: 'calc(33.33% + 8px)' },
    href: process.env.NEXT_PUBLIC_BABY_URL ?? 'http://localhost:3003',
    activities: ['Morning Feed', 'Afternoon Nap', 'Bath Time'],
    statusLabel: 'Age', statusValue: '4 months',
    illus: () => (
      <>
        <div className="absolute top-4 right-10 w-16 h-16 bg-pink-400 rounded-full blur-[2px] pointer-events-none" />
        <div className="absolute top-12 right-4 w-12 h-12 bg-pink-400 rounded-full pointer-events-none" />
      </>
    ),
  },
]

// ── AvatarDropdown ────────────────────────────────────────────────────────────

function AvatarDropdown({ avatarUrl }: { avatarUrl?: string }) {
  const { user } = useUser()
  const { signOut, openUserProfile } = useClerk()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  useEffect(() => {
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) document.addEventListener('keydown', onEscape)
    return () => document.removeEventListener('keydown', onEscape)
  }, [open])

  const initials = (user?.firstName?.[0] ?? user?.lastName?.[0] ?? '?').toUpperCase()
  const displayUrl = avatarUrl ?? user?.imageUrl

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Open account menu"
        aria-expanded={open}
        style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          borderRadius: '50%', display: 'block',
          outline: open ? '2px solid rgba(255,255,255,0.4)' : '2px solid transparent',
          outlineOffset: 2,
          transition: 'outline-color 200ms',
        }}
        className="hover:[outline-color:rgba(255,255,255,0.25)]"
      >
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayUrl} alt=""
            style={{ width: 38, height: 38, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: 'white',
          }}>
            {initials}
          </div>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 48, right: 0, zIndex: 200,
          width: 232,
          background: 'rgba(14, 14, 18, 0.97)',
          backdropFilter: 'blur(12px)',
          willChange: 'transform',
          transform: 'translateZ(0)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}>
          {/* User info */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}>
            {displayUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={displayUrl} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                backgroundColor: 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: 'white',
              }}>
                {initials}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.fullName ?? user?.firstName ?? '—'}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.primaryEmailAddress?.emailAddress ?? ''}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div style={{ padding: '6px' }}>
            <button
              onClick={() => { openUserProfile(); setOpen(false) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, border: 'none', background: 'none',
                fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.65)',
                cursor: 'pointer', textAlign: 'left', transition: 'background 150ms, color 150ms',
              }}
              className="hover:!bg-white/10 hover:!text-white"
            >
              <UserRound size={15} />
              Manage account
            </button>
            <button
              onClick={() => void signOut({ redirectUrl: '/' })}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, border: 'none', background: 'none',
                fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.65)',
                cursor: 'pointer', textAlign: 'left', transition: 'background 150ms, color 150ms',
              }}
              className="hover:!bg-red-500/15 hover:!text-red-400"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── DashboardClient ───────────────────────────────────────────────────────────

export function DashboardClient({
  userName = 'there',
  userImageUrl,
}: {
  userName?: string
  userImageUrl?: string | null
}) {
  const profiles = useMemo<Profile[]>(() => [
    {
      id: 'primary', name: userName, greetingColor: '#ef4444',
      ...(userImageUrl ? { avatar: userImageUrl } : {}),
      gradStart: '#0d1f15', gradMid: '#1b422a', gradEnd: '#070d09', baseColor: '#022c22',
    },
    {
      id: 'secondary', name: 'Sarah', greetingColor: '#a855f7',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80',
      gradStart: '#190d1f', gradMid: '#3b1b42', gradEnd: '#0a070d', baseColor: '#2e1065',
    },
    {
      id: 'family', name: 'Family', greetingColor: '#3b82f6',
      icon: Users,
      gradStart: '#0d151f', gradMid: '#1b2f42', gradEnd: '#070a0d', baseColor: '#172554',
    },
  ], [userName, userImageUrl])

  const containerRef = useRef<HTMLDivElement>(null)
  const [containerW, setContainerW] = useState(900)

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) setContainerW(containerRef.current.offsetWidth)
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const stackMargin = Math.min(120, Math.max(70, containerW * 0.08))
  const activeWidth = containerW - stackMargin

  const [order, setOrder] = useState<string[]>(() => profiles.map(p => p.id))
  const [isAnimating, setIsAnimating] = useState(false)
  const [expand, setExpand] = useState<ExpandState | null>(null)
  const [swipingClones, setSwipingClones] = useState<SwipingClone[]>([])
  const [noTransitionIds, setNoTransitionIds] = useState<string[]>([])
  const [teleportingIds, setTeleportingIds] = useState<string[]>([])
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [hoveredStackId, setHoveredStackId] = useState<string | null>(null)
  const bentoCardRefs = useRef(new Map<string, HTMLDivElement>())
  const [glassParams, setGlassParams] = useState<GlassParams>(DEFAULT_GLASS)
  const glassParamsRef = useRef(glassParams)
  useEffect(() => { glassParamsRef.current = glassParams }, [glassParams])
  const [labOpen, setLabOpen] = useState(false)
  const [mode, setMode] = useState<"home" | "studio" | "builder">("home")
  const [builderAnim, setBuilderAnim] = useState<"idle" | "expanding" | "open" | "collapsing">("idle")
  const createCardRef = useRef<HTMLDivElement>(null)
  const userBgTypeRef = useRef(glassParams.backgroundType)  // saves user's bg choice before studio swaps to graph

  // Keep userBgTypeRef updated when the user changes bg via Lab (but not when studio auto-sets to graph)
  useEffect(() => {
    if (mode === 'home' && glassParams.backgroundType !== 'graph') {
      userBgTypeRef.current = glassParams.backgroundType
    }
  }, [glassParams.backgroundType, mode])
  const labOpenRef = useRef(false)
  const [btnKey, setBtnKey] = useState(0)
  useEffect(() => {
    if (!labOpen && labOpenRef.current) setBtnKey(k => k + 1)
    labOpenRef.current = labOpen
  }, [labOpen])
  const [greeting, setGreeting] = useState('Good Evening')
  const [dateStr, setDateStr] = useState('')

  const bentoGridRef = useRef<HTMLDivElement>(null)
  const studioCanvasRef = useRef<HTMLCanvasElement>(null)
  const studioMouseRef = useRef({ x: -1000, y: -1000 })
  const activeViewRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const probeRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    setGreeting(getGreeting())
    setDateStr(getDateStr())
  }, [])

  // ── Studio graph canvas magnetic dot effect ────────────────────────────────
  useEffect(() => {
    if (mode !== 'studio' && mode !== 'builder') return
    const canvas = studioCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let active = true

    const GRID = 28, RADIUS = 150, PULL = 12, DOT_BASE = 1.5, DOT_GLOW = 3

    const resize = (): void => {
      const p = canvas.parentElement
      if (!p) return
      canvas.width = p.clientWidth
      canvas.height = p.clientHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    const draw = (): void => {
      if (!active) return
      requestAnimationFrame(draw)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const { x: mx, y: my } = studioMouseRef.current
      if (mx < -500) return

      // Convert page coords to canvas-local coords
      const rect = canvas.getBoundingClientRect()
      const lx = mx - rect.left, ly = my - rect.top

      const sc = Math.max(0, Math.floor((lx - RADIUS) / GRID))
      const ec = Math.min(Math.ceil(canvas.width / GRID), Math.ceil((lx + RADIUS) / GRID))
      const sr = Math.max(0, Math.floor((ly - RADIUS) / GRID))
      const er = Math.min(Math.ceil(canvas.height / GRID), Math.ceil((ly + RADIUS) / GRID))

      for (let c = sc; c <= ec; c++) {
        for (let r = sr; r <= er; r++) {
          const gx = c * GRID, gy = r * GRID
          const dx = lx - gx, dy = ly - gy
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist > RADIUS) continue
          const intensity = Math.pow(1 - dist / RADIUS, 1.5)
          const px = (dx / (dist || 1)) * PULL * intensity
          const py = (dy / (dist || 1)) * PULL * intensity
          const dotX = gx + px, dotY = gy + py
          const dotR = DOT_BASE + (DOT_GLOW - DOT_BASE) * intensity

          // Soft glow bloom behind the dot — scales with proximity
          if (intensity > 0.15) {
            const glowR = dotR + 8 * intensity
            const grd = ctx.createRadialGradient(dotX, dotY, dotR * 0.5, dotX, dotY, glowR)
            grd.addColorStop(0, `rgba(96,165,250,${intensity * 0.35})`)
            grd.addColorStop(1, 'rgba(96,165,250,0)')
            ctx.beginPath()
            ctx.arc(dotX, dotY, glowR, 0, Math.PI * 2)
            ctx.fillStyle = grd
            ctx.fill()
          }

          // Solid dot
          ctx.beginPath()
          ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(96,165,250,${0.15 + intensity * 0.7})`
          ctx.fill()
        }
      }
    }
    draw()

    return () => { active = false; ro.disconnect() }
  }, [mode])

  // ── Proximity Hover Engine (spotlight falloff) ──────────────────────────────
  //
  // UX pattern: "proximity-aware focus state" — cards respond to cursor intent
  // before the user commits to a hover, creating a magnetic pull effect.
  //
  // Architecture (ported from specimen diagnostics):
  //   1. onMouseMove on the outermost page div (not on cards — absolute children eat events)
  //   2. Card DOM nodes stored in a useRef(Map) — no React state on mouse move = zero re-renders
  //   3. Distance from cursor to each card's bounding box edge via getBoundingClientRect()
  //   4. CSS variables (--prox-scale, --prox-y) set directly via node.style.setProperty()
  //   5. CSS class .bento-prox-container drives the transform with 0.1s linear interpolation
  //
  const calculateProximityHoverEffects = useCallback((e: React.MouseEvent) => {
    if (expand) return
    const { triggerDistancePx, maxScaleIncrease, maxLiftPx, easingPower } = PROXIMITY_CONFIG

    // Pass 1: calculate each card's intensity, find the focused card
    let focusedId: string | null = null
    let focusedIntensity = 0
    const intensities = new Map<string, number>()

    bentoCardRefs.current.forEach((node, id) => {
      if (!node) return
      const rect = node.getBoundingClientRect()
      const dx = Math.max(rect.left - e.clientX, 0, e.clientX - rect.right)
      const dy = Math.max(rect.top - e.clientY, 0, e.clientY - rect.bottom)
      const edgeDist = Math.hypot(dx, dy)

      let intensity = 0
      if (edgeDist < triggerDistancePx) {
        intensity = Math.pow(1 - edgeDist / triggerDistancePx, easingPower)
      }
      intensities.set(id, intensity)
      if (intensity > focusedIntensity) {
        focusedIntensity = intensity
        focusedId = id
      }
    })

    // Set global focus intensity on the active view container so chrome panels can read it.
    // activeViewRef is the common parent of both chrome panels and the bento grid.
    const activeEl = activeViewRef.current
    if (activeEl) {
      activeEl.style.setProperty('--prox-focus', String(focusedIntensity))
    }

    // Pass 2: focused card scales up (no dim), siblings dim proportionally
    // Also handles 3D tilt and magnetic pull when enabled via GlassParams
    bentoCardRefs.current.forEach((node, id) => {
      if (!node) return
      const intensity = intensities.get(id) ?? 0
      const rect = node.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const mouseOffX = e.clientX - centerX
      const mouseOffY = e.clientY - centerY
      const isInside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom

      if (id === focusedId && intensity > 0) {
        node.classList.remove('settling')
        node.style.setProperty('--prox-scale', String(1 + maxScaleIncrease * intensity))
        node.style.setProperty('--prox-y', `${maxLiftPx * intensity}px`)
        node.style.setProperty('--prox-dim', '0')
      } else {
        node.classList.add('settling')
        node.style.setProperty('--prox-scale', String(1 - focusedIntensity * 0.03))
        node.style.setProperty('--prox-y', '0px')
        node.style.setProperty('--prox-dim', String(focusedIntensity * 0.35))
      }

      // 3D tilt — all cards look toward the cursor globally
      if (glassParamsRef.current.tilt3d) {
        const tStr = glassParamsRef.current.tilt3dStrength
        const rawRx = Math.max(-25, Math.min(25, (-mouseOffY / 20) * tStr))
        const rawRy = Math.max(-25, Math.min(25, (mouseOffX / 20) * tStr))
        node.style.setProperty('--tilt-rx', `${rawRx}deg`)
        node.style.setProperty('--tilt-ry', `${rawRy}deg`)
      } else {
        node.style.setProperty('--tilt-rx', '0deg')
        node.style.setProperty('--tilt-ry', '0deg')
      }

      // Magnetic pull — card shifts toward cursor + tilts when mouse is inside
      if (glassParamsRef.current.magnetic && isInside) {
        const mStr = glassParamsRef.current.magneticStrength
        node.style.setProperty('--mag-x', `${mouseOffX * 0.08 * mStr}px`)
        node.style.setProperty('--mag-y', `${mouseOffY * 0.08 * mStr}px`)
      } else {
        node.style.setProperty('--mag-x', '0px')
        node.style.setProperty('--mag-y', '0px')
      }
    })
  }, [expand])

  /** Reset all cards to resting state when cursor leaves the page container. */
  const resetProximityHoverEffects = useCallback(() => {
    bentoCardRefs.current.forEach((node) => {
      if (!node) return
      node.classList.add('settling')
      node.style.setProperty('--prox-scale', '1')
      node.style.setProperty('--prox-y', '0px')
      node.style.setProperty('--prox-dim', '0')
      node.style.setProperty('--tilt-rx', '0deg')
      node.style.setProperty('--tilt-ry', '0deg')
      node.style.setProperty('--mag-x', '0px')
      node.style.setProperty('--mag-y', '0px')
    })
    const activeEl = activeViewRef.current
    if (activeEl) activeEl.style.setProperty('--prox-focus', '0')
    setHoveredCard(null)
  }, [])

  const expandCard = useCallback((id: string) => {
    if (expand) return
    const bentoEl = bentoGridRef.current
    // ⚠️ LOCKED — Must use bentoCardRefs (outer wrapper) for position, NOT cardRefs (inner div).
    // The inner div has inset:0 so offsetTop/offsetLeft are always 0. Using it breaks expand origin.
    const wrapperEl = bentoCardRefs.current.get(id)
    const activeEl = activeViewRef.current
    if (!bentoEl || !wrapperEl || !activeEl) return

    const origin = {
      top: wrapperEl.offsetTop, left: wrapperEl.offsetLeft,
      width: wrapperEl.offsetWidth, height: wrapperEl.offsetHeight,
    }
    const bentoRect = bentoEl.getBoundingClientRect()
    const activeRect = activeEl.getBoundingClientRect()
    const target = {
      top: activeRect.top - bentoRect.top,
      left: activeRect.left - bentoRect.left,
      width: activeRect.width,
      height: activeRect.height,
    }
    const dur = calcExpandDuration(origin, activeRect.width, activeRect.height)
    setHoveredCard(null)
    setExpand({ id, phase: 'locked', origin, target, dur })
  }, [expand])

  useEffect(() => {
    if (!expand) return
    if (expand.phase === 'locked') {
      const cardEl = cardRefs.current[expand.id]
      if (cardEl) void cardEl.offsetHeight
      requestAnimationFrame(() => requestAnimationFrame(() => {
        setExpand(prev => prev ? { ...prev, phase: 'expanding' } : null)
      }))
      return
    }
    if (expand.phase === 'expanding') {
      const t = setTimeout(() => {
        setExpand(prev => prev ? { ...prev, phase: 'open' } : null)
        resetProximityHoverEffects()
      }, expand.dur + 50)
      return () => clearTimeout(t)
    }
    if (expand.phase === 'collapsing') {
      const t = setTimeout(
        () => setExpand(prev => prev ? { ...prev, phase: 'settling' } : null),
        expand.dur + 30,
      )
      return () => clearTimeout(t)
    }
    if (expand.phase === 'settling') {
      requestAnimationFrame(() => {
        setExpand(null)
        resetProximityHoverEffects()
      })
    }
    return undefined
  }, [expand?.phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const collapseCard = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!expand) return
    const probeEl = probeRefs.current[expand.id]
    let freshOrigin = expand.origin
    if (probeEl) {
      freshOrigin = {
        top: probeEl.offsetTop, left: probeEl.offsetLeft,
        width: probeEl.offsetWidth, height: probeEl.offsetHeight,
      }
    }
    setExpand(prev => prev ? { ...prev, phase: 'collapsing', origin: freshOrigin } : null)
  }, [expand])

  /** Advance the profile stack — swipes the current front card(s) off-screen
   *  and promotes the target profile to the front position.
   *  Creates visual clones of outgoing cards for the swipe-out animation. */
  const advanceStackToProfile = (targetId: string) => {
    if (isAnimating || expand) return
    const targetIndex = order.indexOf(targetId)
    if (targetIndex <= 0) return
    setIsAnimating(true)
    setHoveredStackId(null)
    const idsToSwipe = order.slice(0, targetIndex)
    const swipeClones: SwipingClone[] = idsToSwipe.map((id, idx) => ({
      ...profiles.find(p => p.id === id)!,
      _cloneIdx: idx,
    }))
    setSwipingClones(swipeClones)
    // Reorder: target profile moves to front, swiped profiles go to back
    setOrder(prev => [...prev.slice(targetIndex), ...prev.slice(0, targetIndex)])
    // ⚠️ LOCKED — Double requestAnimationFrame is REQUIRED here. Do not simplify to single rAF.
    // The browser needs a full paint cycle to render the teleported cards at their back
    // position before transitions are re-enabled. Single rAF causes a visible flash/flicker
    // where cards animate from their old position instead of snapping to the back first.
    setNoTransitionIds(idsToSwipe)
    setTeleportingIds(idsToSwipe)
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setNoTransitionIds([])
      setTeleportingIds([])
    }))
    // Clean up clones after the swipe animation completes
    setTimeout(() => {
      setSwipingClones([])
      setIsAnimating(false)
    }, STACK_TRANSITION_MS + (swipeClones.length - 1) * 60)
  }

  /** Reset the stack to the primary profile (instant, no animation). */
  const resetStackToPrimary = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (order[0] === 'primary' || isAnimating) return
    setNoTransitionIds(['all'])
    setOrder(profiles.map(p => p.id))
    setTimeout(() => setNoTransitionIds([]), 30)
  }

  const isExpanding = expand && (expand.phase === 'expanding' || expand.phase === 'open')
  const isHoveringAnyCard = !!hoveredCard && !expand

  // ── Profile Stack Renderer ──────────────────────────────────────────────────
  //
  // Renders a single profile card in the stack. Called for:
  //   - Real cards (position 0 = front, 1 = first behind, 2 = second behind)
  //   - Swipe clones (visual copies that animate off-screen during profile switch)
  //
  // The stack uses a "scattered paper" metaphor — stacked cards are slightly
  // rotated (STACK_ROTATION_DEG) and inset (STACK_INSET_PX) to create organic
  // depth. When a stacked card transitions to front, it un-rotates and expands
  // simultaneously with the outgoing card's swipe-out animation.
  //
  const renderProfileCard = (profile: Profile | SwipingClone, isClone = false): React.ReactElement => {
    const cloneIndex = (profile as SwipingClone)._cloneIdx ?? 0
    const stackPosition = order.indexOf(profile.id)
    const isTeleporting = teleportingIds.includes(profile.id) && !isClone
    const isNoTransition = noTransitionIds.includes('all') || (noTransitionIds.includes(profile.id) && !isClone)
    const isActiveView = stackPosition === 0 || isClone
    const stackSliceWidth = 160  // px — wide enough that left border-radius stays hidden behind front card during peek
    const stackOffset = Math.min(55, Math.max(35, containerW * 0.04))
    const isFrontCard = stackPosition === 0 && !isClone

    // Profile card positioning — each stack position has its own transform, scale, and rotation.
    const stackTransition = `transform ${STACK_TRANSITION_MS}ms ${EASE_SMOOTH}, opacity ${STACK_TRANSITION_MS}ms ${EASE_SMOOTH}, width ${STACK_TRANSITION_MS}ms ${EASE_SMOOTH}, left ${STACK_TRANSITION_MS}ms ${EASE_SMOOTH}, top ${STACK_TRANSITION_MS}ms ${EASE_SMOOTH}, bottom ${STACK_TRANSITION_MS}ms ${EASE_SMOOTH}`

    // ── Stack Peek Effect (card fan / deck spread) ────────────────────────────
    //
    // UX pattern: "anticipatory reveal" — hovering a stacked card causes the
    // entire stack to fan open, signaling that clicking will advance to that profile.
    //
    // The hovered card shifts right to "present" itself.
    // Cards above it shift left to make room (no rotation on the front card).
    // Cards below fan out slightly to the right with a subtle tilt.
    //
    // All shifts use the existing stackTransition (STACK_TRANSITION_MS + EASE_SMOOTH)
    // so the fan eases in/out smoothly. Resets when the mouse leaves or a swipe starts.
    //
    const hoveredStackPos = hoveredStackId ? order.indexOf(hoveredStackId) : -1
    let peekShiftX = 0     // horizontal shift in px (negative = left, positive = right)
    let peekRotateDeg = 0  // additional rotation in degrees on top of STACK_ROTATION_DEG
    if (!isClone && !isTeleporting && !isAnimating && !expand && hoveredStackPos > 0) {
      if (hoveredStackPos === stackPosition) {
        // Hovered card: nudges right to "present" itself from behind the front card
        peekShiftX = 5
      } else if (hoveredStackPos === 1 && stackPosition === 0) {
        // Hovering middle → front card slides left to reveal middle (no rotation — stays stable)
        peekShiftX = -15
      } else if (hoveredStackPos === 2 && stackPosition === 0) {
        // Hovering back → front card slides further left (no rotation)
        peekShiftX = -20
      } else if (hoveredStackPos === 2 && stackPosition === 1) {
        // Hovering back → middle card slides left with a slight counter-tilt
        peekShiftX = -16
        peekRotateDeg = -1
      } else if (hoveredStackPos === 1 && stackPosition === 2) {
        // Hovering middle → back card fans out to the right with a subtle tilt
        peekShiftX = 5
        peekRotateDeg = 2
      }
    }

    const profileCardStyle: React.CSSProperties = {
      backgroundColor: profile.baseColor,
      position: 'absolute',
      borderRadius: 32,
      overflow: 'hidden',
      willChange: 'transform, opacity',
      transform: 'translateZ(0)',
      // Clone: full-width at front, stacked behind other clones
      ...(isClone && { width: activeWidth, left: 0, top: 0, bottom: 0, zIndex: 50 - cloneIndex }),
      // Teleporting: instantly moved to back position (no transition) before re-enabling animation
      ...(!isClone && isTeleporting && {
        width: stackSliceWidth, left: containerW - stackSliceWidth, top: 48, bottom: 48, zIndex: 5,
        transform: 'translateX(40px) scale(0.85) translateZ(0)', opacity: 0, pointerEvents: 'none',
      }),
      // Front card: full-width, no rotation, deep shadow
      ...(!isClone && !isTeleporting && stackPosition === 0 && {
        width: activeWidth, left: 0, top: 0, bottom: 0, zIndex: 30,
        transform: `translateX(${peekShiftX}px) scale(1) rotate(${STACK_ROTATION_DEG.front + peekRotateDeg}deg) translateZ(0)`, opacity: 1,
        boxShadow: '-20px 0 60px rgba(0,0,0,0.8)',
      }),
      // Middle stack: slight tilt + scale down (scattered paper effect)
      ...(!isClone && !isTeleporting && stackPosition === 1 && {
        width: stackSliceWidth, left: containerW - stackOffset - stackSliceWidth - STACK_INSET_PX.middle, top: 24, bottom: 24, zIndex: 20,
        transform: `translateX(${peekShiftX}px) scale(0.96) rotate(${STACK_ROTATION_DEG.middle + peekRotateDeg}deg) translateZ(0)`, opacity: 1,
        boxShadow: '-10px 0 40px rgba(0,0,0,0.6)', cursor: 'pointer',
      }),
      // Back stack: more tilt + more scale down
      ...(!isClone && !isTeleporting && stackPosition === 2 && {
        width: stackSliceWidth, left: containerW - stackSliceWidth - STACK_INSET_PX.back, top: 48, bottom: 48, zIndex: 10,
        transform: `translateX(${peekShiftX}px) scale(0.92) rotate(${STACK_ROTATION_DEG.back + peekRotateDeg}deg) translateZ(0)`, opacity: 1, cursor: 'pointer',
      }),
      ...(!isNoTransition && !isClone && { transition: stackTransition }),
    }

    // Chrome panel slide — hides header/greeting when a bento card is expanding to full-screen.
    // Duration is synced to the expand animation for coordinated motion.
    const expandDur = expand?.dur ?? CARD_EXPAND_FALLBACK_MS
    // Chrome slides up proportionally to proximity focus intensity (--prox-focus: 0→1).
    // When expanding a bento card, it overrides to fully hidden.
    const chromeTransform = isExpanding
      ? 'translateY(-80px)'
      : 'translateY(calc(var(--prox-focus, 0) * -60px))'
    const chromeOpacityVal = isExpanding
      ? 0
      : 'calc(1 - var(--prox-focus, 0) * 0.8)'
    const chromeDur = isHoveringAnyCard && !isExpanding ? STACK_TRANSITION_MS : expandDur * 0.6
    const chromeTransition = `transform ${chromeDur}ms ${EASE_SMOOTH}, opacity ${chromeDur}ms ease`
    const greetingTransform = isExpanding
      ? 'translateY(-40px)'
      : 'translateY(calc(var(--prox-focus, 0) * -25px))'
    const greetingOpacityVal = isExpanding
      ? 0
      : 'calc(1 - var(--prox-focus, 0) * 0.7)'
    const greetingDur = isHoveringAnyCard && !isExpanding ? STACK_TRANSITION_MS : expandDur * 0.5
    const greetingTransition = `transform ${greetingDur}ms ${EASE_SMOOTH}, opacity ${greetingDur}ms ease`

    // Clone swipe animation — visual copy of the outgoing profile card
    const swipeOutFadeClass = isClone ? 'fade-out-midway' : ''
    const swipeOutDelayStyle: React.CSSProperties = isClone ? { animationDelay: `${cloneIndex * 80}ms` } : {}

    return (
      <div
        key={isClone ? `clone-${profile.id}` : profile.id}
        className={`group ${isClone ? 'swipe-out-anim' : ''}`}
        style={profileCardStyle}
        onClick={() => {
          if (!isClone && stackPosition > 0 && teleportingIds.length === 0 && !expand) {
            advanceStackToProfile(profile.id)
          }
        }}
        onMouseEnter={() => {
          if (!isClone && stackPosition > 0 && !isAnimating && !expand) {
            setHoveredStackId(profile.id)
          }
        }}
        onMouseLeave={() => {
          if (!isClone) setHoveredStackId(null)
        }}
      >
        {/* Animated gradient bg */}
        <div
          className="grad-flow"
          style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(135deg, ${profile.gradStart}, ${profile.gradMid}, ${profile.gradEnd})`,
            backgroundSize: '200% 200%', zIndex: 0,
          }}
        />
        {/* Stack background — per-stack type + image, animated only on front card */}
        {(() => {
          const sb = glassParams.stackBackgrounds[profile.id]
          // In studio/builder mode, always force graph canvas — ignore user's bg selection
          const effectiveBgType = (isFrontCard && mode !== 'home') ? 'graph' as const : (sb?.backgroundType ?? glassParams.backgroundType)
          const effectiveBgImage = sb?.bgImage ?? glassParams.bgImage
          const hasAnimatedBg = effectiveBgType !== 'image'
          return (
            <>
              {/* Static image background */}
              {!hasAnimatedBg && effectiveBgImage && (
                <div style={{ position: 'absolute', inset: -20, zIndex: 0, overflow: 'hidden', borderRadius: 'inherit' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className={glassParams.bgMotion ? 'glass-lab-drift' : undefined}
                    src={effectiveBgImage.url}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: effectiveBgImage.position, display: 'block', ...(glassParams.bgMotion ? { animationDuration: `${glassParams.bgMotionSpeed}s` } : {}) }}
                  />
                </div>
              )}
              {/* Animated background — only renders on the front (visible) stack card
                  to avoid running multiple WebGL renderers simultaneously */}
              {hasAnimatedBg && isFrontCard && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', borderRadius: 'inherit' }}>
                  {effectiveBgType === 'fluid' && (
                    <FluidBackground params={{
                      fluidSpeed: glassParams.fluidSpeed, fluidZoom: glassParams.fluidZoom,
                      fluidComplexity: glassParams.fluidComplexity, fluidMorphSpeed: glassParams.fluidMorphSpeed,
                      fluidMorphIntensity: glassParams.fluidMorphIntensity, fluidTheme: glassParams.fluidTheme,
                      ecoMode: glassParams.ecoMode,
                    }} />
                  )}
                  {effectiveBgType === 'rain' && (
                    <RainBackground params={{ rainOpacity: glassParams.rainOpacity, rainBgColor: glassParams.rainBgColor }} />
                  )}
                  {effectiveBgType === 'abstract' && (
                    <AbstractBackground params={{
                      abstractSpeed: glassParams.abstractSpeed,
                      abstractTheme: glassParams.abstractTheme,
                      ecoMode: glassParams.ecoMode,
                    }} />
                  )}
                  {effectiveBgType === 'particles' && <ParticleBackground params={{
                    ecoMode: glassParams.ecoMode, bgColor: glassParams.particleBgColor,
                    minWind: glassParams.particleMinWind, maxWind: glassParams.particleMaxWind,
                    minSize: 16, maxSize: 57, emitterY: 0.4, emitterSpread: 0.35,
                    gravity: glassParams.particleGravity, turbulence: glassParams.particleTurbulence,
                    rotationSpeed: 0, tumbleStrength: 0.4, staticTilt: 0, particleCount: glassParams.particleCount,
                  }} />}
                  {effectiveBgType === 'lasers' && <LaserBackground params={{ ecoMode: glassParams.ecoMode }} />}
                  {effectiveBgType === 'waves' && <WaveBackground params={{ ecoMode: glassParams.ecoMode }} />}
                  {effectiveBgType === 'tunnel' && <TunnelBackground params={{ ecoMode: glassParams.ecoMode }} />}
                  {effectiveBgType === 'pattern' && <PatternBackground params={{ ecoMode: glassParams.ecoMode }} />}
                  {effectiveBgType === 'forest' && <ForestBackground params={{ ecoMode: glassParams.ecoMode }} />}
                  {effectiveBgType === 'graph' && (
                    <>
                      {/* Dark base */}
                      <div style={{ position: 'absolute', inset: 0, background: '#0c0b18' }} />
                      {/* Dot grid with drift */}
                      <div style={{
                        position: 'absolute', inset: '-20%', width: '140%', height: '140%',
                        backgroundImage: 'radial-gradient(circle, rgba(96,165,250,0.4) 1.6px, transparent 1.6px)',
                        backgroundSize: '28px 28px',
                        animation: 'graphDrift 20s ease-in-out infinite',
                        willChange: 'transform',
                      }} />
                      {/* Magnetic dot canvas */}
                      <canvas
                        ref={studioCanvasRef}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }}
                      />
                      {/* Radial vignette */}
                      <div style={{
                        position: 'absolute', inset: 0, zIndex: 2,
                        background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, rgba(12,11,24,0.5) 50%, rgba(12,11,24,0.85) 75%, #0c0b18 100%)',
                      }} />
                    </>
                  )}
                </div>
              )}

              <div className={`absolute inset-0 z-10 transition-colors duration-300 pointer-events-none ${(effectiveBgImage !== null || hasAnimatedBg || mode !== 'home') ? 'bg-black/15' : 'bg-black/40'} ${stackPosition > 0 ? 'group-hover:bg-black/10' : ''}`} />
            </>
          )
        })()}

        {/* ── Spine (visible when stacked) ── */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'flex-end', justifyContent: 'center', paddingRight: 12, zIndex: 20,
          opacity: isActiveView ? 0 : 1,
          pointerEvents: isActiveView ? 'none' : 'auto',
          transition: 'opacity 300ms',
        }}>
          <div className="flex flex-col items-center justify-center gap-6 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
            {profile.avatar
              ? <img src={profile.avatar} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)' }} className="opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-transform duration-300" alt={profile.name} />
              : profile.icon && <profile.icon size={16} color="white" />
            }
            <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '0.3em', fontSize: 11, textTransform: 'uppercase', fontWeight: 600, color: '#d1d5db' }}>
              {profile.name}
            </span>
          </div>
        </div>

        {/* ── Active view (front card) ── */}
        <div
          ref={isFrontCard ? activeViewRef : undefined}
          style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: activeWidth, zIndex: 30,
            opacity: isActiveView ? 1 : 0,
            pointerEvents: isActiveView ? 'auto' : 'none',
            transition: 'opacity 300ms',
          }}
        >
          {/* Top-left chrome — ⚠️ LOCKED: top:-1/left:-1 fixes anti-aliasing seam at card border-radius */}
          <div
            className={swipeOutFadeClass}
            style={{
              position: 'absolute', top: -1, left: -1, backgroundColor: CHROME_BG, borderBottomRightRadius: 28,
              zIndex: 40, paddingLeft: 6, paddingBottom: 5,
              transform: chromeTransform, opacity: chromeOpacityVal, transition: chromeTransition,
              pointerEvents: isExpanding ? 'none' : 'auto',
              ...swipeOutDelayStyle,
            }}
          >
            <SvgCorner position={{ top: 0, right: -28 }} rotation={0} />
            <SvgCorner position={{ bottom: -28, left: 0 }} rotation={0} />
            <div style={{ paddingTop: 24, paddingLeft: 32, paddingRight: 32, paddingBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="group/logo flex items-center gap-2 cursor-pointer" onClick={resetStackToPrimary}>
                <Hexagon size={22} color="#34d399" fill="rgba(52,211,153,0.2)" className="transition-transform duration-500 group-hover/logo:rotate-12" />
                <span style={{ fontWeight: 700, fontSize: 17, color: 'white' }}>Mosaic</span>
              </div>
              {containerW > 500 && (
                <>
                  <div style={{ width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                  <button
                    onClick={(e) => { e.stopPropagation(); setMode("home"); setGlassParams(p => ({ ...p, backgroundType: userBgTypeRef.current })) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 9999,
                      backgroundColor: mode === "home" ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${mode === "home" ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'}`,
                      color: mode === "home" ? 'white' : '#d1d5db',
                      fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    }}
                    className="hover:bg-white/10 hover:text-white transition-colors duration-200"
                  >
                    <Home size={15} /> Home
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (mode === 'home') userBgTypeRef.current = glassParams.backgroundType
                      setMode("studio")
                      setGlassParams(p => ({ ...p, backgroundType: "graph" }))
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 9999,
                      backgroundColor: mode !== "home" ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${mode !== "home" ? 'rgba(96,165,250,0.3)' : 'rgba(255,255,255,0.05)'}`,
                      color: mode !== "home" ? '#93c5fd' : '#d1d5db',
                      fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    }}
                    className="hover:bg-white/10 hover:text-white transition-colors duration-200"
                  >
                    <Wand2 size={15} /> Studio
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Top-right chrome — ⚠️ LOCKED: top:-1/right:-1 fixes anti-aliasing seam at card border-radius */}
          <div
            className={swipeOutFadeClass}
            style={{
              position: 'absolute', top: -1, right: -1, backgroundColor: CHROME_BG, borderBottomLeftRadius: 28,
              zIndex: 40, paddingRight: 6, paddingBottom: 5,
              transform: chromeTransform, opacity: chromeOpacityVal, transition: chromeTransition,
              pointerEvents: isExpanding ? 'none' : 'auto',
              ...swipeOutDelayStyle,
            }}
          >
            <SvgCorner position={{ top: 0, left: -28 }} rotation={90} />
            <SvgCorner position={{ bottom: -28, right: 0 }} rotation={90} size={28} />
            <div style={{ paddingTop: 24, paddingRight: 32, paddingLeft: 24, paddingBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, letterSpacing: '0.05em' }}>{dateStr}</span>
              {profile.id === 'primary'
                ? <AvatarDropdown {...(profile.avatar ? { avatarUrl: profile.avatar } : {})} />
                : profile.avatar
                  ? <img src={profile.avatar} style={{ width: 38, height: 38, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', objectFit: 'cover' }} alt={profile.name} /> // eslint-disable-line @next/next/no-img-element
                  : profile.icon && <profile.icon size={18} color="white" />
              }
            </div>
          </div>

          {/* Main content area */}
          <div style={{
            position: 'relative', height: '100%', width: '100%',
            padding: Math.min(56, Math.max(24, containerW * 0.04)),
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Greeting + name — hidden in studio/builder mode */}
            <div
              className={swipeOutFadeClass}
              style={{
                marginTop: mode === 'home' ? 80 : 0,
                marginBottom: mode === 'home' ? 28 : 0,
                maxHeight: mode === 'home' ? 300 : 0,
                overflow: 'hidden',
                transform: greetingTransform,
                opacity: mode === 'home' ? greetingOpacityVal : 0,
                transition: `${greetingTransition}, max-height 720ms cubic-bezier(0.25, 0.46, 0.45, 0.94), margin 720ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
                ...swipeOutDelayStyle,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#9ca3af', marginBottom: 18 }}>
                <div style={{ width: 40, height: 2, backgroundColor: profile.greetingColor, borderRadius: 9999, opacity: 0.8 }} />
                {greeting}
              </div>
              <h1
                key={`name-${profile.id}-${String(isActiveView && !isClone)}`}
                style={{ fontSize: Math.min(68, Math.max(36, containerW * 0.065)), fontFamily: 'Georgia, "Times New Roman", serif', color: 'white', lineHeight: 1, marginBottom: 10 }}
              >
                {isActiveView && !isClone ? (
                  <>
                    {profile.name.split('').map((char, i) => (
                      <span key={i} className="spell-char" style={{ animationDelay: `${i * 0.05 + 0.15}s` }}>
                        {char === ' ' ? '\u00A0' : char}
                      </span>
                    ))}
                    <span className="spell-char" style={{ color: profile.greetingColor, animationDelay: `${profile.name.length * 0.05 + 0.15}s` }}>.</span>
                  </>
                ) : (
                  <>{profile.name}<span style={{ color: profile.greetingColor }}>.</span></>
                )}
              </h1>
              <p style={{ fontSize: Math.min(17, Math.max(13, containerW * 0.014)), color: '#d1d5db', fontWeight: 300, letterSpacing: '0.05em' }}>
                Your world, at a glance.
              </p>
            </div>

            {/* Content area — slides vertically between Home (bento grid) and Studio */}
            {!isClone && (
              <div style={{ flex: 1, position: 'relative', minHeight: 280, overflow: (expand || mode === 'home') ? 'visible' : 'hidden' }}>
                {/* Home mode — bento grid */}
                <div
                  ref={isFrontCard ? bentoGridRef : undefined}
                  style={{
                    position: 'absolute', inset: 0,
                    overflow: 'visible', perspective: 1000,
                    transform: mode === 'home' ? 'translateY(0)' : 'translateY(100%)',
                    opacity: mode === 'home' ? 1 : 0,
                    transition: expand ? 'none' : 'transform 600ms cubic-bezier(0.4, 0, 0.2, 1), opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                    pointerEvents: mode === 'home' ? 'auto' : 'none',
                  }}
                >
                {/* Invisible probes track original card positions for collapse animation */}
                {isFrontCard && BENTO_CARDS.map(card => (
                  <div
                    key={`probe-${card.id}`}
                    ref={el => { probeRefs.current[card.id] = el }}
                    style={{ position: 'absolute', ...card.pos, visibility: 'hidden', pointerEvents: 'none', zIndex: -1 }}
                  />
                ))}

                {BENTO_CARDS.map((card, cardIdx) => {
                  const IconComp = card.icon
                  const isThis = expand?.id === card.id
                  const isExpandingPhase = isThis && expand?.phase === 'expanding'
                  const isOpenPhase = isThis && expand?.phase === 'open'
                  const isCollapsingPhase = isThis && expand?.phase === 'collapsing'
                  const isMounted = !!isThis && !!expand

                  let posStyle: React.CSSProperties = { ...card.pos }
                  let transitionStr = 'none'
                  let borderRad = 32
                  let zIdx = 1

                  if (isMounted && expand) {
                    zIdx = 50
                    if (expand.phase === 'locked') {
                      posStyle = { top: expand.origin.top, left: expand.origin.left, width: expand.origin.width, height: expand.origin.height }
                    } else if (isExpandingPhase || isOpenPhase) {
                      posStyle = { top: expand.target.top, left: expand.target.left, width: expand.target.width, height: expand.target.height }
                      borderRad = 0
                      if (isExpandingPhase) {
                        transitionStr = `top ${expand.dur}ms cubic-bezier(0.4,0,0.2,1), left ${expand.dur}ms cubic-bezier(0.4,0,0.2,1), width ${expand.dur}ms cubic-bezier(0.4,0,0.2,1), height ${expand.dur}ms cubic-bezier(0.4,0,0.2,1), border-radius ${expand.dur}ms cubic-bezier(0.4,0,0.2,1)`
                      }
                    } else if (isCollapsingPhase) {
                      posStyle = { top: expand.origin.top, left: expand.origin.left, width: expand.origin.width, height: expand.origin.height }
                      borderRad = 32
                      transitionStr = `top ${expand.dur}ms cubic-bezier(0.4,0,0.2,1), left ${expand.dur}ms cubic-bezier(0.4,0,0.2,1), width ${expand.dur}ms cubic-bezier(0.4,0,0.2,1), height ${expand.dur}ms cubic-bezier(0.4,0,0.2,1), border-radius ${expand.dur}ms cubic-bezier(0.4,0,0.2,1)`
                    } else if (expand.phase === 'settling') {
                      // Keep the same pixel coords the collapse animation ended on so there's
                      // no coordinate-system swap (px → %) before expand is nulled next rAF.
                      posStyle = { top: expand.origin.top, left: expand.origin.left, width: expand.origin.width, height: expand.origin.height }
                    }
                  }

                  const isHovered = hoveredCard === card.id && !expand

                  return (
                    <div
                      key={card.id}
                      ref={(el) => {
                        if (isFrontCard) {
                          if (el) bentoCardRefs.current.set(card.id, el)
                          else bentoCardRefs.current.delete(card.id)
                        }
                      }}
                      className="bento-prox-container"
                      style={{
                        position: 'absolute',
                        ...posStyle,
                        zIndex: zIdx,
                        transition: transitionStr,
                      }}
                    >
                    <div
                      ref={isFrontCard ? (el => { cardRefs.current[card.id] = el }) : undefined}
                      className={glassParams.ambientFloat && !expand ? 'ambient-float-active' : undefined}
                      onClick={() => { if (!expand) expandCard(card.id) }}
                      onMouseEnter={() => { if (!expand) setHoveredCard(card.id) }}
                      onMouseLeave={() => setHoveredCard(null)}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: borderRad,
                        overflow: 'hidden',
                        display: 'flex', flexDirection: 'column',
                        cursor: isThis ? 'default' : 'pointer',
                        ...(glassParams.ambientFloat ? { '--float-speed': `${glassParams.floatSpeed}s`, animationDelay: `${cardIdx * -0.8}s` } as React.CSSProperties : {}),
                        background: `linear-gradient(145deg, ${card.glassTint} 0%, rgba(8,6,20,0.18) 100%)`,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.35)',
                        transition: `border-radius ${expand?.dur ?? 300}ms cubic-bezier(0.4,0,0.2,1)`,
                        backfaceVisibility: 'hidden',
                      }}
                    >
                      {/* ── Background image (selected via Lab) — sits behind glass so refraction is visible ── */}
                      {glassParams.bgImage && (
                        <div style={{
                          position: 'absolute', inset: -15, zIndex: -1, borderRadius: 'inherit', overflow: 'hidden',
                          pointerEvents: 'none',
                        }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            className={glassParams.bgMotion ? 'glass-lab-drift' : undefined}
                            src={glassParams.bgImage.url}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: glassParams.bgImage.position, display: 'block', ...(glassParams.bgMotion ? { animationDuration: `${glassParams.bgMotionSpeed}s` } : {}) }}
                          />
                        </div>
                      )}

                      {/* ── Glass engine filter (swappable via Lab) ── */}
                      <GlassFilterSvg cardId={card.id} params={glassParams} />

                      {/* ── Glass backdrop — routes through the active engine filter ── */}
                      <div style={{
                        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', borderRadius: 'inherit',
                        backdropFilter: isMounted ? 'none' : glassBackdropFilter(card.id, glassParams),
                        WebkitBackdropFilter: isMounted ? 'none' : glassBackdropFilter(card.id, glassParams),
                      }} />

                      {/* ── Glass surface tint ── */}
                      {glassParams.opacity > 0 && (
                        <div style={{
                          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', borderRadius: 'inherit',
                          backgroundColor: glassParams.tint === 'light'
                            ? `rgba(255,255,255,${glassParams.opacity})`
                            : `rgba(0,10,30,${glassParams.opacity})`,
                        }} />
                      )}

                      {/* ── Glass edge: gradient border (mask trick) — cheap, always on ── */}
                      <div className="bento-glass-edge" style={{
                        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
                        padding: '1px', borderRadius: 'inherit',
                      }} />

                      {/* ── Specular: top-left highlight — cheap, always on ── */}
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '60%',
                        zIndex: 2, pointerEvents: 'none', borderRadius: 'inherit',
                        background: 'linear-gradient(155deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 35%, transparent 65%)',
                        opacity: isHovered ? 1 : 0.7,
                        transition: 'opacity 400ms ease',
                      }} />

                      {/* ── Shimmer: paused during expansion to avoid extra composite layers ── */}
                      <div style={{
                        position: 'absolute', top: '-100%', left: '-75%',
                        width: '50%', height: '300%',
                        zIndex: 3, pointerEvents: 'none',
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)',
                        animation: `glassShimmerSweep 9s ease-in-out ${cardIdx * 2.2}s infinite`,
                        animationPlayState: isMounted ? 'paused' : 'running',
                      }} />

                      {/* Sibling dim overlay — driven by proximity engine's --prox-dim variable.
                         Dims gradually as the mouse approaches a neighbor card, not on hover enter. */}
                      <div className="bento-prox-dim" />

                      {/* Dark overlay when expanding */}
                      {isMounted && expand && (
                        <div style={{
                          position: 'absolute', inset: 0, zIndex: 5,
                          background: 'linear-gradient(to bottom right, #0d151f, #070a0d)',
                          opacity: isOpenPhase ? 0.98 : 0,
                          animation: isExpandingPhase
                            ? `bgFadeIn ${expand.dur}ms ease forwards`
                            : isCollapsingPhase
                              ? `bgFadeOut ${expand.dur}ms ease forwards`
                              : 'none',
                          pointerEvents: 'none',
                        }} />
                      )}

                      {/* Collapsed card face */}
                      <div style={isMounted && expand ? {
                        position: 'absolute', top: 0, left: 0,
                        width: expand.origin.width, height: expand.origin.height,
                        zIndex: 6, pointerEvents: 'none',
                        opacity: isOpenPhase ? 0 : 1,
                        animation: isExpandingPhase
                          ? `collapsedFadeOut ${expand.dur}ms ease forwards`
                          : isCollapsingPhase
                            ? `collapsedFadeIn ${expand.dur}ms ease forwards`
                            : 'none',
                      } : { position: 'absolute', inset: 0, zIndex: 6, opacity: 1 }}>
                        <div style={{
                          position: 'absolute', inset: 0, zIndex: 6,
                          transform: isHovered ? 'scale(1.1) translate(-3px, -3px)' : 'scale(1) translate(0, 0)',
                          transition: `transform ${STACK_TRANSITION_MS}ms ${EASE_SMOOTH}`,
                        }}>{card.illus()}</div>
                        <div style={{
                          position: 'absolute', inset: 0, zIndex: 10,
                          padding: Math.min(24, Math.max(14, containerW * 0.02)),
                          display: 'flex', flexDirection: 'column',
                          pointerEvents: isMounted ? 'none' : 'auto',
                        }}>
                          <div style={{
                            width: 42, height: 42, borderRadius: 13, backgroundColor: card.bgColor,
                            border: `1px solid ${card.borderColor}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: 'auto',
                            transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                            transition: `transform ${STACK_TRANSITION_MS}ms ${EASE_SMOOTH}`,
                          }}>
                            <IconComp size={17} color={card.iconColor} />
                          </div>
                          <div style={{ marginTop: 'auto' }}>
                            <h4 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', marginBottom: 5 }}>
                              {card.label}
                            </h4>
                            <h2 style={{ fontSize: Math.min(26, Math.max(16, containerW * 0.022)), fontFamily: 'Georgia, "Times New Roman", serif', color: 'white', marginBottom: 8, lineHeight: 1 }}>
                              {card.label}
                            </h2>
                            <div style={{
                              width: 34, height: 34, borderRadius: '50%',
                              border: '1px solid rgba(255,255,255,0.1)',
                              backgroundColor: 'rgba(255,255,255,0.05)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transform: isHovered ? 'translate(3px, -3px)' : 'translate(0px, 0px)',
                              transition: `transform ${STACK_TRANSITION_MS}ms ${EASE_SMOOTH}`,
                            }}>
                              <ArrowUpRight size={13} color="white" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ── Expanded card content ── */}
                      {isMounted && expand && (
                        <div
                          style={{
                            position: 'absolute', top: 0, left: 0,
                            width: expand.target.width, height: expand.target.height,
                            display: 'flex', flexDirection: 'column', zIndex: 15,
                            padding: 'clamp(24px, 4vw, 48px)',
                            opacity: isOpenPhase ? 1 : 0,
                            pointerEvents: isOpenPhase ? 'auto' : 'none',
                            animation: isExpandingPhase
                              ? `contentFadeIn ${expand.dur}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`
                              : isCollapsingPhase
                                ? `contentFadeOut ${expand.dur}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`
                                : 'none',
                          }}
                          className="overflow-hidden"
                        >
                          {/* Action buttons */}
                          <div className="absolute top-6 right-6 z-[110] flex items-center gap-3">
                            <a
                              href={card.href}
                              onClick={e => e.stopPropagation()}
                              className="h-11 px-5 rounded-full bg-white/10 hover:bg-white text-white hover:text-black flex items-center justify-center gap-2 transition-colors duration-300 text-sm font-medium no-underline"
                            >
                              Open <ArrowUpRight className="w-4 h-4" />
                            </a>
                            <button
                              onClick={collapseCard}
                              className="w-11 h-11 rounded-full bg-white/10 hover:bg-white text-white hover:text-black flex items-center justify-center transition-colors duration-300 shadow-2xl group/close"
                            >
                              <X className="w-5 h-5 group-hover/close:rotate-90 transition-transform duration-300" />
                            </button>
                          </div>

                          <div className="w-full h-full mx-auto flex flex-col pt-2">
                            {/* Card header */}
                            <div className="flex items-center gap-6 mb-8 shrink-0">
                              <div
                                style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: card.bgColor, border: `1px solid ${card.borderColor}` }}
                                className="flex items-center justify-center flex-shrink-0"
                              >
                                <IconComp size={32} color={card.iconColor} />
                              </div>
                              <div>
                                <h1 className="text-4xl md:text-5xl font-serif text-white leading-none mb-2">{card.label}</h1>
                                <p className="text-gray-400 text-sm md:text-base font-light tracking-wide">
                                  {card.statusLabel}:{' '}
                                  <span style={{ color: card.iconColor }}>{card.statusValue}</span>
                                </p>
                              </div>
                            </div>

                            {/* Content grid */}
                            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                              <div className="flex flex-col gap-4 h-full">
                                {card.activities.map((activity, i) => (
                                  <div
                                    key={i}
                                    className="group/activity flex-1 flex items-center justify-between px-6 rounded-[24px] bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer min-h-0"
                                  >
                                    <div className="flex items-center gap-6">
                                      <div style={{ color: card.iconColor }} className="font-mono text-xs lg:text-sm">0{i + 1}</div>
                                      <div className="text-lg lg:text-xl text-white font-medium">{activity}</div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover/activity:text-white group-hover/activity:translate-x-1 transition-[color,transform] duration-300" />
                                  </div>
                                ))}
                                <a
                                  href={card.href}
                                  onClick={e => e.stopPropagation()}
                                  className="group/add flex-1 rounded-[24px] border-2 border-dashed border-white/10 flex items-center justify-center gap-3 text-gray-500 hover:text-white hover:border-white/30 transition-colors duration-300 text-base lg:text-lg font-medium min-h-0 no-underline"
                                >
                                  <Plus className="w-5 h-5 group-hover/add:rotate-90 transition-transform duration-300" />
                                  Open {card.label}
                                </a>
                              </div>
                              <div className="bg-white/5 rounded-[32px] p-8 border border-white/5 h-full flex flex-col items-center justify-center">
                                <div className="text-center">
                                  <div className="text-gray-600 text-xs lg:text-sm uppercase tracking-[0.4em] mb-4">{card.statusLabel}</div>
                                  <div className="text-4xl lg:text-6xl font-serif leading-none mb-2" style={{ color: card.iconColor }}>{card.statusValue}</div>
                                  <div className="text-gray-600 text-xs uppercase tracking-widest mt-4">Current</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    </div>
                  )
                })}
                </div>

                {/* Studio mode — app list, slides in from top.
                    Top padding accounts for the chrome header panels that float above.
                    Mouse move forwarded to studioMouseRef for magnetic dot effect on the stack background. */}
                <div
                  onMouseMove={(e) => { studioMouseRef.current = { x: e.clientX, y: e.clientY } }}
                  onMouseLeave={() => { studioMouseRef.current = { x: -1000, y: -1000 } }}
                  style={{
                    position: 'absolute', inset: 0, overflow: 'auto',
                    transform: mode === 'studio' ? 'translateY(0) scale(1)' : mode === 'builder' ? 'translateY(0) scale(0.95)' : 'translateY(-100%) scale(1)',
                    opacity: mode === 'studio' && builderAnim === 'idle' ? 1 : 0,
                    transition: 'transform 600ms cubic-bezier(0.4, 0, 0.2, 1), opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                    pointerEvents: mode === 'studio' ? 'auto' : 'none',
                    display: 'flex', flexDirection: 'column', gap: 16,
                    paddingTop: CHROME_HEADER_HEIGHT_PX + 12,
                    paddingLeft: 16, paddingRight: 16, paddingBottom: 16,
                  }}
                >
                  {/* Studio content — fills available space below chrome header */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, position: 'relative', zIndex: 1 }}>

                    {/* Create new app card — stays in flow. On click, captures its rect
                        and spawns a fixed overlay that expands from that exact position. */}
                    <div
                      ref={createCardRef}
                      onClick={() => {
                        if (builderAnim === 'idle' && createCardRef.current) {
                          builderStartRect.current = createCardRef.current.getBoundingClientRect()
                          setBuilderAnim("expanding")
                          setTimeout(() => { setMode("builder"); setBuilderAnim("open") }, 5000)
                        }
                      }}
                      style={{
                        width: '100%', maxWidth: 320, aspectRatio: '4/3',
                        borderRadius: 20, cursor: 'pointer',
                        background: 'rgba(96,165,250,0.06)', border: '2px dashed rgba(96,165,250,0.25)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        color: '#60a5fa', gap: 12,
                        // Hide while the overlay is covering it
                        opacity: builderAnim === 'idle' ? 1 : 0,
                        transition: 'opacity 200ms ease',
                      }}
                    >
                      <div style={{
                        width: 52, height: 52, borderRadius: 16,
                        background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Plus size={24} />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: 15, fontWeight: 700, display: 'block' }}>Create New App</span>
                        <span style={{ fontSize: 11, color: 'rgba(96,165,250,0.6)', marginTop: 4, display: 'block' }}>Describe it in plain English</span>
                      </div>
                    </div>

                    {/* TODO: Prototype grid goes here when prototypes exist */}

                  </div>
                </div>

                {/* Builder is rendered as a fixed viewport overlay — see bottom of render */}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes gradFlow { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        /* Builder expand — two-phase: width first (33%), then height (67%).
           Shadows morph from inset (pressed) to outset (elevated) to deep (landed).
           Per animations.md panel expand rules. */
        /* Builder expand uses CSS vars --bx, --by, --bw, --bh set from JS
           to start at the card's exact screen position, then grow to fill viewport. */
        @keyframes builderExpand {
          0% {
            top: var(--by); left: var(--bx); width: var(--bw); height: var(--bh);
            border-radius: 20px;
            box-shadow: inset 6px 6px 12px rgba(0,0,0,0.3), inset -4px -4px 8px rgba(96,165,250,0.1);
          }
          15% {
            top: var(--by); left: var(--bx); width: var(--bw); height: var(--bh);
            border-radius: 18px;
            box-shadow: 8px 8px 24px rgba(96,165,250,0.15);
          }
          45% {
            top: 0; left: 0; width: 100vw; height: var(--bh);
            border-radius: 14px;
            box-shadow: 12px 12px 32px rgba(96,165,250,0.12);
          }
          100% {
            top: 0; left: 0; width: 100vw; height: 100vh;
            border-radius: 0px;
            box-shadow: none;
          }
        }
        @keyframes builderCollapse {
          0%   { top: 0; left: 0; width: 100vw; height: 100vh; border-radius: 0; opacity: 1; }
          40%  { top: 0; left: 0; width: 100vw; height: var(--bh); border-radius: 14px; opacity: 0.8; }
          70%  { top: var(--by); left: var(--bx); width: var(--bw); height: var(--bh); border-radius: 18px; opacity: 0.4; }
          100% { top: var(--by); left: var(--bx); width: var(--bw); height: var(--bh); border-radius: 20px; opacity: 0; }
        }
        @keyframes builderContentIn {
          0%, 65% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes builderFaceOut {
          0% { opacity: 1; }
          30% { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes builderFaceIn {
          0% { opacity: 0; }
          70% { opacity: 0; }
          100% { opacity: 1; }
        }

        @keyframes graphDrift {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-8px, 5px); }
          50% { transform: translate(5px, -8px); }
          75% { transform: translate(-3px, -4px); }
        }
        .grad-flow { animation: gradFlow 15s ease infinite; will-change: background-position; }

        /* ⚠️ LOCKED — swipe-out animation: duration, rotation, and easing are hand-tuned.
           The -10deg rotation mirrors the scattered paper stack angles. */
        @keyframes swipeOut {
          0%   { transform: translateX(0) scale(1) translateZ(0); opacity: 1; }
          100% { transform: translateX(-120vw) rotate(-10deg) scale(0.95) translateZ(0); opacity: 0; }
        }
        .swipe-out-anim { animation: swipeOut 480ms cubic-bezier(0.25, 0.1, 0.25, 1) forwards; }

        /* ⚠️ LOCKED — fade-out timing synced to swipe-out duration. */
        @keyframes fadeOutMidway { 0%{opacity:1} 40%,100%{opacity:0} }
        .fade-out-midway { animation: fadeOutMidway 480ms cubic-bezier(0.25, 0.1, 0.25, 1) forwards; }

        @keyframes bgFadeIn    { 0%,20%{opacity:0}    100%{opacity:0.98} }
        @keyframes bgFadeOut   { 0%{opacity:0.98}     40%,100%{opacity:0} }
        @keyframes collapsedFadeOut { 0%{opacity:1}   30%,100%{opacity:0} }
        @keyframes collapsedFadeIn  { 0%,70%{opacity:0} 100%{opacity:1} }

        @keyframes contentFadeIn {
          0%,65% { opacity:0; transform:translateY(6px) scale(0.99); }
          100%   { opacity:1; transform:translateY(0)   scale(1);    }
        }
        @keyframes contentFadeOut {
          0%       { opacity:1; transform:translateY(0)   scale(1);    }
          20%,100% { opacity:0; transform:translateY(6px) scale(0.99); }
        }

        @keyframes spellOut { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }
        .spell-char { display:inline-block; opacity:0; animation:spellOut 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }

        /* Gradient border for bento glass cards — 1px edge using CSS mask trick */
        .bento-glass-edge {
          background: linear-gradient(145deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.16) 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }

        /* Liquid glass shimmer — diagonal stripe sweeps across each bento card */
        @keyframes glassShimmerSweep {
          0%,100% { transform: translateX(0)    skewX(-12deg); opacity: 0;   }
          15%      { opacity: 1; }
          50%      { transform: translateX(350%) skewX(-12deg); opacity: 0.8; }
          85%      { opacity: 0; }
        }

        /* ⚠️ LOCKED — Proximity Hover Engine CSS binding.
           0.1s linear smooths continuous JS mousemove updates.
           CSS variables are set by calculateProximityHoverEffects() via style.setProperty().
           Do not move transform to inline styles — React re-renders will wipe the variables. */
        .bento-prox-container {
          transition: transform 0.13s linear;
          will-change: transform;
          transform:
            scale(var(--prox-scale, 1))
            translateY(var(--prox-y, 0px))
            translate3d(var(--mag-x, 0px), var(--mag-y, 0px), 0)
            rotateX(var(--tilt-rx, 0deg))
            rotateY(var(--tilt-ry, 0deg));
        }
        .bento-prox-container.settling {
          transition: transform 0.72s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .bento-prox-dim {
          position: absolute;
          inset: 0;
          z-index: 7;
          background-color: black;
          pointer-events: none;
          border-radius: inherit;
          opacity: var(--prox-dim, 0);
          transition: opacity 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .no-underline { text-decoration: none; }
      `}</style>

      <div
        onMouseMove={calculateProximityHoverEffects}
        onMouseLeave={resetProximityHoverEffects}
        style={{
        minHeight: '100vh', width: '100%', color: 'white',
        // Radial bloom of deep indigo at the top, fading to near-black at the bottom.
        // The chrome cutout panels use CHROME_BG (#0c0b18) which matches the top-corner of this gradient.
        background: 'radial-gradient(ellipse 120% 80% at 50% -10%, #16133a 0%, #0c0b18 38%, #07060e 70%, #060509 100%)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        userSelect: 'none', padding: 16, boxSizing: 'border-box', WebkitFontSmoothing: 'antialiased',
      }}>
        <div
          ref={containerRef}
          style={{ position: 'relative', width: '100%', maxWidth: 1700, minHeight: 700, height: 'calc(100vh - 32px)' }}
        >
          {profiles.map(profile => renderProfileCard(profile, false))}
          {swipingClones.map(clone => renderProfileCard(clone, true))}
        </div>
      </div>

      {/* ── Fixed Lab trigger — right edge, shimmer border ── */}
      <style>{`
        @property --lab-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes labShimmer { to { --lab-angle: 360deg; } }
        @keyframes labBtnIn {
          from { opacity: 0; transform: translateX(52px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .lab-shimmer-wrap {
          animation: labShimmer 2.64s linear infinite;
          background: conic-gradient(
            from var(--lab-angle) at 50% 50%,
            transparent 0%,
            transparent 52%,
            rgba(147,197,253,0.0) 60%,
            rgba(147,197,253,0.9) 68%,
            rgba(196,181,253,1.0) 72%,
            rgba(147,197,253,0.9) 76%,
            rgba(147,197,253,0.0) 84%,
            transparent 100%
          );
        }
      `}</style>
      <div
        className="lab-shimmer-wrap"
        style={{
          position: 'fixed', right: 0, bottom: '12%',
          zIndex: 198, borderRadius: '12px 0 0 12px',
          padding: '1px 0 1px 1px',
          opacity: labOpen ? 0 : 1,
          pointerEvents: labOpen ? 'none' : 'auto',
        }}
      >
        <button
          key={btnKey}
          onClick={() => setLabOpen(o => !o)}
          title="Glass Lab"
          style={{
            width: 44, height: 110,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7,
            borderRadius: '11px 0 0 11px',
            background: 'rgba(9,9,19,0.88)',
            backdropFilter: 'blur(14px)',
            border: 'none', cursor: 'pointer',
            animation: 'labBtnIn 540ms cubic-bezier(0.22,1,0.36,1) both',
          }}
        >
          <FlaskConical size={16} color='rgba(255,255,255,0.45)' />
          <span style={{
            fontSize: 8, fontWeight: 800, letterSpacing: '0.14em',
            color: 'rgba(255,255,255,0.35)',
            writingMode: 'vertical-rl', transform: 'rotate(180deg)',
            textTransform: 'uppercase', userSelect: 'none',
          }}>LAB</span>
        </button>
      </div>

      {/* ── Glass Laboratory panel ── */}
      {labOpen && (
        <GlassLabPanel
          params={glassParams}
          onChange={(newParams) => {
            // In studio/builder mode, save bg type changes to the ref but keep "graph" active
            if (mode !== 'home' && newParams.backgroundType !== 'graph') {
              userBgTypeRef.current = newParams.backgroundType
              setGlassParams({ ...newParams, backgroundType: 'graph' })
            } else {
              setGlassParams(newParams)
            }
          }}
          onClose={() => setLabOpen(false)}
          profiles={order.map(id => {
            const p = profiles.find(x => x.id === id)
            return p ? { id: p.id, name: p.name } : null
          }).filter((p): p is { id: string; name: string } => p !== null)}
        />
      )}
    </>
  )
}
