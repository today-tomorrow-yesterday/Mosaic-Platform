import { UserButton } from "@clerk/nextjs"

/* ─── Data ─────────────────────────────────────────────────────── */

const categories = [
  { emoji: "🏠", name: "Housing",       spent: 1200, budget: 1200, pct: 100 },
  { emoji: "🍔", name: "Food",          spent: 486,  budget: 600,  pct: 81  },
  { emoji: "🚗", name: "Transport",     spent: 210,  budget: 300,  pct: 70  },
  { emoji: "🎮", name: "Entertainment", spent: 89,   budget: 150,  pct: 59  },
]

const transactions = [
  { name: "Whole Foods",  category: "Food",          date: "Mar 30", amount: 84.32  },
  { name: "Netflix",      category: "Entertainment", date: "Mar 29", amount: 15.99  },
  { name: "Shell Gas",    category: "Transport",     date: "Mar 28", amount: 52.10  },
  { name: "Target",       category: "Shopping",      date: "Mar 27", amount: 127.43 },
  { name: "Spotify",      category: "Entertainment", date: "Mar 26", amount: 9.99   },
]

/* ─── Helpers ───────────────────────────────────────────────────── */

const BUDGET  = 4000
const SPENT   = 2847
const LEFT    = BUDGET - SPENT
const PCT     = Math.round((SPENT / BUDGET) * 100)
// 71% → 255.6°
const RING_DEG = (PCT / 100) * 360

function barColor(pct: number) {
  if (pct >= 100) return "#f6465d"
  if (pct >= 80)  return "#f0a500"
  return "#0052ff"
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/* ─── Card shell ────────────────────────────────────────────────── */

function Card({
  children,
  className = "",
  style = {},
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={className}
      style={{
        background: "#ffffff",
        border: "1px solid #e8ecef",
        borderRadius: 16,
        boxShadow: "0 1px 2px rgba(20,23,26,0.06), 0 2px 8px rgba(20,23,26,0.04)",
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────────── */

export default function BudgetPage() {
  return (
    <div className="min-h-screen" style={{ background: "#f7f8fa" }}>

      {/* ── Sticky header ── */}
      <header
        className="sticky top-0 z-20 animate-fade-in"
        style={{
          background: "rgba(247,248,250,0.9)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #e8ecef",
        }}
      >
        <div
          className="max-w-5xl mx-auto flex items-center justify-between"
          style={{ padding: "0 28px", height: 56 }}
        >
          <div className="flex items-center gap-2">
            <a
              href={process.env.NEXT_PUBLIC_PLATFORM_URL ?? "https://atlas-homevault.com"}
              style={{ fontSize: 13, fontWeight: 500, color: "#5e6e7a" }}
              className="hover:text-[#14171a] transition-colors"
            >
              ← Mosaic
            </a>
            <span style={{ color: "#d1d8de", margin: "0 4px" }}>/</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#14171a" }}>Budget</span>
          </div>
          <div className="flex items-center gap-4">
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#5e6e7a",
                background: "#f0f2f5",
                border: "1px solid #e8ecef",
                borderRadius: 8,
                padding: "3px 10px",
              }}
            >
              March 2026
            </span>
            <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
          </div>
        </div>
      </header>

      <main
        className="max-w-5xl mx-auto"
        style={{ padding: "28px 28px 64px" }}
      >

        {/* ── Overview row ── */}
        <div
          className="grid gap-4 mb-4 animate-fade-up"
          style={{ gridTemplateColumns: "1fr 1fr 1fr", animationDelay: "40ms" }}
        >
          {/* Spent */}
          <Card style={{ padding: "20px 24px" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#5e6e7a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Spent this month
            </p>
            <p style={{ fontSize: 32, fontWeight: 800, color: "#14171a", letterSpacing: "-0.03em", lineHeight: 1 }}>
              ${SPENT.toLocaleString()}
            </p>
          </Card>

          {/* Remaining */}
          <Card style={{ padding: "20px 24px", border: "1px solid #b7f5d8" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#00a063", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Remaining
            </p>
            <p style={{ fontSize: 32, fontWeight: 800, color: "#00c076", letterSpacing: "-0.03em", lineHeight: 1 }}>
              ${LEFT.toLocaleString()}
            </p>
          </Card>

          {/* Budget */}
          <Card style={{ padding: "20px 24px" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#5e6e7a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Monthly budget
            </p>
            <p style={{ fontSize: 32, fontWeight: 800, color: "#14171a", letterSpacing: "-0.03em", lineHeight: 1 }}>
              ${BUDGET.toLocaleString()}
            </p>
          </Card>
        </div>

        {/* ── Progress card ── */}
        <Card
          className="mb-4 animate-fade-up"
          style={{ padding: "24px 28px", animationDelay: "100ms" }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#14171a" }}>
                Budget utilization
              </p>
              <p style={{ fontSize: 12, color: "#5e6e7a", marginTop: 2 }}>
                ${SPENT.toLocaleString()} spent of ${BUDGET.toLocaleString()} — {PCT}% used
              </p>
            </div>

            {/* Donut ring */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: `conic-gradient(#0052ff 0deg ${RING_DEG}deg, #e8ecef ${RING_DEG}deg 360deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 800, color: "#14171a", lineHeight: 1 }}>
                  {PCT}%
                </span>
              </div>
            </div>
          </div>

          {/* Progress track */}
          <div style={{ height: 6, background: "#f0f2f5", borderRadius: 99, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${PCT}%`,
                background: "linear-gradient(90deg, #0052ff, #1a6fff)",
                borderRadius: 99,
              }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span style={{ fontSize: 11, color: "#a0aab4" }}>$0</span>
            <span style={{ fontSize: 11, color: "#a0aab4" }}>${BUDGET.toLocaleString()}</span>
          </div>
        </Card>

        {/* ── Lower two-col ── */}
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "1fr 1.45fr" }}
        >
          {/* Categories */}
          <Card
            className="animate-fade-up"
            style={{ animationDelay: "160ms" }}
          >
            <div
              style={{
                padding: "16px 20px 12px",
                borderBottom: "1px solid #f0f2f5",
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 700, color: "#14171a" }}>Categories</p>
            </div>

            <div style={{ padding: "8px 0" }}>
              {categories.map((cat, i) => {
                const color   = barColor(cat.pct)
                const leftover = cat.budget - cat.spent
                return (
                  <div
                    key={cat.name}
                    className="animate-fade-up"
                    style={{
                      padding: "12px 20px",
                      borderBottom: i < categories.length - 1 ? "1px solid #f7f8fa" : "none",
                      animationDelay: `${200 + i * 45}ms`,
                    }}
                  >
                    {/* Name row */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          style={{
                            fontSize: 16,
                            width: 30,
                            height: 30,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#f7f8fa",
                            borderRadius: 8,
                          }}
                        >
                          {cat.emoji}
                        </span>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#14171a", lineHeight: 1 }}>
                            {cat.name}
                          </p>
                          <p style={{ fontSize: 11, color: "#a0aab4", marginTop: 2 }}>
                            ${cat.spent.toLocaleString()} / ${cat.budget.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color,
                            background: cat.pct >= 100 ? "#fff1f3" : cat.pct >= 80 ? "#fffbeb" : "#f0f7ff",
                            border: `1px solid ${cat.pct >= 100 ? "#fecdd3" : cat.pct >= 80 ? "#fde68a" : "#bfdbfe"}`,
                            borderRadius: 6,
                            padding: "2px 7px",
                          }}
                        >
                          {cat.pct}%
                        </span>
                        {leftover > 0 && (
                          <p style={{ fontSize: 10, color: "#a0aab4", marginTop: 3 }}>
                            ${leftover} left
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bar */}
                    <div style={{ height: 4, background: "#f0f2f5", borderRadius: 99, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.min(cat.pct, 100)}%`,
                          background: color,
                          borderRadius: 99,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Transactions */}
          <Card
            className="animate-fade-up"
            style={{ animationDelay: "200ms" }}
          >
            <div
              className="flex items-center justify-between"
              style={{ padding: "16px 20px 12px", borderBottom: "1px solid #f0f2f5" }}
            >
              <p style={{ fontSize: 13, fontWeight: 700, color: "#14171a" }}>
                Recent transactions
              </p>
              <span style={{ fontSize: 12, color: "#0052ff", fontWeight: 600, cursor: "pointer" }}>
                View all
              </span>
            </div>

            <div>
              {transactions.map((tx, i) => (
                <div
                  key={i}
                  className="group animate-fade-up"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "13px 20px",
                    borderBottom: i < transactions.length - 1 ? "1px solid #f7f8fa" : "none",
                    cursor: "default",
                    transition: "background 0.15s",
                    animationDelay: `${240 + i * 35}ms`,
                  }}
                >
                  {/* Merchant */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: "#f0f2f5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#5e6e7a",
                        flexShrink: 0,
                      }}
                    >
                      {tx.name.charAt(0)}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#14171a" }}>
                        {tx.name}
                      </p>
                      <p style={{ fontSize: 11, color: "#a0aab4", marginTop: 1 }}>
                        {tx.category}
                      </p>
                    </div>
                  </div>

                  {/* Right side */}
                  <div style={{ textAlign: "right" }}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#f6465d",
                        letterSpacing: "-0.01em",
                        lineHeight: 1,
                      }}
                    >
                      −${fmt(tx.amount)}
                    </p>
                    <p style={{ fontSize: 11, color: "#a0aab4", marginTop: 3 }}>
                      {tx.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 20px",
                background: "#f7f8fa",
                borderTop: "1px solid #e8ecef",
                borderRadius: "0 0 16px 16px",
              }}
            >
              <span style={{ fontSize: 12, color: "#5e6e7a", fontWeight: 500 }}>
                5 transactions
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#f6465d" }}>
                −${fmt(transactions.reduce((s, t) => s + t.amount, 0))}
              </span>
            </div>
          </Card>
        </div>

      </main>
    </div>
  )
}
