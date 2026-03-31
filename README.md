# Mosaic Platform

A personal AI-powered application platform for managing home, family, and lifestyle — all under one roof at [atlas-homevault.com](https://atlas-homevault.com).

## Apps

| App | Domain | Description |
|---|---|---|
| **Platform** | atlas-homevault.com | Central dashboard — access all apps from one place |
| **Budget** | budget.atlas-homevault.com | Financial tracking, subscriptions, savings projections |
| **Calendar** | calendar.atlas-homevault.com | Family lifestyle calendar — schedules, maintenance, hobbies |
| **Baby Tracker** | baby.atlas-homevault.com | Milestone tracking and recommendations for ages 1–5 |
| **Home** | home.atlas-homevault.com | Smart home controls via Home Assistant |

## Tech Stack

- **Monorepo** — Turborepo + pnpm workspaces
- **Frontend** — Next.js 15, TypeScript, Tailwind CSS
- **Backend** — Convex (one project per app)
- **Auth** — Clerk (shared across all apps via root domain)
- **UI** — Shared component library in `packages/ui`
- **Data Layer** — Provider-agnostic query pattern in `packages/db`
- **Infrastructure** — Terraform (Cloudflare DNS + Vercel deployments)
- **CI/CD** — GitHub Actions

## Architecture

Each app is independently deployed but shares common packages:

```
Mosaic-Platform/
  apps/
    platform/        → atlas-homevault.com
    budget/          → budget.atlas-homevault.com
    calendar/        → calendar.atlas-homevault.com
    baby-tracker/    → baby.atlas-homevault.com
    home/            → home.atlas-homevault.com
  packages/
    db/              → IQueryable, ITranslator, DbSet, BaseRepository
    ui/              → Shared components (Button, Card, etc.)
    config/          → Shared tsconfig and Tailwind config
  terraform/         → Infrastructure as code
```

### Data Layer

All database access goes through a provider-agnostic query layer. Components never touch Convex directly.

```
Convex Function
  → Repository (extends BaseRepository)
    → DbSet (fluent query builder)
      → IQueryable (pure data, no dependencies)
        → ConvexTranslator (only file that knows about ctx.db)
          → Convex DB
```

Swapping Convex for another database means rewriting only `ConvexTranslator`.

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- Convex account
- Clerk account

### Setup

1. Clone the repo
   ```bash
   git clone https://github.com/today-tomorrow-yesterday/Mosaic-Platform
   cd Mosaic-Platform
   pnpm install
   ```

2. Copy env files and fill in values
   ```bash
   cp apps/platform/.env.example apps/platform/.env.local
   ```

3. Start the platform app
   ```bash
   cd apps/platform
   npx convex dev   # first run — deploys schema and auth config
   pnpm dev
   ```

### Dev Workflow

Run a single app from the repo root:

| Command | App | Port |
|---|---|---|
| `pnpm dev` | Platform | 3000 |
| `pnpm dev:budget` | Budget | 3001 |
| `pnpm dev:calendar` | Calendar | 3002 |
| `pnpm dev:baby-tracker` | Baby Tracker | 3003 |
| `pnpm dev:home` | Home | 3004 |
| `pnpm dev:all` | All apps | — |

Or run from inside an app directory:
```bash
cd apps/budget
pnpm dev
```

> Each app runs its own Convex watcher alongside Next.js. Run `npx convex dev` once per app directory the first time to link it to a Convex project.

### Linking a New App to Convex

Each app needs its own Convex project (for isolation). One-time setup per app:

1. Create a new project at [dashboard.convex.dev](https://dashboard.convex.dev)
2. From the app directory, run `npx convex dev` — it will prompt you to link the project and write `CONVEX_DEPLOYMENT` to `.env.local`
3. Set `CLERK_ISSUER_URL` in the Convex dashboard under **Settings → Environment Variables**

### Environment Variables (per app)

```env
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

Set `CLERK_ISSUER_URL` in your Convex project dashboard under **Settings → Environment Variables**.

## Infrastructure

Terraform manages DNS and Vercel projects. Add secrets to GitHub and infrastructure provisions automatically on merge to `main`.

**Required GitHub secrets:**
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ZONE_ID`
- `VERCEL_API_TOKEN`
- `ROOT_DOMAIN`

## Adding a New App

1. Create folder under `apps/your-app/`
2. Follow the vertical slice pattern in `apps/platform/convex/`
3. Create a new Convex project for the app
4. Add a module block in `terraform/main.tf`
5. Push — Terraform provisions the subdomain and Vercel project automatically
