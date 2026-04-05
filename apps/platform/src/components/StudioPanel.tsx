"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowUpRight, ChevronDown, Plus, Sparkles, X, Zap } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

type AppEntry = {
  id: string
  label: string
  iconColor: string
  glassTint: string
  icon: React.ComponentType<{ size?: number; color?: string }>
  href: string
  statusLabel: string
  statusValue: string
}

type CreateState = 'idle' | 'expanding' | 'expanded' | 'collapsing'

type StudioPanelProps = {
  apps: AppEntry[]
  visible: boolean
  topOffset: number
  onMouseMove?: (e: React.MouseEvent) => void
  onMouseLeave?: () => void
}

// ── App grid positions ────────────────────────────────────────────────────────
// 5-column grid. Create tile floats absolutely at center.
// Apps fill outward from corners, then top/bottom rows, then alongside Create,
// then spill into new rows beneath.

const POSITIONS: Array<{ col: number; row: number }> = [
  // Round 1 — four corners
  { col: 1, row: 1 }, { col: 5, row: 1 },
  { col: 1, row: 3 }, { col: 5, row: 3 },
  // Round 2 — fill top + bottom rows inward
  { col: 2, row: 1 }, { col: 4, row: 1 },
  { col: 2, row: 3 }, { col: 4, row: 3 },
  // Round 3 — center of top + bottom rows
  { col: 3, row: 1 }, { col: 3, row: 3 },
  // Round 4 — left + right of Create (row 2)
  { col: 1, row: 2 }, { col: 5, row: 2 },
  { col: 2, row: 2 }, { col: 4, row: 2 },
  // Round 5 — new rows below
  { col: 1, row: 4 }, { col: 2, row: 4 }, { col: 3, row: 4 },
  { col: 4, row: 4 }, { col: 5, row: 4 },
  { col: 1, row: 5 }, { col: 2, row: 5 }, { col: 3, row: 5 },
  { col: 4, row: 5 }, { col: 5, row: 5 },
]

function getAppPos(i: number): { col: number; row: number } {
  return POSITIONS[i] ?? { col: (i % 5) + 1, row: Math.floor(i / 5) + 6 }
}

// ── Live dot ──────────────────────────────────────────────────────────────────

function LiveDot() {
  return (
    <span style={{
      display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
      background: '#4ade80', boxShadow: '0 0 6px rgba(74,222,128,0.65)',
      flexShrink: 0,
    }} />
  )
}

// ── AppTile ───────────────────────────────────────────────────────────────────

function AppTile({ app, fading, pos }: { app: AppEntry; fading: boolean; pos: { col: number; row: number } }) {
  const IconComp = app.icon
  return (
    <a
      href={app.href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        gridColumn: pos.col,
        gridRow: pos.row,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '16px 14px',
        borderRadius: 13,
        background: app.glassTint,
        border: `1px solid ${app.iconColor}28`,
        textDecoration: 'none',
        overflow: 'hidden',
        position: 'relative',
        boxSizing: 'border-box',
        cursor: fading ? 'default' : 'pointer',
        opacity: fading ? 0 : 1,
        transform: fading ? 'scale(0.96)' : 'scale(1)',
        transition: 'opacity 260ms ease, transform 260ms ease, background 160ms ease, border-color 160ms ease',
        pointerEvents: fading ? 'none' : 'auto',
      }}
      onMouseEnter={e => {
        if (fading) return
        e.currentTarget.style.background = `${app.iconColor}1c`
        e.currentTarget.style.borderColor = `${app.iconColor}55`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = app.glassTint
        e.currentTarget.style.borderColor = `${app.iconColor}28`
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: `${app.iconColor}18`, border: `1px solid ${app.iconColor}35`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <IconComp size={16} color={app.iconColor} />
      </div>

      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 4 }}>
          {app.label}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <LiveDot />
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.05em' }}>
            Live
          </span>
        </div>
      </div>

      <div style={{
        position: 'absolute', top: 10, right: 10,
        width: 18, height: 18, borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ArrowUpRight size={9} color="rgba(255,255,255,0.38)" />
      </div>
    </a>
  )
}

// ── StudioPanel ───────────────────────────────────────────────────────────────

export function StudioPanel({ apps, visible, topOffset, onMouseMove, onMouseLeave }: StudioPanelProps) {
  const [createState, setCreateState] = useState<CreateState>('idle')
  const [canScrollMore, setCanScrollMore] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  const checkScroll = useCallback(() => {
    const el = gridRef.current
    if (!el) return
    setCanScrollMore(el.scrollTop + el.clientHeight < el.scrollHeight - 8)
  }, [])

  useEffect(() => {
    const el = gridRef.current
    if (!el) return
    checkScroll()
    const ro = new ResizeObserver(checkScroll)
    ro.observe(el)
    el.addEventListener('scroll', checkScroll, { passive: true })
    return () => { ro.disconnect(); el.removeEventListener('scroll', checkScroll) }
  }, [checkScroll])

  function handleAnimEnd(e: React.AnimationEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return
    if (createState === 'expanding')  setCreateState('expanded')
    if (createState === 'collapsing') setCreateState('idle')
  }

  const fading = createState !== 'idle'

  // Spacer rows — create scroll depth so the grid is always taller than the container
  // Row 2: reserved (Create hovers here)
  // Rows 4-8: extend the canvas for future apps
  const SPACER_ROWS = [2, 4, 5, 6, 7, 8]

  return (
    <div
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
      position: 'absolute',
      top: topOffset + 10, left: 0, right: 0, bottom: 0,
      borderRadius: 16,
      overflow: 'hidden',
      background: 'transparent',
      transform: visible ? 'translateY(0)' : 'translateY(-110%)',
      opacity: visible ? 1 : 0,
      transition: 'transform 600ms cubic-bezier(0.4, 0, 0.2, 1), opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)',
      pointerEvents: visible ? 'auto' : 'none',
      zIndex: 35,
    }}>

      {/* ── Scrollable 5-col app grid ─────────────────────────────── */}
      <div
        ref={gridRef}
        className="studio-grid-scroll"
        style={{
          position: 'absolute', inset: 0,
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gridAutoRows: 175,
          gap: 10,
          padding: 50,
          boxSizing: 'border-box',
        }}
      >
        {/* App tiles */}
        {apps.map((app, i) => (
          <AppTile key={app.id} app={app} fading={fading} pos={getAppPos(i)} />
        ))}

        {/* Spacers — keep rows alive so grid overflows and enables scroll */}
        {SPACER_ROWS.map(r => (
          <div key={`sp-${r}`} style={{ gridColumn: 1, gridRow: r, pointerEvents: 'none' }} />
        ))}
      </div>

      {/* ── Create tile — floats at center, never scrolls ────────── */}
      {/*
        Idle:       position absolute, top/left 50%, translate(-50%,-50%), 240×260px
        Expanding:  CSS class studioCreateExpand keyframe takes over (fill-mode: both)
                    0% matches idle position exactly — no visual jump
        Expanded:   absolute inset 0, AI builder UI
        Collapsing: reverse keyframe back to idle dimensions
      */}
      {/* Shimmer wrapper — owns position/size/expand animation + rotating border */}
      <div
        className={`studio-create-shimmer${
          createState === 'expanding'  ? ' create-expanding'  :
          createState === 'expanded'   ? ' create-expanded'   :
          createState === 'collapsing' ? ' create-collapsing' : ''
        }`}
        style={createState === 'idle' ? {
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 240, height: 260,
        } : undefined}
        onClick={() => { if (createState === 'idle') setCreateState('expanding') }}
        onAnimationEnd={handleAnimEnd}
      >
      {/* Inner tile — glass surface */}
      <div className="studio-create-tile">

        {/* ── Idle / expanding / collapsing face ── */}
        {createState !== 'expanded' && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '24px 20px',
            opacity: createState === 'collapsing' ? 0 : 1,
            transition: 'opacity 150ms ease',
            pointerEvents: 'none',
          }}>
            {/* Plus ring */}
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16, flexShrink: 0,
            }}>
              <Plus size={18} color="rgba(255,255,255,0.75)" strokeWidth={1.5} />
            </div>

            <div style={{
              fontFamily: 'var(--font-display), serif',
              fontSize: 16, fontWeight: 600, lineHeight: 1.3,
              color: 'rgba(255,255,255,0.9)',
              textAlign: 'center', marginBottom: 8,
            }}>
              Create your next<br />AI powered app
            </div>

            <div style={{
              fontSize: 10, color: 'rgba(255,255,255,0.33)',
              textAlign: 'center', letterSpacing: '0.02em', lineHeight: 1.55,
              marginBottom: 16,
            }}>
              Describe it in plain language.<br />We&apos;ll build the rest.
            </div>

            {/* Tap hint pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 11px', borderRadius: 100,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <Zap size={9} color="rgba(255,255,255,0.35)" />
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.07em' }}>
                Tap to start
              </span>
            </div>
          </div>
        )}

        {/* ── Expanded face — AI builder ── */}
        {createState === 'expanded' && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            padding: '32px 36px',
            animation: 'glass-lab-in 380ms cubic-bezier(0.22,1,0.36,1) 60ms both',
          }}>
            <div style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              marginBottom: 28,
            }}>
              <div>
                <div style={{
                  fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.3)', marginBottom: 10,
                }}>
                  Studio · New App
                </div>
                <div style={{
                  fontFamily: 'var(--font-display), serif',
                  fontSize: 26, fontWeight: 600, lineHeight: 1.2,
                  color: 'rgba(255,255,255,0.92)',
                }}>
                  What are you<br />building?
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setCreateState('collapsing') }}
                style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={13} />
              </button>
            </div>

            <textarea
              placeholder="e.g. A fitness tracker that logs workouts, shows weekly progress, and syncs with my calendar..."
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 12, padding: '14px 16px',
                color: 'rgba(255,255,255,0.88)', fontSize: 14,
                lineHeight: 1.65, resize: 'none', outline: 'none',
                fontFamily: 'var(--font-body), system-ui, sans-serif',
                marginBottom: 14,
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)' }}
              onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }}
            />

            <button
              style={{
                background: 'rgba(255,255,255,0.09)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 12, padding: '12px 20px',
                color: 'rgba(255,255,255,0.88)',
                fontSize: 13, fontWeight: 600, letterSpacing: '0.04em',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                transition: 'background 150ms ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)' }}
            >
              <Sparkles size={14} />
              Generate with AI
            </button>
          </div>
        )}
      </div>
      </div>

      {/* ── Scroll indicator ─────────────────────────────────────── */}
      {canScrollMore && createState === 'idle' && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 80,
          background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.14))',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          paddingBottom: 14,
          pointerEvents: 'none',
          zIndex: 5,
        }}>
          <ChevronDown
            size={15}
            color="rgba(255,255,255,0.4)"
            style={{ animation: 'scrollIndicatorBounce 1.8s ease-in-out infinite' }}
          />
        </div>
      )}
    </div>
  )
}
