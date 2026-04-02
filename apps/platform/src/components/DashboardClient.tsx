"use client"

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  ArrowUpRight, Home, Wallet, Baby, CalendarDays,
  Hexagon, Users, X, Plus, ChevronRight, LogOut, UserRound, FlaskConical,
} from 'lucide-react'
import { useUser, useClerk } from '@clerk/nextjs'
import { GlassFilterSvg, GlassLabPanel, glassBackdropFilter, DEFAULT_GLASS } from './GlassLab'
import type { GlassParams } from './GlassLab'

// ── Constants ─────────────────────────────────────────────────────────────────

// Deep indigo-to-near-black — used as the solid fill for chrome cutout SVGs and panels.
// Must be close to the gradient's top-corner colour so the chrome masks blend.
const BG = '#0c0b18'
const BASE_DUR = 300
const MAX_EXTRA = 350
const EXPAND_DUR = 500

// ── Types ─────────────────────────────────────────────────────────────────────

type Profile = {
  id: string
  name: string
  greetingColor: string
  avatar?: string
  icon?: React.ComponentType<{ size?: number; color?: string }>
  gradStart: string
  gradMid: string
  gradEnd: string
  baseColor: string
}

type SwipingClone = Profile & { _cloneIdx: number }

type ExpandPhase = 'locked' | 'expanding' | 'open' | 'collapsing' | 'settling'

type ExpandState = {
  id: string
  phase: ExpandPhase
  origin: { top: number; left: number; width: number; height: number }
  target: { top: number; left: number; width: number; height: number }
  dur: number
}

type BentoCard = {
  id: string
  label: string
  bgColor: string
  borderColor: string
  icon: React.ComponentType<{ size?: number; color?: string }>
  iconColor: string
  glassTint: string   // accent color at very low opacity for the glass tint
  pos: React.CSSProperties
  href: string
  activities: string[]
  statusLabel: string
  statusValue: string
  illus: () => React.ReactNode
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcDur(
  pos: { top: number; left: number; width: number; height: number },
  ow: number,
  oh: number,
): number {
  const maxDist = Math.max(
    pos.left,
    ow - (pos.left + pos.width),
    pos.top,
    oh - (pos.top + pos.height),
  )
  return BASE_DUR + (maxDist / Math.max(ow, oh)) * MAX_EXTRA
}

function getGreeting(): string {
  const h = new Date().getHours()
  return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening'
}

function getDateStr(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// ── SvgCorner ─────────────────────────────────────────────────────────────────

function SvgCorner({
  position, rotation = 0, color = BG, size = 28,
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
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const [glassParams, setGlassParams] = useState<GlassParams>(DEFAULT_GLASS)
  const [labOpen, setLabOpen] = useState(false)
  const [greeting, setGreeting] = useState('Good Evening')
  const [dateStr, setDateStr] = useState('')

  const bentoGridRef = useRef<HTMLDivElement>(null)
  const activeViewRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const probeRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    setGreeting(getGreeting())
    setDateStr(getDateStr())
  }, [])

  const expandCard = useCallback((id: string) => {
    if (expand) return
    const bentoEl = bentoGridRef.current
    const cardEl = cardRefs.current[id]
    const activeEl = activeViewRef.current
    if (!bentoEl || !cardEl || !activeEl) return

    const origin = {
      top: cardEl.offsetTop, left: cardEl.offsetLeft,
      width: cardEl.offsetWidth, height: cardEl.offsetHeight,
    }
    const bentoRect = bentoEl.getBoundingClientRect()
    const activeRect = activeEl.getBoundingClientRect()
    const target = {
      top: activeRect.top - bentoRect.top,
      left: activeRect.left - bentoRect.left,
      width: activeRect.width,
      height: activeRect.height,
    }
    const dur = calcDur(origin, activeRect.width, activeRect.height)
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
      const t = setTimeout(
        () => setExpand(prev => prev ? { ...prev, phase: 'open' } : null),
        expand.dur + 50,
      )
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
      requestAnimationFrame(() => setExpand(null))
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

  const handleAdvance = (targetId: string) => {
    if (isAnimating || expand) return
    const targetIndex = order.indexOf(targetId)
    if (targetIndex <= 0) return
    setIsAnimating(true)
    const idsToSwipe = order.slice(0, targetIndex)
    const clones: SwipingClone[] = idsToSwipe.map((id, idx) => ({
      ...profiles.find(p => p.id === id)!,
      _cloneIdx: idx,
    }))
    setSwipingClones(clones)
    setOrder(prev => [...prev.slice(targetIndex), ...prev.slice(0, targetIndex)])
    setNoTransitionIds(idsToSwipe)
    setTeleportingIds(idsToSwipe)
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setNoTransitionIds([])
      setTeleportingIds([])
    }))
    setTimeout(() => {
      setSwipingClones([])
      setIsAnimating(false)
    }, 500 + (clones.length - 1) * 80)
  }

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (order[0] === 'primary' || isAnimating) return
    setNoTransitionIds(['all'])
    setOrder(profiles.map(p => p.id))
    setTimeout(() => setNoTransitionIds([]), 30)
  }

  const isExpanding = expand && (expand.phase === 'expanding' || expand.phase === 'open')
  const isHoveringAnyCard = !!hoveredCard && !expand

  // ── Render a profile card (shared between real + clone) ─────────────────────

  const renderProfileCard = (profile: Profile | SwipingClone, isClone = false): React.ReactElement => {
    const _cloneIdx = (profile as SwipingClone)._cloneIdx ?? 0
    const position = order.indexOf(profile.id)
    const isTeleporting = teleportingIds.includes(profile.id) && !isClone
    const isNoTransition = noTransitionIds.includes('all') || (noTransitionIds.includes(profile.id) && !isClone)
    const isActiveView = position === 0 || isClone
    const stackWidth = 100
    const stackOffset = Math.min(55, Math.max(35, containerW * 0.04))
    const isFrontCard = position === 0 && !isClone

    const cardStyle: React.CSSProperties = {
      backgroundColor: profile.baseColor,
      position: 'absolute',
      borderRadius: 32,
      overflow: 'hidden',
      willChange: 'transform, opacity',
      transform: 'translateZ(0)',
      ...(isClone && { width: activeWidth, left: 0, top: 0, bottom: 0, zIndex: 50 - _cloneIdx }),
      ...(!isClone && isTeleporting && {
        width: stackWidth, left: containerW - stackWidth, top: 48, bottom: 48, zIndex: 5,
        transform: 'translateX(40px) scale(0.85) translateZ(0)', opacity: 0, pointerEvents: 'none',
      }),
      ...(!isClone && !isTeleporting && position === 0 && {
        width: activeWidth, left: 0, top: 0, bottom: 0, zIndex: 30,
        transform: 'translateX(0) scale(1) translateZ(0)', opacity: 1,
        boxShadow: '-20px 0 60px rgba(0,0,0,0.8)',
      }),
      ...(!isClone && !isTeleporting && position === 1 && {
        width: stackWidth, left: containerW - stackOffset - stackWidth, top: 24, bottom: 24, zIndex: 20,
        transform: 'translateX(0) scale(0.96) translateZ(0)', opacity: 1,
        boxShadow: '-10px 0 40px rgba(0,0,0,0.6)', cursor: 'pointer',
      }),
      ...(!isClone && !isTeleporting && position === 2 && {
        width: stackWidth, left: containerW - stackWidth, top: 48, bottom: 48, zIndex: 10,
        transform: 'translateX(0) scale(0.92) translateZ(0)', opacity: 1, cursor: 'pointer',
      }),
      ...(!isNoTransition && !isClone && { transition: 'transform 500ms cubic-bezier(0.4, 0, 0.2, 1), opacity 500ms cubic-bezier(0.4, 0, 0.2, 1), width 500ms cubic-bezier(0.4, 0, 0.2, 1), left 500ms cubic-bezier(0.4, 0, 0.2, 1), top 500ms cubic-bezier(0.4, 0, 0.2, 1), bottom 500ms cubic-bezier(0.4, 0, 0.2, 1)' }),
    }

    // Use the actual expand duration (dynamic by card distance) so chrome exit/entry
    // stays in sync with the card morph animation rather than a fixed constant.
    const motionDur = expand?.dur ?? EXPAND_DUR
    const chromeSlide = isExpanding ? -80 : isHoveringAnyCard ? -60 : 0
    const chromeOpacity = isExpanding ? 0 : isHoveringAnyCard ? 0.2 : 1
    const hoverEase = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
    const hoverDur = '400ms'
    const chromeTrans = `transform ${isHoveringAnyCard && !isExpanding ? hoverDur : `${motionDur * 0.6}ms`} ${hoverEase}, opacity ${isHoveringAnyCard && !isExpanding ? hoverDur : `${motionDur * 0.4}ms`} ease`
    const greetingSlide = isExpanding ? -40 : isHoveringAnyCard ? -25 : 0
    const greetingOpacity = isExpanding ? 0 : isHoveringAnyCard ? 0.3 : 1
    const greetingTrans = `transform ${isHoveringAnyCard && !isExpanding ? hoverDur : `${motionDur * 0.5}ms`} ${hoverEase}, opacity ${isHoveringAnyCard && !isExpanding ? hoverDur : `${motionDur * 0.3}ms`} ease`

    const cloneFadeClass = isClone ? 'fade-out-midway' : ''
    const cloneAnimStyle: React.CSSProperties = isClone ? { animationDelay: `${_cloneIdx * 80}ms` } : {}

    return (
      <div
        key={isClone ? `clone-${profile.id}` : profile.id}
        className={`group ${isClone ? 'swipe-out-anim' : ''}`}
        style={cardStyle}
        onClick={() => {
          if (!isClone && position > 0 && teleportingIds.length === 0 && !expand) {
            handleAdvance(profile.id)
          }
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
        {/* Stack background image (selected via Lab) */}
        {glassParams.stackBgImage && (
          <div style={{ position: 'absolute', inset: -20, zIndex: 0, overflow: 'hidden', borderRadius: 'inherit' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={glassParams.bgMotion ? 'glass-lab-drift' : undefined}
              src={glassParams.stackBgImage.url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: glassParams.stackBgImage.position, display: 'block' }}
            />
          </div>
        )}
        <div className={`absolute inset-0 z-10 transition-colors duration-300 pointer-events-none ${glassParams.stackBgImage !== null ? 'bg-black/15' : 'bg-black/40'} ${position > 0 ? 'group-hover:bg-black/10' : ''}`} />

        {/* ── Spine (visible when stacked) ── */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'flex-end', justifyContent: 'center', paddingRight: 12, zIndex: 20,
          opacity: isActiveView ? 0 : 1,
          pointerEvents: isActiveView ? 'none' : 'auto',
          transition: 'opacity 300ms',
        }}>
          <div className="flex flex-col items-center justify-center gap-6 opacity-50 group-hover:opacity-100 transition-all duration-300">
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
          {/* Top-left chrome */}
          <div
            className={cloneFadeClass}
            style={{
              position: 'absolute', top: -1, left: -1, backgroundColor: BG, borderBottomRightRadius: 28,
              zIndex: 40, paddingLeft: 6, paddingBottom: 5,
              transform: `translateY(${chromeSlide}px)`, opacity: chromeOpacity, transition: chromeTrans,
              pointerEvents: isExpanding ? 'none' : 'auto',
              ...cloneAnimStyle,
            }}
          >
            <SvgCorner position={{ top: 0, right: -28 }} rotation={0} />
            <SvgCorner position={{ bottom: -28, left: 0 }} rotation={0} />
            <div style={{ paddingTop: 24, paddingLeft: 32, paddingRight: 32, paddingBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="group/logo flex items-center gap-2 cursor-pointer" onClick={handleReset}>
                <Hexagon size={22} color="#34d399" fill="rgba(52,211,153,0.2)" className="transition-transform duration-500 group-hover/logo:rotate-12" />
                <span style={{ fontWeight: 700, fontSize: 17, color: 'white' }}>Mosaic</span>
              </div>
              {containerW > 500 && (
                <>
                  <div style={{ width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                  <button
                    onClick={handleReset}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', color: '#d1d5db', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                    className="hover:bg-white/10 hover:text-white transition-colors duration-200"
                  >
                    <Home size={15} /> Launchpad
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setLabOpen(o => !o) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 9999,
                      backgroundColor: labOpen ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${labOpen ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.05)'}`,
                      color: labOpen ? '#c4b5fd' : '#d1d5db',
                      fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    }}
                    className="hover:bg-white/10 transition-colors duration-200"
                  >
                    <FlaskConical size={15} /> Lab
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Top-right chrome */}
          <div
            className={cloneFadeClass}
            style={{
              position: 'absolute', top: -1, right: -1, backgroundColor: BG, borderBottomLeftRadius: 28,
              zIndex: 40, paddingRight: 6, paddingBottom: 5,
              transform: `translateY(${chromeSlide}px)`, opacity: chromeOpacity, transition: chromeTrans,
              pointerEvents: isExpanding ? 'none' : 'auto',
              ...cloneAnimStyle,
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
            {/* Greeting + name */}
            <div
              className={cloneFadeClass}
              style={{
                marginTop: 80, marginBottom: 28,
                transform: `translateY(${greetingSlide}px)`,
                opacity: greetingOpacity,
                transition: greetingTrans,
                ...cloneAnimStyle,
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

            {/* Bento grid */}
            {!isClone && (
              <div
                ref={isFrontCard ? bentoGridRef : undefined}
                style={{ flex: 1, position: 'relative', minHeight: 280, overflow: 'visible' }}
                onMouseMove={isFrontCard && !expand ? (e) => {
                  const grid = bentoGridRef.current
                  if (!grid) return
                  const rect = grid.getBoundingClientRect()
                  setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
                } : undefined}
                onMouseLeave={isFrontCard ? () => { setMousePos(null); setHoveredCard(null) } : undefined}
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

                  // Proximity-based dimming: calculate how much to dim this card
                  // based on how close the mouse is to another card
                  let proximityDim = 0
                  if (mousePos && !expand && !isHovered) {
                    const cardEl = cardRefs.current[card.id]
                    if (cardEl) {
                      const cx = cardEl.offsetLeft + cardEl.offsetWidth / 2
                      const cy = cardEl.offsetTop + cardEl.offsetHeight / 2
                      const dist = Math.sqrt((mousePos.x - cx) ** 2 + (mousePos.y - cy) ** 2)
                      const cardSize = Math.max(cardEl.offsetWidth, cardEl.offsetHeight)
                      // Start dimming when mouse is within 2x card size, max dim when directly on another card
                      const threshold = cardSize * 2
                      if (hoveredCard) {
                        // Mouse is on a card — full dim for siblings
                        proximityDim = 0.35
                      } else if (dist < threshold) {
                        // Mouse approaching but not on any card yet — partial dim based on proximity to closest card
                        // Find distance to the closest OTHER card
                        let minDistToOther = Infinity
                        for (const other of BENTO_CARDS) {
                          if (other.id === card.id) continue
                          const otherEl = cardRefs.current[other.id]
                          if (!otherEl) continue
                          const ox = otherEl.offsetLeft + otherEl.offsetWidth / 2
                          const oy = otherEl.offsetTop + otherEl.offsetHeight / 2
                          const od = Math.sqrt((mousePos.x - ox) ** 2 + (mousePos.y - oy) ** 2)
                          minDistToOther = Math.min(minDistToOther, od)
                        }
                        const otherSize = cardSize * 0.8
                        if (minDistToOther < otherSize) {
                          proximityDim = Math.min(0.35, (1 - minDistToOther / otherSize) * 0.35)
                        }
                      }
                    }
                  }
                  const isOtherHovered = proximityDim > 0

                  return (
                    <div
                      key={card.id}
                      ref={el => { cardRefs.current[card.id] = el }}
                      onClick={() => { if (!expand) expandCard(card.id) }}
                      onMouseEnter={() => { if (!expand) setHoveredCard(card.id) }}
                      onMouseLeave={() => setHoveredCard(null)}
                      style={{
                        position: 'absolute',
                        ...posStyle,
                        borderRadius: borderRad,
                        overflow: 'hidden',
                        display: 'flex', flexDirection: 'column',
                        cursor: isThis ? 'default' : 'pointer',
                        background: `linear-gradient(145deg, ${card.glassTint} 0%, rgba(8,6,20,0.18) 100%)`,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.35)',
                        zIndex: zIdx,
                        transition: transitionStr !== 'none'
                          ? `${transitionStr}, transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)`
                          : 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                        willChange: 'transform',
                        transform: isHovered ? 'scale(1.02) translateZ(0)' : 'translateZ(0)',
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
                            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: glassParams.bgImage.position, display: 'block' }}
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

                      {/* Sibling dim overlay — proximity-based gradual darkening */}
                      <div style={{
                        position: 'absolute', inset: 0, zIndex: 7, backgroundColor: 'black',
                        opacity: proximityDim,
                        transition: 'opacity 150ms ease', pointerEvents: 'none',
                      }} />

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
                          transition: 'transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
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
                            transition: 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
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
                              transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
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
                              className="h-11 px-5 rounded-full bg-white/10 hover:bg-white text-white hover:text-black flex items-center justify-center gap-2 transition-all duration-300 text-sm font-medium no-underline"
                            >
                              Open <ArrowUpRight className="w-4 h-4" />
                            </a>
                            <button
                              onClick={collapseCard}
                              className="w-11 h-11 rounded-full bg-white/10 hover:bg-white text-white hover:text-black flex items-center justify-center transition-all duration-300 shadow-2xl group/close"
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
                                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover/activity:text-white group-hover/activity:translate-x-1 transition-all duration-300" />
                                  </div>
                                ))}
                                <a
                                  href={card.href}
                                  onClick={e => e.stopPropagation()}
                                  className="group/add flex-1 rounded-[24px] border-2 border-dashed border-white/10 flex items-center justify-center gap-3 text-gray-500 hover:text-white hover:border-white/30 transition-all duration-300 text-base lg:text-lg font-medium min-h-0 no-underline"
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
                  )
                })}
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
        .grad-flow { animation: gradFlow 15s ease infinite; will-change: background-position; }

        @keyframes swipeOut {
          0%   { transform: translateX(0) scale(1) translateZ(0); opacity: 1; }
          100% { transform: translateX(-120vw) rotate(-10deg) scale(0.95) translateZ(0); opacity: 0; }
        }
        .swipe-out-anim { animation: swipeOut 500ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }

        @keyframes fadeOutMidway { 0%{opacity:1} 40%,100%{opacity:0} }
        .fade-out-midway { animation: fadeOutMidway 500ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }

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

        .no-underline { text-decoration: none; }
      `}</style>

      <div style={{
        minHeight: '100vh', width: '100%', color: 'white',
        // Radial bloom of deep indigo at the top, fading to near-black at the bottom.
        // The chrome cutout panels use BG (#0c0b18) which matches the top-corner of this gradient.
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

      {/* ── Glass Laboratory panel ── */}
      {labOpen && (
        <GlassLabPanel
          params={glassParams}
          onChange={setGlassParams}
          onClose={() => setLabOpen(false)}
        />
      )}
    </>
  )
}
