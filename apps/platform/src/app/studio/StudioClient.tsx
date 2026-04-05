"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  ArrowLeft, Send, Sparkles, Monitor, Smartphone,
  Copy, Check, Wand2, Pencil, Code2, ChevronDown, ChevronUp,
  MoreHorizontal, CheckCircle2, Circle, Loader2, RotateCcw,
  Share2, Download, Zap, AlertCircle, MessageSquare,
} from "lucide-react"
import Link from "next/link"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"

// ── Types ────────────────────────────────────────────────────────────────────

type UserMsg      = { role: "user";      content: string; id: string }
type AssistantMsg = {
  role: "assistant"
  content: string
  code: string | null
  id: string
  version: number
  chips: string[]
}
type BuildingMsg  = { role: "building";  id: string }
type Message      = UserMsg | AssistantMsg | BuildingMsg

type BuildStep = 0 | 1 | 2 | 3 | 4

// ── Demo app (Garden Monitor) ────────────────────────────────────────────────

const DEMO_CODE = `
function App() {
  const [plants, setPlants] = React.useState([
    { id: 1, name: "Cherry Tomatoes", icon: "🍅", moisture: 72, light: 88, zone: "Bed A",       lastWatered: "2 hrs ago",  health: "good"    },
    { id: 2, name: "Sweet Basil",     icon: "🌿", moisture: 41, light: 92, zone: "Window",       lastWatered: "7 hrs ago",  health: "thirsty" },
    { id: 3, name: "Lavender",        icon: "💜", moisture: 24, light: 76, zone: "Bed B",        lastWatered: "Yesterday",  health: "dry"     },
    { id: 4, name: "Butterhead Lettuce", icon: "🥬", moisture: 85, light: 55, zone: "Cold Frame", lastWatered: "1 hr ago",  health: "good"    },
  ]);

  function water(id) {
    setPlants(prev => prev.map(p =>
      p.id === id
        ? { ...p, moisture: Math.min(100, p.moisture + 35), lastWatered: "Just now",
            health: p.moisture + 35 >= 60 ? "good" : p.health }
        : p
    ));
  }

  function healthColor(h) {
    return h === "good" ? "#10b981" : h === "thirsty" ? "#f59e0b" : "#ef4444";
  }

  const avg = Math.round(plants.reduce((a, p) => a + p.moisture, 0) / plants.length);
  const needsWater = plants.filter(p => p.moisture < 50).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 font-sans">
      <div className="max-w-sm mx-auto">
        <div className="mb-5 pt-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🌱</span>
            <h1 className="text-xl font-bold text-green-900">Garden Monitor</h1>
          </div>
          <p className="text-sm text-green-600">Spring · {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: "Plants",       value: plants.length, icon: "🪴" },
            { label: "Avg Moisture", value: avg + "%",      icon: "💧" },
            { label: "Need Water",   value: needsWater,     icon: "⚠️" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-3 text-center shadow-sm border border-green-100">
              <div className="text-xl mb-0.5">{s.icon}</div>
              <div className="text-lg font-bold text-green-900">{s.value}</div>
              <div className="text-xs text-green-600">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {plants.map(plant => (
            <div key={plant.id} className="bg-white rounded-2xl p-4 shadow-sm border border-green-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{plant.icon}</span>
                  <div>
                    <div className="font-semibold text-green-900 text-sm">{plant.name}</div>
                    <div className="text-xs text-green-500">{plant.zone}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: healthColor(plant.health) }} />
                  <span className="text-xs capitalize font-medium" style={{ color: healthColor(plant.health) }}>{plant.health}</span>
                </div>
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-xs text-green-600 mb-1">
                  <span>💧 Moisture</span><span>{plant.moisture}%</span>
                </div>
                <div className="h-1.5 bg-green-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: plant.moisture + "%", background: plant.moisture > 60 ? "#10b981" : plant.moisture > 40 ? "#f59e0b" : "#ef4444" }} />
                </div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-xs text-green-600 mb-1">
                  <span>☀️ Sunlight</span><span>{plant.light}%</span>
                </div>
                <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: plant.light + "%" }} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Watered {plant.lastWatered}</span>
                <button onClick={() => water(plant.id)}
                  className="text-xs px-3 py-1.5 rounded-full font-medium transition-all active:scale-95"
                  style={{ background: plant.moisture < 60 ? "#10b981" : "#f0fdf4", color: plant.moisture < 60 ? "white" : "#10b981", border: "1px solid #a7f3d0" }}>
                  💧 Water
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-xs text-green-400">Tap 💧 Water to update moisture levels</p>
      </div>
    </div>
  );
}
`

const DEMO_RESPONSE = `Here's your Garden Monitor! 🌱

I've built a working app with 4 plant cards tracking moisture and sunlight in real time. Tap 💧 Water on any card to see values update instantly.`

const DEMO_CHIPS = [
  "Add a watering schedule with reminders",
  "Show a weather forecast for each zone",
  "Change to a dark forest color theme",
]

const SUGGESTIONS = [
  { label: "🌱 Garden monitor",  prompt: "Build me a garden monitor to track my houseplants — moisture levels, sunlight, and when I last watered each one." },
  { label: "✅ Habit tracker",   prompt: "Make a daily habit tracker with a weekly grid view and streak counters." },
  { label: "📖 Recipe box",      prompt: "Create a recipe box to save my favourite recipes with ingredients and steps." },
  { label: "💰 Budget tracker",  prompt: "Build a simple household budget tracker with income, expenses, and a running balance." },
  { label: "📔 Daily journal",   prompt: "Make a daily journal app with mood tracking and a calendar view." },
  { label: "🥗 Meal planner",    prompt: "Create a weekly meal planner with a shopping list generator." },
]

const BUILD_STEPS = [
  "Reading your idea",
  "Designing the layout",
  "Writing the components",
  "Finishing touches",
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildIframeDoc(code: string): string {
  return `<!DOCTYPE html><html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>*{box-sizing:border-box}body{margin:0}</style>
  <script>
    window.onerror = function(msg, src, line, col, err) {
      window.parent.postMessage({ type: 'preview-error', message: msg }, '*');
      return true;
    };
    window.addEventListener('unhandledrejection', function(e) {
      window.parent.postMessage({ type: 'preview-error', message: e.reason?.message || String(e.reason) }, '*');
    });
  </script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
${code}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
  </script>
</body>
</html>`
}

function guessAppName(prompt: string): string {
  const lower = prompt.toLowerCase()
  if (lower.includes("garden") || lower.includes("plant")) return "Garden Monitor"
  if (lower.includes("habit"))                               return "Habit Tracker"
  if (lower.includes("recipe"))                             return "Recipe Box"
  if (lower.includes("budget") || lower.includes("expense")) return "Budget Tracker"
  if (lower.includes("journal"))                            return "Daily Journal"
  if (lower.includes("meal"))                               return "Meal Planner"
  if (lower.includes("todo") || lower.includes("task"))     return "Task Manager"
  if (lower.includes("fitness") || lower.includes("workout")) return "Fitness Log"
  if (lower.includes("inventory") || lower.includes("stock")) return "Inventory"
  if (lower.includes("finance") || lower.includes("money"))  return "Finance Tracker"
  return "My App"
}

function extractCodeAndProse(fullText: string): { prose: string; code: string | null; chips: string[] } {
  const codeMatch = fullText.match(/```(?:jsx?|tsx?)?\n?([\s\S]*?)```/)
  const code = codeMatch?.[1] != null ? codeMatch[1].trim() : null
  const prose = fullText.replace(/```(?:jsx?|tsx?)?[\s\S]*?```/g, "").trim()

  // Extract bullet-point chips from the end of the response
  const chipLines = prose.split("\n").filter(l => /^[•\-\*]\s/.test(l.trim()))
  const chips = chipLines.slice(0, 4).map(l => l.replace(/^[•\-\*]\s+/, "").trim()).filter(Boolean)
  const cleanProse = prose.split("\n").filter(l => !/^[•\-\*]\s/.test(l.trim())).join("\n").trim()

  return { prose: cleanProse || prose, code, chips: chips.length ? chips : DEMO_CHIPS }
}

// ── Sub-components ───────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-typing-dot"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  )
}

function BuildProgress({ step, dark = false }: { step: BuildStep; dark?: boolean }) {
  return (
    <div className="space-y-2 px-1 py-1">
      {BUILD_STEPS.map((label, i) => {
        const stepNum = (i + 1) as BuildStep
        const done    = step > stepNum
        const active  = step === stepNum
        return (
          <div key={label} className="flex items-center gap-2">
            {done ? (
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-500" />
            ) : active ? (
              <Loader2 className="w-3.5 h-3.5 flex-shrink-0 animate-spin" style={{ color: "var(--s-accent)" }} />
            ) : (
              <Circle className={`w-3.5 h-3.5 flex-shrink-0 ${dark ? "text-white/15" : "text-zinc-200"}`} />
            )}
            <span
              className="text-xs font-body"
              style={{
                color: done
                  ? (dark ? "rgba(255,255,255,0.3)" : "#9ca3af")
                  : active
                    ? (dark ? "rgba(255,255,255,0.9)" : "var(--s-text-primary)")
                    : (dark ? "rgba(255,255,255,0.35)" : "#d1d5db"),
                fontWeight: active ? 500 : 400,
                textDecoration: done ? "line-through" : "none",
              }}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function EmptyState({ onSuggestion }: { onSuggestion: (prompt: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-5 py-8 text-center">
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-2xl blur-2xl opacity-50 pointer-events-none" style={{ background: "color-mix(in srgb, var(--s-accent) 40%, transparent)", transform: "scale(1.6)" }} />
        <div className="relative w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <Wand2 className="w-5 h-5" style={{ color: "var(--s-accent)" }} strokeWidth={1.5} />
        </div>
      </div>
      <h2 className="font-display font-medium mb-2" style={{ fontSize: 18, letterSpacing: "-0.02em", color: "rgba(255,255,255,0.85)" }}>
        What would you like to build?
      </h2>
      <p className="font-body text-sm leading-relaxed mb-6" style={{ maxWidth: 240, color: "rgba(255,255,255,0.35)" }}>
        Describe any idea in plain language.
      </p>
      <div className="flex flex-wrap gap-1.5 justify-center">
        {SUGGESTIONS.map(s => (
          <button
            key={s.label}
            onClick={() => onSuggestion(s.prompt)}
            className="font-body text-xs px-3 py-1.5 rounded-full transition-all duration-150 hover:scale-[1.03] active:scale-95"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.55)",
              border: "1px solid rgba(255,255,255,0.09)",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function CodeBlock({ code }: { code: string }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const preview = code.trim().split("\n").slice(0, 4).join("\n")

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-zinc-200 text-left">
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-800">
        <div className="flex items-center gap-1.5">
          <Code2 className="w-3 h-3 text-zinc-400" />
          <span className="text-[10px] font-mono text-zinc-400">App.jsx</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors px-1.5 py-0.5 rounded"
          >
            {copied
              ? <><Check className="w-3 h-3 text-emerald-400" /> Copied</>
              : <><Copy className="w-3 h-3" /> Copy</>
            }
          </button>
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors px-1.5 py-0.5 rounded"
          >
            {expanded
              ? <><ChevronUp className="w-3 h-3" /> Collapse</>
              : <><ChevronDown className="w-3 h-3" /> Expand</>
            }
          </button>
        </div>
      </div>
      <pre
        className="text-[11px] leading-relaxed font-mono text-zinc-300 bg-zinc-900 p-3 overflow-x-auto"
        style={{ maxHeight: expanded ? 320 : "none", overflowY: expanded ? "auto" : "hidden" }}
      >
        <code>{expanded ? code.trim() : preview + "\n..."}</code>
      </pre>
    </div>
  )
}

function RefinementChips({
  chips,
  onSelect,
}: {
  chips: string[]
  onSelect: (text: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2.5">
      {chips.slice(0, 4).map(chip => (
        <button
          key={chip}
          onClick={() => onSelect(chip)}
          className="font-body text-[11px] px-2.5 py-1 rounded-full border transition-all duration-150 hover:scale-[1.02] active:scale-95 text-left"
          style={{
            color: "var(--s-accent)",
            borderColor: "color-mix(in srgb, var(--s-accent) 25%, transparent)",
            background: "color-mix(in srgb, var(--s-accent) 6%, transparent)",
          }}
        >
          {chip}
        </button>
      ))}
    </div>
  )
}

function MessageBubble({
  message,
  onRestore,
  onChipSelect,
}: {
  message: Message
  onRestore?: (code: string) => void
  onChipSelect?: (text: string) => void
}) {
  if (message.role === "building") {
    return (
      <div className="flex items-start gap-2.5 animate-fade-up">
        <div
          className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
          style={{ background: "color-mix(in srgb, var(--s-accent) 12%, transparent)" }}
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--s-accent)" }} />
        </div>
        <div className="bg-white border border-zinc-100 rounded-2xl rounded-tl-sm shadow-sm px-4 py-3">
          <TypingDots />
        </div>
      </div>
    )
  }

  if (message.role === "user") {
    return (
      <div className="flex justify-end animate-fade-up">
        <div
          className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed font-body text-white"
          style={{ background: "var(--s-accent)" }}
        >
          {message.content}
        </div>
      </div>
    )
  }

  // assistant
  return (
    <div className="flex items-start gap-2.5 animate-fade-up">
      <div
        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
        style={{ background: "color-mix(in srgb, var(--s-accent) 12%, transparent)" }}
      >
        <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--s-accent)" }} />
      </div>
      <div className="flex-1 min-w-0">
        {/* Version badge + restore */}
        {message.version > 0 && (
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="font-body text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: "color-mix(in srgb, var(--s-accent) 10%, transparent)",
                color: "var(--s-accent)",
              }}
            >
              v{message.version}
            </span>
            {message.code && onRestore && (
              <button
                onClick={() => message.code && onRestore(message.code)}
                className="flex items-center gap-1 font-body text-[10px] text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Restore this version
              </button>
            )}
          </div>
        )}

        <div className="bg-white border border-zinc-100 rounded-2xl rounded-tl-sm shadow-sm px-4 py-3 text-sm leading-relaxed text-zinc-700 font-body whitespace-pre-wrap">
          {message.content}
        </div>

        {message.code && <CodeBlock code={message.code} />}

        {message.chips.length > 0 && onChipSelect && (
          <RefinementChips chips={message.chips} onSelect={onChipSelect} />
        )}
      </div>
    </div>
  )
}

function BuildingMessage({ step }: { step: BuildStep }) {
  return (
    <div className="flex items-start gap-2.5 animate-fade-up">
      <div
        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
        style={{ background: "color-mix(in srgb, var(--s-accent) 12%, transparent)" }}
      >
        <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--s-accent)" }} />
      </div>
      <div className="bg-white border border-zinc-100 rounded-2xl rounded-tl-sm shadow-sm px-4 py-3">
        {step === 0 ? <TypingDots /> : <BuildProgress step={step} />}
      </div>
    </div>
  )
}

function PreviewEmpty({ isBuilding, buildStep }: { isBuilding: boolean; buildStep: BuildStep }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      {isBuilding ? (
        <>
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-3xl blur-2xl opacity-60 pointer-events-none" style={{ background: "color-mix(in srgb, var(--s-accent) 50%, transparent)", transform: "scale(1.8)" }} />
            <div className="relative w-16 h-16 rounded-3xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <Wand2 className="w-7 h-7" style={{ color: "var(--s-accent)", animation: "spin 2s linear infinite" }} strokeWidth={1.5} />
            </div>
          </div>
          <p className="font-body text-sm font-medium mb-5" style={{ color: "rgba(255,255,255,0.7)" }}>Building your app…</p>
          {buildStep > 0 && (
            <div className="text-left">
              <BuildProgress step={buildStep} dark />
            </div>
          )}
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <Monitor className="w-7 h-7" style={{ color: "rgba(255,255,255,0.2)" }} strokeWidth={1.5} />
          </div>
          <p className="font-body text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Your app will appear here</p>
          <p className="font-body text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>Describe what you want to build in the chat</p>
        </>
      )}
    </div>
  )
}

function OverflowMenu({
  onClose,
  code,
  appName,
}: {
  onClose: () => void
  code: string | null
  appName: string
}) {
  const items = [
    {
      icon: Share2,
      label: "Share URL",
      desc: "Get a public link to your app",
      onClick: () => { alert("Share coming soon!"); onClose() },
    },
    {
      icon: Download,
      label: "Export ZIP",
      desc: "Download as standalone HTML",
      onClick: () => {
        if (!code) return
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${appName}</title>
<script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script src="https://cdn.tailwindcss.com"></script>
<style>*{box-sizing:border-box}body{margin:0}</style>
</head><body><div id="root"></div>
<script type="text/babel">
${code}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
</script></body></html>`
        const blob = new Blob([html], { type: "text/html" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url; a.download = `${appName.replace(/\s+/g, "-").toLowerCase()}.html`
        a.click(); URL.revokeObjectURL(url)
        onClose()
      },
    },
    {
      icon: Zap,
      label: "Promote to App",
      desc: "Turn this into a permanent Mosaic app",
      onClick: () => { alert("Promote coming soon!"); onClose() },
    },
  ]

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="absolute right-0 top-full mt-2 w-60 rounded-2xl z-50 overflow-hidden animate-dropdown-in p-1.5"
        style={{ background: "rgba(18,16,28,0.97)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.5)" }}
      >
        {items.map(item => (
          <button
            key={item.label}
            onClick={item.onClick}
            className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 hover:bg-white/8"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            <item.icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "rgba(255,255,255,0.4)" }} />
            <div>
              <p className="font-body text-sm font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>{item.label}</p>
              <p className="font-body text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{item.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export function StudioClient({ onBack }: { onBack?: () => void } = {}) {
  const [messages,       setMessages]       = useState<Message[]>([])
  const [input,          setInput]          = useState("")
  const [isBuilding,     setIsBuilding]     = useState(false)
  const [buildStep,      setBuildStep]      = useState<BuildStep>(0)
  const [code,           setCode]           = useState<string | null>(null)
  const [activeTab,      setActiveTab]      = useState<"chat" | "preview">("chat")
  const [previewMode,    setPreviewMode]    = useState<"desktop" | "mobile">("desktop")
  const [appName,        setAppName]        = useState("Untitled App")
  const [isEditingName,  setIsEditingName]  = useState(false)
  const [headerCopied,   setHeaderCopied]   = useState(false)
  const [isSaved,        setIsSaved]        = useState(false)
  const [isSaving,       setIsSaving]       = useState(false)
  const [prototypeId,    setPrototypeId]    = useState<Id<"prototypeApps"> | null>(null)
  const [showOverflow,   setShowOverflow]   = useState(false)
  const [versionCount,   setVersionCount]   = useState(0)
  const [previewError,   setPreviewError]   = useState<string | null>(null)

  const savePrototype   = useMutation(api.features.studio.mutations.save)
  const updatePrototype = useMutation(api.features.studio.mutations.update)

  const messagesEndRef   = useRef<HTMLDivElement>(null)
  const textareaRef      = useRef<HTMLTextAreaElement>(null)
  const nameInputRef     = useRef<HTMLInputElement>(null)
  const buildingMsgIdRef = useRef<string>("")
  const stepTimersRef    = useRef<ReturnType<typeof setTimeout>[]>([])

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus name input when editing
  useEffect(() => {
    if (isEditingName) {
      nameInputRef.current?.focus()
      nameInputRef.current?.select()
    }
  }, [isEditingName])

  // iframe error bridge
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "preview-error") {
        setPreviewError(String(e.data.message))
      }
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [])

  // Clear build timers on unmount
  useEffect(() => {
    return () => { stepTimersRef.current.forEach(clearTimeout) }
  }, [])

  const clearStepTimers = () => {
    stepTimersRef.current.forEach(clearTimeout)
    stepTimersRef.current = []
  }

  const startBuildProgress = useCallback(() => {
    clearStepTimers()
    setBuildStep(1)
    const t1 = setTimeout(() => setBuildStep(2), 500)
    const t2 = setTimeout(() => setBuildStep(3), 1300)
    stepTimersRef.current = [t1, t2]
  }, [])

  const handleRestore = useCallback((restoredCode: string) => {
    setCode(restoredCode)
    setPreviewError(null)
    setActiveTab("preview")
  }, [])

  const handleChipSelect = useCallback((text: string) => {
    setInput(text)
    textareaRef.current?.focus()
  }, [])

  const handleSave = useCallback(async (latestCode?: string, latestMessages?: Message[]) => {
    const codeToSave = latestCode ?? code
    if (!codeToSave || isSaving) return
    const msgsToSave = latestMessages ?? messages
    const conversationJson = JSON.stringify(
      msgsToSave
        .filter((m): m is UserMsg | AssistantMsg => m.role === "user" || m.role === "assistant")
        .map(m => ({ role: m.role, content: m.content, id: m.id }))
    )
    setIsSaving(true)
    try {
      if (prototypeId) {
        await updatePrototype({ id: prototypeId, name: appName, code: codeToSave, conversationJson })
      } else {
        const result = await savePrototype({ name: appName, code: codeToSave, conversationJson })
        if (typeof result._id === "string") setPrototypeId(result._id as Id<"prototypeApps">)
      }
      setIsSaved(true)
    } finally {
      setIsSaving(false)
    }
  }, [code, messages, isSaving, prototypeId, appName, savePrototype, updatePrototype])

  const handleSend = useCallback(async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || isBuilding) return

    setInput("")
    if (textareaRef.current) textareaRef.current.style.height = "auto"
    setPreviewError(null)

    // Guess the name immediately from the first user prompt
    if (appName === "Untitled App" || appName === "My App") {
      setAppName(guessAppName(content))
    }

    const userId     = crypto.randomUUID()
    const buildingId = crypto.randomUUID()
    buildingMsgIdRef.current = buildingId

    // Build conversation history for API (user+assistant messages only)
    const history = (messages as Message[])
      .filter((m): m is UserMsg | AssistantMsg => m.role === "user" || m.role === "assistant")
      .map(m => ({ role: m.role as "user" | "assistant", content: m.content }))
    history.push({ role: "user", content })

    setMessages(prev => [
      ...prev,
      { role: "user",     content, id: userId },
      { role: "building", id: buildingId },
    ])
    setIsBuilding(true)
    startBuildProgress()

    // ── Demo mode (no API key in env) ────────────────────────────────────────
    const aiEnabled = process.env.NEXT_PUBLIC_STUDIO_AI_ENABLED === "true"
    if (!aiEnabled) {
      await new Promise(r => setTimeout(r, 2400))
      clearStepTimers()
      setBuildStep(4)
      await new Promise(r => setTimeout(r, 300))

      const newVersion = versionCount + 1
      setVersionCount(newVersion)
      setMessages(prev => prev.map(m =>
        m.id === buildingId
          ? { role: "assistant", content: DEMO_RESPONSE, code: DEMO_CODE, id: buildingId, version: newVersion, chips: DEMO_CHIPS }
          : m
      ))
      setCode(DEMO_CODE)
      setIsBuilding(false)
      setBuildStep(0)
      setActiveTab("preview")
      return
    }

    // ── Real AI mode ──────────────────────────────────────────────────────────
    try {
      const resp = await fetch("/api/studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      })

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)

      const reader = resp.body?.getReader()
      if (!reader) throw new Error("No response stream")

      const decoder = new TextDecoder()
      let fullText = ""

      setBuildStep(3)

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue
          const data = line.slice(6).trim()
          if (data === "[DONE]") continue
          try {
            const parsed = JSON.parse(data) as { text?: string; error?: string }
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.text) fullText += parsed.text
          } catch (parseErr) {
            if (parseErr instanceof SyntaxError) continue
            throw parseErr
          }
        }
      }

      clearStepTimers()
      setBuildStep(4)
      await new Promise(r => setTimeout(r, 300))

      const { prose, code: extractedCode, chips } = extractCodeAndProse(fullText)
      const newVersion = versionCount + 1
      setVersionCount(newVersion)

      const completedMsg = { role: "assistant" as const, content: prose, code: extractedCode, id: buildingId, version: newVersion, chips }
      setMessages(prev => {
        const updated = prev.map(m => m.id === buildingId ? completedMsg : m)
        if (extractedCode) {
          void handleSave(extractedCode, updated)
        }
        return updated
      })

      if (extractedCode) {
        setCode(extractedCode)
        setActiveTab("preview")
      }

    } catch (err) {
      clearStepTimers()
      const msg = err instanceof Error ? err.message : "Something went wrong"
      setMessages(prev => prev.map(m =>
        m.id === buildingId
          ? { role: "assistant", content: `Sorry, I ran into an issue: ${msg}. Please try again.`, code: null, id: buildingId, version: 0, chips: [] }
          : m
      ))
    } finally {
      clearStepTimers()
      setIsBuilding(false)
      setBuildStep(0)
    }
  }, [input, isBuilding, messages, appName, versionCount, startBuildProgress, handleSave])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = "auto"
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  const handleHeaderCopy = () => {
    if (!code) return
    navigator.clipboard.writeText(code)
    setHeaderCopied(true)
    setTimeout(() => setHeaderCopied(false), 2000)
  }

  // ── Derived state ─────────────────────────────────────────────────────────

  const hasContent = messages.length > 0 || isBuilding

  // ── Root layout ───────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: "transparent" }}>

      {/* ── Header ── */}
      <header
        className="flex-shrink-0 h-11 flex items-center justify-between px-4 gap-3 relative z-10"
        style={{ background: "transparent", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {onBack ? (
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
              style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer" }}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <Link
              href="/studio"
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}
          <div className="w-px h-4 flex-shrink-0" style={{ background: "rgba(255,255,255,0.1)" }} />
          {isEditingName ? (
            <input
              ref={nameInputRef}
              value={appName}
              onChange={e => setAppName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") setIsEditingName(false) }}
              className="font-body text-sm font-medium bg-transparent border-b-2 focus:outline-none px-0.5 min-w-[100px] max-w-[200px]"
              style={{ borderBottomColor: "var(--s-accent)", color: "rgba(255,255,255,0.9)", caretColor: "white" }}
            />
          ) : (
            <button onClick={() => setIsEditingName(true)} className="group flex items-center gap-1.5 hover:opacity-70 transition-opacity truncate">
              <span className="font-body text-sm font-medium truncate" style={{ color: "rgba(255,255,255,0.85)" }}>{appName}</span>
              <Pencil className="w-3 h-3 flex-shrink-0 transition-colors" style={{ color: "rgba(255,255,255,0.2)" }} />
            </button>
          )}
          {isSaved && (
            <span className="hidden sm:flex items-center gap-1 font-body text-[10px]" style={{ color: "#34d399" }}>
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 relative">
          {code && (
            <button
              onClick={handleHeaderCopy}
              className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-full font-body text-xs font-medium transition-all duration-150"
              style={{ color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.85)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.45)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)" }}
            >
              {headerCopied
                ? <><Check className="w-3.5 h-3.5" style={{ color: "#34d399" }} /> Copied!</>
                : <><Copy className="w-3.5 h-3.5" /> Copy code</>
              }
            </button>
          )}
          <button
            disabled={!code || isSaving}
            onClick={() => void handleSave()}
            className="h-8 px-4 rounded-full font-body text-xs font-semibold transition-all"
            style={{
              background: code && !isSaving ? "var(--s-accent)" : "rgba(255,255,255,0.07)",
              color:      code && !isSaving ? "white"           : "rgba(255,255,255,0.2)",
              cursor:     code && !isSaving ? "pointer"         : "not-allowed",
              boxShadow:  code && !isSaving ? "0 0 20px color-mix(in srgb, var(--s-accent) 35%, transparent)" : "none",
            }}
          >
            {isSaving ? "Saving…" : isSaved ? "Saved" : "Save"}
          </button>
          <button
            onClick={() => setShowOverflow(v => !v)}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ color: "rgba(255,255,255,0.35)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.8)" }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.35)" }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {showOverflow && (
            <OverflowMenu
              onClose={() => setShowOverflow(false)}
              code={code}
              appName={appName}
            />
          )}
        </div>
      </header>

      {/* ── Phase 1: Fullscreen hero (no content yet) ── */}
      {!hasContent && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 relative overflow-hidden">
          {/* Ambient bloom and star-field removed — the stack's graph canvas background provides the texture */}

          <div className="relative z-10 flex flex-col items-center text-center w-full max-w-xl">
            {/* Icon orb */}
            <div className="relative mb-8">
              <div className="absolute rounded-full blur-3xl opacity-60 pointer-events-none" style={{ inset: -40, background: "color-mix(in srgb, var(--s-accent) 30%, transparent)" }} />
              <div className="relative w-20 h-20 rounded-[28px] flex items-center justify-center" style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.14)", boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.18)" }}>
                <Wand2 className="w-9 h-9" style={{ color: "var(--s-accent)" }} strokeWidth={1.5} />
              </div>
            </div>

            <h1 className="font-display font-semibold mb-4" style={{ fontSize: "clamp(32px, 5vw, 52px)", letterSpacing: "-0.03em", lineHeight: 1.1, color: "rgba(255,255,255,0.92)" }}>
              What would you like<br />to build?
            </h1>
            <p className="font-body mb-10 leading-relaxed" style={{ fontSize: 16, maxWidth: 360, color: "rgba(255,255,255,0.38)" }}>
              Describe any app in plain language — no coding required.
            </p>

            {/* Glass input card */}
            <div
              className="w-full rounded-3xl overflow-hidden transition-all duration-300"
              style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)" }}
              onFocusCapture={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = `0 0 0 1px var(--s-accent), 0 8px 60px rgba(0,0,0,0.5), 0 0 80px color-mix(in srgb, var(--s-accent) 12%, transparent), inset 0 1px 0 rgba(255,255,255,0.1)`; el.style.borderColor = "color-mix(in srgb, var(--s-accent) 70%, rgba(255,255,255,0.12))" }}
              onBlurCapture={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)"; el.style.borderColor = "rgba(255,255,255,0.12)" }}
            >
              <div className="flex items-end gap-3 p-4">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="A daily habit tracker with streaks and a weekly grid…"
                  rows={2}
                  disabled={isBuilding}
                  className="flex-1 bg-transparent resize-none focus:outline-none leading-relaxed font-body disabled:opacity-50 placeholder:text-white/25"
                  style={{ maxHeight: 120, fontSize: 15, color: "rgba(255,255,255,0.85)", caretColor: "white" }}
                />
                <button
                  onClick={() => void handleSend()}
                  disabled={!input.trim() || isBuilding}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 self-end disabled:cursor-not-allowed"
                  style={{
                    background: input.trim() && !isBuilding ? "var(--s-accent)" : "rgba(255,255,255,0.08)",
                    color:      input.trim() && !isBuilding ? "white"           : "rgba(255,255,255,0.25)",
                    boxShadow:  input.trim() && !isBuilding ? "0 4px 20px color-mix(in srgb, var(--s-accent) 40%, transparent)" : "none",
                  }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="px-5 pb-4">
                <p className="font-body text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                  Enter to send · Shift+Enter for new line
                </p>
              </div>
            </div>

            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 justify-center mt-7">
              {SUGGESTIONS.map(s => (
                <button
                  key={s.label}
                  onClick={() => void handleSend(s.prompt)}
                  className="font-body text-xs px-4 py-2 rounded-full transition-all duration-150 hover:scale-[1.03] active:scale-95"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.5)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    backdropFilter: "blur(8px)",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.85)" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)" }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Phase 2: Split layout (has content) ── */}
      {hasContent && (
        <>
          {/* Mobile mode toggle — pill segmented control */}
          <div className="md:hidden flex-shrink-0 px-4 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.04)" }}>
            <div className="flex bg-zinc-100 rounded-xl p-1">
              <button
                onClick={() => setActiveTab("chat")}
                className="flex-1 flex items-center justify-center gap-2 h-9 rounded-[10px] font-body text-[13px] font-medium transition-all duration-200"
                style={{
                  background: activeTab === "chat" ? "white" : "transparent",
                  color:      activeTab === "chat" ? "#18181b" : "#9ca3af",
                  boxShadow:  activeTab === "chat" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                }}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Chat
              </button>
              <button
                onClick={() => setActiveTab("preview")}
                className="flex-1 flex items-center justify-center gap-2 h-9 rounded-[10px] font-body text-[13px] font-medium transition-all duration-200"
                style={{
                  background: activeTab === "preview" ? "white" : "transparent",
                  color:      activeTab === "preview" ? "var(--s-accent)" : "#9ca3af",
                  boxShadow:  activeTab === "preview" ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                }}
              >
                <Monitor className="w-3.5 h-3.5" />
                Preview
                {code && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5 flex-shrink-0" />}
              </button>
            </div>
          </div>

          {/* Split body — each panel rendered ONCE, CSS controls visibility */}
          <div className="flex-1 flex overflow-hidden min-h-0">

            {/* ── Chat panel ── */}
            <div
              className={`flex-col border-r border-white/[0.06] overflow-hidden w-full md:w-[380px] md:flex-shrink-0
                ${activeTab === "preview" ? "hidden md:flex" : "flex"}`}
            >
              {/* Chat header */}
              <div className="flex-shrink-0 h-11 border-b border-zinc-100 flex items-center px-4 gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
                <span className="font-body text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                  Chat
                </span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
                {messages.map(msg =>
                  msg.role === "building" ? (
                    <BuildingMessage key={msg.id} step={buildStep} />
                  ) : (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      onRestore={handleRestore}
                      onChipSelect={p => { handleChipSelect(p) }}
                    />
                  )
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="flex-shrink-0 p-4 border-t border-zinc-100">
                <div className="flex items-end gap-2 rounded-2xl border p-3 transition-colors" style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.1)" }}>
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe a change or refinement…"
                    rows={1}
                    disabled={isBuilding}
                    className="flex-1 bg-transparent resize-none focus:outline-none text-sm text-zinc-700 placeholder:text-zinc-400 leading-relaxed font-body disabled:opacity-50"
                    style={{ maxHeight: 120 }}
                  />
                  <button
                    onClick={() => void handleSend()}
                    disabled={!input.trim() || isBuilding}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 disabled:cursor-not-allowed"
                    style={{
                      background: input.trim() && !isBuilding ? "var(--s-accent)" : "#e4e7eb",
                      color:      input.trim() && !isBuilding ? "white"           : "#9ca3af",
                    }}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="font-body text-[10px] text-zinc-400 mt-2 text-center">
                  Enter to send · Shift+Enter for new line
                </p>
              </div>
            </div>

            {/* ── Preview panel ── */}
            <div
              className={`flex-1 flex-col overflow-hidden
                ${activeTab === "chat" ? "hidden md:flex" : "flex"}`}
            >
              {/* Preview toolbar */}
              <div className="flex-shrink-0 h-11 flex items-center justify-between px-4" style={{ background: "rgba(10,9,20,0.6)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.22)" }} />
                  <span className="font-body text-[11px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.22)" }}>
                    Preview
                  </span>
                  {code && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#34d399" }} />}
                </div>
                <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ background: "rgba(255,255,255,0.08)" }}>
                  {([["desktop", Monitor], ["mobile", Smartphone]] as const).map(([mode, Icon]) => (
                    <button
                      key={mode}
                      onClick={() => setPreviewMode(mode)}
                      className="w-7 h-6 flex items-center justify-center rounded-md transition-all"
                      style={{
                        background: previewMode === mode ? "rgba(255,255,255,0.15)" : "transparent",
                        color:      previewMode === mode ? "var(--s-accent)"         : "rgba(255,255,255,0.3)",
                        boxShadow:  previewMode === mode ? "0 1px 4px rgba(0,0,0,0.3)" : "none",
                      }}
                      aria-label={`${mode} preview`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview content */}
              <div
                className="flex-1 overflow-auto p-6 lg:p-8 flex items-start justify-center min-h-0"
                style={{
                  background: "#080614",
                  backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              >
                {!code ? (
                  <PreviewEmpty isBuilding={isBuilding} buildStep={buildStep} />
                ) : (
                  <div
                    className="relative flex-shrink-0 w-full h-full"
                    style={{ maxWidth: previewMode === "mobile" ? 390 : "100%" }}
                  >
                    <div
                      className="bg-white overflow-hidden shadow-lg transition-all duration-300 w-full h-full"
                      style={{
                        border:       previewMode === "mobile" ? "8px solid #18181b" : "1px solid #e4e7eb",
                        borderRadius: previewMode === "mobile" ? 44 : 16,
                        height:       "100%",
                      }}
                    >
                      <iframe
                        srcDoc={buildIframeDoc(code)}
                        sandbox="allow-scripts"
                        className="w-full h-full block"
                        title="App preview"
                        onLoad={() => setPreviewError(null)}
                      />
                    </div>

                    {/* Error overlay */}
                    {previewError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-6 text-center" style={{ background: "rgba(20,8,8,0.95)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(239,68,68,0.25)" }}>
                        <AlertCircle className="w-8 h-8 mb-3" style={{ color: "#f87171" }} />
                        <p className="font-body text-sm font-semibold mb-1" style={{ color: "#fca5a5" }}>Preview error</p>
                        <p className="font-body text-xs mb-5 max-w-xs leading-relaxed" style={{ color: "rgba(252,165,165,0.7)" }}>{previewError}</p>
                        <button
                          onClick={() => void handleSend(`The preview had a JavaScript error: "${previewError}". Please fix it.`)}
                          className="font-body text-xs font-semibold px-4 py-2 rounded-full text-white transition-colors"
                          style={{ background: "var(--s-accent)" }}
                        >
                          Fix this error
                        </button>
                        <button
                          onClick={() => setPreviewError(null)}
                          className="mt-2 font-body text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  )
}
