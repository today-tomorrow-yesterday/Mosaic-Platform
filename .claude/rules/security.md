# Security Rules

## Secrets and Environment Variables
- **Never commit** `.env.local`, `.env`, or any file containing real keys
- All sensitive values go in `.env.local` (gitignored) in each app
- `NEXT_PUBLIC_*` variables are **exposed to the browser** — treat as public
- Server-only secrets (`CLERK_SECRET_KEY`, `CONVEX_DEPLOYMENT`) must never be in `NEXT_PUBLIC_*` vars

## Clerk Authentication
- All pages are protected by Clerk middleware (`src/middleware.ts`) — verify it exists in every app
- Server-side user access: `auth()` or `currentUser()` from `@clerk/nextjs/server`
- Client-side user access: `useUser()` or `useAuth()` from `@clerk/nextjs`
- Never manually decode JWTs — use Clerk's provided helpers
- Sign-in/up routes must be at the paths defined in env: `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`

## Convex Auth
- `auth.config.ts` links Clerk as the auth provider — do not modify the provider domain/applicationID structure
- Verify caller identity in mutations before data writes: `const identity = await ctx.auth.getUserIdentity()`
- Return `null` or throw `new ConvexError("Unauthorized")` for unauthenticated mutation attempts

## No Exposed Internals
- Do not expose database IDs or internal system fields in public-facing responses unless required
- Do not log sensitive user data (email, name) at anything above `debug` level in production
