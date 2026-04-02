# Baby Tracker

**App:** `apps/baby-tracker`
**URL:** `baby.atlas-homevault.com`
**Status:** Scaffolded — UI complete, backend not connected

## What It Is

The Baby Tracker logs a young child's daily activities and developmental milestones. It tracks feeds, sleep sessions, and diaper changes throughout the day, and shows a milestone checklist for the child's current age. It is designed for the first 0–5 years of a child's life.

## Intent

The early months of parenthood involve a lot of repetitive data — how long ago was the last feed? Is the baby sleeping more today than yesterday? Is this milestone normal for their age? Baby Tracker captures this information without friction so parents can answer these questions quickly and spot patterns over time.

The design is intentionally minimal and clinical-feeling — it should be usable at 3am with one hand.

## How to Use It

1. Navigate to `baby.atlas-homevault.com` or tap the Baby card on the platform dashboard
2. The stat cards at the top show age, milestone progress, and today's feed count at a glance
3. The milestones section shows which developmental checkpoints have been reached
4. Today's log shows a chronological record of feeds, sleeps, and diaper changes entered today
5. (Planned) Tap the + button to log a new activity
6. (Planned) Tap a pending milestone to mark it as completed

## Features

### Stat Cards

Three summary cards across the top:

| Card | Content | Accent |
|------|---------|--------|
| Age | Child's current age in months | Orange |
| Milestones | Completed / total for current age range | Green |
| Today's Feeds | Count of feed entries logged today | Blue |

These use the shared `StatCard` component from `@mosaic/ui`.

### Milestones

A checklist of developmental milestones for the child's current age range. Each row shows:

- A filled green dot (completed) or empty circle (pending)
- Milestone description
- Date completed (for completed milestones) or "Upcoming" (for pending)
- A small status badge

Milestones are ordered by expected age. Completed milestones appear first.

The milestone list is currently hardcoded for a 4-month-old. When the backend is connected, milestones will be loaded from a reference table keyed by age range and compared against logged completions.

### Today's Log

A reverse-chronological list of all activities logged today. Each entry uses the shared `Badge` component to indicate type:

| Badge | Colour | Activity |
|-------|--------|---------|
| Feed | Blue | Breast or bottle feeding with volume |
| Sleep | Default (grey) | Nap or overnight sleep with duration |
| Diaper | Orange | Wet or dirty diaper change |

Each row shows the badge, a short note (e.g. "6 oz formula", "2 hr nap"), and the time using tabular numerals for clean alignment.

## Technical Notes

- All data is currently hardcoded mock data for a 4-month-old child
- The Convex schema is empty — tables need to be defined for children, milestones, and log entries
- Uses `AppHeader` and `StatCard` from `@mosaic/ui` — the most complete usage of shared components after the Home app
- `Badge` component from `@mosaic/ui` is used for activity type labels

## Planned Data Model

```
children table:
  name        string
  birthDate   number       (unix timestamp)
  ownerId     string

milestoneDefinitions table:
  description     string
  ageMonthsMin    number
  ageMonthsMax    number
  category        motor | social | language | cognitive

milestoneCompletions table:
  childId         id(children)
  definitionId    id(milestoneDefinitions)
  completedAt     number
  ownerId         string

activityLog table:
  childId         id(children)
  type            feed | sleep | diaper
  startTime       number
  endTime         number        (for sleep)
  note            string        (volume, duration, diaper type)
  ownerId         string
```

## Files

```
apps/baby-tracker/src/
  app/
    page.tsx      Full page — stat cards, milestones, today's log
    layout.tsx    Root layout — Clerk, Convex, fonts
  components/
    ConvexClientProvider.tsx
```
