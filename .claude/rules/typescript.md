# TypeScript Rules

## Strictness
- **No `any`** — if the type is unknown, use `unknown` and narrow it
- **No non-null assertions (`!`)** on environment variables or external data — guard with a conditional
- **No `as` type casts** unless you can explain why the type system cannot infer it
- Enable strict mode in all tsconfigs — it is already set via `@mosaic/config`

## Type Declarations
- Use `type` for data shapes, function signatures, and unions
- Use `interface` only when you need declaration merging or an extensible public contract
- Prefer discriminated unions over optional fields for variant state:

```ts
// DO
type RequestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: Item[] }
  | { status: "error"; message: string }

// DON'T
type RequestState = {
  status: string
  data?: Item[]
  message?: string
}
```

## Functions
- Explicit return types on all exported functions
- Use `async/await` — never `.then()/.catch()` chains
- Never `async` a function that has no `await` inside it

## Environment Variables
```ts
// DO — guard before use
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
const client = convexUrl ? new ConvexReactClient(convexUrl) : null

// DON'T — crashes at runtime if undefined
const client = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
```

## Convex Validators
- Use Convex `v` validators (`v.string()`, `v.number()`, `v.id("table")` etc.) for all Convex function args
- Use Zod only for validation at non-Convex system boundaries (form inputs, external API responses)
- Do not mix Zod and Convex validators for the same data

## Imports
- Use `type` imports for types: `import type { Foo } from "./foo"`
- Keep imports ordered: external packages → internal packages → relative
- No barrel re-exports that create circular dependency risks
