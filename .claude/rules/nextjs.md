# Next.js Rules

## Server vs Client Components
- All components are **Server Components by default** — do not add `"use client"` unless required
- Only add `"use client"` when the component needs:
  - `useState` / `useReducer` / `useRef`
  - `useEffect`
  - DOM event handlers (`onClick`, `onChange`, `onSubmit`, etc.)
  - Browser-only APIs
  - Clerk client hooks (`useUser`, `useAuth`, `useClerk`)
  - Convex client hooks (`useQuery`, `useMutation`)

## Hover and Interactive States
- **NEVER** use `onMouseEnter` / `onMouseLeave` in server components — they are silently ignored
- All hover effects use Tailwind: `hover:`, `group-hover:`, `focus:`, `focus-visible:`
- Add `group` class to the parent, `group-hover:` to children for coordinated hover effects

## Auth Patterns
```ts
// Server component — use currentUser() or auth()
import { currentUser, auth } from "@clerk/nextjs/server"
const user = await currentUser()
const { userId } = await auth()

// Client component — use hooks
import { useUser, useAuth } from "@clerk/nextjs"
const { user } = useUser()
```

## App Router Conventions
- Layouts in `layout.tsx`, pages in `page.tsx`, loading states in `loading.tsx`, errors in `error.tsx`
- API routes in `app/api/<route>/route.ts`
- Sign-in/up pages at `app/sign-in/[[...sign-in]]/page.tsx` and `app/sign-up/[[...sign-up]]/page.tsx`
- `ConvexClientProvider` wraps children in `layout.tsx` — it already guards against missing `NEXT_PUBLIC_CONVEX_URL`

## Environment Variables
- Server-only vars (no prefix): safe for server components, API routes, Convex functions
- `NEXT_PUBLIC_*` vars: exposed to the browser — never put secrets here
- Always guard against missing env vars — **never** use `process.env.VAR!` (non-null assertion)
- Each app reads its own `.env.local` — the root `.env.local` is not read by apps

## Ports (Local Dev)
- platform: 3000, budget: 3001, calendar: 3002, baby-tracker: 3003, home: 3004
- Use `NEXT_PUBLIC_PLATFORM_URL` / `NEXT_PUBLIC_HOME_URL` etc. env vars for cross-app links
