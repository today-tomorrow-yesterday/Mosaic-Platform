import { currentUser } from "@clerk/nextjs/server"
import { UserButton } from "@clerk/nextjs"
import { Home, CalendarDays, Wallet, Baby, ArrowUpRight } from "lucide-react"
import { BeeSwarm } from "@/components/BeeSwarm"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function getDateString() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

export default async function DashboardPage() {
  const user = await currentUser()
  const firstName = user?.firstName ?? "there"

  return (
    <div className="min-h-screen bg-[var(--s-bg)] relative overflow-x-hidden">
      <BeeSwarm />

      {/* Ambient background glows — colors from season CSS vars */}
      <div className="fixed top-[-25vh] right-[-12vw] w-[65vw] h-[65vw] rounded-full bg-[var(--s-glow-a)] blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-30vh] left-[-12vw] w-[55vw] h-[55vw] rounded-full bg-[var(--s-glow-b)] blur-[100px] pointer-events-none" />
      <div className="fixed top-[40vh] left-[30vw] w-[30vw] h-[30vw] rounded-full bg-[var(--s-glow-c)] blur-[80px] pointer-events-none" />

      {/* Nav */}
      <header
        className="relative flex items-center justify-between px-10 pt-8 max-w-[1100px] mx-auto animate-fade-in"
        style={{ animationDelay: "0ms" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 flex items-center justify-center rounded-[10px] bg-[var(--s-logo-bg)]">
            <span className="font-display italic font-light text-base leading-none tracking-[-0.01em] text-[var(--s-logo-text)]">
              M
            </span>
          </div>
          <span className="font-body text-[14px] font-semibold tracking-tight text-[var(--s-text-primary)]">
            Mosaic
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-body text-[12px] text-zinc-400 tabular-nums">
            {getDateString()}
          </span>
          <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
        </div>
      </header>

      <main className="relative max-w-[1100px] mx-auto px-10 pt-12 pb-16">

        {/* Greeting */}
        <div className="mb-12">
          <div
            className="flex items-center gap-3 mb-5 animate-fade-up"
            style={{ animationDelay: "80ms" }}
          >
            <div className="w-7 h-px bg-[var(--s-accent)]" />
            <span
              className="font-body text-[11px] font-medium uppercase text-zinc-400"
              style={{ letterSpacing: "0.22em" }}
            >
              {getGreeting()}
            </span>
          </div>

          <h1
            className="font-display italic font-light animate-fade-up text-[var(--s-text-primary)]"
            style={{
              fontSize: "clamp(64px, 8.5vw, 104px)",
              lineHeight: 0.93,
              letterSpacing: "-0.028em",
              animationDelay: "140ms",
            }}
          >
            {firstName}
            <span className="text-[var(--s-accent)]">.</span>
          </h1>

          <p
            className="font-body text-[15px] text-zinc-500 mt-5 animate-fade-up"
            style={{ letterSpacing: "0.01em", animationDelay: "220ms" }}
          >
            Your world, at a glance.
          </p>
        </div>

        {/* Bento grid */}
        <div
          className="grid grid-cols-3 gap-3.5"
          style={{ gridTemplateRows: "284px 284px" }}
        >

          {/* Home — wide */}
          <a
            href={process.env.NEXT_PUBLIC_HOME_URL ?? "https://home.atlas-homevault.com"}
            className="group col-span-2 rounded-[24px] overflow-hidden border flex flex-col transition-all duration-300 hover:shadow-2xl animate-fade-up"
            style={{
              background: "#fffbf5",
              borderColor: "#ede7da",
              animationDelay: "300ms",
            }}
          >
            <div className="flex-1 relative overflow-hidden p-7">
              <div
                className="absolute top-0 right-0 pointer-events-none"
                style={{ width: 160, height: 160, overflow: "hidden", borderRadius: "0 24px 0 0" }}
              >
                <div
                  className="absolute rounded-full transition-all duration-500 group-hover:scale-110"
                  style={{ top: -55, right: -55, width: 190, height: 190, border: "22px solid #fed7aa", opacity: 0.45, transformOrigin: "center" }}
                />
                <div
                  className="absolute rounded-full transition-all duration-700 group-hover:scale-110"
                  style={{ top: -30, right: -30, width: 120, height: 120, border: "12px solid #fdba74", opacity: 0.25, transformOrigin: "center" }}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative h-full flex flex-col justify-between">
                <div
                  className="w-11 h-11 flex items-center justify-center transition-colors duration-300 group-hover:bg-orange-100"
                  style={{ borderRadius: "13px", background: "#fff0e6", border: "1px solid #fed7aa" }}
                >
                  <Home className="w-5 h-5 text-orange-500" strokeWidth={1.5} />
                </div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="font-body text-[10px] font-semibold uppercase text-zinc-400 mb-2" style={{ letterSpacing: "0.2em" }}>
                      Smart Home
                    </p>
                    <h2 className="font-display text-[#1a1208] leading-none" style={{ fontWeight: 500, fontSize: "38px", letterSpacing: "-0.02em" }}>
                      Home
                    </h2>
                    <p className="font-body text-[13px] text-zinc-500 mt-2 leading-relaxed" style={{ maxWidth: 268 }}>
                      Control devices, automations, and monitor every corner of your home.
                    </p>
                  </div>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mb-1 transition-colors duration-300 group-hover:bg-orange-500"
                    style={{ background: "#f0ece4" }}
                  >
                    <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors duration-300" />
                  </div>
                </div>
              </div>
            </div>
            <div className="h-[2px] bg-gradient-to-r from-orange-300/0 via-orange-400 to-orange-300/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>

          {/* Calendar — tall */}
          <a
            href={process.env.NEXT_PUBLIC_CALENDAR_URL ?? "https://calendar.atlas-homevault.com"}
            className="group row-span-2 rounded-[24px] overflow-hidden border flex flex-col transition-all duration-300 hover:shadow-2xl animate-fade-up"
            style={{ background: "#f5f7ff", borderColor: "#dde3f5", animationDelay: "360ms" }}
          >
            <div className="flex-1 relative overflow-hidden flex flex-col p-7">
              <div className="absolute top-5 right-5 pointer-events-none">
                <div className="grid gap-[7px] transition-opacity duration-300" style={{ gridTemplateColumns: "repeat(5, 1fr)", opacity: 0.18 }}>
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-[5px] h-[5px] rounded-full bg-blue-400 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ opacity: i % 3 === 0 ? 0.8 : 0.4 }}
                    />
                  ))}
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-blue-50/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex flex-col h-full">
                <div
                  className="w-11 h-11 flex items-center justify-center transition-colors duration-300 group-hover:bg-blue-100"
                  style={{ borderRadius: "13px", background: "#eef1ff", border: "1px solid #c7d2fe" }}
                >
                  <CalendarDays className="w-5 h-5 text-blue-500" strokeWidth={1.5} />
                </div>
                <div className="mt-auto">
                  <p className="font-body text-[10px] font-semibold uppercase text-zinc-400 mb-2" style={{ letterSpacing: "0.2em" }}>
                    Family Schedule
                  </p>
                  <h2 className="font-display text-[#1a1208] leading-none" style={{ fontWeight: 500, fontSize: "38px", letterSpacing: "-0.02em" }}>
                    Calendar
                  </h2>
                  <p className="font-body text-[13px] text-zinc-500 mt-2 leading-relaxed">
                    Coordinate appointments, events, and routines across the whole family.
                  </p>
                  <div className="flex items-center justify-between mt-6">
                    <span className="font-body text-[10px] font-medium text-blue-500 bg-blue-50 rounded-full px-3 py-1" style={{ border: "1px solid #bfdbfe" }}>
                      Coming soon
                    </span>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 group-hover:bg-blue-500"
                      style={{ background: "#eef1ff" }}
                    >
                      <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors duration-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-[2px] bg-gradient-to-r from-blue-300/0 via-blue-400 to-blue-300/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>

          {/* Budget */}
          <a
            href={process.env.NEXT_PUBLIC_BUDGET_URL ?? "https://budget.atlas-homevault.com"}
            className="group rounded-[24px] overflow-hidden border flex flex-col transition-all duration-300 hover:shadow-2xl animate-fade-up"
            style={{ background: "#f3fbf6", borderColor: "#d5edd8", animationDelay: "400ms" }}
          >
            <div className="flex-1 relative overflow-hidden p-7">
              <div className="absolute bottom-6 right-6 flex items-end gap-[5px] pointer-events-none transition-opacity duration-300 group-hover:opacity-50" style={{ opacity: 0.18 }}>
                {[28, 44, 34, 52, 40, 48, 36].map((h, i) => (
                  <div key={i} className="w-[7px] rounded-sm bg-emerald-500" style={{ height: h }} />
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-50/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative h-full flex flex-col justify-between">
                <div
                  className="w-11 h-11 flex items-center justify-center transition-colors duration-300 group-hover:bg-emerald-100"
                  style={{ borderRadius: "13px", background: "#edf8f1", border: "1px solid #a7f3d0" }}
                >
                  <Wallet className="w-5 h-5 text-emerald-500" strokeWidth={1.5} />
                </div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="font-body text-[10px] font-semibold uppercase text-zinc-400 mb-2" style={{ letterSpacing: "0.2em" }}>
                      Financial
                    </p>
                    <h2 className="font-display text-[#1a1208] leading-none" style={{ fontWeight: 500, fontSize: "38px", letterSpacing: "-0.02em" }}>
                      Budget
                    </h2>
                    <p className="font-body text-[13px] text-zinc-500 mt-2 leading-relaxed">
                      Track spending and forecast savings.
                    </p>
                  </div>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mb-1 transition-colors duration-300 group-hover:bg-emerald-500"
                    style={{ background: "#e2f5e8" }}
                  >
                    <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors duration-300" />
                  </div>
                </div>
              </div>
            </div>
            <div className="h-[2px] bg-gradient-to-r from-emerald-300/0 via-emerald-400 to-emerald-300/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>

          {/* Baby */}
          <a
            href={process.env.NEXT_PUBLIC_BABY_URL ?? "https://baby.atlas-homevault.com"}
            className="group rounded-[24px] overflow-hidden border flex flex-col transition-all duration-300 hover:shadow-2xl animate-fade-up"
            style={{ background: "#fff7fb", borderColor: "#f0d8e8", animationDelay: "440ms" }}
          >
            <div className="flex-1 relative overflow-hidden p-7">
              <div className="absolute top-4 right-4 pointer-events-none">
                <div className="w-14 h-14 rounded-full bg-pink-200/50 transition-colors duration-300 group-hover:bg-pink-200/70" />
                <div className="w-7 h-7 rounded-full bg-pink-300/30 transition-colors duration-300 group-hover:bg-pink-300/50" style={{ marginLeft: 36, marginTop: -10 }} />
                <div className="w-9 h-9 rounded-full bg-pink-200/35 transition-colors duration-300 group-hover:bg-pink-200/55" style={{ marginLeft: 16, marginTop: -6 }} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-tl from-pink-50/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative h-full flex flex-col justify-between">
                <div
                  className="w-11 h-11 flex items-center justify-center transition-colors duration-300 group-hover:bg-pink-100"
                  style={{ borderRadius: "13px", background: "#fff0f7", border: "1px solid #fbcfe8" }}
                >
                  <Baby className="w-5 h-5 text-pink-500" strokeWidth={1.5} />
                </div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="font-body text-[10px] font-semibold uppercase text-zinc-400 mb-2" style={{ letterSpacing: "0.2em" }}>
                      Milestones
                    </p>
                    <h2 className="font-display text-[#1a1208] leading-none" style={{ fontWeight: 500, fontSize: "38px", letterSpacing: "-0.02em" }}>
                      Baby
                    </h2>
                    <p className="font-body text-[13px] text-zinc-500 mt-2 leading-relaxed">
                      Track growth and milestones ages 0–5.
                    </p>
                  </div>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mb-1 transition-colors duration-300 group-hover:bg-pink-500"
                    style={{ background: "#fce8f3" }}
                  >
                    <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors duration-300" />
                  </div>
                </div>
              </div>
            </div>
            <div className="h-[2px] bg-gradient-to-r from-pink-300/0 via-pink-400 to-pink-300/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>

        </div>
      </main>
    </div>
  )
}
