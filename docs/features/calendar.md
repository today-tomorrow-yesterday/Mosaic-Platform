# Calendar

**App:** `apps/calendar`
**URL:** `calendar.atlas-homevault.com`
**Status:** Scaffolded — UI complete, backend not connected

## What It Is

The Calendar app is a family scheduling tool with a deliberately hand-crafted, sketch-style aesthetic. It shows a week-at-a-glance view and a list of upcoming events, designed to feel like a physical planner rather than a digital productivity tool.

## Intent

Most calendar apps optimise for density and control — minute-by-minute scheduling, drag-and-drop, sync across 10 services. This is not that. The Mosaic Calendar is designed for the rhythm of a family home: loose time blocks, recurring commitments, and the occasional important date that needs not to be forgotten. The sketch aesthetic is intentional — it signals that this is a soft, human tool, not a corporate time-tracker.

## How to Use It

1. Navigate to `calendar.atlas-homevault.com` or tap the Calendar card on the dashboard
2. The current week is shown across 5 day cards — today is highlighted
3. Each day card shows the first event scheduled for that day, or a "free" indicator if nothing is booked
4. The upcoming events list below shows the next several events beyond the current week, with category colour coding
5. The month selector in the header lets you navigate to other months (planned — not yet functional)

## Features

### This Week View

Five day cards arranged horizontally. Each card displays:

- Day abbreviation (Mon, Tue, etc.)
- Date number (large, dominant)
- First event for the day: title and time, or "Free day" placeholder
- Today's card is visually highlighted — a warm amber tint to distinguish it from the rest

The week view is intentionally limited to one event per day card. The intent is overview, not scheduling granularity. A day detail view (showing all events for a day) is planned but not built.

### Upcoming Events

A vertical list of events beyond the current week. Each row shows:

- Date (abbreviated month + day)
- Event title
- Category label with a colour-coded dot

| Category | Colour |
|----------|--------|
| Health | Blue |
| Maintenance | Brown |
| Personal | Green |
| Bills | Red |

The list uses a dashed border container that reinforces the paper-and-pen aesthetic.

### Stats Strip

A small annotation bar between the week view and the upcoming list showing two summary numbers: events this week and events this month. Styled like a footnote.

### Sketch Aesthetic

The entire app applies an SVG displacement-map filter (`feDisplacementMap`) to all card borders, giving them a hand-drawn wobble. A subtle paper grain texture overlay (SVG pattern) is applied to the page background. The typography uses a sketch-appropriate font class (`font-sketch`). The colour palette is warm cream and earth tones rather than pure white and grey.

This aesthetic is unique to the Calendar app — no other Mosaic app uses it.

## Technical Notes

- All event data is currently hardcoded mock data
- The sketch filter is defined as an inline SVG at the root of the page component and referenced via CSS `filter: url(#sketch)`
- The Convex schema is empty — tables need to be defined for events and recurring rules
- The "Coming soon" badge is shown on the dashboard card because the Calendar does not yet have a live backend

## Planned Data Model

```
events table:
  title       string
  start       number       (unix timestamp)
  end         number
  allDay      boolean
  category    string
  ownerId     string
  recurring   boolean
  recurrence  string       (iCal RRULE string, optional)
  notes       string

categories table:
  name        string
  colour      string
  ownerId     string
```

## Files

```
apps/calendar/src/
  app/
    page.tsx      Full page — sketch filter, week view, upcoming list
    layout.tsx    Root layout — Clerk, Convex, fonts
  components/
    ConvexClientProvider.tsx
```
