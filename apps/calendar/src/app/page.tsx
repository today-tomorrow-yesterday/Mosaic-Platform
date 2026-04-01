import { UserButton } from "@clerk/nextjs"

type WeekDay = {
  day: string
  date: string
  event: string | null
  time: string | null
  isToday: boolean
}

type UpcomingEvent = {
  date: string
  title: string
  category: string
  color: string
}

const thisWeek: WeekDay[] = [
  { day: "Mon", date: "Mar 31", event: "Doctor's appointment", time: "2:00 PM",  isToday: true  },
  { day: "Tue", date: "Apr 1",  event: "Grocery pickup",       time: "10:00 AM", isToday: false },
  { day: "Wed", date: "Apr 2",  event: "Soccer practice",      time: "6:00 PM",  isToday: false },
  { day: "Thu", date: "Apr 3",  event: null,                   time: null,       isToday: false },
  { day: "Fri", date: "Apr 4",  event: "Date night",           time: "7:00 PM",  isToday: false },
]

const upcoming: UpcomingEvent[] = [
  { date: "Apr 10", title: "Dentist",           category: "Health",      color: "#5f8ab5" },
  { date: "Apr 15", title: "Car oil change",    category: "Maintenance", color: "#b5704a" },
  { date: "Apr 20", title: "Family dinner",     category: "Personal",    color: "#5a8a5a" },
  { date: "Apr 28", title: "Insurance renewal", category: "Bills",       color: "#b54a4a" },
]

export default function CalendarPage() {
  return (
    <div className="min-h-screen relative" style={{ background: "#f0ebe0" }}>

      {/* ── SVG sketch filter definition ── */}
      <svg
        style={{ display: "none", position: "absolute" }}
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="sketchy">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.035"
              numOctaves="5"
              seed="7"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="3.5"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* ── Paper grain texture overlay ── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")",
          opacity: 0.055,
        }}
      />

      {/* ── Sketch-style nav ── */}
      <header
        className="relative max-w-4xl mx-auto px-8 pt-7 pb-2 flex items-center justify-between animate-fade-in"
      >
        <div className="flex items-center gap-2">
          <a
            href={process.env.NEXT_PUBLIC_PLATFORM_URL ?? "https://atlas-homevault.com"}
            className="font-sketch text-[16px] text-[#8c8070] hover:text-[#1a1410] transition-colors"
          >
            ← Mosaic
          </a>
          <span className="font-sketch text-[#c4b8a0] text-xl mx-1">·</span>
          <span className="font-sketch text-[16px] font-semibold text-[#1a1410]">
            Calendar
          </span>
        </div>
        <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
      </header>

      <main className="relative max-w-4xl mx-auto px-8 pb-20">

        {/* ── Page title ── */}
        <div
          className="mt-6 mb-10 animate-fade-up"
          style={{ animationDelay: "40ms" }}
        >
          <p className="font-sketch text-[15px] text-[#8c8070] mb-0.5">
            March — April 2026
          </p>
          <h1
            className="font-sketch font-bold text-[#1a1410] leading-none"
            style={{ fontSize: "clamp(60px, 10vw, 88px)", letterSpacing: "-0.01em" }}
          >
            Calendar
          </h1>
          <p className="font-sketch text-[20px] text-[#8c8070] italic mt-2">
            4 events this week · 9 this month
          </p>
        </div>

        {/* ── Sketchy rule ── */}
        <div
          className="mb-10 animate-fade-up"
          style={{ animationDelay: "100ms", filter: "url(#sketchy)" }}
        >
          <div
            style={{
              height: 2,
              background: "#1a1410",
              borderRadius: 4,
            }}
          />
        </div>

        {/* ── This Week ── */}
        <section
          className="mb-12 animate-fade-up"
          style={{ animationDelay: "160ms" }}
        >
          <h2 className="font-sketch font-bold text-[30px] text-[#1a1410] mb-5">
            this week →
          </h2>

          <div className="grid grid-cols-5 gap-3">
            {thisWeek.map(({ day, date, event, time, isToday }) => {
              const dateNum = date.split(" ")[1]
              const cardBg = isToday ? "#fef9e7" : "#faf7f2"
              const borderColor = isToday ? "#d97706" : "#1a1410"

              return (
                <div key={date} className="relative">
                  {/* Sketchy card background */}
                  <div
                    className="absolute inset-0 rounded-xl border-2"
                    style={{
                      background: cardBg,
                      borderColor,
                      filter: "url(#sketchy)",
                    }}
                  />

                  {/* Card content — unfiltered for crisp text */}
                  <div className="relative px-3 py-4 min-h-[148px] flex flex-col">

                    {/* Day label */}
                    <p
                      className="font-sketch font-bold text-[11px] uppercase text-[#8c8070]"
                      style={{ letterSpacing: "0.14em" }}
                    >
                      {day}
                    </p>

                    {/* Date number */}
                    <p
                      className="font-sketch font-bold leading-none mt-0.5 mb-2"
                      style={{
                        fontSize: 42,
                        color: isToday ? "#d97706" : "#1a1410",
                      }}
                    >
                      {dateNum}
                    </p>

                    {/* Today tag */}
                    {isToday && (
                      <p
                        className="font-sketch font-bold uppercase text-[9px] text-amber-600 mb-1"
                        style={{ letterSpacing: "0.2em" }}
                      >
                        today
                      </p>
                    )}

                    {/* Event or free */}
                    {event ? (
                      <>
                        <p className="font-sketch text-[13px] font-semibold text-[#1a1410] leading-snug flex-1">
                          {event}
                        </p>
                        <p className="font-sketch text-[12px] text-[#8c8070] mt-1">
                          {time}
                        </p>
                      </>
                    ) : (
                      <p className="font-sketch text-[14px] text-[#c4b8a0] italic flex-1">
                        free —
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Upcoming ── */}
        <section
          className="mb-12 animate-fade-up"
          style={{ animationDelay: "280ms" }}
        >
          <h2 className="font-sketch font-bold text-[30px] text-[#1a1410] mb-5">
            coming up →
          </h2>

          <div className="relative">
            {/* Sketchy card background */}
            <div
              className="absolute inset-0 rounded-2xl border-2"
              style={{
                background: "#faf7f2",
                borderColor: "#1a1410",
                filter: "url(#sketchy)",
              }}
            />

            {/* List content */}
            <div className="relative">
              {upcoming.map(({ date, title, category, color }, i) => (
                <div
                  key={date}
                  className="flex items-center gap-5 px-6 py-4"
                  style={{
                    borderBottom:
                      i < upcoming.length - 1
                        ? "1px dashed #c4b8a0"
                        : "none",
                  }}
                >
                  {/* Ink-dot category color */}
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: color }}
                  />

                  {/* Date */}
                  <span
                    className="font-sketch text-[16px] font-bold text-[#8c8070] flex-shrink-0 tabular-nums"
                    style={{ minWidth: 60 }}
                  >
                    {date}
                  </span>

                  {/* Title */}
                  <span className="font-sketch text-[18px] font-semibold text-[#1a1410] flex-1">
                    {title}
                  </span>

                  {/* Category — margin-note style */}
                  <span className="font-sketch text-[15px] text-[#8c8070] italic flex-shrink-0">
                    {category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats — annotation strip ── */}
        <div
          className="animate-fade-up"
          style={{ animationDelay: "380ms" }}
        >
          <div className="relative">
            <div
              className="absolute inset-0 rounded-xl border"
              style={{
                background: "#faf7f2",
                borderColor: "#c4b8a0",
                borderStyle: "dashed",
                filter: "url(#sketchy)",
              }}
            />
            <div className="relative flex items-center px-2">
              <div className="flex-1 px-6 py-5 text-center">
                <p className="font-sketch font-bold text-[52px] leading-none text-[#1a1410]">4</p>
                <p className="font-sketch text-[14px] text-[#8c8070] italic mt-1">
                  events this week
                </p>
              </div>
              <div
                className="self-stretch"
                style={{ width: 1, background: "#c4b8a0" }}
              />
              <div className="flex-1 px-6 py-5 text-center">
                <p className="font-sketch font-bold text-[52px] leading-none text-[#1a1410]">9</p>
                <p className="font-sketch text-[14px] text-[#8c8070] italic mt-1">
                  events this month
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer doodles ── */}
        <div
          className="mt-16 flex items-center justify-center gap-4 animate-fade-in"
          style={{ animationDelay: "500ms" }}
        >
          <span className="font-sketch text-[28px] text-[#c4b8a0]">✦</span>
          <span className="font-sketch text-[18px] text-[#c4b8a0] tracking-widest">· · ·</span>
          <span className="font-sketch text-[28px] text-[#c4b8a0]">✦</span>
        </div>
      </main>
    </div>
  )
}
