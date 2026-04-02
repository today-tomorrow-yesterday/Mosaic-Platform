# Platform Dashboard

**App:** `apps/platform`
**URL:** `atlas-homevault.com`
**Status:** Live

## What It Is

The platform dashboard is the front door to Mosaic. It is a personal home screen — not a marketing page, not an admin panel. Its job is to give the user a single place to see the state of their life and jump into any of their apps. Think of it as the springboard between everything that Mosaic does.

## Intent

The dashboard should feel calm and personal, not utilitarian. It uses a seasonal visual system so the interface reflects the time of year. The goal is that opening it every morning feels like glancing at a tasteful physical planner — grounding, not overwhelming.

## How to Use It

1. Sign in via Clerk — the page is fully auth-gated
2. The greeting at the top reads your name and the date
3. The bento grid below shows your permanent apps (Home, Budget, Calendar, Baby)
4. Tap any card to navigate directly into that app
5. The AI Studio section at the bottom shows the Build card and any prototype apps you have saved

## Features

### Seasonal Theming

The dashboard has six visual seasons, each defined by a complete set of CSS custom properties:

| Season | Trigger | Accent |
|--------|---------|--------|
| Spring | Mar–May | Soft green |
| Summer | Jun–Aug | Warm amber |
| Fall | Sep–Nov | Burnt orange |
| Winter | Dec–Feb | Cool blue |
| Halloween | Late Oct | Pumpkin orange |
| Christmas | Dec | Festive red |

Seasons auto-detect from the current date. Users can override the season manually through the avatar menu — the choice is persisted in a cookie.

The CSS variables injected per season are:

```css
--s-bg            /* Page background colour */
--s-accent        /* Primary interactive colour */
--s-text-primary  /* Heading text */
--s-logo-bg       /* Icon container background */
--s-glow-a/b/c    /* Ambient background glows */
```

### Bento Grid

Four permanent app cards arranged in a responsive bento grid. On desktop the layout is a 3-column grid with fixed row heights. On mobile it collapses to a single column.

Each card carries:
- App name and a short description
- A colour theme derived from the app's identity
- A direct navigation link (no intermediate step)
- A hover animation (lift + shadow)

The Calendar card currently shows a "Coming soon" badge — it has a UI but no live backend data yet.

### AI Studio Section

Below the main bento grid, a labelled section titled "AI Studio" holds:
- The Build card (entry point to `/studio`)
- Any prototype apps the user has previously saved (rendered as cards alongside the Build card)

The Build card has a rotating conic-gradient border animation that signals it is a creative surface, distinct from the navigational cards above it.

### Avatar Menu

The avatar in the top-right corner opens a dropdown containing:
- User name and email (from Clerk)
- Season override picker (6 seasons + Auto)
- Sign out

The season selection uses an optimistic update — the UI reacts immediately, and the cookie is written in the background.

### LogoBees

The Mosaic logo in the header includes a subtle animated bee motif that adjusts its behaviour per season (speed, path, colour). It is a purely decorative touch and does not affect functionality.

## Technical Notes

- Fully server-rendered except `AvatarMenu` and `BuildCard` which are client components (require state and event handlers)
- Seasonal CSS variables are injected server-side via `<style>` tags in the root layout, derived from a `getSeason()` utility that reads the current date and any session cookie override
- The bento grid uses a custom `bento-grid` CSS class with fixed `grid-template-rows` on large screens only
- `ConvexClientProvider` wraps the layout for any child components that need Convex hooks

## Files

```
apps/platform/src/
  app/
    page.tsx                  Landing page — bento grid, greeting, AI Studio section
    layout.tsx                Root layout — fonts, Clerk, Convex, seasonal vars
    globals.css               All animations, season vars, bento layout
  components/
    AvatarMenu.tsx            User dropdown + season picker
    BuildCard.tsx             Entry card to AI Studio
    LogoBees.tsx              Animated logo
    ConvexClientProvider.tsx  Convex setup
  lib/
    season.ts                 Season detection and CSS var mapping
```
