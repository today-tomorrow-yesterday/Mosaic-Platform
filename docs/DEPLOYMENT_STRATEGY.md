# Mosaic Platform — Deployment Strategy

> **Last updated:** 2026-04-06 (reviewed + corrected by 5-agent audit)  
> **Scope:** Platform shell, mini-apps, Studio mode, user-deployed apps

---

## Table of Contents

1. [Current State](#1-current-state)
2. [Core Deployment Architecture](#2-core-deployment-architecture)
3. [Domain & DNS Strategy](#3-domain--dns-strategy)
4. [Authentication Across All Apps](#4-authentication-across-all-apps)
5. [Convex Backend Strategy](#5-convex-backend-strategy)
6. [Turborepo Build & CI/CD](#6-turborepo-build--cicd)
7. [Studio Mode Architecture](#7-studio-mode-architecture)
8. [The App Lifecycle: Idea → Production](#8-the-app-lifecycle-idea--production)
9. [Cost Planning](#9-cost-planning)
10. [Phased Roadmap](#10-phased-roadmap)

---

## 1. Current State

### What Exists

The Mosaic Platform is a Turborepo monorepo (`pnpm` workspaces) containing five independently deployable Next.js 15 apps and three shared packages.

| App | Domain | Status |
|-----|--------|--------|
| `apps/platform` | `atlas-homevault.com` | Active — dashboard, Studio mode kanban, AI generate API |
| `apps/budget` | `budget.atlas-homevault.com` | Scaffolded — placeholder UI, no DB |
| `apps/calendar` | `calendar.atlas-homevault.com` | Scaffolded — placeholder UI, no DB |
| `apps/home` | `home.atlas-homevault.com` | Scaffolded — placeholder UI, no DB |
| `apps/baby-tracker` | `baby.atlas-homevault.com` | Scaffolded — placeholder UI, no DB |

| Package | Purpose |
|---------|---------|
| `@mosaic/ui` | Shared components (AppHeader, StatCard, Badge, shadcn primitives) |
| `@mosaic/db` | Provider-agnostic data layer (BaseRepository → ConvexTranslator) |
| `@mosaic/config` | Shared Tailwind + TypeScript configs |

### What's Already Wired
- **Terraform** provisions all five Vercel projects + Cloudflare DNS CNAME records
- **GitHub Actions** runs `typecheck` + `lint` on PRs and applies Terraform on merge to main
- **Clerk** integrated in all five apps (same publishable key, same instance)
- **Convex** deployed per-app with separate projects; platform has a real `prototypeApps` schema
- **AI generate route** (`/api/studio/generate`) streams Claude Opus responses as JSX

### What's Missing
- Studio app code is generated but not persisted (no save/resume)
- Generated code has no live preview (no sandbox)
- Mini-app Convex schemas are empty stubs — no real data yet
- No deployment pipeline for Studio-created apps
- `turbo.json` does not declare env vars in build tasks (cache poisoning risk)
- Clerk satellite domain config not yet applied to mini-apps

---

## 2. Core Deployment Architecture

### One Vercel Project Per App

Each app in `apps/` has its own Vercel project, all linked to the **same GitHub repository**. This is Vercel's native monorepo support. The Terraform module already provisions this correctly.

```
GitHub Repo (one)
├── Vercel Project: mosaic-platform  (Root Dir: apps/platform)
├── Vercel Project: mosaic-budget    (Root Dir: apps/budget)
├── Vercel Project: mosaic-calendar  (Root Dir: apps/calendar)
├── Vercel Project: mosaic-home      (Root Dir: apps/home)
└── Vercel Project: mosaic-baby      (Root Dir: apps/baby-tracker)
```

**Build command for each:** `turbo build` — Vercel infers the workspace filter from Root Directory automatically. No `--filter` flag needed.

**Required env var on every project:** `ENABLE_EXPERIMENTAL_COREPACK=1` — ensures the exact `pnpm@9.0.0` from root `package.json` is used.

**Plan requirement:** Vercel Hobby (free) is sufficient for a personal project. The Hobby plan allows 10 active projects per account — more than enough for the 5 core apps, plus early Studio-deployed apps. Upgrade to Pro ($20/month) only if you exceed 10 projects or need team collaboration features.

### turbo.json — Required Fix

The current `turbo.json` does not declare `NEXT_PUBLIC_*` env vars in the build task. Turborepo will serve a cached build artifact even when `NEXT_PUBLIC_CONVEX_URL` is different per app, which can cause the wrong Convex URL to be embedded in a build. Add per-app overrides:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"],
      "env": ["NODE_ENV"]
    },
    "platform#build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [".next/**", "!.next/cache/**"],
      "env": ["NEXT_PUBLIC_CONVEX_URL", "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"]
    },
    "budget#build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [".next/**", "!.next/cache/**"],
      "env": ["NEXT_PUBLIC_CONVEX_URL", "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"]
    }
  }
}
```
_(Repeat `#build` overrides for calendar, home, baby-tracker — include `inputs` on each.)_

> **Note:** `app#build` overrides in the root `turbo.json` are **complete replacements** — nothing is inherited from the base `build` task. Always re-declare `inputs`, `outputs`, `dependsOn`, and `env` explicitly on every override.

---

## 3. Domain & DNS Strategy

All five apps are subdomains of `atlas-homevault.com`. DNS is managed by Cloudflare via Terraform.

| App | Domain | DNS Record |
|-----|--------|-----------|
| platform | `atlas-homevault.com` | `A 76.76.21.21` |
| budget | `budget.atlas-homevault.com` | `CNAME cname.vercel-dns.com` |
| calendar | `calendar.atlas-homevault.com` | `CNAME cname.vercel-dns.com` |
| home | `home.atlas-homevault.com` | `CNAME cname.vercel-dns.com` |
| baby-tracker | `baby.atlas-homevault.com` | `CNAME cname.vercel-dns.com` |
| Clerk auth | `clerk.atlas-homevault.com` | `CNAME <instance-specific>` — value from Clerk Dashboard |

**Important:** The `clerk.atlas-homevault.com` CNAME target is **instance-specific** — it is not `frontend-api.clerk.dev`. Get the exact CNAME target value from the Clerk Dashboard under **Domains → Production → DNS Records**. Add it in both Cloudflare (DNS) and confirm it in the Clerk dashboard. This unlocks production Clerk auth for the root domain and all subdomains.

### Studio-Deployed Apps

Apps deployed through Studio mode get subdomains under a dedicated zone:

```
my-kanban-app.apps.atlas-homevault.com
```

This keeps Studio-deployed apps visually distinct from the core Mosaic apps and avoids naming conflicts.

**DNS strategy: one CNAME per deployed app (not a wildcard).** A single wildcard CNAME (`*.apps.atlas-homevault.com → cname.vercel-dns.com`) does not work with Vercel + Cloudflare because:
1. Vercel requires nameserver delegation (not a CNAME) to verify wildcard domains.
2. A wildcard CNAME would route all Studio subdomains to the same Vercel project — incompatible with the per-app Vercel project model.

The correct approach is to assign each subdomain individually via the **Vercel API** at deploy time:

```ts
// After creating the Vercel project for a Studio app:
await vercel.projects.addDomain({
  idOrName: project.id,
  requestBody: { name: `${appSlug}.apps.atlas-homevault.com` }
})
// Then add a matching CNAME in Cloudflare via Terraform or the Cloudflare API
```

Cloudflare then gets one CNAME record per deployed Studio app pointing to that project's Vercel CNAME endpoint. This is done programmatically during the deploy pipeline — no manual DNS work required.

### Cross-App Links

Each app reads its sibling URLs from env vars. These should be set in each Vercel project and in each app's `.env.local`:

```env
NEXT_PUBLIC_PLATFORM_URL=https://atlas-homevault.com
NEXT_PUBLIC_BUDGET_URL=https://budget.atlas-homevault.com
NEXT_PUBLIC_CALENDAR_URL=https://calendar.atlas-homevault.com
NEXT_PUBLIC_HOME_URL=https://home.atlas-homevault.com
NEXT_PUBLIC_BABY_URL=https://baby.atlas-homevault.com
```

---

## 4. Authentication Across All Apps

### Architecture: One Clerk Instance, Shared Root Domain

All Mosaic apps share **one Clerk application instance** (same publishable key + secret key). Because every app is a subdomain of `atlas-homevault.com`, Clerk's session cookie is automatically scoped to `.atlas-homevault.com` by the browser and sent to all subdomains.

**This works on Clerk's free tier — no satellite domain configuration required.** Satellite domains are a paid feature for linking completely different root domains (e.g., `myapp.com` + `myapp-admin.io`). For `*.atlas-homevault.com`, same-domain cookie scoping handles session sharing automatically.

The only production requirement is a DNS CNAME for Clerk's Frontend API proxy at your root domain (free — see Section 3).

### Configuration: All Apps

Every app (platform + mini-apps + Studio-deployed apps) uses the **same two env vars**:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...   # same value in every app
CLERK_SECRET_KEY=sk_live_...                     # same value in every app
```

No satellite domain props, no `isSatellite` flags, no `allowedRedirectOrigins`. Standard `<ClerkProvider>` and `clerkMiddleware()` usage is all that's needed.

Sign-in/up pages live on the platform (`atlas-homevault.com/sign-in`) and all mini-apps point there:

```env
NEXT_PUBLIC_CLERK_SIGN_IN_URL=https://atlas-homevault.com/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=https://atlas-homevault.com/sign-up
```

### Studio-Deployed Apps

Every Studio app deployed to production uses the same Clerk publishable key — no additional config, no additional cost. They share the session cookie that's already set on `.atlas-homevault.com`.

---

## 5. Convex Backend Strategy

### Current Model: One Convex Project Per App

Each of the five apps has its own independent Convex project. This is correct and should be maintained. It provides:
- True data isolation between apps
- Independent schema evolution
- Separate Convex dashboards and function logs

### Env Var Per Project

Each app has its own `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_DEPLOY_KEY`. In CI/CD (Vercel + GitHub Actions), name them with an app prefix to avoid collisions:

```
PLATFORM_CONVEX_DEPLOY_KEY
BUDGET_CONVEX_DEPLOY_KEY
CALENDAR_CONVEX_DEPLOY_KEY
HOME_CONVEX_DEPLOY_KEY
BABY_CONVEX_DEPLOY_KEY
```

### Deploying Convex in CI

Each Convex project deploys independently via its own deploy key:

```bash
# In GitHub Actions, per-app step
cd apps/platform && CONVEX_DEPLOY_KEY=$PLATFORM_CONVEX_DEPLOY_KEY npx convex deploy
```

Convex deployments are triggered automatically by Vercel builds — the Vercel + Convex integration injects the deploy key. For apps where you run the deploy manually in CI, add a step after the Next.js build step.

### Studio Apps: Two-Tier Data Strategy

| Phase | Data Location | Rationale |
|-------|--------------|-----------|
| Draft / iteration | Platform's Convex project, `studioProjects` table | No provisioning overhead; easy to query/resume |
| Deployed to production | Own Convex project (provisioned via Management API) | True isolation; user can own it |

**Draft data schema** (add to `apps/platform/convex/schema.ts`):

> **Warning — Convex document size limit:** Convex enforces a **1 MiB per-document limit**. Storing all file contents as a single `files` field on one document will hit this limit for any non-trivial generated app. The schema below uses `v.any()` for simplicity during early development. Before shipping Phase 1, migrate file storage to a separate `studioProjectFiles` table (one document per file path) to avoid hitting the ceiling.

```ts
studioProjects: defineTable({
  userId: v.string(),
  name: v.string(),
  // WARNING: migrate to studioProjectFiles table before shipping
  files: v.any(),           // Record<string, string> — path → content
  conversationJson: v.string(),
  status: v.union(
    v.literal("draft"),
    v.literal("building"),
    v.literal("deployed")
  ),
  deployedUrl: v.optional(v.string()),
  deployedConvexUrl: v.optional(v.string()),
  updatedAt: v.number(),
}).index("by_userId", ["userId"]),
```

### Provisioning Convex for a Deployed App

When a user clicks "Deploy to Production," the platform backend calls the Convex Management API via raw `fetch()`. There is no official npm SDK wrapper — use the REST endpoints directly with a Team Access Token:

```ts
const BASE = 'https://api.convex.dev/v1'
const headers = {
  Authorization: `Bearer ${process.env.CONVEX_MANAGEMENT_TOKEN}`,
  'Content-Type': 'application/json',
}

// 1. Create a new project
const projectRes = await fetch(`${BASE}/teams/${process.env.CONVEX_TEAM_ID}/create_project`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ name: `studio-${userId}-${projectSlug}` }),
})
const { projectId } = await projectRes.json()

// 2. Create a production deployment
const deployRes = await fetch(`${BASE}/projects/${projectId}/create_deployment`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ type: 'prod' }),
})
const { deploymentName, deploymentUrl } = await deployRes.json()

// 3. Create a deploy key
const keyRes = await fetch(`${BASE}/deployments/${deploymentName}/create_deploy_key`, {
  method: 'POST',
  headers,
})
const { deployKey } = await keyRes.json()

// 4. Store deployKey + deploymentUrl; pass to GitHub Actions CI step
```

**Pushing generated Convex functions requires a CI runner — not a serverless function.** `npx convex deploy` reads from the local filesystem. It cannot run from inside a Vercel API route (no persistent filesystem). The correct flow is:

1. The API route stores `deployKey` and the generated schema/function files in the `studioProjects` record
2. It triggers a GitHub Actions workflow via `workflow_dispatch` or a repository dispatch event
3. The CI job checks out the repo, writes the generated files, then runs:

```bash
CONVEX_DEPLOY_KEY="<deployKey>" npx convex deploy
```

**Convex Management API note:** The API is in public beta as of early 2026. Contact `platforms@convex.dev` before building production features on it to understand rate limits and the GA timeline.

### Deployment Limit Planning

Convex Professional plan: 300 deployments per team. Budget 2–3 deployments per Studio app (prod + dev). This supports roughly 100–120 deployed Studio apps before hitting the ceiling. At that scale, escalate to Convex Business ($2,500+/month).

---

## 6. Turborepo Build & CI/CD

### Remote Caching

Turborepo remote caching is free on Vercel and requires zero configuration during Vercel builds. Enable it for local dev and GitHub Actions:

```bash
# One-time setup per developer
npx turbo login
npx turbo link
```

For GitHub Actions, add these secrets to the repo:
```
TURBO_TOKEN   — Vercel Access Token
TURBO_TEAM    — Vercel team slug
```

**Why it matters:** All five apps depend on `@mosaic/ui`, `@mosaic/db`, and `@mosaic/config`. Without remote caching, a change to `@mosaic/ui` rebuilds those packages five times across five concurrent Vercel deploys. With caching, they're replayed from cache in seconds on deploys 2–5.

### Skip Unchanged App Builds

Set the **Ignored Build Step** on each Vercel project to:
```
npx turbo-ignore --fallback=HEAD^
```

`turbo-ignore` reads Turborepo's dependency graph and cancels the Vercel build if neither the app nor any of its dependencies have changed since the last deployment. The `--fallback=HEAD^` flag prevents all apps from deploying on new branch creation.

> **Deprecation notice:** `turbo-ignore` is deprecated and will no longer receive updates. The long-term replacement is `turbo query affected`. Continue using `turbo-ignore` for now — it still works — but plan to migrate when `turbo query` gains stable Vercel Ignored Build Step support.

### GitHub Actions CI Pipeline

The existing `.github/workflows/ci.yml` covers typecheck + lint. Add a Convex deploy step per app:

```yaml
- name: Deploy Convex (platform)
  working-directory: apps/platform
  env:
    CONVEX_DEPLOY_KEY: ${{ secrets.PLATFORM_CONVEX_DEPLOY_KEY }}
  run: npx convex deploy
```

Repeat for each app. Convex deploys are fast (~10s) and idempotent — safe to run on every push to main.

### Env Var Documentation

Commit a `.env.production.example` file in each app (no real values, just keys). This prevents drift and documents what's needed for new developers:

```env
# apps/platform/.env.production.example
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_PLATFORM_URL=
NEXT_PUBLIC_BUDGET_URL=
NEXT_PUBLIC_CALENDAR_URL=
NEXT_PUBLIC_HOME_URL=
NEXT_PUBLIC_BABY_URL=
```

---

## 7. Studio Mode Architecture

### What Studio Mode Is

Studio is the core differentiator of Mosaic. It's a persistent, AI-powered workspace for capturing app ideas, building them with AI assistance, seeing them live, and deploying them. The purpose is to replace scattered AI chat threads (ChatGPT, Gemini, Claude) with a single place where your projects don't get lost.

### Current Implementation

| Component | Status | Location |
|-----------|--------|----------|
| Kanban board (Spark → Draft → Prototype → Live) | Built | `StudioPanel.tsx` |
| AI generate API route (streaming JSX) | Built | `api/studio/generate/route.ts` |
| `prototypeApps` Convex schema | Built | `apps/platform/convex/schema.ts` |
| Prototype repository (list, get) | Built | `convex/features/studio/` |
| Persisting generated code | Not yet | — |
| Live preview of generated code | Not yet | — |
| Iterating on an existing prototype | Not yet | — |
| Deploying a prototype | Not yet | — |

### The Generation Pipeline

The current `/api/studio/generate` route instructs Claude to emit plain React JSX (no imports, no TypeScript, Tailwind for styles). This needs to evolve to emit structured file blocks so the parser can write to a virtual filesystem:

**Target system prompt structure:**
```
When writing files, emit structured blocks:

<fileWrite path="src/app/page.tsx">
// file content
</fileWrite>

<fileWrite path="src/components/KanbanBoard.tsx">
// file content
</fileWrite>
```

A streaming parser intercepts these blocks token-by-token and writes each file to the project's `files` record in Convex. The preview iframe re-renders when any file changes. This is similar in principle to how Bolt.new works — no formal tool-calling API, just structured text that a parser treats as tool calls. (Bolt uses `<boltAction type="file" filePath="...">` tags specifically; the tag names here are Mosaic's own convention.)

### Live Preview Strategy

Three tiers, each with trade-offs:

**Option A — Sandpack (recommended for MVP)**
- Embeds a CodeSandbox iframe with full React support
- Works in all browsers, no COOP/COEP header changes needed
- Previews a component, not a full Next.js app (good enough for most Studio apps)
- `@codesandbox/sandpack-react` is licensed **Apache 2.0**; the `react` template is free for commercial use — no CodeSandbox subscription required

**Tailwind with Sandpack:** Do **not** add `tailwindcss` as a `customSetup` dependency — Sandpack's bundler does not run PostCSS, so Tailwind utility classes will have no effect. Use the Tailwind CDN script via a custom `index.html` entry instead:

```tsx
import { Sandpack } from '@codesandbox/sandpack-react'

<Sandpack
  template="react"
  files={{
    ...project.files,
    '/public/index.html': `<!DOCTYPE html>
<html>
  <head>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body><div id="root"></div></body>
</html>`,
  }}
  options={{ showPreview: true, showEditor: false }}
/>
```

**Option B — StackBlitz WebContainers (v2)**
- Full Next.js 15 in the browser, including SSR
- Requires `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Opener-Policy: same-origin-allow-popups` headers on the host page — use `same-origin-allow-popups` (not `same-origin`) to avoid breaking Clerk's sign-in popup flow
- Chrome/Chromium only (no Safari, limited Firefox)
- Requires a commercial WebContainer API license from StackBlitz

**Option C — Server-Side Container (production-grade)**
- Fly.io Firecracker microVM per active preview session
- No browser limitations, true SSR, real `npm install`
- Cold start latency (~2–3s), cost per active session
- How Lovable.dev runs previews in production

**Recommendation:** Ship MVP with Sandpack. Graduate to WebContainers or Fly.io once real users are iterating on Studio apps.

### Conversation Persistence

Each Studio project has a `conversationJson` field that stores the full chat history as a JSON string. When a user reopens a project, the conversation is rehydrated and the AI has full context of what was built and why. This is the key feature that makes Studio different from a fresh AI chat: **you never lose your place**.

---

## 8. The App Lifecycle: Idea → Production

```
SPARK
  User types an idea: "I want a habit tracker with streaks"
  → Saved to studioProjects (status: "draft")
  → Appears in the Kanban "Spark" column

PROTOTYPE
  User opens the project → chat panel opens
  → AI generates React components via streaming
  → Files saved to studioProjects.files in Convex
  → Live preview in Sandpack iframe
  → User iterates: "add a weekly progress bar", "change the color to green"
  → Each exchange appends to conversationJson, updates files
  → Kanban card moves to "Prototype" column

DEPLOY
  User clicks "Go Live" on the kanban card
  → Backend: Convex Management API creates new project + prod deployment + deploy key
  → Backend: GitHub API creates new repo, pushes files from studioProjects.files
             (includes a pre-built .github/workflows/convex-deploy.yml in the push)
  → Backend: GitHub API sets CONVEX_DEPLOY_KEY as a repo secret on the new repo
  → Backend: Vercel API creates project linked to new repo, sets env vars
             (NEXT_PUBLIC_CONVEX_URL, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, etc.)
  → Backend: Vercel API assigns subdomain: <slug>.apps.atlas-homevault.com
  → Backend: Cloudflare API adds CNAME for the new subdomain
  → GitHub push triggers new repo's convex-deploy.yml → npx convex deploy runs
  → Vercel detects the GitHub push → builds and deploys the Next.js app
  → Kanban card moves to "Live" column with the live URL
  → studioProjects.status set to "deployed", deployedUrl set

LIVE
  The app is a real Next.js app at my-habit-tracker.apps.atlas-homevault.com
  It has its own Convex backend with real data
  Session cookie from atlas-homevault.com is already trusted — user is signed in automatically
  User can continue to iterate via Studio (changes push to the app's GitHub repo → Vercel redeploys)
  Or: "Graduate" — transfer the Vercel project + Convex project to the user's own accounts
```

### What Makes This Different From v0/Bolt/Lovable

| Feature | v0.dev | Bolt.new | Lovable.dev | Mosaic Studio |
|---------|--------|----------|-------------|---------------|
| Persistent project history | No (new chat = new project) | Yes | Yes | Yes |
| Kanban project management | No | No | No | Yes |
| Deploys to your own domain | Partial | Netlify | GitHub Pages | `*.apps.atlas-homevault.com` |
| Integrated with your other apps | No | No | No | Yes (same Clerk, same platform) |
| Data survives conversation threads | No | Yes | Yes | Yes |

---

## 9. Cost Planning

### Current Monthly Costs (MVP — all five apps live, no Studio deployments)

| Service | Plan | Cost | Notes |
|---------|------|------|-------|
| Vercel | Hobby | $0 | Free for personal projects; 10 projects/account covers 5 core apps |
| Clerk | Free | $0 | Same-root-domain subdomains share sessions automatically — no paid satellite feature needed |
| Convex | Starter | $0 | Free tier (0.5 GB DB, 1M function calls/mo); sufficient for personal use |
| Cloudflare | Free | $0 | DNS only; no Workers needed |
| GitHub | Free | $0 | Private repo on Free plan |
| **Total** | | **$0/month** | |

### Studio Mode — Additional Costs as Apps Deploy

| Per deployed Studio app | Cost | Notes |
|------------------------|------|-------|
| Vercel project | Included in Hobby | Up to 10 projects/account on free tier; upgrade to Pro ($20/mo) when you exceed 10 total |
| Convex project (2 deployments) | ~$0 at low usage | Counted against 300-deployment Professional limit |
| GitHub repo | Included in Free | Unlimited private repos |
| DNS subdomain | $0 | One CNAME per app added via Cloudflare API during deploy pipeline |

**Scaling ceiling:** At ~100 deployed Studio apps:
- Convex Professional deployment limit approached (~300 deployments)
- Consider Convex Business ($2,500/month) only at that scale
- This is a personal platform — hitting 100 deployed apps is a future concern, not near-term

### Sandpack (Live Preview)
- Sandpack is open source (Apache 2.0) — free for commercial use when using the `react` template
- No CodeSandbox subscription required for the `react` template; a subscription is only needed for Nodebox-backed templates (Next.js, Vite, Astro) — which are not used in the MVP
- Tailwind via CDN script tag (see Section 7) — no extra cost

---

## 10. Phased Roadmap

### Phase 0 — Fix the Foundation (before anything else)
- [ ] Update `turbo.json` with per-app `env` declarations
- [ ] Add `clerk.atlas-homevault.com` CNAME in Cloudflare (get exact target value from Clerk Dashboard → Domains → Production → DNS Records)
- [ ] Ensure all mini-apps use the same `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and point `NEXT_PUBLIC_CLERK_SIGN_IN_URL` to the platform — no satellite config needed
- [ ] Add `ENABLE_EXPERIMENTAL_COREPACK=1` to each Vercel project
- [ ] Set `Ignored Build Step: npx turbo-ignore --fallback=HEAD^` on each Vercel project
- [ ] Commit `.env.production.example` per app
- [ ] Enable Turborepo Remote Caching (`npx turbo login && npx turbo link`)

### Phase 1 — Studio Core (prototype persistence + live preview)
- [ ] Expand `studioProjects` schema (files map, conversation, status)
- [ ] Wire the "Spark Capture" input to Convex (save new project on submit)
- [ ] Update the AI generate route to emit `<fileWrite>` blocks
- [ ] Write the streaming parser that updates `studioProjects.files` on each block
- [ ] Integrate Sandpack for live preview in the Studio chat panel
- [ ] Resume: rehydrate conversation from `conversationJson` when reopening a project

### Phase 2 — Studio Deploy (prototype → live URL)
- [ ] Integrate Convex Management API (raw `fetch()` against `api.convex.dev/v1`) for project provisioning — contact `platforms@convex.dev` first (API is in beta)
- [ ] Integrate GitHub API for repo creation + file push
- [ ] Integrate Vercel API for project creation + env var injection
- [ ] Wire the "Go Live" button on the kanban card to trigger the deploy pipeline
- [ ] Assign `<slug>.apps.atlas-homevault.com` subdomain via Vercel API
- [ ] Update kanban card to show live URL + "Open" button

### Phase 3 — Mini-App Data (connect the placeholder UIs to real backends)
- [ ] Budget: define Convex schema, wire transactions + categories
- [ ] Calendar: define schema, wire events
- [ ] Home: define schema, wire rooms + devices
- [ ] Baby Tracker: define schema, wire milestones + daily logs

### Phase 4 — Studio Iterations on Live Apps
- [ ] Support iterating on a deployed app from Studio (changes push to GitHub → Vercel redeploys)
- [ ] Version history: save file snapshots on each iteration
- [ ] "Revert to previous version" from the kanban card
- [ ] Optional: transfer deployed app to user's own Vercel/Convex accounts

---

## 11. Technical Implementation Reference

This section is the complete, concrete wiring guide. Everything above describes *what* — this section describes *how* with exact file names, secret names, and code.

---

### 11.1 Secret & Env Var Inventory

**Three places secrets live:**
1. **GitHub repo secrets** — used by GitHub Actions workflows
2. **Vercel project env vars** — injected into Next.js builds and server functions
3. **Convex dashboard env vars** — injected into Convex function runtime

#### GitHub Repo Secrets (Settings → Secrets → Actions)

```
# Infrastructure provisioning (used by terraform.yml)
CLOUDFLARE_API_TOKEN          Cloudflare API token with Zone:DNS:Edit permission
CLOUDFLARE_ZONE_ID            Zone ID for atlas-homevault.com (from Cloudflare dashboard)
VERCEL_API_TOKEN              Vercel Access Token (Account Settings → Tokens)
TF_VAR_vercel_team_id         Vercel team/account ID

# Turborepo remote cache (used by all workflows)
TURBO_TOKEN                   Same Vercel Access Token as above
TURBO_TEAM                    Vercel team slug (e.g. "trehill" or your username)

# Convex deploy keys — one per app (used by ci.yml on push to main)
PLATFORM_CONVEX_DEPLOY_KEY    From Convex dashboard → platform project → Settings → Deploy Keys
BUDGET_CONVEX_DEPLOY_KEY      From Convex dashboard → budget project → Settings → Deploy Keys
CALENDAR_CONVEX_DEPLOY_KEY    From Convex dashboard → calendar project → Settings → Deploy Keys
HOME_CONVEX_DEPLOY_KEY        From Convex dashboard → home project → Settings → Deploy Keys
BABY_CONVEX_DEPLOY_KEY        From Convex dashboard → baby-tracker project → Settings → Deploy Keys

# Studio deploy pipeline — Phase 2 only
CONVEX_MANAGEMENT_TOKEN       Convex Team Access Token (convex.dev → Team Settings → Access Tokens)
CONVEX_TEAM_ID                Convex team ID (from team URL or API)
STUDIO_GITHUB_PAT             GitHub Personal Access Token with repo + admin:repo_hook scopes
                              (GITHUB_TOKEN cannot create new repos — a PAT is required)
```

#### Vercel Env Vars — Per Project

Set these in Vercel Dashboard → Project → Settings → Environment Variables (Production environment).

All five apps share these (same value in every project):
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY   pk_live_...
CLERK_SECRET_KEY                    sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL       https://atlas-homevault.com/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL       https://atlas-homevault.com/sign-up
ENABLE_EXPERIMENTAL_COREPACK        1
NEXT_PUBLIC_PLATFORM_URL            https://atlas-homevault.com
NEXT_PUBLIC_BUDGET_URL              https://budget.atlas-homevault.com
NEXT_PUBLIC_CALENDAR_URL            https://calendar.atlas-homevault.com
NEXT_PUBLIC_HOME_URL                https://home.atlas-homevault.com
NEXT_PUBLIC_BABY_URL                https://baby.atlas-homevault.com
```

Each app gets its own:
```
NEXT_PUBLIC_CONVEX_URL              https://<app-specific>.convex.cloud
```

Platform only (additional):
```
ANTHROPIC_API_KEY                   sk-ant-...  (for /api/studio/generate)
CONVEX_MANAGEMENT_TOKEN             (same as GitHub secret — used server-side in deploy route)
CONVEX_TEAM_ID                      (same as GitHub secret)
STUDIO_GITHUB_PAT                   (same as GitHub secret — used server-side in deploy route)
VERCEL_API_TOKEN                    (same as GitHub secret — used server-side in deploy route)
CLOUDFLARE_API_TOKEN                (same as GitHub secret — used server-side in deploy route)
CLOUDFLARE_ZONE_ID                  (same as GitHub secret — used server-side in deploy route)
```

> **Security note:** The platform API route that triggers Studio deploys is a Next.js Server Action or API route — server-side only, never exposed to the browser. The PAT, management tokens, and Cloudflare token must never appear in `NEXT_PUBLIC_*` vars.

#### Convex Dashboard Env Vars (per project)

In each Convex project dashboard → Settings → Environment Variables:
```
CLERK_ISSUER_URL    https://clerk.atlas-homevault.com  (from Clerk dashboard → API Keys)
```

This is how Convex validates Clerk JWTs. Every app's Convex project needs this same value.

---

### 11.2 GitHub Actions Workflows

#### `ci.yml` — Updated (typecheck + lint + Convex deploy)

Runs on: PRs to `main` (typecheck + lint only) and push to `main` (+ Convex deploy).

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ secrets.TURBO_TEAM }}

jobs:
  check:
    name: Typecheck & Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo typecheck lint

  deploy-convex:
    name: Deploy Convex Backends
    runs-on: ubuntu-latest
    needs: check
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile

      - name: Deploy Convex — platform
        working-directory: apps/platform
        env:
          CONVEX_DEPLOY_KEY: ${{ secrets.PLATFORM_CONVEX_DEPLOY_KEY }}
        run: npx convex deploy

      - name: Deploy Convex — budget
        working-directory: apps/budget
        env:
          CONVEX_DEPLOY_KEY: ${{ secrets.BUDGET_CONVEX_DEPLOY_KEY }}
        run: npx convex deploy

      - name: Deploy Convex — calendar
        working-directory: apps/calendar
        env:
          CONVEX_DEPLOY_KEY: ${{ secrets.CALENDAR_CONVEX_DEPLOY_KEY }}
        run: npx convex deploy

      - name: Deploy Convex — home
        working-directory: apps/home
        env:
          CONVEX_DEPLOY_KEY: ${{ secrets.HOME_CONVEX_DEPLOY_KEY }}
        run: npx convex deploy

      - name: Deploy Convex — baby-tracker
        working-directory: apps/baby-tracker
        env:
          CONVEX_DEPLOY_KEY: ${{ secrets.BABY_CONVEX_DEPLOY_KEY }}
        run: npx convex deploy
```

> **Why Convex deploy is separate from Vercel build:** Vercel triggers its own builds via GitHub webhooks. Convex has no Vercel integration that automatically deploys — it must be done explicitly in CI. This workflow ensures Convex schema changes are live before (or concurrent with) the Next.js build that references them.

#### `terraform.yml` — Existing (no changes needed)

Applies Terraform on merge to `main`. Provisions Vercel projects + Cloudflare DNS records for the five core apps. No changes needed until Phase 2 (Studio deploy adds new resources dynamically via API, not Terraform).

#### `studio-deploy.yml` — New (Phase 2)

This workflow is triggered by the platform's `/api/studio/deploy` API route via `workflow_dispatch`. It handles the Convex deploy step for a newly created Studio app repo.

```yaml
# .github/workflows/studio-deploy.yml
name: Studio App — Deploy Convex

on:
  workflow_dispatch:
    inputs:
      convex_deploy_key:
        description: Deploy key for the new Convex project
        required: true
      app_repo:
        description: Full repo name (e.g. mosaic-apps/habit-tracker-abc123)
        required: true
      app_slug:
        description: App slug for logging
        required: true

jobs:
  deploy-convex:
    name: Deploy Convex for Studio App
    runs-on: ubuntu-latest
    steps:
      - name: Checkout generated app repo
        uses: actions/checkout@v4
        with:
          repository: ${{ inputs.app_repo }}
          token: ${{ secrets.STUDIO_GITHUB_PAT }}

      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm install convex

      - name: Deploy Convex
        env:
          CONVEX_DEPLOY_KEY: ${{ inputs.convex_deploy_key }}
        run: npx convex deploy
```

> **Security:** `convex_deploy_key` is passed as a `workflow_dispatch` input. GitHub Actions encrypts workflow inputs in transit and masks them in logs. Do not log or echo the key in any step.

---

### 11.3 Environment Matrix

How env vars differ across local dev, Vercel preview, and Vercel production:

| Variable | Local Dev (`.env.local`) | Vercel Preview | Vercel Production |
|----------|--------------------------|----------------|-------------------|
| `NEXT_PUBLIC_CONVEX_URL` | Dev deployment URL | Dev deployment URL | Prod deployment URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...` (dev instance) | `pk_test_...` | `pk_live_...` |
| `CLERK_SECRET_KEY` | `sk_test_...` | `sk_test_...` | `sk_live_...` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `http://localhost:3000/sign-in` | `https://preview-xxx.vercel.app/sign-in` | `https://atlas-homevault.com/sign-in` |
| `ANTHROPIC_API_KEY` | Real key (local testing) | Same real key | Same real key |

**Clerk dev vs prod instances:** Clerk has separate development and production instances. Use the dev instance (`pk_test_` / `sk_test_`) for local development and Vercel preview deployments. Use the production instance (`pk_live_` / `sk_live_`) for Vercel production. Set these in Vercel's "Preview" and "Production" environment tabs separately.

**Convex dev vs prod deployments:** Each Convex project has a `dev` deployment (for local development) and a `prod` deployment (for production). `NEXT_PUBLIC_CONVEX_URL` in local `.env.local` points to the dev deployment. The Vercel production env var points to the prod deployment. `CONVEX_DEPLOY_KEY` in GitHub secrets is the prod deploy key.

---

### 11.4 How Vercel Builds Are Triggered

Understanding this prevents confusion about when things run:

```
git push to main
       │
       ├─► GitHub Actions ci.yml (typecheck + lint + Convex deploy)
       │         runs in parallel with Vercel
       │
       └─► Vercel webhook (for each of the 5 projects)
                 │
                 ├─ turbo-ignore check → skip if app + deps unchanged
                 └─ if changed: turbo build → next build → deploy to CDN
```

Vercel and GitHub Actions run independently and in parallel. There is no coordination between them — which means a Convex schema change and its corresponding Next.js code are deployed within seconds of each other, but not atomically. For schema-breaking changes, deploy the Convex migration first (let CI run), then deploy the Next.js change.

---

### 11.5 Studio Deploy Orchestration (Phase 2)

The platform API route `POST /api/studio/deploy` is a Next.js Route Handler. It runs server-side and orchestrates all the external API calls. Below is the exact sequence with failure handling.

```ts
// apps/platform/src/app/api/studio/deploy/route.ts

export async function POST(req: Request) {
  // 1. Auth check
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const { projectId } = await req.json()

  // 2. Load project files from Convex
  // (fetch studioProjects record — files, name, etc.)

  // 3. Provision Convex backend
  const { deployKey, deploymentUrl } = await provisionConvexProject(appSlug)

  // 4. Create GitHub repo + push files
  const repoFullName = await createGitHubRepo(appSlug, files, deployKey)
  // Files pushed include:
  //   - src/  (generated Next.js app)
  //   - convex/  (generated schema + functions)
  //   - package.json, next.config.ts, tailwind.config.ts, etc.
  //   - .github/workflows/convex-deploy.yml  (template workflow)
  //   - .env.production.example

  // 5. Set CONVEX_DEPLOY_KEY as a repo secret on the new repo
  await setGitHubRepoSecret(repoFullName, 'CONVEX_DEPLOY_KEY', deployKey)

  // 6. Create Vercel project linked to new repo
  const vercelProject = await createVercelProject(appSlug, repoFullName)

  // 7. Set env vars on new Vercel project
  await setVercelEnvVars(vercelProject.id, {
    NEXT_PUBLIC_CONVEX_URL: deploymentUrl,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: 'https://atlas-homevault.com/sign-in',
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: 'https://atlas-homevault.com/sign-up',
    NEXT_PUBLIC_PLATFORM_URL: 'https://atlas-homevault.com',
  })

  // 8. Assign subdomain on the Vercel project
  const subdomain = `${appSlug}.apps.atlas-homevault.com`
  await assignVercelDomain(vercelProject.id, subdomain)

  // 9. Add CNAME in Cloudflare
  // Vercel provides a per-project CNAME endpoint after domain assignment
  const vercelCname = await getVercelProjectCname(vercelProject.id)
  await addCloudflareRecord(subdomain, vercelCname)

  // 10. Trigger GitHub Actions to run Convex deploy
  // (the repo's own convex-deploy.yml — triggered by the push in step 4)
  // No explicit trigger needed — the push in step 4 already starts the workflow

  // 11. Update Convex record
  await updateStudioProject(projectId, {
    status: 'deployed',
    deployedUrl: `https://${subdomain}`,
    deployedConvexUrl: deploymentUrl,
  })

  return Response.json({ url: `https://${subdomain}` })
}
```

**What triggers the Convex deploy on the new repo:** When files are pushed to the new GitHub repo in step 4, the `.github/workflows/convex-deploy.yml` file is included in that push. GitHub Actions runs it immediately on the first push — no separate `workflow_dispatch` trigger from the platform is needed. The workflow reads `CONVEX_DEPLOY_KEY` from the repo secret set in step 5.

**Failure recovery:** Steps 3–9 are not atomic. If any step fails after Convex is provisioned, you'll have a dangling Convex project. For MVP, log the failure with the provisioned `deployKey` and `deploymentUrl` in the `studioProjects` record so cleanup or retry is possible. A retry route can skip to the failed step using stored state.

---

### 11.6 New Studio App — Template Files

When the platform creates a new GitHub repo for a deployed Studio app, it pushes these non-generated files alongside the AI-generated source code. These are static templates that every Studio app needs.

**`.github/workflows/convex-deploy.yml`**
```yaml
name: Deploy Convex

on:
  push:
    branches: [main]
    paths:
      - 'convex/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install convex
      - name: Deploy Convex
        env:
          CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}
        run: npx convex deploy
```

**`package.json`** (minimal — Studio-generated app)
```json
{
  "name": "<app-slug>",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "15.0.0",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "convex": "^1.17.0",
    "@clerk/nextjs": "^6.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20",
    "@types/react": "^19",
    "tailwindcss": "^3.4.0",
    "postcss": "^8",
    "autoprefixer": "^10"
  }
}
```

**`next.config.ts`**
```ts
import type { NextConfig } from 'next'
const nextConfig: NextConfig = {}
export default nextConfig
```

---

### 11.7 Vercel Ignored Build Step — Per Project Setup

This must be set manually in Vercel Dashboard per project (or via Terraform `vercel_project` resource `ignored_build_command` attribute):

```
# Vercel Dashboard → Project → Settings → Git → Ignored Build Step
npx turbo-ignore --fallback=HEAD^
```

Via Terraform (add to `terraform/modules/mosaic-app/main.tf`):
```hcl
resource "vercel_project" "app" {
  name              = "mosaic-${var.app_name}"
  framework         = "nextjs"
  root_directory    = "apps/${var.app_name}"
  ignored_build_command = "npx turbo-ignore --fallback=HEAD^"
  ...
}
```

---

### 11.8 Terraform — What It Currently Manages vs What's Manual

| Resource | Managed by Terraform | Manual / API |
|----------|---------------------|--------------|
| Vercel projects (5 core apps) | Yes — `terraform/modules/mosaic-app` | — |
| Cloudflare CNAME (5 core apps) | Yes | — |
| Clerk `clerk.atlas-homevault.com` CNAME | **No** — must be added manually | One-time manual step |
| Vercel env vars | **No** — must be set in Vercel dashboard | Manual per project |
| Convex project creation | **No** | Manual (core apps) / API (Studio apps) |
| Vercel projects (Studio apps) | **No** — created dynamically via API | API at deploy time |
| Cloudflare CNAME (Studio apps) | **No** — created dynamically via API | API at deploy time |
| GitHub repo (Studio apps) | **No** | API at deploy time |

**Gap to close:** Vercel env vars for the 5 core apps should eventually be managed by Terraform using the `vercel_project_environment_variable` resource to prevent drift. For now, set them manually and document them in `.env.production.example` per app.

---

## Key Architectural Decisions (Summary)

| Decision | Choice | Reason |
|----------|--------|--------|
| Multi-app deployment | One Vercel project per app, same repo | Native Vercel monorepo support; Terraform already wires it |
| Auth sharing | Clerk free tier, shared root domain | Same session cookie scoped to `.atlas-homevault.com` — no paid satellite feature needed |
| Studio data (draft) | Platform's Convex project, scoped tables | No provisioning overhead during iteration |
| Studio data (deployed) | Separate Convex project per app | True isolation; user can own it |
| Live preview (MVP) | Sandpack | Lowest friction, works everywhere |
| Live preview (v2) | WebContainers or Fly.io | Full Next.js SSR fidelity |
| Code storage | Convex documents (files map) during iteration; GitHub repo on deploy | Matches how Bolt.new and Lovable work |
| Studio subdomains | `<slug>.apps.atlas-homevault.com` per app | Assigned via Vercel + Cloudflare APIs at deploy time; wildcard CNAME incompatible with per-app Vercel projects |
| LLM for generation | Claude Sonnet (already in use) | Consistent with existing `/api/studio/generate` |
