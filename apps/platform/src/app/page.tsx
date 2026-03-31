import { currentUser } from "@clerk/nextjs/server"
import { UserButton } from "@clerk/nextjs"
import { Home, CalendarDays, Wallet, Baby, ArrowUpRight } from "lucide-react"

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
    gradient: "from-orange-400 to-rose-500",
    hoverShadow: "hover:shadow-orange-200",
    arrowBg: "group-hover:bg-orange-500",
  },
  {
    name: "Calendar",
    label: "Family Schedule",
    description: "Coordinate appointments, events, and routines across the whole family.",
    icon: CalendarDays,
    href: "https://calendar.atlas-homevault.com",
    gradient: "from-blue-500 to-indigo-600",
    hoverShadow: "hover:shadow-blue-200",
    arrowBg: "group-hover:bg-blue-500",
  },
  {
    name: "Budget",
    label: "Financial Tracking",
    description: "Track spending, manage subscriptions, and forecast savings over time.",
    icon: Wallet,
    href: "https://budget.atlas-homevault.com",
    gradient: "from-emerald-400 to-teal-600",
    hoverShadow: "hover:shadow-emerald-200",
    arrowBg: "group-hover:bg-emerald-500",
  },
  {
    name: "Baby",
    label: "Milestone Tracker",
    description: "Log milestones, track growth, and get insights for children ages 0–5.",
    icon: Baby,
    href: "https://baby.atlas-homevault.com",
    gradient: "from-pink-400 to-fuchsia-500",
    hoverShadow: "hover:shadow-pink-200",
    arrowBg: "group-hover:bg-pink-500",
  },
]

export default async function DashboardPage() {
  const user = await currentUser()
  const firstName = user?.firstName ?? "there"

  return (
    <div className="min-h-screen bg-neutral-100">

      {/* Nav */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-neutral-900 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold tracking-tight">M</span>
            </div>
            <span className="font-semibold text-[15px] tracking-tight text-neutral-900">Mosaic</span>
          </div>
          <UserButton />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">

        {/* Greeting */}
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400 mb-3">
            {getGreeting()}
          </p>
          <h1 className="text-5xl font-bold tracking-tight text-neutral-900 leading-none">
            {firstName}.
          </h1>
          <p className="mt-3 text-base text-neutral-400">
            Your platform — pick up where you left off.
          </p>
        </div>

        {/* Apps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {apps.map((app) => {
            const Icon = app.icon
            return (
              <a
                key={app.name}
                href={app.href}
                className={`group block rounded-3xl overflow-hidden bg-white shadow-md hover:shadow-2xl ${app.hoverShadow} hover:-translate-y-1 transition-all duration-300 ease-out`}
              >
                {/* Gradient banner */}
                <div className={`bg-gradient-to-br ${app.gradient} h-44 flex items-center justify-center relative`}>
                  {/* Icon bubble */}
                  <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-10 h-10 text-white" strokeWidth={1.5} />
                  </div>

                  {/* Status */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/20 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
                    <span className="text-[11px] font-medium text-white/90 tracking-wide">Coming soon</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400 mb-1">
                      {app.label}
                    </p>
                    <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
                      {app.name}
                    </h2>
                    <p className="mt-1.5 text-sm text-neutral-400 leading-relaxed">
                      {app.description}
                    </p>
                  </div>

                  <div className={`shrink-0 w-9 h-9 rounded-full bg-neutral-100 ${app.arrowBg} flex items-center justify-center transition-colors duration-300 mt-1`}>
                    <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors duration-300" />
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
