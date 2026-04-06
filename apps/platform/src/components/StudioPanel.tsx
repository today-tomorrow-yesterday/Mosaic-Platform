"use client"

import React, { useState, useRef, useEffect } from 'react'
import {
  ArrowUpRight, Plus, Wand2, Lightbulb, PenLine,
  Leaf, BarChart2, BookOpen, Home, Wallet, CalendarDays, Baby,
  FlaskConical, ChevronRight, Rocket, X,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'spark' | 'draft' | 'prototype' | 'live'

type KanbanCard = {
  id: string
  title: string
  description: string
  phase: Phase
  accentColor: string
  icon?: React.ComponentType<{ size?: number; color?: string }>
  updatedAt: number
  href?: string
  prompt?: string
}

type StudioPanelProps = {
  apps?: unknown[]
  visible: boolean
  topOffset: number
  onMouseMove?: (e: React.MouseEvent) => void
  onMouseLeave?: () => void
}

// ── Phase config ──────────────────────────────────────────────────────────────

const PHASES: Array<{
  id: Phase
  label: string
  accent: string
  dimAccent: string
  description: string
  icon: React.ComponentType<{ size?: number; color?: string }>
}> = [
  { id: 'spark',     label: 'Spark',     accent: '#fbbf24', dimAccent: 'rgba(251,191,36,0.12)',  description: 'Raw ideas',        icon: Lightbulb },
  { id: 'draft',     label: 'Draft',     accent: '#60a5fa', dimAccent: 'rgba(96,165,250,0.12)',  description: 'Fleshed out',      icon: PenLine },
  { id: 'prototype', label: 'Prototype', accent: '#a78bfa', dimAccent: 'rgba(167,139,250,0.12)', description: 'Built & running',  icon: Wand2 },
  { id: 'live',      label: 'Live',      accent: '#4ade80', dimAccent: 'rgba(74,222,128,0.12)',  description: 'In your dashboard', icon: Rocket },
]

// ── Mock cards ────────────────────────────────────────────────────────────────

const NOW = Date.now()
const hr  = 3_600_000
const day = 86_400_000

const MOCK_CARDS: KanbanCard[] = [
  // ── Spark ──
  {
    id: 's1', phase: 'spark', accentColor: '#fbbf24',
    title: 'Meal prep assistant',
    description: 'AI suggests weekly meals based on what\'s already in the fridge. Generates a shopping list diff.',
    updatedAt: NOW - 2 * hr,
  },
  {
    id: 's2', phase: 'spark', accentColor: '#fbbf24',
    title: 'Family chore tracker',
    description: 'Assign chores to family members with a points/reward system. Kids can mark them done.',
    updatedAt: NOW - day,
  },
  {
    id: 's3', phase: 'spark', accentColor: '#fbbf24',
    title: 'Sleep quality log',
    description: 'Quick morning check-in: sleep rating, mood, one-line note. Shows weekly patterns.',
    updatedAt: NOW - 3 * day,
  },
  {
    id: 's4', phase: 'spark', accentColor: '#fbbf24',
    title: 'Neighborhood tool share',
    description: 'Post tools you own and borrow from neighbors. No accounts — just a postcode + contact.',
    updatedAt: NOW - 6 * day,
  },

  // ── Draft ──
  {
    id: 'd1', phase: 'draft', accentColor: '#60a5fa',
    title: 'Voice memo journal',
    description: 'Record quick voice notes, auto-transcribed and tagged by mood. Browse by date or keyword.',
    prompt: 'Build a voice memo journal app. Users tap record, speak for up to 2 minutes, and the note is auto-transcribed. Show a timeline of notes with mood tags.',
    updatedAt: NOW - 2 * day,
  },
  {
    id: 'd2', phase: 'draft', accentColor: '#60a5fa',
    title: 'Neighborhood marketplace',
    description: 'Simple buy/sell/trade board for nearby neighbors. Post items with a photo and price.',
    prompt: 'Create a simple neighborhood marketplace. Users can post items to sell or give away, browse listings, and message sellers. No login required — just a display name.',
    updatedAt: NOW - 5 * day,
  },
  {
    id: 'd3', phase: 'draft', accentColor: '#60a5fa',
    title: 'Plant care scheduler',
    description: 'Know exactly when to water, fertilise, and repot each plant. Sends gentle reminders.',
    prompt: 'Build a plant care app with a card for each plant. Each card shows the plant name, an icon, and the next watering and fertilising dates.',
    updatedAt: NOW - 8 * day,
  },

  // ── Prototype ──
  {
    id: 'p1', phase: 'prototype', accentColor: '#4ade80', icon: Leaf,
    title: 'Garden Monitor',
    description: 'Tracks moisture, sunlight and watering schedules for houseplants.',
    updatedAt: NOW - day,
    href: '/studio',
  },
  {
    id: 'p2', phase: 'prototype', accentColor: '#a78bfa', icon: BarChart2,
    title: 'Habit Tracker',
    description: 'Daily habits with a weekly grid view and streak counters.',
    updatedAt: NOW - 5 * day,
    href: '/studio',
  },
  {
    id: 'p3', phase: 'prototype', accentColor: '#fb923c', icon: BookOpen,
    title: 'Recipe Box',
    description: 'Save favourite recipes with ingredients and step-by-step instructions.',
    updatedAt: NOW - day,
    href: '/studio',
  },
  {
    id: 'p4', phase: 'prototype', accentColor: '#38bdf8', icon: FlaskConical,
    title: 'Lab Notes',
    description: 'Quick-capture notes for experiments, observations, and results.',
    updatedAt: NOW - 7 * day,
    href: '/studio',
  },

  // ── Live ──
  {
    id: 'l1', phase: 'live', accentColor: '#fb923c', icon: Home,
    title: 'Home',
    description: '5 active devices',
    updatedAt: NOW,
    href: '/',
  },
  {
    id: 'l2', phase: 'live', accentColor: '#60a5fa', icon: CalendarDays,
    title: 'Calendar',
    description: '3 events this week',
    updatedAt: NOW,
    href: '/',
  },
  {
    id: 'l3', phase: 'live', accentColor: '#34d399', icon: Wallet,
    title: 'Budget',
    description: '$1,240 spent this month',
    updatedAt: NOW,
    href: '/',
  },
  {
    id: 'l4', phase: 'live', accentColor: '#f472b6', icon: Baby,
    title: 'Baby',
    description: '4 months old',
    updatedAt: NOW,
    href: '/',
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(ms: number): string {
  const diff = Date.now() - ms
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 2)  return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(diff / 86_400_000)
  return `${days}d ago`
}

// ── Cards ─────────────────────────────────────────────────────────────────────

// ── Spark capture card ────────────────────────────────────────────────────────

function SparkCaptureCard() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) titleRef.current?.focus()
  }, [open])

  function handleCapture() {
    // TODO: persist to Convex
    setTitle('')
    setDesc('')
    setOpen(false)
  }

  function handleCancel() {
    setTitle('')
    setDesc('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        className="spark-capture-idle"
        onClick={() => setOpen(true)}
        style={{
          width: '100%', border: 'none', background: 'none',
          padding: 0, cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{
          borderRadius: 16,
          padding: '22px 20px',
          background: 'linear-gradient(160deg, rgba(251,191,36,0.13) 0%, rgba(251,191,36,0.04) 100%)',
          border: '1px solid rgba(251,191,36,0.3)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 12, textAlign: 'center',
          transition: 'border-color 150ms ease, background 150ms ease, box-shadow 150ms ease',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(251,191,36,0.15)',
            border: '1px solid rgba(251,191,36,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Plus size={18} color="#fbbf24" strokeWidth={1.8} />
          </div>
          <div>
            <div style={{
              fontSize: 16, fontWeight: 700, lineHeight: 1.3,
              color: 'rgba(255,255,255,0.92)',
              fontFamily: 'var(--font-display), Georgia, serif',
              marginBottom: 6,
            }}>
              Capture a new idea
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
              Before it fades
            </div>
          </div>
        </div>
      </button>
    )
  }

  return (
    <div style={{
      borderRadius: 14,
      padding: '14px 16px',
      background: 'rgba(251,191,36,0.07)',
      border: '1.5px solid rgba(251,191,36,0.35)',
      boxShadow: '0 0 20px rgba(251,191,36,0.1)',
      animation: 'glass-lab-in 220ms cubic-bezier(0.22,1,0.36,1) both',
    }}>
      <input
        ref={titleRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && title.trim()) handleCapture(); if (e.key === 'Escape') handleCancel() }}
        placeholder="What's the idea?"
        style={{
          width: '100%', background: 'none', border: 'none', outline: 'none',
          fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.92)',
          fontFamily: 'var(--font-display), Georgia, serif',
          marginBottom: 8, boxSizing: 'border-box',
        }}
      />
      <textarea
        value={desc}
        onChange={e => setDesc(e.target.value)}
        placeholder="Any details... (optional)"
        rows={2}
        style={{
          width: '100%', background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
          outline: 'none', resize: 'none', padding: '8px 10px',
          fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55,
          fontFamily: 'var(--font-body), system-ui, sans-serif',
          boxSizing: 'border-box', marginBottom: 10,
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.25)' }}
        onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
      />
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={handleCapture}
          disabled={!title.trim()}
          style={{
            flex: 1, padding: '7px 0', borderRadius: 8, cursor: title.trim() ? 'pointer' : 'default',
            background: title.trim() ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${title.trim() ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.08)'}`,
            color: title.trim() ? '#fbbf24' : 'rgba(255,255,255,0.25)',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
            transition: 'background 150ms ease, border-color 150ms ease, color 150ms ease',
          }}
        >
          Capture
        </button>
        <button
          onClick={handleCancel}
          style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.09)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'rgba(255,255,255,0.35)',
          }}
        >
          <X size={11} />
        </button>
      </div>
    </div>
  )
}

// ── Cards ─────────────────────────────────────────────────────────────────────

function SparkCard({ card }: { card: KanbanCard }) {
  return (
    <div className="kanban-card" style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(251,191,36,0.18)',
      borderRadius: 14,
      padding: '14px 16px',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* left accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 12, bottom: 12, width: 3,
        borderRadius: '0 3px 3px 0',
        background: 'linear-gradient(to bottom, #fbbf24, #f59e0b)',
      }} />

      <div style={{ paddingLeft: 12 }}>
        <div style={{
          fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.95)',
          marginBottom: 7, lineHeight: 1.3,
          fontFamily: 'var(--font-display), Georgia, serif',
        }}>
          {card.title}
        </div>
        <div style={{
          fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {card.description}
        </div>
        <div style={{
          marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.02em' }}>
            {relativeTime(card.updatedAt)}
          </span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 600, color: '#fbbf24', letterSpacing: '0.02em',
          }}>
            Draft <ChevronRight size={11} />
          </div>
        </div>
      </div>
    </div>
  )
}

function DraftCard({ card }: { card: KanbanCard }) {
  return (
    <div className="kanban-card" style={{
      background: 'rgba(96,165,250,0.06)',
      border: '1px solid rgba(96,165,250,0.2)',
      borderRadius: 14,
      padding: '14px 16px',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.95)',
        marginBottom: 8, lineHeight: 1.3,
        fontFamily: 'var(--font-display), Georgia, serif',
      }}>
        {card.title}
      </div>

      {card.prompt && (
        <div style={{
          background: 'rgba(96,165,250,0.08)',
          border: '1px solid rgba(96,165,250,0.16)',
          borderRadius: 8,
          padding: '10px 12px',
          marginBottom: 12,
          fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          fontStyle: 'italic',
        }}>
          &ldquo;{card.prompt}&rdquo;
        </div>
      )}

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.02em' }}>
          {relativeTime(card.updatedAt)}
        </span>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '6px 12px', borderRadius: 100,
          background: 'rgba(96,165,250,0.15)',
          border: '1px solid rgba(96,165,250,0.35)',
          fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
          color: '#60a5fa', cursor: 'pointer',
        }}>
          <Wand2 size={11} />
          Build it
        </div>
      </div>
    </div>
  )
}

function PrototypeCard({ card }: { card: KanbanCard }) {
  const IconComp = card.icon
  return (
    <a
      href={card.href ?? '#'}
      className="kanban-card"
      style={{
        display: 'block',
        background: `linear-gradient(135deg, ${card.accentColor}12 0%, rgba(255,255,255,0.03) 70%)`,
        border: `1px solid ${card.accentColor}28`,
        borderRadius: 14,
        padding: '14px 16px',
        textDecoration: 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top edge glow */}
      <div style={{
        position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
        background: `linear-gradient(90deg, transparent, ${card.accentColor}55, transparent)`,
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        {IconComp && (
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: `${card.accentColor}20`, border: `1px solid ${card.accentColor}35`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <IconComp size={13} color={card.accentColor} />
          </div>
        )}
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: card.accentColor,
          background: `${card.accentColor}18`, border: `1px solid ${card.accentColor}35`,
          padding: '3px 8px', borderRadius: 100,
        }}>
          Prototype
        </span>
      </div>

      <div style={{
        fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.95)',
        marginBottom: 6, lineHeight: 1.3,
        fontFamily: 'var(--font-display), Georgia, serif',
      }}>
        {card.title}
      </div>
      <div style={{
        fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        overflow: 'hidden', marginBottom: 12,
      }}>
        {card.description}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.02em' }}>
          {relativeTime(card.updatedAt)}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: card.accentColor, fontSize: 11, fontWeight: 600 }}>
          Open <ArrowUpRight size={11} />
        </div>
      </div>
    </a>
  )
}

function LiveCard({ card }: { card: KanbanCard }) {
  const IconComp = card.icon
  return (
    <a
      href={card.href ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="kanban-card"
      style={{
        display: 'block',
        background: `linear-gradient(135deg, ${card.accentColor}14 0%, rgba(255,255,255,0.03) 65%)`,
        border: `1px solid ${card.accentColor}35`,
        borderRadius: 14,
        padding: '14px 16px',
        textDecoration: 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        {IconComp && (
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: `${card.accentColor}22`, border: `1px solid ${card.accentColor}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <IconComp size={13} color={card.accentColor} />
          </div>
        )}
        <div>
          <div style={{
            fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.95)',
            lineHeight: 1.2, fontFamily: 'var(--font-display), Georgia, serif',
          }}>
            {card.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
              background: '#4ade80', boxShadow: '0 0 6px rgba(74,222,128,0.7)',
              display: 'inline-block',
            }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em' }}>
              Live
            </span>
          </div>
        </div>
        <div style={{
          marginLeft: 'auto',
          width: 24, height: 24, borderRadius: '50%',
          background: `${card.accentColor}15`, border: `1px solid ${card.accentColor}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <ArrowUpRight size={11} color={card.accentColor} style={{ opacity: 0.8 }} />
        </div>
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.45 }}>
        {card.description}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 12,
      }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.02em' }}>
          {relativeTime(card.updatedAt)}
        </span>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          color: card.accentColor, fontSize: 11, fontWeight: 600,
        }}>
          View <ArrowUpRight size={11} />
        </div>
      </div>
    </a>
  )
}

// ── KanbanColumn ──────────────────────────────────────────────────────────────

function KanbanColumn({ phase, cards }: {
  phase: typeof PHASES[number]
  cards: KanbanCard[]
}) {
  const PhaseIcon = phase.icon
  const isSpark = phase.id === 'spark'

  return (
    <div style={{
      flex: 1,
      minWidth: 220,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Column header */}
      <div style={{
        padding: '14px 16px 12px',
        marginBottom: 12,
        borderRadius: 12,
        background: phase.dimAccent,
        border: `1px solid ${phase.accent}28`,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7,
              background: `${phase.accent}22`, border: `1px solid ${phase.accent}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <PhaseIcon size={13} color={phase.accent} />
            </div>
            <span style={{
              fontSize: 14, fontWeight: 700, letterSpacing: '0.01em',
              color: 'rgba(255,255,255,0.95)',
            }}>
              {phase.label}
            </span>
          </div>
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: phase.accent,
            background: `${phase.accent}20`, border: `1px solid ${phase.accent}35`,
            padding: '2px 9px', borderRadius: 100,
          }}>
            {cards.length}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 5, letterSpacing: '0.01em' }}>
          {phase.description}
        </div>
      </div>

      {/* Cards */}
      <div className="kanban-col-scroll" style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        paddingBottom: 16,
        paddingRight: 2,
      }}>
        {isSpark && <SparkCaptureCard />}
        {cards.map(card => {
          if (card.phase === 'spark')     return <SparkCard     key={card.id} card={card} />
          if (card.phase === 'draft')     return <DraftCard     key={card.id} card={card} />
          if (card.phase === 'prototype') return <PrototypeCard key={card.id} card={card} />
          if (card.phase === 'live')      return <LiveCard      key={card.id} card={card} />
          return null
        })}
      </div>
    </div>
  )
}

// ── StudioPanel ───────────────────────────────────────────────────────────────

export function StudioPanel({ visible, topOffset, onMouseMove, onMouseLeave }: StudioPanelProps) {
  const cardsByPhase = (phase: Phase) => MOCK_CARDS.filter(c => c.phase === phase)

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
      }}
    >
      {/* Kanban board */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex',
        flexDirection: 'row',
        gap: 24,
        padding: '20px 32px',
        boxSizing: 'border-box',
        overflowX: 'auto',
        overflowY: 'hidden',
      }}>
        {PHASES.map(phase => (
          <KanbanColumn
            key={phase.id}
            phase={phase}
            cards={cardsByPhase(phase.id)}
          />
        ))}
      </div>
    </div>
  )
}
