# Convex Rules

## Before Writing Any Convex Code
- **Always read `convex/_generated/ai/guidelines.md` first** — it overrides training data on Convex APIs
- Each app has its own independent Convex project and deployment — they do not share data

## Function Structure
- Use `query`, `mutation`, `action` from `convex/server` with `v` validators on all args
- Organize by feature: `convex/features/<feature>/queries.ts` and `mutations.ts`
- Every function that touches data instantiates `ConvexTranslator`: `const db = new ConvexTranslator(ctx.db)`
- Then passes `db` to a repository: `const repo = new FeatureRepository(db)`

```ts
// DO — correct pattern
export const getItems = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const db = new ConvexTranslator(ctx.db)
    const repo = new ItemRepository(db)
    return repo.getBy({ userId: args.userId })
  },
})

// DON'T — never use ctx.db directly
export const getItems = query({
  handler: async (ctx) => {
    return ctx.db.query("items").collect() // WRONG
  },
})
```

## Repository Pattern
- Each entity gets a repository that extends `BaseRepository<T>` from `@mosaic/db`
- Place repositories at `convex/features/<feature>/<Feature>Repository.ts`
- Add custom query methods to the repository — do not add business logic to Convex handlers

```ts
// DO — repository for custom queries
export class ItemRepository extends BaseRepository<Item> {
  constructor(db: ITranslator) {
    super("items", db)
  }

  async getActiveByUser(userId: string): Promise<Item[]> {
    return this.db.select().where({ userId, active: true }).returnAll()
  }
}
```

## Schema
- Define all tables in `convex/schema.ts` using `defineTable` and `v` validators
- Add `_id` and `_creationTime` are injected by Convex — do not define them in schema
- Add indexes for fields used in `.where()` conditions
- **DO NOT** store computed values — derive them at query time

## Auth
- `auth.config.ts` is pre-configured for Clerk — do not modify the provider structure
- Get the authenticated user in mutations/queries via `ctx.auth.getUserIdentity()`
- Always validate the user is authenticated before data operations in mutations
