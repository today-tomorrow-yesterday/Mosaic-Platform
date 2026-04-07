# Mosaic Platform — Implementation Roadmap

> **Purpose:** Step-by-step technical guidance for implementing the full Mosaic + Studio Mode strategy.  
> No production code lives here — this is the thinking and decision layer. All pseudo-code is illustrative only.  
> Actual implementation goes in the corresponding `.ts`, `.tsx`, `.yml`, `.tf` files.
>
> **Last updated:** 2026-04-06  
> **Read alongside:** `docs/DEPLOYMENT_STRATEGY.md`

---

## Reading This Document

Each phase is self-contained with:
- **Goal** — what done looks like from the user's perspective
- **Current state** — exact files/code that exist right now
- **Tasks** — ordered, numbered steps with file paths and pseudo-code
- **Done when** — concrete, verifiable completion criteria
- **Do not proceed until** — hard gates before moving to the next phase

Phases must be completed in order. Phase 0 unblocks everything. Phase 1 must be fully working before Phase 2 starts. Mini-app data (Phase 3) is independent and can run in parallel with Phase 2 if desired.

---

## Current State Snapshot

Before any work begins, this is the exact state of every relevant file:

### Infrastructure
| File | State |
|------|-------|
| `.github/workflows/ci.yml` | Runs typecheck + lint. No Convex deploy. No Turborepo remote cache. Uses `pnpm typecheck` directly instead of `pnpm turbo typecheck`. |
| `.github/workflows/terraform.yml` | Correct. Provisions 5 Vercel projects + Cloudflare DNS on push to main. |
| `terraform/main.tf` | Correct. 5 app modules. |
| `terraform/modules/mosaic-app/main.tf` | Has `var.environment_variables` in a `dynamic` block but no caller passes values — env vars are never actually set via Terraform. `ignored_build_command` not set. |
| `turbo.json` | Missing: `env` declarations, per-app `#build` overrides, `TURBO_TOKEN`/`TURBO_TEAM` usage. |

### Platform App — Studio
| File | State |
|------|-------|
| `apps/platform/convex/schema.ts` | Has `prototypeApps` table. Schema uses a single `code: v.string()` field — not a files map. Status values: `"draft" \| "saved" \| "archived"`. |
| `convex/features/studio/PrototypeRepository.ts` | Has `getByUser()` and `getSaved()`. No `getById()`. Uses `tokenIdentifier` for user scoping. |
| `convex/features/studio/queries.ts` | Has `listSaved`. Missing: `getById`, `listAll`. |
| `convex/features/studio/mutations.ts` | Has `save`, `update`, `remove`. Missing: `create` (new project from name only), `updateFiles`, `markDeployed`. |
| `apps/platform/src/app/studio/page.tsx` | Renders `StudioListClient`. Correct. |
| `apps/platform/src/app/studio/StudioListClient.tsx` | Fully built grid UI. Links to `/studio/new` and `/studio/[id]` — **neither route exists**. |
| `apps/platform/src/app/studio/` | Only contains `page.tsx` and `StudioListClient.tsx`. No `new/` or `[id]/` subdirectories. |
| `apps/platform/src/app/api/studio/generate/` | **Does not exist.** No generate route file was found. |
| `apps/platform/src/components/StudioPanel.tsx` | Kanban board with fully mock data. Not connected to Convex. |

### Mini-Apps
All four mini-apps (`budget`, `calendar`, `home`, `baby-tracker`) have empty Convex schemas and placeholder UI. No data wiring.

---

## Phase 0 — Fix the Foundation

**Goal:** The infrastructure is solid, correctly wired, and all five apps build and deploy cleanly from the monorepo. Turborepo caching works. Clerk auth works in production across all subdomains. No configuration drift.

**This phase has zero new user-facing features.** It is entirely infrastructure fixes that must be correct before any feature work begins.

---

### Task 0.1 — Fix `turbo.json`

**File:** `turbo.json` (root)

**What's wrong:** No `env` declarations means Turborepo doesn't know that `NEXT_PUBLIC_CONVEX_URL` differs per app. A cached build from one app could be served for another app's deploy, embedding the wrong Convex URL silently.

**What to do:**
- Add per-app `#build` task overrides that declare which env vars affect the cache hash
- Each `#build` override is a **complete replacement** — re-declare `dependsOn`, `inputs`, and `outputs` on every one
- Add `env` array to the global `build` task for `NODE_ENV`
- Do not add `TURBO_TOKEN` or `TURBO_TEAM` here — those are GitHub secrets, not turbo.json settings

**Pseudo-structure:**
```
tasks:
  build (global):
    dependsOn: ["^build"]
    inputs: ["$TURBO_DEFAULT$", ".env*"]
    outputs: [".next/**", "!.next/cache/**", "dist/**"]
    env: ["NODE_ENV"]

  platform#build:
    dependsOn: ["^build"]
    inputs: ["$TURBO_DEFAULT$", ".env*"]
    outputs: [".next/**", "!.next/cache/**"]
    env: ["NEXT_PUBLIC_CONVEX_URL", "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"]

  budget#build:
    (same shape as platform#build)

  calendar#build, home#build, baby-tracker#build:
    (same shape)
```

---

### Task 0.2 — Fix `ci.yml`

**File:** `.github/workflows/ci.yml`

**What's wrong:** 
- Uses `pnpm typecheck` and `pnpm lint` directly instead of `pnpm turbo typecheck lint` — bypasses Turborepo's dependency graph and caching
- No `TURBO_TOKEN` / `TURBO_TEAM` env vars — remote caching is never activated for CI runs
- Convex backends are never deployed from CI — schema changes require manual deploys or luck with the Vercel integration
- No separation between PR checks and main-branch deploys

**What to do:**
- Split into two jobs: `check` (runs on PRs + push) and `deploy-convex` (runs on push to `main` only, after `check` passes)
- Add `TURBO_TOKEN` and `TURBO_TEAM` as env vars at the workflow level (read from GitHub secrets)
- Change typecheck/lint to use `pnpm turbo typecheck lint`
- Add a Convex deploy step per app in the `deploy-convex` job
- Convex deploys must run sequentially per app (not parallel) to avoid rate limits

**Job structure pseudo-code:**
```
workflow ci.yml:
  triggers: pull_request → main, push → main
  
  env (workflow-level):
    TURBO_TOKEN: secrets.TURBO_TOKEN
    TURBO_TEAM: secrets.TURBO_TEAM

  job: check
    runs-on: ubuntu-latest
    steps:
      - checkout
      - setup pnpm@9
      - setup node@20 with pnpm cache
      - pnpm install --frozen-lockfile
      - pnpm turbo typecheck lint

  job: deploy-convex
    runs-on: ubuntu-latest
    needs: [check]
    condition: push to main only
    steps:
      - checkout
      - setup pnpm@9 + node@20
      - pnpm install --frozen-lockfile
      - for each app (platform, budget, calendar, home, baby-tracker):
          working-directory: apps/<app>
          env: CONVEX_DEPLOY_KEY: secrets.<APP>_CONVEX_DEPLOY_KEY
          run: npx convex deploy
```

> **Note on Vercel builds:** Vercel triggers its own build pipeline independently via GitHub webhooks. The `ci.yml` Convex deploy and the Vercel Next.js build run in parallel — there is no coordination. For schema-breaking changes, deploy Convex first (merge a schema-only commit), wait for CI to complete, then merge the Next.js code that depends on it.

---

### Task 0.3 — Fix Terraform Module — Env Vars + Ignored Build Step

**File:** `terraform/modules/mosaic-app/main.tf`

**What's wrong:**
- `var.environment_variables` is declared in the module but no caller in `terraform/main.tf` passes it — the `dynamic "environment"` block loops over an empty list, so no env vars are set via Terraform
- `ignored_build_command` is not set on any Vercel project

**What to do:**
- Add `ignored_build_command = "npx turbo-ignore --fallback=HEAD^"` to the `vercel_project` resource
- Add `environment_variables` defaults for the shared env vars (Corepack, sign-in URLs, cross-app links) so they are provisioned by Terraform, not set manually per project
- Env vars that differ per app (`NEXT_PUBLIC_CONVEX_URL`, Clerk keys) should remain manually set in Vercel dashboard for now — do not hard-code secrets in Terraform state

**Pseudo-structure for vercel_project resource:**
```hcl
resource "vercel_project" "app" {
  name                  = "mosaic-${var.app_name}"
  framework             = "nextjs"
  root_directory        = "apps/${var.app_name}"
  ignored_build_command = "npx turbo-ignore --fallback=HEAD^"

  git_repository = {
    type = "github"
    repo = var.github_repo
  }

  # Shared env vars safe to commit (no secrets)
  environment = [
    { key = "ENABLE_EXPERIMENTAL_COREPACK", value = "1", target = ["production", "preview"] },
    { key = "NEXT_PUBLIC_CLERK_SIGN_IN_URL", value = "https://${var.root_domain}/sign-in", target = ["production"] },
    { key = "NEXT_PUBLIC_CLERK_SIGN_UP_URL", value = "https://${var.root_domain}/sign-up", target = ["production"] },
    { key = "NEXT_PUBLIC_PLATFORM_URL",      value = "https://${var.root_domain}",          target = ["production"] },
  ]
}
```

---

### Task 0.4 — Add `clerk.atlas-homevault.com` CNAME

**This is a one-time manual step — not automated.**

**Where to do it:**
1. Log into Clerk Dashboard → your production instance → Configure → Domains
2. Add `atlas-homevault.com` as your production domain
3. Clerk provides a CNAME target value (instance-specific — do not guess it)
4. Log into Cloudflare → DNS → Add record:
   - Type: CNAME
   - Name: `clerk`
   - Target: the value Clerk gave you
   - Proxy: Off (DNS only — orange cloud off)
5. Back in Clerk dashboard, click "Verify" — it polls DNS and confirms when propagated

**Why this matters:** Until this CNAME exists, Clerk's JWT verification uses a generic shared domain. The custom CNAME enables Clerk to set cookies correctly scoped to `.atlas-homevault.com` in production.

---

### Task 0.5 — Set All Vercel Env Vars

**Manual step — done once per Vercel project.**

In Vercel Dashboard, for each of the 5 projects, set the following in Settings → Environment Variables → Production:

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_CONVEX_URL` | `https://<app-specific>.convex.cloud` | Different per app — get from Convex dashboard |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` | Same for all — from Clerk Dashboard |
| `CLERK_SECRET_KEY` | `sk_live_...` | Same for all — never in NEXT_PUBLIC_ |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `https://atlas-homevault.com/sign-in` | Same for all |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `https://atlas-homevault.com/sign-up` | Same for all |
| `ENABLE_EXPERIMENTAL_COREPACK` | `1` | Same for all — Terraform will handle this after Task 0.3 |

Platform only:
| Variable | Value |
|----------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` (your Anthropic key) |

Also set **Preview** environment versions using Clerk's development instance keys (`pk_test_` / `sk_test_`).

---

### Task 0.6 — Set GitHub Repo Secrets

**Manual step — done once.**

In GitHub → repo → Settings → Secrets → Actions:

```
TURBO_TOKEN                Vercel Access Token (Account Settings → Tokens → create new)
TURBO_TEAM                 Your Vercel team/username slug
CLOUDFLARE_API_TOKEN       Already set (used by terraform.yml)
CLOUDFLARE_ZONE_ID         Already set
VERCEL_API_TOKEN           Already set
VERCEL_TEAM_ID             Already set
ROOT_DOMAIN                Already set
PLATFORM_CONVEX_DEPLOY_KEY From Convex dashboard → platform project → Settings → Deploy Keys → create
BUDGET_CONVEX_DEPLOY_KEY   Same for budget project
CALENDAR_CONVEX_DEPLOY_KEY Same for calendar project
HOME_CONVEX_DEPLOY_KEY     Same for home project
BABY_CONVEX_DEPLOY_KEY     Same for baby-tracker project
```

---

### Task 0.7 — Commit `.env.production.example` Per App

Create a `.env.production.example` file in each app's root directory. This file is committed (no real values) and documents exactly what env vars are needed to run each app in production.

**File location:** `apps/<app>/.env.production.example`

**Purpose:** When you add a new env var to Vercel, you must remember to add it here too. Treat this file as the canonical documentation of each app's production configuration.

---

### Phase 0 — Done When

- [ ] `turbo.json` has per-app `#build` overrides with `env` declarations
- [ ] `ci.yml` uses `pnpm turbo typecheck lint`, has `TURBO_TOKEN`/`TURBO_TEAM`, deploys all 5 Convex backends on push to main
- [ ] Terraform module has `ignored_build_command` and provisions shared env vars
- [ ] `clerk.atlas-homevault.com` CNAME is verified in Clerk dashboard
- [ ] All 5 Vercel projects have correct env vars set (Production + Preview)
- [ ] All GitHub secrets are set including `TURBO_TOKEN` and 5 Convex deploy keys
- [ ] `.env.production.example` committed per app
- [ ] Push a test commit → CI passes, Convex deploys succeed, Vercel deploys succeed and load at their subdomains

---

## Phase 1 — Studio Core

**Goal:** The Studio is a real, persistent AI-powered app builder. You can describe an app idea, AI generates working React code, you see it live in a preview, you can close the browser and reopen the project and everything is exactly where you left it — conversation, code, and all.

**Prerequisites:** Phase 0 complete.

---

### Architecture Overview

Studio in Phase 1 has four parts that work together:

```
1. Project creation  → /studio/new page → creates Convex record → redirects to /studio/[id]
2. Chat + generation → /studio/[id] page → streams from /api/studio/generate → updates Convex
3. Live preview      → Sandpack iframe inside /studio/[id] page → re-renders on file change
4. Resume            → /studio/[id] loads conversation + files from Convex on mount
```

The Convex schema is the source of truth for everything. The UI is stateless — it reads from and writes to Convex.

---

### Task 1.1 — Migrate the Convex Schema

**File:** `apps/platform/convex/schema.ts`

**What's wrong:** The current `prototypeApps` table uses a single `code` string. The new system needs a `files` map (path → content), richer status values, and separate tracking for the kanban phase.

**Migration plan:**
- Rename/replace `prototypeApps` with a new `studioProjects` table
- Keep `prototypeApps` temporarily during migration to avoid data loss (or clear it if it has no production data)
- The `files` field stores each generated file as a separate entry. **Do not store all files in one document** — Convex enforces a 1 MiB per-document limit. Use a companion `studioProjectFiles` table

**New schema structure (pseudo-code):**
```
studioProjects table:
  userId: string                    (from Clerk tokenIdentifier)
  name: string                      (user-provided or AI-suggested)
  description: optional string      (one-line summary shown on list card)
  conversationJson: string          (full message array, JSON-stringified)
  phase: "spark" | "draft" | "prototype" | "live"
  status: "active" | "deployed" | "archived"
  deployedUrl: optional string      (set when phase becomes "live")
  deployedConvexUrl: optional string
  createdAt: number
  updatedAt: number

  indexes:
    by_userId: [userId]
    by_userId_status: [userId, status]

studioProjectFiles table:
  projectId: id(studioProjects)     (foreign key)
  path: string                      (e.g. "src/app/page.tsx")
  content: string                   (file contents)
  updatedAt: number

  indexes:
    by_projectId: [projectId]
    by_projectId_path: [projectId, path]  (for upsert-by-path)
```

**Why separate files table:** A generated app might have 10–20 files at 5–20 KB each = 50–400 KB total. That fits in one document today but leaves no room for growth. The separate table also enables per-file queries, per-file update subscriptions, and cheap "which files changed" diffs.

---

### Task 1.2 — Build the Studio Repository + Mutations

**Files:**
- `apps/platform/convex/features/studio/StudioProjectRepository.ts` (new)
- `apps/platform/convex/features/studio/StudioProjectFilesRepository.ts` (new)
- `apps/platform/convex/features/studio/queries.ts` (extend existing)
- `apps/platform/convex/features/studio/mutations.ts` (extend existing)

**StudioProjectRepository needs:**
```
getByUser(userId)                         → StudioProject[]     (for list page)
getById(id)                               → StudioProject | null
getByUserAndId(userId, id)                → StudioProject | null (auth-scoped getById)
create(fields)                            → id
updateConversation(id, conversationJson)  → void
updatePhase(id, phase)                    → void
markDeployed(id, url, convexUrl)          → void
archive(id)                               → void
```

**StudioProjectFilesRepository needs:**
```
getByProject(projectId)                   → StudioProjectFile[]
getByPath(projectId, path)                → StudioProjectFile | null
upsert(projectId, path, content)          → void  (insert or update by path)
upsertMany(projectId, files: Record<string,string>) → void
deleteByProject(projectId)                → void  (for cleanup)
```

**Convex mutations needed:**
```
createProject(name)                       → id   (creates project record, no files)
updateConversation(id, conversationJson)  → void
upsertFile(id, path, content)             → void (called per file from streaming parser)
upsertFiles(id, files)                    → void (called on load/reload — batch write)
updatePhase(id, phase)                    → void
markDeployed(id, url, convexUrl)          → void
archiveProject(id)                        → void
```

**Convex queries needed:**
```
listProjects()                            → StudioProject[]     (user-scoped)
getProject(id)                            → StudioProject | null
getProjectFiles(id)                       → StudioProjectFile[] (all files for a project)
```

All mutations and queries must:
1. Call `ctx.auth.getUserIdentity()` at the top
2. Return early / throw `ConvexError("Unauthorized")` if no identity
3. Use `tokenIdentifier` as the userId for scoping

---

### Task 1.3 — Build the `/studio/new` Route

**Files to create:**
- `apps/platform/src/app/studio/new/page.tsx` (server component — just renders client)
- `apps/platform/src/app/studio/new/NewProjectClient.tsx` (client component)

**What this page does:**
- Shows a single large text input: "What do you want to build?"
- Optional: a few example prompts as chips (tap to pre-fill)
- On submit: calls the `createProject` Convex mutation with the name/prompt
- On success: redirects to `/studio/[id]` using `router.push`
- The page should feel fast — create the project record immediately, don't wait for AI

**Pseudo-logic:**
```
NewProjectClient:
  state: name = ""
  state: loading = false

  onSubmit:
    if name is empty, return
    loading = true
    id = await createProject({ name })
    router.push(`/studio/${id}`)
```

**Design note:** This page must match the existing dark Studio aesthetic from `StudioListClient`. Background: `#0c0b18`. Same font, same color palette.

---

### Task 1.4 — Build the Generate API Route

**File:** `apps/platform/src/app/api/studio/generate/route.ts`

This is a Next.js Route Handler that accepts a POST, streams Claude's response as Server-Sent Events, and parses `<fileWrite>` blocks in the stream to extract file contents.

**Request shape:**
```
POST /api/studio/generate
Body: {
  projectId: string
  messages: Array<{ role: "user" | "assistant", content: string }>
}
```

**What the route does:**
1. Validates auth (Clerk `auth()` — throw 401 if not signed in)
2. Validates the project belongs to the caller (load from Convex, check `tokenIdentifier`)
3. Builds the system prompt (see below)
4. Streams Claude Sonnet (not Opus — Sonnet is faster for iteration; Opus for final polish)
5. As the stream arrives, SSE-forward each chunk to the client
6. After stream ends, parse the full response for `<fileWrite>` blocks and call `upsertFiles` mutation

**System prompt design:**
```
You are an AI that builds React applications. When creating or modifying files,
emit each file using this exact format:

<fileWrite path="src/app/page.tsx">
// full file content here
</fileWrite>

Rules:
- Use Tailwind CSS for all styling (no CSS modules, no inline styles)
- Use React 19 functional components
- No TypeScript — plain JSX only
- No imports except React (assume it's globally available in the preview)
- Keep components in a single file for the preview unless you have a strong reason to split
- Make the UI beautiful, modern, and polished
- After the file blocks, briefly describe what you built

Always emit at minimum one <fileWrite> block per response when creating/modifying the app.
```

**Streaming parser pseudo-logic:**
```
let fullResponse = ""
let parsedFiles = {}

for each chunk in stream:
  fullResponse += chunk
  yield SSE chunk to client

after stream ends:
  parsedFiles = parseFileWriteBlocks(fullResponse)
  // parseFileWriteBlocks: regex to extract path + content from each <fileWrite> block
  
  if parsedFiles has entries:
    await convex mutation: upsertFiles(projectId, parsedFiles)
  
  await convex mutation: updateConversation(projectId, newMessages)
```

**SSE response format:**
```
Content-Type: text/event-stream
Cache-Control: no-cache

data: {"type": "chunk", "text": "..."}
data: {"type": "chunk", "text": "..."}
data: {"type": "files", "paths": ["src/app/page.tsx"]}
data: {"type": "done"}
```

**Important:** The route calls Convex mutations server-side using the Convex HTTP client (`ConvexHttpClient`), not the React hooks. Import and instantiate it from the `CONVEX_URL` env var.

---

### Task 1.5 — Build the `/studio/[id]` Route

**Files to create:**
- `apps/platform/src/app/studio/[id]/page.tsx` (server component — validates id, loads initial data)
- `apps/platform/src/app/studio/[id]/StudioEditorClient.tsx` (client component — the full editor UI)

This is the main Studio workspace. It is the most complex component in Phase 1.

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│  Header: back arrow │ project name │ phase badge │ "Go   │
│                                                   Live"  │
├──────────────────────┬───────────────────────────────────┤
│                      │                                   │
│   Chat panel         │   Live Preview (Sandpack)         │
│   (left ~40%)        │   (right ~60%)                    │
│                      │                                   │
│   Message history    │   Iframe showing the app          │
│   ──────────────     │                                   │
│   Input box          │                                   │
│                      │                                   │
└──────────────────────┴───────────────────────────────────┘
```

**Client component state:**
```
- messages: Message[]          (loaded from project.conversationJson on mount)
- files: Record<string,string> (loaded from getProjectFiles query — live Convex subscription)
- streaming: boolean
- streamBuffer: string         (accumulates SSE chunks to show in chat)
```

**On mount:**
```
1. Parse project.conversationJson → messages[]
2. getProjectFiles subscription provides files (live-updated by Convex)
3. If files is empty and messages has user messages → project was generating when user left
   show "Resuming..." state
```

**On send message:**
```
1. Append user message to messages
2. Call POST /api/studio/generate with { projectId, messages }
3. Consume SSE stream:
   - On "chunk": append to streamBuffer, show in chat as streaming assistant message
   - On "files": note which files were updated (Convex subscription will update files automatically)
   - On "done": finalize assistant message, clear streamBuffer, streaming = false
4. Save final messages to Convex via updateConversation mutation
```

**Sandpack integration:**
```
<Sandpack
  template="react"
  files={{
    ...files,  // from Convex subscription — updates automatically
    '/public/index.html': tailwindCdnHtmlTemplate,
  }}
  options={{ showPreview: true, showEditor: false, autorun: true }}
/>
```

The `files` object from Convex updates in real time as the streaming parser writes files. Sandpack re-runs the preview automatically when files change.

**Phase badge + "Go Live" button:** Both read from `project.phase`. "Go Live" only shows when phase is `"prototype"` or later. Clicking it in Phase 1 does nothing (Phase 2 wires the deploy flow) — but the button should exist and be visible.

---

### Task 1.6 — Connect StudioListClient and StudioPanel to Real Data

**Files:**
- `apps/platform/src/app/studio/StudioListClient.tsx` (already exists — update)
- `apps/platform/src/components/StudioPanel.tsx` (exists — update)

**StudioListClient:** Already subscribes to `api.features.studio.queries.listSaved`. Once Task 1.2 is complete and `listProjects` exists, update the query call. The list UI renders correctly already — it just needs real data.

**StudioPanel (Kanban board):** Currently uses `MOCK_CARDS`. The board needs to subscribe to `listProjects` and map the results to the four phase columns. Projects in phase `"spark"` go in the Spark column, etc.

The kanban card click action:
- For spark/draft cards: navigate to `/studio/[id]` to open the chat
- For prototype cards: navigate to `/studio/[id]`, but also show the "Go Live" CTA prominently
- For live cards: navigate to the deployed URL (external link)

**Important:** Do not remove the mock cards immediately — keep them visible when `listProjects` returns an empty array, but mark them visually as "examples." Once a real project exists, show only real projects.

---

### Phase 1 — Done When

- [ ] `/studio/new` creates a project in Convex and redirects to the editor
- [ ] `/studio/[id]` loads the project, shows conversation history, renders files in Sandpack
- [ ] Typing a message and hitting send calls the generate route, streams a response, shows it in chat
- [ ] Generated `<fileWrite>` blocks update files in Convex
- [ ] Sandpack preview re-renders automatically as files change
- [ ] Closing and reopening `/studio/[id]` restores the full conversation and preview
- [ ] StudioListClient shows real projects from Convex
- [ ] StudioPanel kanban shows real projects in the correct phase columns
- [ ] Typecheck passes (`pnpm turbo typecheck`)

---

## Phase 2 — Studio Deploy

**Goal:** A prototype can go live. Click "Go Live" → within ~60 seconds, the app is accessible at `<slug>.apps.atlas-homevault.com`, has its own Convex backend, uses Clerk auth, and is a real deployable Next.js app — not a prototype preview.

**Prerequisites:** Phase 1 complete. Specifically: `studioProjectFiles` data is being written correctly for at least one project.

---

### Architecture Overview

The deploy flow is an orchestrated sequence of external API calls. It runs entirely server-side from a single Next.js API route. It is not a background job in Phase 2 — it runs synchronously and the client polls for completion.

```
User clicks "Go Live"
  → POST /api/studio/deploy { projectId }
    → 1. Validate auth + ownership
    → 2. Load project + all files from Convex
    → 3. Convex Management API: create project + deployment + deploy key
    → 4. GitHub API: create new repo under a GitHub org (or your personal account)
    → 5. GitHub API: push all generated files + template files to the new repo
    → 6. GitHub API: set CONVEX_DEPLOY_KEY as a repo secret
    → 7. Vercel API: create project linked to the new repo
    → 8. Vercel API: set env vars on the new project
    → 9. Vercel API: assign subdomain <slug>.apps.atlas-homevault.com
    → 10. Cloudflare API: add CNAME for the new subdomain
    → 11. Convex: update studioProjects record (status: deployed, deployedUrl)
    → return { url }
  
GitHub push in step 5 triggers:
  → New repo's .github/workflows/convex-deploy.yml
  → npx convex deploy (using the secret set in step 6)
  
Vercel detects the GitHub push:
  → Builds and deploys the Next.js app
  → App is live within ~30–60 seconds of step 5
```

---

### Task 2.1 — New GitHub Repository Setup (Template Files)

When a Studio app is deployed, the platform creates a new GitHub repository and pushes the generated code plus a set of template files that every Studio app needs.

**Template files — these are committed to the platform repo under `apps/platform/src/lib/studio-templates/`:**

```
studio-templates/
  github-workflow-convex-deploy.yml   (the Convex deploy workflow for the new repo)
  package.json.template               (minimal Next.js 15 + Convex + Clerk)
  next.config.ts.template
  tailwind.config.ts.template
  postcss.config.js.template
  tsconfig.json.template
  app/layout.tsx.template             (ClerkProvider + ConvexClientProvider wrapper)
  app/globals.css.template            (Tailwind base styles)
  convex/auth.config.ts.template      (Clerk auth for Convex)
  .env.production.example.template
```

**Template rendering:** Each template has placeholders like `{{APP_NAME}}`, `{{CONVEX_URL}}`, `{{CLERK_PUBLISHABLE_KEY}}` that are filled at deploy time.

**The `layout.tsx` template is critical:** It wraps the generated app with `<ClerkProvider>` and `<ConvexClientProvider>`. The generated AI code only produces page content — the infrastructure shell comes from the template.

---

### Task 2.2 — Build the Deploy API Route

**File:** `apps/platform/src/app/api/studio/deploy/route.ts`

This is a POST handler. It runs synchronously — the full deploy flow completes before it returns. Expected duration: 20–60 seconds.

**Required server-side env vars (set in platform's Vercel project):**
```
CONVEX_MANAGEMENT_TOKEN     Convex team access token
CONVEX_TEAM_ID              Convex team ID
STUDIO_GITHUB_PAT           GitHub PAT with repo + admin:repo_hook scopes
VERCEL_API_TOKEN            Vercel access token
CLOUDFLARE_API_TOKEN        Already set (same token as Terraform uses)
CLOUDFLARE_ZONE_ID          Already set
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY   (same as all apps — available as env var)
CLERK_SECRET_KEY                    (same as all apps — available as env var)
```

**Step-by-step pseudo-logic:**

```
1. AUTH
   identity = ctx.auth.getUserIdentity()
   if !identity → 401

2. LOAD PROJECT
   project = getByUserAndId(projectId, identity.tokenIdentifier)
   if !project → 404
   if project.status === "deployed" → 409 (already deployed)
   files = getProjectFiles(projectId)
   if files.length === 0 → 400 (nothing to deploy)

3. DERIVE APP SLUG
   slug = slugify(project.name) + "-" + randomHex(6)
   subdomain = `${slug}.apps.atlas-homevault.com`

4. PROVISION CONVEX
   POST api.convex.dev/v1/teams/{CONVEX_TEAM_ID}/create_project
     body: { name: `studio-${slug}` }
   → { projectId: convexProjectId }
   
   POST api.convex.dev/v1/projects/{convexProjectId}/create_deployment
     body: { type: "prod" }
   → { deploymentName, deploymentUrl }
   
   POST api.convex.dev/v1/deployments/{deploymentName}/create_deploy_key
   → { deployKey }

5. CREATE GITHUB REPO
   POST api.github.com/user/repos   (or /orgs/{org}/repos if using an org)
     headers: Authorization: token {STUDIO_GITHUB_PAT}
     body: { name: slug, private: true, auto_init: false }
   → { full_name: repoFullName }

6. ASSEMBLE FILE TREE
   allFiles = {
     ...renderTemplates({ slug, deploymentUrl, CLERK_PUBLISHABLE_KEY }),
     ...convertConvexFilesToProjectStructure(project.files),
     ".github/workflows/convex-deploy.yml": convexDeployWorkflowContent,
   }
   
   Push all files to the new repo as a single commit:
   - Create a tree via GitHub API (POST /repos/{owner}/{repo}/git/trees)
   - Create a commit pointing to that tree
   - Update main branch ref to point to the new commit
   
   (This is the GitHub "create commit via API" pattern — no git CLI needed)

7. SET REPO SECRET
   GitHub API: PUT /repos/{owner}/{repo}/actions/secrets/CONVEX_DEPLOY_KEY
     value: deployKey (must be encrypted with the repo's public key first — GitHub requires this)

8. CREATE VERCEL PROJECT
   POST api.vercel.com/v10/projects
     headers: Authorization: Bearer {VERCEL_API_TOKEN}
     body: {
       name: `studio-${slug}`,
       framework: "nextjs",
       gitRepository: { type: "github", repo: repoFullName }
     }
   → { id: vercelProjectId }

9. SET VERCEL ENV VARS
   For each env var: POST api.vercel.com/v10/projects/{vercelProjectId}/env
     body: { key, value, target: ["production"], type: "plain" }
   
   Vars to set:
     NEXT_PUBLIC_CONVEX_URL = deploymentUrl
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
     CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY
     NEXT_PUBLIC_CLERK_SIGN_IN_URL = "https://atlas-homevault.com/sign-in"
     NEXT_PUBLIC_CLERK_SIGN_UP_URL = "https://atlas-homevault.com/sign-up"
     NEXT_PUBLIC_PLATFORM_URL = "https://atlas-homevault.com"
     NEXT_PUBLIC_APP_URL = `https://${subdomain}`

10. ASSIGN VERCEL DOMAIN
    POST api.vercel.com/v10/projects/{vercelProjectId}/domains
      body: { name: subdomain }
    → { cname: vercelCnameTarget }  (Vercel provides project-specific CNAME)

11. ADD CLOUDFLARE CNAME
    POST api.cloudflare.com/client/v4/zones/{CLOUDFLARE_ZONE_ID}/dns_records
      headers: Authorization: Bearer {CLOUDFLARE_API_TOKEN}
      body: {
        type: "CNAME", name: subdomain,
        content: vercelCnameTarget, proxied: false
      }

12. UPDATE CONVEX RECORD
    await convex.mutation(api.features.studio.mutations.markDeployed, {
      id: projectId,
      deployedUrl: `https://${subdomain}`,
      deployedConvexUrl: deploymentUrl,
    })

13. RETURN
    return { url: `https://${subdomain}` }
```

**Error handling strategy:**
- Store `deployKey` and `convexProjectId` in the `studioProjects` record immediately after step 4 completes (before any subsequent steps). This way, if steps 5–12 fail, you have the Convex project info and can attempt cleanup or retry.
- For MVP: if any step fails, return a 500 with `{ error, step, recoveryData }`. Log the failure. Do not attempt automatic rollback yet.

---

### Task 2.3 — GitHub Repo Secret Encryption

**This is a subtle technical requirement:** GitHub's API requires that secrets be encrypted with the repository's RSA public key before being set. You cannot POST a plaintext secret.

**The encryption process (pseudo-code):**
```
1. GET /repos/{owner}/{repo}/actions/public-key
   → { key_id, key }  (key is a Base64-encoded RSA public key)

2. Use libsodium (tweetnacl-js or sodium-native) to:
   a. Decode the Base64 public key
   b. Encrypt the secret value using the public key (sealed box / Box.seal)
   c. Base64-encode the encrypted result

3. PUT /repos/{owner}/{repo}/actions/secrets/CONVEX_DEPLOY_KEY
   body: { encrypted_value: base64EncryptedValue, key_id }
```

**Package to use:** `tweetnacl` + `tweetnacl-util` (both zero-dependency, work in Node.js / Edge runtime).

This is not optional — the GitHub API will reject unencrypted secret values.

---

### Task 2.4 — Wire "Go Live" Button in StudioEditorClient

**File:** `apps/platform/src/app/studio/[id]/StudioEditorClient.tsx`

**What changes:**
- "Go Live" button is already visible (from Phase 1) — wire its `onClick`
- On click: show a deploy progress UI (steps with checkmarks as each completes — or a simple loading state for MVP)
- Call `POST /api/studio/deploy { projectId }`
- Poll for completion (the route is synchronous, so just await the fetch)
- On success: show the live URL, update the kanban card phase to "live"
- On failure: show error message with the failed step

**Deploy progress states for the UI:**
```
"provisioning"   → Creating your backend...
"creating-repo"  → Setting up repository...
"deploying"      → Deploying your app...
"wiring-domain"  → Configuring domain...
"done"           → 🎉 Your app is live!
```

For MVP, these states can be driven by a timer (each step gets ~10 seconds) rather than real progress events. Real progress requires Server-Sent Events from the deploy route, which can be added in Phase 4.

---

### Task 2.5 — Add `studio-deploy.yml` to Platform Repo

**File:** `.github/workflows/studio-deploy.yml`

This workflow is kept for Phase 4 (when we need to re-deploy a live Studio app after iterating on it). In Phase 2, the Convex deploy is triggered by the push to the new app's own repo (which includes its own `convex-deploy.yml`). No separate platform workflow_dispatch is needed for Phase 2.

Add the file now so it exists, but it won't be called until Phase 4.

---

### Phase 2 — Done When

- [ ] Clicking "Go Live" on a prototype project initiates the deploy flow
- [ ] A new GitHub repo is created with all generated files + templates
- [ ] A Vercel project is created and linked to the GitHub repo
- [ ] A Convex project is provisioned and its deploy key is set as a repo secret
- [ ] The app is accessible at `<slug>.apps.atlas-homevault.com` within ~90 seconds
- [ ] The deployed app's Convex functions are running (can verify in Convex dashboard)
- [ ] The kanban card for the project shows "Live" with a link to the URL
- [ ] A second test deploy also works (the first one wasn't a fluke)

---

## Phase 3 — Mini-App Data

**Goal:** Budget, Calendar, Home, and Baby Tracker all have real data. The placeholder UIs are connected to Convex. Users can add, edit, and delete real records.

**Prerequisites:** Phase 0 complete. This phase can run in parallel with Phase 2.

Each mini-app follows the same pattern. Document the pattern once here.

---

### The Mini-App Feature Pattern

Every mini-app feature follows the same four-layer stack:

```
Layer 1 — Convex schema    (apps/<app>/convex/schema.ts)
            ↓ defines the table shape and indexes
Layer 2 — Repository       (apps/<app>/convex/features/<feature>/<Feature>Repository.ts)
            ↓ extends BaseRepository, adds app-specific queries
Layer 3 — Queries/Mutations (apps/<app>/convex/features/<feature>/queries.ts + mutations.ts)
            ↓ Convex functions that instantiate translator + repository
Layer 4 — React UI          (apps/<app>/src/components/<Feature>.tsx)
            ↓ useQuery + useMutation hooks, renders data
```

Never skip a layer. Never call `ctx.db` outside a ConvexTranslator. Never call the repository outside a Convex function.

---

### Task 3.1 — Budget App Schema + Features

**File:** `apps/budget/convex/schema.ts`

**Data model:**
```
accounts table:
  userId: string
  name: string           ("Checking", "Savings", "Credit Card")
  type: "checking" | "savings" | "credit" | "investment"
  balance: number        (in cents — never store floats for money)
  currency: string       ("USD")
  createdAt: number

transactions table:
  userId: string
  accountId: id(accounts)
  amount: number         (in cents, negative for expenses)
  description: string
  category: string
  date: number           (timestamp)
  createdAt: number

  indexes:
    by_userId: [userId]
    by_accountId: [accountId]
    by_userId_date: [userId, date]

categories table:
  userId: string
  name: string
  color: string
  icon: string
  budget: optional number   (monthly budget in cents)
```

**Queries needed:**
```
listAccounts()                          → Account[]
listTransactions(accountId?, limit?)    → Transaction[]
getCategorySpending(month: number)      → { category, total }[]
getMonthlyTotals(year: number)          → { month, income, expenses }[]
```

**Mutations needed:**
```
createAccount(name, type, balance)      → id
createTransaction(accountId, amount, description, category, date) → id
updateTransaction(id, fields)           → void
deleteTransaction(id)                   → void
```

---

### Task 3.2 — Calendar App Schema + Features

**File:** `apps/calendar/convex/schema.ts`

**Data model:**
```
events table:
  userId: string
  title: string
  description: optional string
  startTime: number        (timestamp)
  endTime: number          (timestamp)
  allDay: boolean
  color: string
  recurring: optional string   ("daily" | "weekly" | "monthly" | "yearly")
  recurringEnd: optional number
  createdAt: number

  indexes:
    by_userId: [userId]
    by_userId_start: [userId, startTime]
```

**Queries:**
```
listEvents(startTime, endTime)          → Event[]
getEvent(id)                            → Event | null
```

**Mutations:**
```
createEvent(fields)                     → id
updateEvent(id, fields)                 → void
deleteEvent(id)                         → void
```

---

### Task 3.3 — Baby Tracker App Schema + Features

**File:** `apps/baby-tracker/convex/schema.ts`

**Data model:**
```
babies table:
  userId: string
  name: string
  dateOfBirth: number        (timestamp)
  photoUrl: optional string

milestones table:
  userId: string
  babyId: id(babies)
  title: string
  category: "motor" | "language" | "social" | "cognitive"
  achievedAt: optional number   (null = not yet achieved)
  notes: optional string

dailyLogs table:
  userId: string
  babyId: id(babies)
  date: number               (timestamp, start of day)
  feeds: number              (count)
  sleepMinutes: number
  mood: "happy" | "fussy" | "neutral"
  notes: optional string

  indexes:
    by_babyId: [babyId]
    by_babyId_date: [babyId, date]
```

---

### Task 3.4 — Home App Schema + Features

**File:** `apps/home/convex/schema.ts`

**Data model:**
```
rooms table:
  userId: string
  name: string           ("Living Room", "Kitchen", etc.)
  icon: string
  order: number

devices table:
  userId: string
  roomId: id(rooms)
  name: string
  type: "light" | "thermostat" | "lock" | "camera" | "appliance" | "other"
  isOn: boolean
  value: optional number   (thermostat temp, dimmer level, etc.)
  lastUpdated: number

  indexes:
    by_roomId: [roomId]
    by_userId: [userId]
```

**Note:** In Phase 3, device state is managed manually (user toggles on/off in the UI). Smart home integration (real device control) is out of scope.

---

### Phase 3 — Done When

- [ ] Budget app: user can add accounts, log transactions, see category spending
- [ ] Calendar app: user can create, edit, delete events; week view shows real events
- [ ] Baby tracker: user can add a baby, log daily feeds/sleep, mark milestones
- [ ] Home app: user can add rooms and devices, toggle device on/off
- [ ] All four apps pass typecheck
- [ ] All four Convex schemas have been deployed (CI confirms successful deploys)

---

## Phase 4 — Studio Iterations on Live Apps

**Goal:** After a Studio app is live, the user can continue iterating on it from Studio. Changes made in the chat flow update the live app — same feel as developing in the Studio, but pushing to production.

**Prerequisites:** Phase 2 complete. At least one Studio app deployed and live.

---

### Architecture Change

In Phase 1–2, generated code is stored in Convex (`studioProjectFiles`). In Phase 4, there are now two sources of truth:
1. `studioProjectFiles` in Convex (the "working copy" in Studio)
2. The live GitHub repo (the deployed version)

These must be kept in sync. The strategy:
- Studio is always the source of truth for the working copy
- On "save to production," Studio pushes a commit to the GitHub repo
- Vercel detects the commit and redeploys automatically
- The GitHub repo is read-only from outside Studio — never commit manually to the deployed app's repo

---

### Task 4.1 — Push Iterations to GitHub

**File:** `apps/platform/src/app/api/studio/push/route.ts`

When the user clicks "Push to Live" (a new button that replaces "Go Live" for already-deployed projects):

```
1. Load project + current files from Convex
2. Load the deployed repo name from project.deployedRepoName (store this in Task 2.2)
3. GitHub API: get the current commit SHA of main branch
4. GitHub API: create a new tree with all changed files
5. GitHub API: create a new commit pointing to the new tree
6. GitHub API: update the main branch ref to the new commit
7. Vercel detects the push and triggers a new build automatically
8. Return { commitSha, estimatedDeployTime }
```

No `workflow_dispatch` needed — Vercel's GitHub webhook handles redeployment.

---

### Task 4.2 — Version History

**Schema addition:** Add a `studioProjectSnapshots` table:

```
studioProjectSnapshots table:
  projectId: id(studioProjects)
  files: omit — files too large for snapshot approach
  commitSha: string          (GitHub commit SHA at snapshot time)
  message: string            (AI summary of what changed, or user-provided label)
  createdAt: number

  indexes:
    by_projectId: [projectId]
```

Rather than storing full file snapshots (too large), store the GitHub commit SHA. "Revert to version" triggers a `git revert` commit via GitHub API.

---

### Task 4.3 — Revert

**File:** `apps/platform/src/app/api/studio/revert/route.ts`

```
1. Load project + target snapshot (has commitSha)
2. GitHub API: get file tree at that commitSha
3. Set those files as the current working copy in studioProjectFiles
4. Push a new commit to GitHub (same as Task 4.1) with the reverted files
5. Vercel redeploys
6. Show the preview of the reverted version in Sandpack
```

---

### Phase 4 — Done When

- [ ] "Push to Live" button appears on deployed projects and pushes a commit to the app's GitHub repo
- [ ] Vercel redeploys within ~60 seconds of a push
- [ ] Each push creates a snapshot record with the commit SHA
- [ ] "Revert" on a snapshot card restores files and pushes a new commit

---

## Appendix A — File Map

All files that will be created or modified across all phases:

### Phase 0
| File | Action |
|------|--------|
| `turbo.json` | Modify — add env declarations + per-app overrides |
| `.github/workflows/ci.yml` | Modify — add turbo cache env vars, add Convex deploy job |
| `terraform/modules/mosaic-app/main.tf` | Modify — add ignored_build_command, fix env var wiring |
| `apps/*/` | Create `.env.production.example` in each |

### Phase 1
| File | Action |
|------|--------|
| `apps/platform/convex/schema.ts` | Modify — add studioProjects + studioProjectFiles tables |
| `apps/platform/convex/features/studio/StudioProjectRepository.ts` | Create |
| `apps/platform/convex/features/studio/StudioProjectFilesRepository.ts` | Create |
| `apps/platform/convex/features/studio/queries.ts` | Modify — add listProjects, getProject, getProjectFiles |
| `apps/platform/convex/features/studio/mutations.ts` | Modify — add createProject, upsertFile, upsertFiles, updatePhase, markDeployed |
| `apps/platform/src/app/api/studio/generate/route.ts` | Create |
| `apps/platform/src/app/studio/new/page.tsx` | Create |
| `apps/platform/src/app/studio/new/NewProjectClient.tsx` | Create |
| `apps/platform/src/app/studio/[id]/page.tsx` | Create |
| `apps/platform/src/app/studio/[id]/StudioEditorClient.tsx` | Create |
| `apps/platform/src/app/studio/StudioListClient.tsx` | Modify — update query name |
| `apps/platform/src/components/StudioPanel.tsx` | Modify — wire to real Convex data |

### Phase 2
| File | Action |
|------|--------|
| `apps/platform/src/app/api/studio/deploy/route.ts` | Create |
| `apps/platform/src/lib/studio-templates/` | Create directory + all template files |
| `apps/platform/src/app/studio/[id]/StudioEditorClient.tsx` | Modify — wire "Go Live" button |
| `.github/workflows/studio-deploy.yml` | Create (dormant until Phase 4) |

### Phase 3
| File | Action |
|------|--------|
| `apps/budget/convex/schema.ts` | Modify — add accounts, transactions, categories tables |
| `apps/budget/convex/features/budget/` | Create — repository, queries, mutations |
| `apps/budget/src/components/` | Modify — wire UI to Convex hooks |
| (same pattern for calendar, home, baby-tracker) | |

### Phase 4
| File | Action |
|------|--------|
| `apps/platform/src/app/api/studio/push/route.ts` | Create |
| `apps/platform/src/app/api/studio/revert/route.ts` | Create |
| `apps/platform/convex/schema.ts` | Modify — add studioProjectSnapshots table |
| `apps/platform/src/app/studio/[id]/StudioEditorClient.tsx` | Modify — add "Push to Live" + version history panel |

---

## Appendix B — Dependencies Between Tasks

```
Phase 0 (all tasks) ──────────────────────────────────────────────────►
                                                                        │
Phase 1:  1.1 → 1.2 → 1.3 ──────────────────────────────────────────► │
                     ↓ 1.4 ──────────────────────────────────────────► │
                     ↓ 1.5 (depends on 1.2 + 1.4) ─────────────────► │
                     ↓ 1.6 (depends on 1.2) ────────────────────────► │
                                                                        │
Phase 2:  2.1 → 2.2 (depends on 2.1 + all of Phase 1)                 │
               ↓ 2.3 (must solve before 2.2 can deploy secrets)        │
               ↓ 2.4 (UI wiring, depends on 2.2)                       │
               ↓ 2.5 (independent — add workflow file now)             │
                                                                        │
Phase 3:  3.1, 3.2, 3.3, 3.4 — independent of each other + Phase 2   │
                                                                        │
Phase 4:  4.1 → 4.2 → 4.3 (all depend on Phase 2)                    ◄┘
```

**Critical path to first deployed Studio app:**
`0.1 → 0.2 → 0.6 → 1.1 → 1.2 → 1.4 → 1.5 → 2.1 → 2.3 → 2.2 → 2.4`

---

## Appendix C — Known Risks and Open Questions

| Risk | Severity | Notes |
|------|----------|-------|
| Convex Management API is in public beta | High | Contact `platforms@convex.dev` before starting Phase 2. If the API is unavailable, Phase 2 is blocked. Fallback: create Convex projects manually and skip per-user Convex provisioning for MVP. |
| GitHub PAT credential storage | Medium | The `STUDIO_GITHUB_PAT` token is stored as a Vercel env var on the platform project. If it is leaked, an attacker can create repos under your GitHub account. Prefer a GitHub App (scoped to specific repos) over a PAT for production hardening. |
| Convex `studioProjectFiles` 1 MiB per-document limit | Medium | Each file is a separate document. A very large file (>1 MiB) would fail to insert. Impose a client-side file size check in the streaming parser: skip any file over 512 KB and warn the user. |
| Vercel Hobby account project limit (10) | Low | 5 core apps + 5 Studio apps = 10. The 6th Studio deploy will fail. Upgrade to Pro at that point ($20/month). |
| Sandpack `react` template requires React entry point structure | Low | The generated code must export a default React component from the file at the Sandpack `main` path. The system prompt must enforce this convention. |
| Deployed Studio apps share the Clerk Free tier | Low | All apps under atlas-homevault.com subdomains share one Clerk instance and the same MAU limit (10,000). Well above any personal use ceiling. |
