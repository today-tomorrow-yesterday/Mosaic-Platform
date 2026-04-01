import { UserButton } from "@clerk/nextjs"
import { AppHeader } from "@mosaic/ui"
import type { LucideIcon } from "lucide-react"
import {
  Sofa,
  ChefHat,
  BedDouble,
  Monitor,
  Lightbulb,
  Tv2,
  Thermometer,
  Coffee,
} from "lucide-react"

type RoomStatus = "active" | "idle"
type DeviceState = "on" | "off" | "neutral"

const rooms: { name: string; devices: number; status: RoomStatus; Icon: LucideIcon }[] = [
  { name: "Living Room", devices: 3, status: "active", Icon: Sofa },
  { name: "Kitchen", devices: 2, status: "idle", Icon: ChefHat },
  { name: "Bedroom", devices: 2, status: "active", Icon: BedDouble },
  { name: "Office", devices: 1, status: "active", Icon: Monitor },
]

const devices: { name: string; display: string; state: DeviceState; Icon: LucideIcon }[] = [
  { name: "Living Room Light", display: "On", state: "on", Icon: Lightbulb },
  { name: "Smart TV", display: "Off", state: "off", Icon: Tv2 },
  { name: "Thermostat", display: "72°F", state: "neutral", Icon: Thermometer },
  { name: "Kitchen Light", display: "On", state: "on", Icon: Lightbulb },
  { name: "Coffee Maker", display: "Off", state: "off", Icon: Coffee },
]

const activeRooms = rooms.filter((r) => r.status === "active").length
const devicesOn = devices.filter((d) => d.state === "on").length

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "#f5f3ef" }}>
      <AppHeader
        name="Home"
        actions={<UserButton />}
        backHref={process.env.NEXT_PUBLIC_PLATFORM_URL ?? "https://atlas-homevault.com"}
      />

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-7">

        {/* Status bar — three-panel instrument display */}
        <section className="animate-fade-up" style={{ animationDelay: "0ms" }}>
          <div
            className="grid grid-cols-3 overflow-hidden rounded-2xl border"
            style={{ gap: "1px", background: "#e2ddd6", borderColor: "#e2ddd6" }}
          >
            {/* Rooms Active */}
            <div className="bg-[#f5f3ef] px-8 py-7 flex flex-col">
              <p
                className="font-heading text-[10px] font-semibold uppercase text-stone-400 mb-4"
                style={{ letterSpacing: "0.22em" }}
              >
                Rooms Active
              </p>
              <p className="font-mono text-[52px] font-medium leading-none text-stone-900">
                {activeRooms}
              </p>
              <div className="flex gap-1.5 mt-4">
                {rooms.map((r) => (
                  <div
                    key={r.name}
                    className="h-[3px] rounded-full flex-1"
                    style={{ background: r.status === "active" ? "#10b981" : "#d6d3d1" }}
                  />
                ))}
              </div>
              <p className="font-heading text-[11px] text-stone-400 mt-2">
                of {rooms.length} rooms
              </p>
            </div>

            {/* Temperature — hero center */}
            <div className="bg-white px-8 py-7 flex flex-col items-center justify-center relative overflow-hidden">
              {/* Concentric decorative rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="absolute rounded-full border-[40px]"
                  style={{ width: 260, height: 260, borderColor: "#fff7ed" }}
                />
                <div
                  className="absolute rounded-full border-[18px]"
                  style={{ width: 188, height: 188, borderColor: "#ffedd5" }}
                />
              </div>
              <div className="relative text-center">
                <p
                  className="font-heading text-[10px] font-semibold uppercase text-stone-400 mb-3"
                  style={{ letterSpacing: "0.22em" }}
                >
                  Temperature
                </p>
                <p className="font-mono leading-none text-orange-500" style={{ fontSize: 56, fontWeight: 500 }}>
                  72°
                </p>
                <p className="font-mono text-[13px] font-medium text-stone-400 mt-1">
                  Fahrenheit
                </p>
                <p className="font-heading text-[11px] font-semibold text-emerald-500 mt-2.5">
                  Comfortable
                </p>
              </div>
            </div>

            {/* Devices On */}
            <div className="bg-[#f5f3ef] px-8 py-7 flex flex-col">
              <p
                className="font-heading text-[10px] font-semibold uppercase text-stone-400 mb-4"
                style={{ letterSpacing: "0.22em" }}
              >
                Devices On
              </p>
              <p className="font-mono text-[52px] font-medium leading-none text-stone-900">
                {devicesOn}
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {devices.map((d) => (
                  <div
                    key={d.name}
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      background:
                        d.state === "on"
                          ? "#10b981"
                          : d.state === "neutral"
                            ? "#f97316"
                            : "#d6d3d1",
                    }}
                  />
                ))}
              </div>
              <p className="font-heading text-[11px] text-stone-400 mt-2">
                of {devices.length} total
              </p>
            </div>
          </div>
        </section>

        {/* Rooms + Devices */}
        <div className="grid grid-cols-5 gap-5">

          {/* Rooms — 3 cols wide */}
          <section className="col-span-3 animate-fade-up" style={{ animationDelay: "120ms" }}>
            <h2
              className="font-heading text-[10px] font-semibold uppercase text-stone-400 mb-3"
              style={{ letterSpacing: "0.22em" }}
            >
              Rooms
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {rooms.map((room) => {
                const Icon = room.Icon
                const isActive = room.status === "active"
                return (
                  <div
                    key={room.name}
                    className="relative bg-white rounded-2xl overflow-hidden border hover:shadow-md hover:-translate-y-px transition-all duration-200 cursor-pointer"
                    style={{ borderColor: "#e2ddd6" }}
                  >
                    {/* Left accent bar */}
                    <div
                      className="absolute left-0 inset-y-0 w-[3px]"
                      style={{ background: isActive ? "#10b981" : "#e2ddd6" }}
                    />

                    <div className="px-5 py-4 pl-6">
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{
                            background: isActive ? "#f0fdf4" : "#fafaf9",
                            border: `1px solid ${isActive ? "#bbf7d0" : "#e7e5e4"}`,
                          }}
                        >
                          <Icon
                            className="w-4 h-4"
                            style={{ color: isActive ? "#059669" : "#a8a29e" }}
                            strokeWidth={1.5}
                          />
                        </div>
                        {isActive && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                          </span>
                        )}
                      </div>

                      <p className="font-heading text-[14px] font-semibold text-stone-900 leading-snug">
                        {room.name}
                      </p>
                      <p className="font-mono text-[11px] text-stone-400 mt-0.5">
                        {String(room.devices).padStart(2, "0")}{" "}
                        {room.devices === 1 ? "device" : "devices"}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Devices — 2 cols wide */}
          <section className="col-span-2 animate-fade-up" style={{ animationDelay: "200ms" }}>
            <h2
              className="font-heading text-[10px] font-semibold uppercase text-stone-400 mb-3"
              style={{ letterSpacing: "0.22em" }}
            >
              Devices
            </h2>
            <div
              className="bg-white rounded-2xl border overflow-hidden"
              style={{ borderColor: "#e2ddd6" }}
            >
              {devices.map((device, i) => {
                const Icon = device.Icon
                const isOn = device.state === "on"
                const isNeutral = device.state === "neutral"
                return (
                  <div
                    key={device.name}
                    className="flex items-center gap-3 px-4 py-3.5"
                    style={{
                      borderBottom: i < devices.length - 1 ? "1px solid #f0ede8" : "none",
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isOn ? "#f0fdf4" : isNeutral ? "#fff7ed" : "#fafaf9",
                        border: `1px solid ${isOn ? "#bbf7d0" : isNeutral ? "#fed7aa" : "#e7e5e4"}`,
                      }}
                    >
                      <Icon
                        className="w-3.5 h-3.5"
                        style={{
                          color: isOn ? "#059669" : isNeutral ? "#ea580c" : "#a8a29e",
                        }}
                        strokeWidth={1.5}
                      />
                    </div>
                    <span className="font-heading text-[13px] font-medium text-stone-800 flex-1 min-w-0 truncate">
                      {device.name}
                    </span>
                    <span
                      className="font-mono text-[12px] font-medium tabular-nums flex-shrink-0"
                      style={{
                        color: isOn ? "#059669" : isNeutral ? "#ea580c" : "#a8a29e",
                      }}
                    >
                      {device.display}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}
