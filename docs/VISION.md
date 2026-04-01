# Mosaic — Platform Vision

## What Mosaic Is

Mosaic is a personal family operating system. It is the single place where a household manages its digital life — smart home, finances, schedules, health, and anything else a family needs — without each person needing to be a developer.

The core insight: every family has a different set of needs. No single app suite covers them all, and no non-technical person should have to stitch together and maintain software. Mosaic solves this by letting family members create, own, and iterate on their own apps through a conversational AI interface — and then live inside those apps alongside permanent first-party apps built to high standards.

---

## Two Kinds of Apps

### Permanent Apps
Built and maintained as full production applications. They have their own subdomain, their own Convex backend, their own design language, and are deployed as independent Next.js apps inside the Turborepo monorepo.

Current permanent apps:
- **Home** — smart home control and device automation
- **Budget** — household spending tracking and forecasting
- **Calendar** — family scheduling and shared routines
- **Baby** — child milestone and development tracking

Permanent apps live on the Mosaic landing page as full-color bento cards with direct navigation links.

### Prototype Apps (AI Studio)
Created by any family member through natural language conversation with an AI agent. The user describes what they want; the AI builds a working React application inside a sandboxed runtime. No code knowledge required.

Prototype apps:
- Live inside a sandboxed execution environment (iframe + in-browser transpiler)
- Can be iterated on indefinitely through the same AI chat interface
- Are visible to the family member who created them on the landing page
- Are visually distinct from permanent apps (shimmer border, "Prototype" label)
- Can be **promoted to permanent apps** when they prove valuable

---

## The AI Studio Experience

1. **Entry** — A "Build with AI" card on the landing page opens the Studio
2. **Conversation** — A split-pane interface: AI chat on the left, live preview on the right
3. **Building** — The AI generates React components; a Babel-compiled in-browser sandbox renders them in real time
4. **Iteration** — The user requests changes in plain language; the AI updates the code and the preview refreshes
5. **Saving** — The prototype is saved and appears as a card on the user's landing page
6. **Promotion** — When a prototype is ready, an owner can promote it to a permanent app with its own Convex backend and subdomain

---

## Multi-User Model

Each family member has their own Mosaic identity (via Clerk). The landing page is personalized:
- Greeting uses their first name
- Their own prototype apps appear on their dashboard
- Permanent apps are shared and always visible to everyone
- Future: per-user theming or layout preferences

---

## Infrastructure Strategy

| Layer | Technology | Notes |
|-------|-----------|-------|
| Hosting | Vercel | Each app deploys independently |
| Auth | Clerk | Shared across all apps via same publishable key |
| Database | Convex | One project per permanent app; prototypes share a sandbox project |
| Monorepo | Turborepo + pnpm | All apps and packages in one repo |
| Shared UI | `@mosaic/ui` | shadcn primitives + custom components |
| Shared data | `@mosaic/db` | BaseRepository → ConvexTranslator pattern |

### Subdomain Strategy (Permanent Apps)
```
atlas-homevault.com          → Platform (landing page)
home.atlas-homevault.com     → Home app
budget.atlas-homevault.com   → Budget app
calendar.atlas-homevault.com → Calendar app
baby.atlas-homevault.com     → Baby app
```

### Prototype App Strategy (To Be Decided)
Options under consideration:
- `proto-{slug}.atlas-homevault.com` per promoted prototype
- A shared `/apps/{slug}` route on the platform
- Serverless functions per prototype with their own Convex schema

---

## Design Philosophy

- **Seasonal** — the platform adapts its visual identity to the calendar (season/holiday)
- **Personal** — greets by name, remembers preferences, feels like a family space not an enterprise tool
- **Calm** — motion is intentional (bee swarm, card hover, seasonal honeycomb), not noise
- **No dark mode** — the platform is warm and light, like a home
