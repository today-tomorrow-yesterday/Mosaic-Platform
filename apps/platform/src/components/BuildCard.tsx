"use client"

import { useState } from "react"
import { Sparkles, ArrowUpRight, X, Wand2 } from "lucide-react"

export function BuildCard() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      {/* ── Card ── */}
      <button
        onClick={() => setModalOpen(true)}
        className="group relative w-full text-left min-h-[220px] lg:min-h-0 rounded-[24px] flex flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] focus:outline-none animate-fade-up build-card"
        style={{ animationDelay: "480ms" }}
        aria-label="Open AI Studio"
      >
        {/* Animated gradient border via ::before pseudo-element (CSS class) */}
        <div className="absolute inset-0 rounded-[24px] build-card-border pointer-events-none" />

        {/* Card content */}
        <div className="relative flex-1 flex flex-col justify-between p-5 lg:p-7 z-10">

          {/* Top row: icon + badge */}
          <div className="flex items-start justify-between">
            <div
              className="w-11 h-11 flex items-center justify-center transition-all duration-300 group-hover:scale-110"
              style={{
                borderRadius: "13px",
                background: "var(--s-logo-bg)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Sparkles
                className="w-5 h-5 transition-colors duration-300"
                style={{ color: "var(--s-accent)" }}
                strokeWidth={1.5}
              />
            </div>

            <span
              className="font-body text-[9px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{
                color: "var(--s-accent)",
                background: "color-mix(in srgb, var(--s-accent) 10%, transparent)",
                border: "1px solid color-mix(in srgb, var(--s-accent) 25%, transparent)",
              }}
            >
              AI Studio
            </span>
          </div>

          {/* Bottom row: text + arrow */}
          <div className="flex items-end justify-between gap-4 mt-6">
            <div>
              <p
                className="font-body text-[10px] font-semibold uppercase text-zinc-400 mb-2"
                style={{ letterSpacing: "0.2em" }}
              >
                No code needed
              </p>
              <h2
                className="font-display leading-none"
                style={{
                  fontWeight: 500,
                  fontSize: "clamp(24px, 3.5vw, 38px)",
                  letterSpacing: "-0.02em",
                  color: "var(--s-text-primary)",
                }}
              >
                Build
              </h2>
              <p className="font-body text-[13px] text-zinc-500 mt-2 leading-relaxed" style={{ maxWidth: 200 }}>
                Describe any idea. Your AI builds a working app for you.
              </p>
            </div>

            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mb-1 transition-all duration-300 group-hover:scale-110"
              style={{
                background: "color-mix(in srgb, var(--s-accent) 12%, transparent)",
              }}
            >
              <ArrowUpRight
                className="w-4 h-4 transition-colors duration-300"
                style={{ color: "var(--s-accent)" }}
              />
            </div>
          </div>
        </div>

        {/* Hover accent line */}
        <div
          className="h-[2px] relative z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: "linear-gradient(to right, transparent, var(--s-accent), transparent)",
          }}
        />
      </button>

      {/* ── Studio modal (shell) ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setModalOpen(false)}
          />

          {/* Panel */}
          <div
            className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl animate-fade-up p-8 z-10"
            style={{ border: "1px solid #e4e7eb" }}
          >
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            <div
              className="w-14 h-14 flex items-center justify-center rounded-2xl mb-6"
              style={{ background: "var(--s-logo-bg)" }}
            >
              <Wand2 className="w-6 h-6" style={{ color: "var(--s-accent)" }} strokeWidth={1.5} />
            </div>

            <h2
              className="font-display font-medium mb-2"
              style={{ fontSize: 28, letterSpacing: "-0.02em", color: "var(--s-text-primary)" }}
            >
              AI Studio
            </h2>
            <p className="font-body text-[14px] text-zinc-500 leading-relaxed mb-8">
              Describe what you want to build in plain language — a habit tracker,
              a garden planner, a recipe box — and the AI will create a working app for you.
              No coding required.
            </p>

            {/* Coming soon state */}
            <div
              className="rounded-2xl p-5 flex flex-col items-center text-center gap-3"
              style={{
                background: "color-mix(in srgb, var(--s-accent) 6%, transparent)",
                border: "1px dashed color-mix(in srgb, var(--s-accent) 35%, transparent)",
              }}
            >
              <Sparkles className="w-5 h-5" style={{ color: "var(--s-accent)" }} />
              <p className="font-body text-[13px] font-medium" style={{ color: "var(--s-text-primary)" }}>
                Coming soon
              </p>
              <p className="font-body text-[12px] text-zinc-400 leading-relaxed">
                The Studio is under development. When it launches, you'll be able to
                build apps here through conversation with an AI.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
