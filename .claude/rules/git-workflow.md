# Git Workflow Rules

## Commit Message Format
Conventional commits — always:
```
<type>(<optional scope>): <short description>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `style`, `test`, `build`

Examples:
- `feat(budget): add category spending query`
- `fix(platform): guard ConvexClientProvider against missing URL`
- `chore(ui): add shadcn Button and Card components`

## Commit Discipline
- **Atomic commits**: feature code + passing typecheck in the same commit — never commit broken types
- Run `pnpm turbo typecheck` before every commit
- One logical change per commit — do not bundle unrelated changes
- **Never** `git commit --no-verify` or `--no-gpg-sign`
- **Never** force-push to `main`

## What Not to Commit
- `.env.local` files — gitignored, contain secrets
- `**/convex/_generated` — gitignored, auto-generated
- `.next/` build output — gitignored
- `node_modules/` — gitignored

## Before Pushing
1. `pnpm turbo typecheck` — must be clean
2. Review the diff — no accidentally committed env vars or secrets
3. Confirm the commit message accurately describes the change
