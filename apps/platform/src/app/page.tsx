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
    subtitle: "Smart Home",
    description:
      "Control devices, set automations, and monitor every room from one place via Home Assistant.",
    icon: Home,
    href: "https://home.atlas-homevault.com",
    gradient: "from-orange-500 via-amber-400 to-yellow-300",
    shadow: "shadow-orange-200",
    status: "coming soon",
  },
  {
    name: "Calendar",
    subtitle: "Family Schedule",
    description:
      "Coordinate the whole family — appointments, chores, recurring events, and seasonal planning.",
    icon: CalendarDays,
    href: "https://calendar.atlas-homevault.com",
    gradient: "from-blue-600 via-blue-500 to-sky-400",
    shadow: "shadow-blue-200",
    status: "coming soon",
  },
  {
    name: "Budget",
    subtitle: "Financial Tracking",
    description:
      "Track spending, manage subscriptions, forecast savings, and stay on top of your finances.",
    icon: Wallet,
    href: "https://budget.atlas-homevault.com",
    gradient: "from-emerald-600 via-emerald-500 to-teal-400",
    shadow: "shadow-emerald-200",
    status: "coming soon",
  },
  {
    name: "Baby",
    subtitle: "Milestone Tracker",
    description:
      "Log milestones, track growth, and get age-appropriate insights for children ages 0–5.",
    icon: Baby,
    href: "https://baby.atlas-homevault.com",
    gradient: "from-pink-500 via-rose-400 to-fuchsia-400",
    shadow: "shadow-pink-200",
    status: "coming soon",
  },
]

export default async function DashboardPage() {
  const user = await currentUser()
  const firstName = user?.firstName ?? "there"

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Nav */}
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200/80">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-gray-900 to-gray-600" />
            <span className="font-semibold text-gray-900 tracking-tight">Mosaic</span>
          </div>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
              },
            }}
          />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-14">
        {/* Greeting */}
        <div className="mb-12">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-2">
            {getGreeting()}
          </p>
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight">
            {firstName}.
          </h1>
          <p className="text-gray-500 mt-3 text-lg">
            Your platform. Pick up where you left off.
          </p>
        </div>

        {/* App Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {apps.map((app) => {
            const Icon = app.icon
            return (
              <a
                key={app.name}
                href={app.href}
                className={`group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl ${app.shadow} transition-all duration-300 hover:-translate-y-1`}
              >
                {/* Gradient header */}
                <div className={`bg-gradient-to-br ${app.gradient} h-36 flex items-center justify-center relative`}>
                  <div className="absolute inset-0 bg-black/5" />
                  <div className="relative bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                    <Icon className="w-9 h-9 text-white drop-shadow-sm" strokeWidth={1.75} />
                  </div>

                  {/* Status badge */}
                  <span className="absolute top-3 right-3 text-xs font-medium bg-white/20 backdrop-blur-sm text-white px-2.5 py-1 rounded-full border border-white/30">
                    {app.status}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        {app.subtitle}
                      </p>
                      <h2 className="text-xl font-bold text-gray-900">{app.name}</h2>
                      <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                        {app.description}
                      </p>
                    </div>
                    <div className="shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-gray-900 flex items-center justify-center transition-colors duration-200">
                        <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors duration-200" />
                      </div>
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
