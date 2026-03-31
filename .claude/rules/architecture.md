# Architecture Rules

## Monorepo Structure
- `apps/*` — Next.js applications, each independently deployable
- `packages/db` — shared data layer abstraction (BaseRepository, DbSet, builders, interfaces)
- `packages/ui` — shared component library (custom + shadcn primitives)
- `packages/config` — shared TypeScript and tooling configuration
- **DO NOT** import from one app into another — shared code always goes in a `packages/` library
- **DO NOT** create new packages without discussing the need first

## Vertical Slice Architecture
- Features are self-contained: all code for a feature (query, mutation, UI, types) lives together
- Convex backend: `convex/features/<feature>/queries.ts`, `convex/features/<feature>/mutations.ts`
- **DO NOT** create a generic `utils/` or `helpers/` folder — utilities belong to the feature that uses them
- **DO NOT** share types across features by importing from each other — duplicate the type or promote it to `packages/db`

## Data Layer — The Only Pattern
- All data access flows through `BaseRepository` → `DbSet` → builders → `ConvexTranslator` → `ctx.db`
- `ConvexTranslator` is the **sole** location where `ctx.db` appears — one per Convex app at `convex/_shared/ConvexTranslator.ts`
- Every Convex function that accesses data creates a `ConvexTranslator`: `new ConvexTranslator(ctx.db)`
- Extend `BaseRepository` for each entity — never call `DbSet` directly from a Convex function
- **DO NOT** call `ctx.db.query(...)`, `ctx.db.insert(...)`, etc. anywhere outside `ConvexTranslator`
- **DO NOT** bypass the builder pattern with raw Convex database calls

## Package Manager
- **pnpm only** — never npm or yarn
- Run `pnpm install` from the monorepo root, never inside individual apps
- Use `pnpm turbo <task>` to run tasks across the workspace
