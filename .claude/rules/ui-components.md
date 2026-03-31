# UI & Component Rules

## Where Components Live
- Shared components consumed by multiple apps → `packages/ui/src/components/`
- Custom Mosaic components (flat): `AppHeader`, `StatCard`, `Badge`, `ProgressBar`
- shadcn primitives (in `ui/` subfolder): `Button`, `Card`, `Accordion`
- App-specific components that will never be shared → stay inside the app's `src/components/`
- Export everything shared from `packages/ui/src/index.ts`

## Styling Rules
- **Tailwind CSS only** — no CSS modules, no inline `style={{}}`, no styled-components
- Use `cn()` from `@mosaic/ui` for all conditional or merged class names
- **No dark mode** — light design only, no `.dark` variants
- Page background: `bg-[#f4f4f5]` (zinc-100 equivalent)
- Cards/panels: `bg-white border border-zinc-200 rounded-2xl`

## Color Palette
- Neutrals: `zinc-*` (text, borders, backgrounds)
- Success/active: `emerald-*`
- Warning/highlight: `orange-*`
- Info/primary: `blue-*`
- Error/danger: `red-*`
- **DO NOT** introduce new color families without discussion

## shadcn Components
- shadcn components use the CSS variable color system (`hsl(var(--primary))` etc.)
- CSS variables are defined in each app's `globals.css` under `:root`
- Tailwind config in each app maps color names to CSS vars — do not remove this mapping
- To add a new shadcn component: create it in `packages/ui/src/components/ui/`, export from index

## CSS Variable Color System
- All apps share the same CSS variable definitions (light theme only)
- `--primary`: dark zinc (buttons, strong text)
- `--muted`: light zinc (backgrounds, subtle text)
- `--border`: zinc border color
- `--destructive`: red (errors, delete actions)
- Do not redefine these per-app — they are intentionally consistent

## Typography
- Font: Inter (loaded via `next/font/google` in each app's `layout.tsx`)
- Applied via `className={inter.className}` on the `<html>` element
- **DO NOT** load fonts in individual components — always via layout

## AppHeader
- Every app page should start with `<AppHeader name="App Name" actions={<UserButton />} backHref={...} />`
- `backHref` should use `process.env.NEXT_PUBLIC_PLATFORM_URL ?? "https://atlas-homevault.com"`
