import { currentUser } from "@clerk/nextjs/server"
import { UserButton } from "@clerk/nextjs"
import { Home, CalendarDays, Wallet, Baby, MoveUpRight } from "lucide-react"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

const apps = [
  {
    name: "Home",
    label: "Smart Home",
    description: "Control devices, set automations, and monitor every corner of your home.",
    icon: Home,
    href: "https://home.atlas-homevault.com",
    from: "#f97316",
    to: "#ef4444",
    shadow: "rgba(249,115,22,0.35)",
  },
  {
    name: "Calendar",
    label: "Family Schedule",
    description: "Coordinate appointments, events, and routines across the whole family.",
    icon: CalendarDays,
    href: "https://calendar.atlas-homevault.com",
    from: "#3b82f6",
    to: "#6366f1",
    shadow: "rgba(59,130,246,0.35)",
  },
  {
    name: "Budget",
    label: "Financial Tracking",
    description: "Track spending, manage subscriptions, and forecast savings over time.",
    icon: Wallet,
    href: "https://budget.atlas-homevault.com",
    from: "#10b981",
    to: "#0d9488",
    shadow: "rgba(16,185,129,0.35)",
  },
  {
    name: "Baby",
    label: "Milestone Tracker",
    description: "Log milestones, track growth, and get insights for children ages 0–5.",
    icon: Baby,
    href: "https://baby.atlas-homevault.com",
    from: "#ec4899",
    to: "#a855f7",
    shadow: "rgba(236,72,153,0.35)",
  },
]

export default async function DashboardPage() {
  const user = await currentUser()
  const firstName = user?.firstName ?? "there"

  return (
    <div className="min-h-screen bg-[#f6f6f7]">

      {/* Nav */}
      <header className="sticky top-0 z-20 bg-white/75 backdrop-blur-2xl border-b border-black/[0.06]">
        <div className="max-w-5xl mx-auto px-6 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold"
              style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e)" }}
            >
              M
            </div>
            <span className="font-semibold text-[15px] text-gray-900 tracking-tight">Mosaic</span>
          </div>
          <UserButton />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6">

        {/* Greeting */}
        <section className="pt-14 pb-12">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-indigo-500 mb-3">
            {getGreeting()}
          </p>
          <h1 className="text-[52px] font-bold tracking-[-0.03em] text-gray-950 leading-none">
            {firstName}.
          </h1>
          <p className="mt-3 text-[17px] text-gray-400 font-normal">
            Your platform — everything in one place.
          </p>
        </section>

        {/* Section label */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
            Your Apps
          </span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* App grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-16">
          {apps.map((app) => {
            const Icon = app.icon
            return (
              <a
                key={app.name}
                href={app.href}
                className="group relative block rounded-[24px] overflow-hidden bg-white transition-transform duration-200 hover:-translate-y-1"
                style={{
                  boxShadow: `0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)`,
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 4px 6px rgba(0,0,0,0.06), 0 20px 40px ${app.shadow}`
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)`
                }}
              >
                {/* Gradient swatch */}
                <div
                  className="h-[160px] flex items-center justify-center relative"
                  style={{
                    background: `linear-gradient(135deg, ${app.from}, ${app.to})`,
                  }}
                >
                  {/* Noise overlay for texture */}
                  <div className="absolute inset-0 opacity-[0.08]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                  }} />

                  {/* Icon bubble */}
                  <div className="relative bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-4 group-hover:scale-105 transition-transform duration-200">
                    <Icon className="w-10 h-10 text-white drop-shadow" strokeWidth={1.5} />
                  </div>

                  {/* Coming soon badge */}
                  <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 bg-black/20 backdrop-blur-md rounded-full px-3 py-1 border border-white/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />
                    <span className="text-[11px] font-medium text-white/90 tracking-wide">Coming soon</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400 mb-1">
                        {app.label}
                      </p>
                      <h2 className="text-[18px] font-bold text-gray-900 tracking-tight">
                        {app.name}
                      </h2>
                      <p className="text-[13px] text-gray-500 mt-1.5 leading-[1.5]">
                        {app.description}
                      </p>
                    </div>
                    <div
                      className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 mt-0.5"
                      style={{ background: `linear-gradient(135deg, ${app.from}22, ${app.to}22)` }}
                    >
                      <MoveUpRight
                        className="w-4 h-4 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        style={{ color: app.from }}
                      />
                    </div>
                  </div>
                </div>
              </a>
            )
          })}
        </div>

      </main>
    </div>
  )
}
