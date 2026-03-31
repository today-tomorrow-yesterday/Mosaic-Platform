import { UserButton } from "@clerk/nextjs"
import { AppHeader, StatCard, Badge, ProgressBar } from "@mosaic/ui"

const categories = [
  { emoji: "🏠", name: "Housing", spent: 1200, budget: 1200, pct: 100, badgeVariant: "red" as const, color: "red" as const },
  { emoji: "🍔", name: "Food", spent: 486, budget: 600, pct: 81, badgeVariant: "orange" as const, color: "orange" as const },
  { emoji: "🚗", name: "Transport", spent: 210, budget: 300, pct: 70, badgeVariant: "default" as const, color: "zinc" as const },
  { emoji: "🎮", name: "Entertainment", spent: 89, budget: 150, pct: 59, badgeVariant: "green" as const, color: "green" as const },
]

const transactions = [
  { name: "Whole Foods", category: "Food", date: "Mar 30", amount: "-$84.32" },
  { name: "Netflix", category: "Entertainment", date: "Mar 29", amount: "-$15.99" },
  { name: "Shell Gas Station", category: "Transport", date: "Mar 28", amount: "-$52.10" },
  { name: "Target", category: "Shopping", date: "Mar 27", amount: "-$127.43" },
  { name: "Spotify", category: "Entertainment", date: "Mar 26", amount: "-$9.99" },
]

const categoryBadgeVariant: Record<string, "default" | "green" | "blue" | "orange" | "red" | "pink"> = {
  Food: "orange",
  Entertainment: "green",
  Transport: "default",
  Shopping: "blue",
}

export default function BudgetPage() {
  return (
    <div className="min-h-screen bg-[#f4f4f5]">
      <AppHeader name="Budget" actions={<UserButton />} />

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Monthly Budget" value="$4,000" />
          <StatCard label="Spent" value="$2,847" accent="orange" />
          <StatCard label="Remaining" value="$1,153" accent="green" />
        </div>

        {/* Overall Progress */}
        <div className="bg-white rounded-2xl border border-zinc-200 px-5 py-4 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-zinc-700">Overall Spending</span>
            <span className="text-sm text-zinc-500">$2,847 of $4,000 spent — 71%</span>
          </div>
          <ProgressBar value={2847} max={4000} color="orange" />
        </div>

        {/* Categories */}
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">Categories</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {categories.map((cat) => (
              <div key={cat.name} className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-zinc-800">
                    {cat.emoji} {cat.name}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-zinc-500">
                      ${cat.spent.toLocaleString()} / ${cat.budget.toLocaleString()}
                    </span>
                    <Badge variant={cat.badgeVariant}>{cat.pct}%</Badge>
                  </div>
                </div>
                <ProgressBar value={cat.spent} max={cat.budget} color={cat.color} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">Recent Transactions</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {transactions.map((tx, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-zinc-800 min-w-0 truncate">{tx.name}</span>
                <div className="flex items-center gap-4 shrink-0">
                  <Badge variant={categoryBadgeVariant[tx.category] ?? "default"}>{tx.category}</Badge>
                  <span className="text-xs text-zinc-400 w-12 text-right">{tx.date}</span>
                  <span className="text-sm font-bold text-zinc-700 w-20 text-right">{tx.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
