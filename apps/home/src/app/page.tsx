import { UserButton } from "@clerk/nextjs"
import { AppHeader, StatCard, Badge } from "@mosaic/ui"

const rooms = [
  { name: "Living Room", devices: 3, status: "active" as const },
  { name: "Kitchen", devices: 2, status: "idle" as const },
  { name: "Bedroom", devices: 2, status: "active" as const },
  { name: "Office", devices: 1, status: "active" as const },
]

const devices = [
  { name: "Living Room Light", display: "On", dot: "green" as const },
  { name: "Smart TV", display: "Off", dot: "gray" as const },
  { name: "Thermostat", display: "72°F", dot: null },
  { name: "Kitchen Light", display: "On", dot: "green" as const },
  { name: "Coffee Maker", display: "Off", dot: "gray" as const },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f4f4f5]">
      <AppHeader name="Home" actions={<UserButton />} backHref={process.env.NEXT_PUBLIC_PLATFORM_URL ?? "https://atlas-homevault.com"} />

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Stat Cards */}
        <section>
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Rooms Active" value={3} accent="green" />
            <StatCard label="Devices On" value={5} accent="blue" />
            <StatCard label="Temp" value="72°F" accent="orange" />
          </div>
        </section>

        {/* Rooms Grid */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-400 mb-3">
            Rooms
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {rooms.map((room) => (
              <div
                key={room.name}
                className="bg-white rounded-2xl border border-zinc-200 px-5 py-4 flex items-start justify-between"
              >
                <div>
                  <p className="font-semibold text-[15px] text-zinc-900 mb-1">{room.name}</p>
                  <p className="text-xs text-zinc-400">
                    {room.devices} {room.devices === 1 ? "device" : "devices"}
                  </p>
                </div>
                <Badge variant={room.status === "active" ? "green" : "default"}>
                  {room.status === "active" ? "Active" : "Idle"}
                </Badge>
              </div>
            ))}
          </div>
        </section>

        {/* Devices List */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-400 mb-3">
            Devices
          </h2>
          <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100">
            {devices.map((device) => (
              <div
                key={device.name}
                className="flex items-center justify-between px-5 py-3.5"
              >
                <span className="text-sm font-medium text-zinc-800">{device.name}</span>
                <div className="flex items-center gap-2">
                  {device.dot === "green" && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  )}
                  {device.dot === "gray" && (
                    <span className="w-2 h-2 rounded-full bg-zinc-300 flex-shrink-0" />
                  )}
                  <span className="text-sm text-zinc-500">{device.display}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
