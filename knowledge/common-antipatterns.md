# Common Anti-Patterns

These are patterns that have caused real bugs in this project. Each entry has a bad example, the correct pattern, and why it matters.

---

## 1. Using ctx.db Directly in Convex Functions

**Bad:**
```ts
export const getItems = query({
  handler: async (ctx) => {
    return ctx.db.query("items").collect()
  },
})
```

**Good:**
```ts
export const getItems = query({
  handler: async (ctx) => {
    const db = new ConvexTranslator(ctx.db)
    const repo = new ItemRepository(db)
    return repo.getAll()
  },
})
```

**Why:** The entire data layer abstraction exists to keep all database access consistent, testable, and behind a single interface. Bypassing it breaks the vertical slice pattern and makes queries impossible to swap or mock.

---

## 2. Non-Null Assertion on Environment Variables

**Bad:**
```ts
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
```
*Crashes at runtime with "No address provided to ConvexReactClient" when the var is missing.*

**Good:**
```ts
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null
```

**Why:** Sub-apps don't have Convex projects linked yet. The guard makes the app render without Convex rather than crashing entirely.

---

## 3. Event Handlers in Server Components

**Bad:**
```tsx
// Server component — onMouseEnter is silently ignored, hover never fires
export default function Card() {
  return <div onMouseEnter={() => setHovered(true)}>...</div>
}
```

**Good:**
```tsx
// Server component — pure Tailwind hover
export default function Card() {
  return <div className="group hover:shadow-xl transition-all">
    <span className="group-hover:text-orange-500">...</span>
  </div>
}
```

**Why:** Next.js App Router components are server components by default. Event handlers require client-side JS and are silently stripped — no error, just no behavior.

---

## 4. Hardcoding Production URLs for Cross-App Links

**Bad:**
```tsx
<a href="https://home.atlas-homevault.com">Home</a>
```
*Always routes to production during local development.*

**Good:**
```tsx
<a href={process.env.NEXT_PUBLIC_HOME_URL ?? "https://home.atlas-homevault.com"}>Home</a>
```

**Why:** Each app runs on a different localhost port in dev. Without env var overrides, clicking app links always navigates to the live production domain.

---

## 5. @apply With Undefined CSS Custom Properties

**Bad:**
```css
/* globals.css — without the CSS vars defined in tailwind.config.ts */
body { @apply bg-background text-foreground; }
```
*Silently produces no styles — body has no background or text color.*

**Good:**
- Define CSS variables in `globals.css` under `:root`
- Map them in `tailwind.config.ts` under `theme.extend.colors`
- Then `@apply bg-background` works

**Why:** Tailwind only generates classes for colors it knows about. If `background` isn't in the theme config, `bg-background` is an unknown class and generates nothing.

---

## 6. Running `npx convex dev` in Sub-Apps Without a Linked Project

**Bad:**
```json
{ "dev": "concurrently \"npx convex dev\" \"next dev --port 3001\"" }
```
*Convex CLI crashes immediately in non-interactive terminal, marking the entire task as failed.*

**Good:**
```json
{ "dev": "next dev --turbo --port 3001" }
```

**Why:** Sub-apps (budget, calendar, home, baby-tracker) don't have Convex projects linked yet. Add `npx convex dev` back to the dev script only after running `npx convex dev` interactively and linking a project.

---

## 7. Importing Between Apps

**Bad:**
```ts
// In apps/budget/
import { SomeComponent } from "../../calendar/src/components/SomeComponent"
```

**Good:**
```ts
// Promote it to packages/ui or packages/db first
import { SomeComponent } from "@mosaic/ui"
```

**Why:** Apps are independently deployable. Cross-app imports create tight coupling, break Turborepo's task graph, and will cause build failures in CI.

---

## 8. Missing postcss.config.js

**Symptom:** Tailwind classes produce no styles — page renders as unstyled HTML.

**Fix:** Every Next.js app needs `postcss.config.js` at its root:
```js
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }
```

**Why:** Without PostCSS config, the Tailwind PostCSS plugin never runs and no CSS is generated. This is not scaffolded automatically.
