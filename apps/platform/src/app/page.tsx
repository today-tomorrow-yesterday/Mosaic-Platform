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
    <div className="min-h-screen bg-[#f4f4f5]">

      {/* Nav */}
      <header className="flex items-center justify-between px-8 pt-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center">
            <span className="text-white text-[11px] font-black tracking-tighter">M</span>
          </div>
          <span className="font-semibold text-[15px] text-zinc-800 tracking-tight">Mosaic</span>
        </div>
        <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
      </header>

      <main className="max-w-6xl mx-auto px-8 pt-14 pb-12">

        {/* Greeting */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 mb-3">
            {getGreeting()}
          </p>
          <h1 className="text-[60px] font-black tracking-[-0.04em] leading-none text-zinc-900">
            {firstName}.
          </h1>
          <p className="mt-3 text-[15px] text-zinc-400">
            Everything in one place.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-3 gap-3" style={{ gridTemplateRows: "260px 260px" }}>

          {/* Home — wide */}
          <a
            href="https://home.atlas-homevault.com"
            className="group col-span-2 rounded-3xl overflow-hidden bg-white border border-zinc-200 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100 transition-all duration-300 flex flex-col"
          >
            <div className="flex-1 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 right-0 w-56 h-56 bg-orange-100 rounded-full blur-3xl opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
              <div className="relative p-7 h-full flex flex-col justify-between">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center group-hover:bg-orange-100 group-hover:border-orange-200 transition-colors duration-300">
                  <Home className="w-6 h-6 text-orange-500" strokeWidth={1.5} />
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400 mb-2">Smart Home</p>
                    <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Home</h2>
                    <p className="text-sm text-zinc-400 mt-1.5 max-w-xs">Control devices, automations, and monitor every corner of your home.</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-orange-500 transition-colors duration-300 mb-1">
                    <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors duration-300" />
                  </div>
                </div>
              </div>
            </div>
            <div className="h-[3px] bg-gradient-to-r from-orange-300/0 via-orange-400 to-orange-300/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>

          {/* Calendar — tall */}
          <a
            href="https://calendar.atlas-homevault.com"
            className="group row-span-2 rounded-3xl overflow-hidden bg-white border border-zinc-200 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100 transition-all duration-300 flex flex-col"
          >
            <div className="flex-1 relative overflow-hidden flex flex-col">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-100 rounded-full blur-3xl opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
              <div className="relative p-7 flex flex-col h-full">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center group-hover:bg-blue-100 group-hover:border-blue-200 transition-colors duration-300">
                  <CalendarDays className="w-6 h-6 text-blue-500" strokeWidth={1.5} />
                </div>
                <div className="mt-auto">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400 mb-2">Family Schedule</p>
                  <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Calendar</h2>
                  <p className="text-sm text-zinc-400 mt-1.5">Coordinate appointments, events, and routines across the whole family.</p>
                  <div className="flex items-center justify-between mt-6">
                    <span className="text-[11px] font-medium text-blue-500 bg-blue-50 border border-blue-100 rounded-full px-3 py-1">
                      Coming soon
                    </span>
                    <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-blue-500 transition-colors duration-300">
                      <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors duration-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-[3px] bg-gradient-to-r from-blue-300/0 via-blue-400 to-blue-300/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>

          {/* Budget */}
          <a
            href="https://budget.atlas-homevault.com"
            className="group rounded-3xl overflow-hidden bg-white border border-zinc-200 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-100 transition-all duration-300 flex flex-col"
          >
            <div className="flex-1 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-100 rounded-full blur-3xl opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
              <div className="relative p-7 h-full flex flex-col justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center group-hover:bg-emerald-100 group-hover:border-emerald-200 transition-colors duration-300">
                  <Wallet className="w-6 h-6 text-emerald-500" strokeWidth={1.5} />
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400 mb-2">Financial</p>
                    <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Budget</h2>
                    <p className="text-sm text-zinc-400 mt-1.5">Track spending and forecast savings.</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-emerald-500 transition-colors duration-300 mb-1">
                    <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors duration-300" />
                  </div>
                </div>
              </div>
            </div>
            <div className="h-[3px] bg-gradient-to-r from-emerald-300/0 via-emerald-400 to-emerald-300/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>

          {/* Baby */}
          <a
            href="https://baby.atlas-homevault.com"
            className="group rounded-3xl overflow-hidden bg-white border border-zinc-200 hover:border-pink-200 hover:shadow-xl hover:shadow-pink-100 transition-all duration-300 flex flex-col"
          >
            <div className="flex-1 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tl from-pink-50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-pink-100 rounded-full blur-3xl opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
              <div className="relative p-7 h-full flex flex-col justify-between">
                <div className="w-12 h-12 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center group-hover:bg-pink-100 group-hover:border-pink-200 transition-colors duration-300">
                  <Baby className="w-6 h-6 text-pink-500" strokeWidth={1.5} />
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400 mb-2">Milestones</p>
                    <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Baby</h2>
                    <p className="text-sm text-zinc-400 mt-1.5">Track growth and milestones ages 0–5.</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-pink-500 transition-colors duration-300 mb-1">
                    <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors duration-300" />
                  </div>
                </div>
              </div>
            </div>
            <div className="h-[3px] bg-gradient-to-r from-pink-300/0 via-pink-400 to-pink-300/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>

        </div>
      </main>
    </div>
  )
}
