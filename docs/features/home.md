# Home

**App:** `apps/home`
**URL:** `home.atlas-homevault.com`
**Status:** Scaffolded — UI complete, backend not connected

## What It Is

The Home app is a smart home control panel. It shows the status of every room and device in the house — which rooms are active, which devices are on, and what the current temperature is — from a single dashboard. Eventually it will allow devices to be controlled directly from the interface.

## Intent

Smart home dashboards are typically either too complicated (Home Assistant) or too locked down (vendor apps). The Mosaic Home app aims to be a calm, read-first view of the home's state that also supports common controls. The aesthetic is inspired by analogue instrument panels — clear, purposeful, no decoration for its own sake.

The app is designed to connect to Home Assistant as its data source via a Convex backend that proxies Home Assistant's API. All automations and device logic live in Home Assistant; this app is purely a display and control interface.

## How to Use It

1. Navigate to `home.atlas-homevault.com` or tap the Home card on the platform dashboard
2. The status bar at the top shows rooms active, current temperature, and devices on
3. The left column shows a room-by-room breakdown — each room shows device count and active status
4. The right column shows a device-by-device list with on/off state and current values
5. (Planned) Tap a device to toggle it or adjust its value

## Features

### Status Bar

Three summary panels across the top of the page:

**Rooms Active** — A count of rooms that have at least one active device. Shows horizontal bar indicators for each room, colour-coded green (active) or grey (idle).

**Temperature** — The dominant centrepiece of the status bar. Shows the current thermostat reading in large type with a "Comfortable / Too warm / Too cold" status label. Surrounded by decorative concentric rings that echo the aesthetic of an analogue dial. The temperature is read from the thermostat device in the device list.

**Devices On** — A count of devices currently on. Shows a dot grid where each dot represents a device, coloured green (on) or grey (off).

### Rooms

A 2-column grid of room cards. Each card shows:

- Room icon (emoji or Lucide icon)
- Room name
- Number of devices in the room
- Active/idle status indicator with a left accent bar
- A green "ping" animation on the status dot when the room is active

Rooms: Living Room, Kitchen, Bedroom, Office.

### Devices

A vertical list of all devices. Each row shows:

- Device icon (Lucide)
- Device name and room
- Current state (On / Off / temperature reading)
- A colour-coded status indicator:
  - **Green** — On or active
  - **Grey** — Off or inactive
  - **Orange** — Neutral state (thermostat, neither on nor off)

Devices: Living Room Light, Smart TV, Thermostat, Kitchen Light, Coffee Maker.

## Technical Notes

- All data is currently hardcoded mock data
- The Convex backend needs to be built to proxy Home Assistant's REST API
- Device toggle actions will go through a Convex mutation that calls the Home Assistant API
- The Convex schema is empty — tables need to be defined for rooms, devices, and readings
- The `AppHeader` component from `@mosaic/ui` is used here, making this the most complete example of shared component usage in the codebase

## Planned Data Model

```
rooms table:
  name        string
  icon        string
  ownerId     string

devices table:
  roomId      id(rooms)
  name        string
  icon        string
  type        light | switch | thermostat | media | appliance
  haEntityId  string       (Home Assistant entity ID)
  ownerId     string

deviceReadings table:
  deviceId    id(devices)
  state       string       (on, off, or numeric value as string)
  unit        string       (optional — °F, %, etc.)
  recordedAt  number
```

## Planned: Home Assistant Integration

The intended architecture is:

1. A Convex HTTP action polls Home Assistant's `/api/states` endpoint on a schedule (every 30 seconds)
2. It writes current device states to `deviceReadings`
3. The UI subscribes to `deviceReadings` via Convex live queries — updates push to the browser automatically
4. Toggle/control actions call a Convex mutation that fires `POST /api/services/{domain}/{service}` to Home Assistant

This gives real-time device state without exposing the Home Assistant URL or token to the browser.

## Files

```
apps/home/src/
  app/
    page.tsx      Full page — status bar, rooms grid, devices list
    layout.tsx    Root layout — Clerk, Convex, fonts
  components/
    ConvexClientProvider.tsx
```
