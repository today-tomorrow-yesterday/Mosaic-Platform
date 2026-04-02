# Mosaic Platform — Feature Documentation

Mosaic is a personal home platform living at `atlas-homevault.com`. It is a family of interconnected apps that share a common identity, design language, and authentication layer. Each app is independently deployed but unified through the platform dashboard.

## Feature Index

| Feature | Path | Status | Domain |
|---------|------|--------|--------|
| [Platform Dashboard](./platform-dashboard.md) | `apps/platform` | Live | atlas-homevault.com |
| [AI Studio](./ai-studio.md) | `apps/platform/studio` | In Development | atlas-homevault.com/studio |
| [Budget](./budget.md) | `apps/budget` | Scaffolded | budget.atlas-homevault.com |
| [Calendar](./calendar.md) | `apps/calendar` | Scaffolded | calendar.atlas-homevault.com |
| [Home](./home.md) | `apps/home` | Scaffolded | home.atlas-homevault.com |
| [Baby Tracker](./baby-tracker.md) | `apps/baby-tracker` | Scaffolded | baby.atlas-homevault.com |
| [Shared Packages](./shared-packages.md) | `packages/` | Partial | — |

## Architecture in One Paragraph

Every app is a Next.js 15 App Router application using Clerk for auth and Convex for its backend. They share a UI component library (`@mosaic/ui`) and a data-access layer (`@mosaic/db`) through pnpm workspaces. The platform dashboard is the front door — it links out to every permanent app and hosts the AI Studio prototype builder. No app imports from another app; shared code lives in `packages/` only.

## Status Key

| Status | Meaning |
|--------|---------|
| **Live** | Deployed, real data, real users |
| **In Development** | Feature exists, actively being built |
| **Scaffolded** | UI complete with mock data, backend not yet connected |
| **Planned** | Documented intent, no code yet |
