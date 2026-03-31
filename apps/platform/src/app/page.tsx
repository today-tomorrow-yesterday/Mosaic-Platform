import { UserButton } from "@clerk/nextjs"
import { Home, CalendarDays, Wallet, Baby, ArrowRight } from "lucide-react"

const apps = [
  {
    name: "Home",
    description: "Smart home controls and device management via Home Assistant",
    icon: Home,
    href: "https://home.atlas-homevault.com",
    color: "bg-orange-500",
    lightColor: "bg-orange-50",
    textColor: "text-orange-600",
  },
  {
    name: "Calendar",
    description: "Family lifestyle calendar — schedules, maintenance, hobbies",
    icon: CalendarDays,
    href: "https://calendar.atlas-homevault.com",
    color: "bg-blue-500",
    lightColor: "bg-blue-50",
    textColor: "text-blue-600",
  },
  {
    name: "Budget",
    description: "Financial tracking, subscriptions, and savings projections",
    icon: Wallet,
    href: "https://budget.atlas-homevault.com",
    color: "bg-emerald-500",
    lightColor: "bg-emerald-50",
    textColor: "text-emerald-600",
  },
  {
    name: "Baby",
    description: "Milestone tracking and development insights for ages 0–5",
    icon: Baby,
    href: "https://baby.atlas-homevault.com",
    color: "bg-pink-500",
    lightColor: "bg-pink-50",
    textColor: "text-pink-600",
  },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gray-900 rounded-md" />
            <span className="font-semibold text-gray-900 text-lg">Mosaic</span>
          </div>
          <UserButton />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Your Platform</h1>
          <p className="text-gray-500 mt-1">Everything in one place.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {apps.map((app) => {
            const Icon = app.icon
            return (
              <a
                key={app.name}
                href={app.href}
                className="group bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-md transition-all duration-150"
              >
                <div className="flex items-start justify-between">
                  <div className={`${app.lightColor} rounded-lg p-2.5`}>
                    <Icon className={`w-5 h-5 ${app.textColor}`} />
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all duration-150" />
                </div>
                <div className="mt-4">
                  <h2 className="font-semibold text-gray-900">{app.name}</h2>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{app.description}</p>
                </div>
              </a>
            )
          })}
        </div>
      </main>
    </div>
  )
}
