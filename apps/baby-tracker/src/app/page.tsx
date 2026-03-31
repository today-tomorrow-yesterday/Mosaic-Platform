import { UserButton } from "@clerk/nextjs"
import { AppHeader, StatCard, Badge } from "@mosaic/ui"

const milestones = [
  { label: "First smile", date: "Jan 12", done: true },
  { label: "Holds head up", date: "Feb 3", done: true },
  { label: "Rolls over", date: "Feb 28", done: true },
  { label: "Sits without support", date: null, done: false },
  { label: "First foods", date: null, done: false },
]

const recentLogs = [
  { type: "Feed", note: "6 oz formula", time: "7:30 AM", badgeVariant: "blue" as const },
  { type: "Sleep", note: "2 hr nap", time: "10:00 AM", badgeVariant: "default" as const },
  { type: "Feed", note: "5 oz formula", time: "1:00 PM", badgeVariant: "blue" as const },
  { type: "Diaper", note: "Wet", time: "2:45 PM", badgeVariant: "orange" as const },
  { type: "Sleep", note: "45 min nap", time: "3:30 PM", badgeVariant: "default" as const },
]

export default function BabyPage() {
  return (
    <div className="min-h-screen bg-[#f4f4f5]">
      <AppHeader
        name="Baby"
        actions={<UserButton />}
        backHref={process.env.NEXT_PUBLIC_PLATFORM_URL ?? "https://atlas-homevault.com"}
      />

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Age" value="4 mo" accent="orange" />
          <StatCard label="Milestones" value="3 / 5" accent="green" />
          <StatCard label="Today's Feeds" value={3} accent="blue" />
        </div>

        {/* Milestones */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400 mb-3">
            Milestones
          </h2>
          <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100 overflow-hidden">
            {milestones.map(({ label, date, done }) => (
              <div key={label} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${done ? "bg-emerald-500" : "bg-zinc-200"}`} />
                  <span className={`text-sm font-medium ${done ? "text-zinc-900" : "text-zinc-400"}`}>
                    {label}
                  </span>
                </div>
                {date ? (
                  <span className="text-xs text-zinc-400 tabular-nums">{date}</span>
                ) : (
                  <Badge variant="default">Upcoming</Badge>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Today's Log */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400 mb-3">
            Today's Log
          </h2>
          <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100 overflow-hidden">
            {recentLogs.map((log, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <Badge variant={log.badgeVariant}>{log.type}</Badge>
                  <span className="text-sm text-zinc-700">{log.note}</span>
                </div>
                <span className="text-xs text-zinc-400 tabular-nums">{log.time}</span>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  )
}
