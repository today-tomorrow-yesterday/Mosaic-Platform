import { UserButton } from "@clerk/nextjs"
import { AppHeader, StatCard, Badge } from "@mosaic/ui"

const thisWeek = [
  { day: "Mon", date: "Mar 31", event: "Doctor's appointment", time: "2:00 PM", isToday: true },
  { day: "Tue", date: "Apr 1",  event: "Grocery pickup",       time: "10:00 AM", isToday: false },
  { day: "Wed", date: "Apr 2",  event: "Soccer practice",      time: "6:00 PM",  isToday: false },
  { day: "Thu", date: "Apr 3",  event: null,                   time: null,       isToday: false },
  { day: "Fri", date: "Apr 4",  event: "Date night",           time: "7:00 PM",  isToday: false },
]

const upcoming = [
  { date: "Apr 10", title: "Dentist",            badgeVariant: "blue"    as const, badgeLabel: "Health" },
  { date: "Apr 15", title: "Car oil change",     badgeVariant: "orange"  as const, badgeLabel: "Maintenance" },
  { date: "Apr 20", title: "Family dinner",      badgeVariant: "default" as const, badgeLabel: "Personal" },
  { date: "Apr 28", title: "Insurance renewal",  badgeVariant: "red"     as const, badgeLabel: "Bills" },
]

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-[#f4f4f5]">
      <AppHeader name="Calendar" actions={<UserButton />} />

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
          <StatCard label="This Week"  value={4} sub="4 of 5 days have events" accent="blue" />
          <StatCard label="This Month" value={9} sub="March – April 2026" />
        </div>

        {/* This Week */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400 mb-3">
            This Week
          </h2>
          <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100 overflow-hidden">
            {thisWeek.map(({ day, date, event, time, isToday }) => (
              <div
                key={date}
                className={`flex items-center justify-between px-5 py-3.5 ${
                  isToday ? "border-l-4 border-l-blue-500 pl-4" : ""
                }`}
              >
                {/* Left: day label + date */}
                <div className="flex items-center gap-3 min-w-[90px]">
                  <span
                    className={`text-xs font-semibold uppercase tracking-wide w-8 ${
                      isToday ? "text-blue-600" : "text-zinc-400"
                    }`}
                  >
                    {day}
                  </span>
                  <span
                    className={`text-sm ${
                      isToday ? "font-semibold text-blue-600" : "text-zinc-500"
                    }`}
                  >
                    {date}
                  </span>
                </div>

                {/* Right: event + time */}
                {event ? (
                  <div className="flex items-center gap-3 text-right">
                    <span className={`text-sm font-medium ${isToday ? "text-zinc-900" : "text-zinc-700"}`}>
                      {event}
                    </span>
                    <span className="text-xs text-zinc-400 tabular-nums">{time}</span>
                  </div>
                ) : (
                  <span className="text-sm text-zinc-300 italic">Free day</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Upcoming */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400 mb-3">
            Upcoming
          </h2>
          <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100 overflow-hidden">
            {upcoming.map(({ date, title, badgeVariant, badgeLabel }) => (
              <div key={date} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium text-zinc-400 tabular-nums w-14">{date}</span>
                  <span className="text-sm font-medium text-zinc-800">{title}</span>
                </div>
                <Badge variant={badgeVariant}>{badgeLabel}</Badge>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  )
}
