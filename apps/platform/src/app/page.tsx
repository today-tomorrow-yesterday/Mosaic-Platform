import { currentUser } from "@clerk/nextjs/server"
import { UserButton } from "@clerk/nextjs"
import { Home, CalendarDays, Wallet, Baby, ArrowUpRight } from "lucide-react"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

export default async function DashboardPage() {
  const user = await currentUser()
  const firstName = user?.firstName ?? "there"

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-white">

      {/* Nav */}
      <header className="flex items-center justify-between px-8 pt-8 pb-0 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
            <span className="text-[#0c0c0e] text-[11px] font-black tracking-tighter">M</span>
          </div>
          <span className="font-semibold text-[15px] text-white/80 tracking-tight">Mosaic</span>
        </div>
        <UserButton
          appearance={{ elements: { avatarBox: "w-8 h-8" } }}
        />
      </header>

      <main className="max-w-6xl mx-auto px-8 pt-16 pb-12">

        {/* Greeting */}
        <div className="mb-12">
          <p className="text-xs font-medium text-white/30 uppercase tracking-[0.2em] mb-4">
            {getGreeting()}
          </p>
          <h1 className="text-[64px] font-black tracking-[-0.04em] leading-none bg-gradient-to-br from-white via-white/90 to-white/40 bg-clip-text text-transparent">
            {firstName}.
          </h1>
          <p className="mt-4 text-[15px] text-white/30 font-light">
            Everything in one place.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-3 gap-3" style={{ gridTemplateRows: "260px 260px" }}>

          {/* Home — wide */}
          <a
            href="https://home.atlas-homevault.com"
            className="group col-span-2 rounded-3xl overflow-hidden border border-white/[0.06] bg-[#141416] hover:border-orange-500/30 transition-colors duration-300 flex flex-col"
          >
            <div className="flex-1 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-orange-500/5 to-transparent" />
              <div className="absolute bottom-0 right-0 w-56 h-56 bg-gradient-to-tl from-orange-500/25 to-transparent rounded-full blur-3xl" />
              <div className="relative p-7 h-full flex flex-col justify-between">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center group-hover:bg-orange-500/25 transition-colors duration-300">
                  <Home className="w-6 h-6 text-orange-400" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/30 mb-2">Smart Home</p>
                      <h2 className="text-3xl font-bold text-white tracking-tight">Home</h2>
                      <p className="text-sm text-white/40 mt-1.5 max-w-xs">Control devices, automations, and monitor every corner of your home.</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-orange-500 group-hover:border-orange-500 transition-all duration-300 mb-1">
                      <ArrowUpRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors duration-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-orange-500/0 via-orange-500/60 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>

          {/* Calendar — tall (spans 2 rows) */}
          <a
            href="https://calendar.atlas-homevault.com"
            className="group row-span-2 rounded-3xl overflow-hidden border border-white/[0.06] bg-[#141416] hover:border-blue-500/30 transition-colors duration-300 flex flex-col"
          >
            <div className="flex-1 relative overflow-hidden flex flex-col">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 via-blue-500/5 to-transparent" />
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />
              <div className="relative p-7 flex flex-col h-full">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center mb-auto group-hover:bg-blue-500/25 transition-colors duration-300">
                  <CalendarDays className="w-6 h-6 text-blue-400" strokeWidth={1.5} />
                </div>
                <div className="mt-auto">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/30 mb-2">Family Schedule</p>
                  <h2 className="text-3xl font-bold text-white tracking-tight">Calendar</h2>
                  <p className="text-sm text-white/40 mt-1.5">Coordinate appointments, events, and routines across the whole family.</p>
                  <div className="flex items-center justify-between mt-6">
                    <span className="text-[11px] font-medium text-blue-400/70 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1">
                      Coming soon
                    </span>
                    <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-blue-500 group-hover:border-blue-500 transition-all duration-300">
                      <ArrowUpRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors duration-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/60 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>

          {/* Budget */}
          <a
            href="https://budget.atlas-homevault.com"
            className="group rounded-3xl overflow-hidden border border-white/[0.06] bg-[#141416] hover:border-emerald-500/30 transition-colors duration-300 flex flex-col"
          >
            <div className="flex-1 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/15 via-emerald-500/5 to-transparent" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
              <div className="relative p-7 h-full flex flex-col justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/25 transition-colors duration-300">
                  <Wallet className="w-6 h-6 text-emerald-400" strokeWidth={1.5} />
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/30 mb-2">Financial</p>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Budget</h2>
                    <p className="text-sm text-white/40 mt-1.5">Track spending and forecast savings.</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-emerald-500 group-hover:border-emerald-500 transition-all duration-300 mb-1">
                    <ArrowUpRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors duration-300" />
                  </div>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/60 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>

          {/* Baby */}
          <a
            href="https://baby.atlas-homevault.com"
            className="group rounded-3xl overflow-hidden border border-white/[0.06] bg-[#141416] hover:border-pink-500/30 transition-colors duration-300 flex flex-col"
          >
            <div className="flex-1 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tl from-pink-500/15 via-pink-500/5 to-transparent" />
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-fuchsia-500/20 rounded-full blur-3xl" />
              <div className="relative p-7 h-full flex flex-col justify-between">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/15 border border-pink-500/20 flex items-center justify-center group-hover:bg-pink-500/25 transition-colors duration-300">
                  <Baby className="w-6 h-6 text-pink-400" strokeWidth={1.5} />
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/30 mb-2">Milestones</p>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Baby</h2>
                    <p className="text-sm text-white/40 mt-1.5">Track growth and milestones ages 0–5.</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-pink-500 group-hover:border-pink-500 transition-all duration-300 mb-1">
                    <ArrowUpRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors duration-300" />
                  </div>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-pink-500/0 via-pink-500/60 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>

        </div>
      </main>
    </div>
  )
}
