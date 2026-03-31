# Mosaic Platform — Claude Code Instructions

## Project Overview
Mosaic is a personal dashboard platform at `atlas-homevault.com`. It is a Turborepo monorepo containing a platform shell and several mini-apps (Budget, Calendar, Home, Baby Tracker), all sharing a common UI library and data layer abstraction.

## Tech Stack
- **Monorepo**: Turborepo + pnpm workspaces
- **Apps**: Next.js 15 (App Router), React 19, TypeScript 5
- **Auth**: Clerk (shared across all apps)
- **Backend**: Convex (one project per app)
- **Styling**: Tailwind CSS v3 + shadcn/ui primitives
- **Shared packages**: `@mosaic/ui` (components), `@mosaic/db` (data layer), `@mosaic/config` (tooling)

## Always-Loaded Rules
The `.claude/rules/` directory is auto-loaded every session:
- `architecture.md` — monorepo structure, vertical slices, data layer pattern
- `convex.md` — ConvexTranslator usage, repository pattern, schema conventions
- `nextjs.md` — Server/Client component boundaries, auth patterns, env vars
- `ui-components.md` — shared components, Tailwind conventions, color system
- `typescript.md` — type strictness, no `any`, discriminated unions
- `git-workflow.md` — conventional commits, atomic commits, no force-push
- `security.md` — Clerk auth, secret handling, env var safety

## Key Invariants (Never Violate)
1. `ctx.db` only appears inside `ConvexTranslator` — all other code uses repositories
2. No cross-app imports — shared code lives in `packages/`
3. No dark mode — light design only
4. pnpm only — never npm or yarn
5. Server components by default — `"use client"` only when required
6. Never commit `.env.local` or any secrets

## Knowledge Base
- `knowledge/common-antipatterns.md` — real bugs this project has hit, with fixes

## Ports (Local Dev)
| App | Port |
|-----|------|
| platform | 3000 |
| budget | 3001 |
| calendar | 3002 |
| baby-tracker | 3003 |
| home | 3004 |

## Before Writing Any Convex Code
Read `convex/_generated/ai/guidelines.md` in the relevant app first — it overrides training data.

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
