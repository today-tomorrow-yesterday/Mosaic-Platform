# Shared Packages

Mosaic has two shared packages consumed by every app. They live in `packages/` and are referenced as workspace dependencies (`@mosaic/ui`, `@mosaic/db`). A third package (`@mosaic/config`) provides shared tooling configuration.

---

## @mosaic/ui

**Path:** `packages/ui`
**Purpose:** Shared React component library

Every visual primitive that appears in more than one app lives here. The package exports both custom Mosaic components and shadcn/ui primitives that have been installed into the shared library rather than duplicated per app.

### Custom Mosaic Components

These are components designed specifically for Mosaic's design language.

#### AppHeader

The top navigation bar used by every permanent app (Home, Budget, Calendar, Baby Tracker). Not used on the Platform dashboard which has its own custom header.

```tsx
<AppHeader
  name="Budget"
  actions={<UserButton />}
  backHref={process.env.NEXT_PUBLIC_PLATFORM_URL ?? "https://atlas-homevault.com"}
/>
```

Props:

| Prop | Type | Purpose |
|------|------|---------|
| `name` | string | App name shown in the header |
| `actions` | ReactNode | Slot for right-side content (usually a Clerk `<UserButton />`) |
| `backHref` | string | URL for the back arrow — should always point to the platform |

The `backHref` should always use the `NEXT_PUBLIC_PLATFORM_URL` env var, never a hardcoded URL, so it works across both local development and production.

#### StatCard

A labelled numeric stat display, used in Baby Tracker and Budget.

```tsx
<StatCard label="Milestones" value="3 / 5" accent="green" />
```

Props: `label`, `value` (string or number), `accent` (colour name: green, blue, orange, red, default).

#### Badge

A pill-shaped status label for categorising items in lists.

```tsx
<Badge variant="blue">Feed</Badge>
<Badge variant="orange">Diaper</Badge>
<Badge variant="default">Sleep</Badge>
```

Variants: `default` (grey), `green`, `blue`, `orange`, `red`, `pink`.

#### ProgressBar

A horizontal progress indicator with a labelled percentage.

```tsx
<ProgressBar value={72} accent="blue" />
```

#### cn()

The classname merge utility. Import this from `@mosaic/ui` — do not re-implement it in individual apps.

```ts
import { cn } from "@mosaic/ui"

cn("base-class", condition && "conditional-class", "another-class")
```

Internally uses `clsx` + `tailwind-merge` to handle Tailwind class conflicts correctly.

### shadcn/ui Primitives

shadcn components that have been installed into the shared library. These live in `packages/ui/src/components/ui/` and use the shared CSS variable colour system (`hsl(var(--primary))` etc.).

Currently installed: `Button`, `Card`, `Accordion`.

To add a new shadcn component: install it into `packages/ui/src/components/ui/` and export it from `packages/ui/src/index.ts`. Do not run `shadcn add` inside individual apps.

### Design Constraints

All components in this package must:

- Use Tailwind CSS only — no CSS modules, no inline `style={{}}` except for CSS variable references
- Work in light mode only — no `.dark:` variants
- Not assume any specific page background — they must be composable anywhere
- Not import from any app — only from `packages/` or external npm packages

---

## @mosaic/db

**Path:** `packages/db`
**Purpose:** Provider-agnostic data access layer

This package defines a layered abstraction over Convex's database API. The goal is that all data access logic in Convex functions goes through this layer — `ctx.db` should never appear outside of a single `ConvexTranslator` file per app.

### Why This Exists

Without this layer, every Convex query and mutation would call `ctx.db` directly. This creates tight coupling to Convex's API shape, makes testing harder, and means that any future database migration would require rewriting every query individually.

With this layer, all queries are expressed as repository calls. A repository describes *what data is needed*. The translator (Convex-specific) describes *how to get it*. Swapping databases only requires rewriting the translator.

### Layer Overview

```
Convex handler
    │
    ▼
ConvexTranslator    ← the ONLY place ctx.db appears, per app
    │
    ▼
ITranslator         ← interface: provider-agnostic contract
    │
    ▼
BaseRepository      ← base class: CRUD operations + query building
    │
    ▼
FeatureRepository   ← per-entity class: custom query methods
    │
    ▼
DbSet               ← fluent query builder (select / update / delete)
```

### Usage in a Convex Function

```ts
// convex/features/transactions/queries.ts

export const getByMonth = query({
  args: { userId: v.string(), month: v.number() },
  handler: async (ctx, args) => {
    const db = new ConvexTranslator(ctx.db)
    const repo = new TransactionRepository(db)
    return repo.getByMonth(args.userId, args.month)
  },
})
```

### Writing a Repository

```ts
// convex/features/transactions/TransactionRepository.ts

import { BaseRepository } from "@mosaic/db"
import type { ITranslator } from "@mosaic/db"

export class TransactionRepository extends BaseRepository<Transaction> {
  constructor(db: ITranslator) {
    super("transactions", db)
  }

  async getByMonth(userId: string, month: number): Promise<Transaction[]> {
    return this.db.select()
      .where({ userId, month })
      .orderBy("date", "desc")
      .returnAll()
  }
}
```

### Exported API

| Export | Purpose |
|--------|---------|
| `BaseRepository<T>` | Extend this for every entity |
| `DbSet<T>` | Fluent query builder — used internally by repositories |
| `SelectBuilder<T>` | Chainable `.where()`, `.orderBy()`, `.limit()` |
| `UpdateBuilder<T>` | Chainable field updates |
| `DeleteBuilder<T>` | Chainable conditional deletes |
| `IQueryable<T>` | Pure data interface — no Convex types |
| `ITranslator` | Database provider interface |

### Rules

- `ctx.db` may only appear in `convex/_shared/ConvexTranslator.ts` — one file per app
- Convex functions never call `DbSet` directly — they instantiate a repository and call its methods
- Repositories contain query logic, not business logic
- Do not import `@mosaic/db` from the frontend — it is a backend package

---

## @mosaic/config

**Path:** `packages/config`
**Purpose:** Shared tooling configuration

Exports a base TypeScript config (`tsconfig.base.json`) and a shared Tailwind configuration. All app-level `tsconfig.json` files extend from here. This ensures strict mode, path aliases, and compiler settings are consistent across every app without duplication.

Apps may extend the shared Tailwind config to add their own CSS variable mappings (e.g. the seasonal variables on the platform), but they should not change the core colour palette families (zinc, emerald, orange, blue, red).

---

## Adding a New Shared Component

1. Create the component in `packages/ui/src/components/YourComponent.tsx`
2. Export it from `packages/ui/src/index.ts`
3. Import it in any app with `import { YourComponent } from "@mosaic/ui"`
4. Do not duplicate the component file across apps

## Adding a New shadcn Primitive

1. Run `npx shadcn@latest add <component>` inside `packages/ui/` (not inside an app)
2. The component lands in `packages/ui/src/components/ui/`
3. Export it from `packages/ui/src/index.ts`
4. Import in apps with `import { Button } from "@mosaic/ui"`
