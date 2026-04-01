import { UserButton } from "@clerk/nextjs"

type Category = {
  name: string
  emoji: string
  spent: number
  budget: number
  pct: number
}

type Transaction = {
  name: string
  category: string
  date: string
  amount: string
  negative: boolean
}

const categories: Category[] = [
  { emoji: "🏠", name: "Housing",       spent: 1200, budget: 1200, pct: 100 },
  { emoji: "🍔", name: "Food",          spent: 486,  budget: 600,  pct: 81  },
  { emoji: "🚗", name: "Transport",     spent: 210,  budget: 300,  pct: 70  },
  { emoji: "🎮", name: "Entertainment", spent: 89,   budget: 150,  pct: 59  },
]

const transactions: Transaction[] = [
  { name: "Whole Foods",  category: "Food",          date: "Mar 30", amount: "$84.32",  negative: true  },
  { name: "Netflix",      category: "Entertainment", date: "Mar 29", amount: "$15.99",  negative: true  },
  { name: "Shell Gas",    category: "Transport",     date: "Mar 28", amount: "$52.10",  negative: true  },
  { name: "Target",       category: "Shopping",      date: "Mar 27", amount: "$127.43", negative: true  },
  { name: "Spotify",      category: "Entertainment", date: "Mar 26", amount: "$9.99",   negative: true  },
]

function categoryAccent(pct: number) {
  if (pct >= 100) return { text: "#dc2626", bar: "#dc2626", bg: "#fef2f2", border: "#fecaca" }
  if (pct >= 80)  return { text: "#d97706", bar: "#f59e0b", bg: "#fffbeb", border: "#fde68a" }
  return              { text: "#059669", bar: "#10b981", bg: "#f0fdf4", border: "#bbf7d0" }
}

export default function BudgetPage() {
  const pctSpent = Math.round((2847 / 4000) * 100)

  return (
    <div className="min-h-screen" style={{ background: "#f0f2f5" }}>

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-20 animate-fade-in"
        style={{
          background: "rgba(240,242,245,0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid #e2e5ea",
          animationDelay: "0ms",
        }}
      >
        <div className="max-w-5xl mx-auto px-7 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <a
              href={process.env.NEXT_PUBLIC_PLATFORM_URL ?? "https://atlas-homevault.com"}
              className="font-body text-[13px] text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              ← Mosaic
            </a>
            <span className="text-zinc-200 select-none">/</span>
            <span className="font-display font-semibold text-[15px] text-zinc-900 tracking-tight">
              Budget
            </span>
          </div>
          <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-7 py-8 space-y-5">

        {/* ── Hero card ── */}
        <div
          className="rounded-3xl overflow-hidden animate-fade-up"
          style={{
            background: "#111827",
            animationDelay: "40ms",
            boxShadow: "0 20px 60px -12px rgba(17,24,39,0.35)",
          }}
        >
          {/* Top section: numbers */}
          <div className="px-8 pt-8 pb-6 grid grid-cols-3 gap-6">
            {/* Spent */}
            <div>
              <p
                className="font-body font-medium text-zinc-500 mb-2"
                style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}
              >
                Spent
              </p>
              <p
                className="font-display font-bold text-white leading-none"
                style={{ fontSize: "clamp(36px, 5vw, 52px)", letterSpacing: "-0.03em" }}
              >
                $2,847
              </p>
            </div>

            {/* Remaining — hero stat, center */}
            <div className="text-center">
              <p
                className="font-body font-medium mb-2"
                style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6ee7b7" }}
              >
                Remaining
              </p>
              <p
                className="font-display font-extrabold leading-none"
                style={{
                  fontSize: "clamp(44px, 6.5vw, 68px)",
                  letterSpacing: "-0.04em",
                  color: "#34d399",
                }}
              >
                $1,153
              </p>
            </div>

            {/* Budget */}
            <div className="text-right">
              <p
                className="font-body font-medium text-zinc-500 mb-2"
                style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}
              >
                Budget
              </p>
              <p
                className="font-display font-bold leading-none"
                style={{
                  fontSize: "clamp(36px, 5vw, 52px)",
                  letterSpacing: "-0.03em",
                  color: "#374151",
                }}
              >
                $4,000
              </p>
            </div>
          </div>

          {/* Progress bar section */}
          <div className="px-8 pb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="font-body text-[12px] text-zinc-500">March 2026</span>
              <span
                className="font-display font-bold text-zinc-300"
                style={{ fontSize: 22, letterSpacing: "-0.02em" }}
              >
                {pctSpent}% used
              </span>
            </div>

            {/* Track */}
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ height: 8, background: "#1f2937" }}
            >
              {/* Gradient fill */}
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pctSpent}%`,
                  background: "linear-gradient(90deg, #34d399 0%, #f59e0b 70%, #ef4444 100%)",
                  backgroundSize: `${100 / (pctSpent / 100)}% 100%`,
                  transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />
            </div>

            {/* Tick marks for budget milestones */}
            <div className="flex justify-between mt-2 px-0.5">
              {["25%", "50%", "75%", "100%"].map((label) => (
                <span key={label} className="font-body text-[10px] text-zinc-600">
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Category grid ── */}
        <div
          className="animate-fade-up"
          style={{ animationDelay: "140ms" }}
        >
          <p
            className="font-body font-semibold text-zinc-400 mb-3 px-1"
            style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" }}
          >
            Categories
          </p>
          <div className="grid grid-cols-2 gap-4">
            {categories.map((cat, i) => {
              const accent = categoryAccent(cat.pct)
              const leftover = cat.budget - cat.spent
              return (
                <div
                  key={cat.name}
                  className="rounded-2xl p-6 animate-fade-up"
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e8eaed",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
                    animationDelay: `${180 + i * 50}ms`,
                  }}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
                        style={{ background: accent.bg, border: `1px solid ${accent.border}` }}
                      >
                        {cat.emoji}
                      </div>
                      <p
                        className="font-display font-semibold text-zinc-800"
                        style={{ fontSize: 15, letterSpacing: "-0.01em" }}
                      >
                        {cat.name}
                      </p>
                      <p className="font-body text-[12px] text-zinc-400 mt-0.5 tabular-nums">
                        ${cat.spent.toLocaleString()} of ${cat.budget.toLocaleString()}
                      </p>
                    </div>

                    {/* Large percentage */}
                    <div className="text-right">
                      <p
                        className="font-display font-extrabold leading-none tabular-nums"
                        style={{ fontSize: 42, letterSpacing: "-0.04em", color: accent.text }}
                      >
                        {cat.pct}%
                      </p>
                      <p
                        className="font-body text-[11px] mt-1 font-medium"
                        style={{ color: accent.text }}
                      >
                        {cat.pct >= 100 ? "over budget" : leftover > 0 ? `$${leftover} left` : "maxed"}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div
                    className="w-full rounded-full overflow-hidden"
                    style={{ height: 5, background: "#f3f4f6" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(cat.pct, 100)}%`,
                        background: accent.bar,
                        transition: "width 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Transactions ── */}
        <div
          className="animate-fade-up"
          style={{ animationDelay: "360ms" }}
        >
          <p
            className="font-body font-semibold text-zinc-400 mb-3 px-1"
            style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" }}
          >
            Recent Transactions
          </p>

          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "#ffffff",
              border: "1px solid #e8eaed",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
            }}
          >
            {transactions.map((tx, i) => (
              <div
                key={i}
                className="group flex items-center justify-between px-6 py-4 hover:bg-zinc-50 transition-colors animate-fade-up"
                style={{
                  borderBottom: i < transactions.length - 1 ? "1px solid #f3f4f6" : "none",
                  animationDelay: `${400 + i * 40}ms`,
                }}
              >
                {/* Left: icon + name */}
                <div className="flex items-center gap-4 min-w-0">
                  {/* Initial circle */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#f3f4f6" }}
                  >
                    <span className="font-display font-bold text-[13px] text-zinc-500">
                      {tx.name.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p
                      className="font-display font-semibold text-zinc-900 truncate"
                      style={{ fontSize: 14, letterSpacing: "-0.01em" }}
                    >
                      {tx.name}
                    </p>
                    <p className="font-body text-[12px] text-zinc-400">
                      {tx.category}
                    </p>
                  </div>
                </div>

                {/* Right: date + amount */}
                <div className="flex items-center gap-5 flex-shrink-0">
                  <span className="font-body text-[12px] text-zinc-400 tabular-nums hidden sm:block">
                    {tx.date}
                  </span>
                  <span
                    className="font-display font-bold tabular-nums"
                    style={{
                      fontSize: 15,
                      letterSpacing: "-0.02em",
                      color: "#111827",
                    }}
                  >
                    −${tx.amount}
                  </span>
                </div>
              </div>
            ))}

            {/* Footer */}
            <div
              className="px-6 py-3 flex items-center justify-between"
              style={{ borderTop: "1px solid #f3f4f6", background: "#fafafa" }}
            >
              <span className="font-body text-[12px] text-zinc-400">
                Showing 5 of 5 transactions
              </span>
              <span
                className="font-display font-semibold text-[13px]"
                style={{ color: "#059669" }}
              >
                Total: −$289.83
              </span>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
