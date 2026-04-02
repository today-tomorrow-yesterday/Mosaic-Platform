# Budget

**App:** `apps/budget`
**URL:** `budget.atlas-homevault.com`
**Status:** Scaffolded — UI complete, backend not connected

## What It Is

The Budget app tracks household income and spending against a monthly budget. It gives the family a single view of where the money went this month, how close they are to their limits per category, and a running log of recent transactions.

## Intent

Household finances are often invisible until something goes wrong. The Budget app makes spending continuously visible without being anxiety-inducing. The design is calm and information-dense — it should feel like a well-organised spreadsheet, not a warning system. The goal is awareness, not behaviour modification.

## How to Use It

1. Navigate to `budget.atlas-homevault.com` or tap the Budget card on the platform dashboard
2. The current month's summary is shown immediately — total spent, remaining budget, and utilisation percentage
3. The donut ring and category bars give a visual breakdown at a glance
4. Scroll down to see the transaction log for the month
5. The month selector in the header lets you navigate to previous months

## Features

### Monthly Overview

Three summary cards at the top of the page:

| Card | Content |
|------|---------|
| Spent this month | Running total of all transactions |
| Remaining | Budget minus spent |
| Monthly budget | The household's total budget cap |

The utilisation percentage is shown as a circular donut ring with a conic-gradient fill. Below the ring, a linear progress bar scales from $0 to the budget cap with the current spend marked.

### Category Breakdown

Each spending category is shown as a row with:

- Category icon (emoji) and name
- Horizontal progress bar colour-coded by utilisation:
  - **Blue** — under 80% used (healthy)
  - **Amber** — 80–99% used (approaching limit)
  - **Red** — at or over 100% used (over budget)
- Amount spent / amount budgeted
- Remaining amount shown below the bar

Default categories: Housing, Food, Transport, Entertainment. Categories are intended to be user-configurable once the backend is connected.

### Transaction Log

A chronological list of recent transactions showing:
- Merchant name and category
- Amount
- Date

The footer of the log shows the count and sum of visible transactions.

### Header

A sticky glassmorphic header with:
- Breadcrumb navigation back to the platform
- Month and year selector
- Clerk user avatar

## Technical Notes

- All data is currently hardcoded as mock data in the page component
- The Convex schema for this app is empty — tables need to be defined for accounts, transactions, and budget rules
- The donut ring is a CSS-only implementation using `conic-gradient` — no charting library required
- Category progress bars use inline width percentages computed from spend/budget ratios

## Planned Data Model

```
accounts table:
  name        string
  type        checking | savings | credit
  ownerId     string

transactions table:
  accountId   id(accounts)
  amount      number         (negative = expense, positive = income)
  merchant    string
  categoryId  id(categories)
  date        number
  ownerId     string

categories table:
  name        string
  icon        string
  budget      number         (monthly limit)
  colour      string
  ownerId     string
```

## Files

```
apps/budget/src/
  app/
    page.tsx      Full page — all UI and mock data
    layout.tsx    Root layout — Clerk, Convex, fonts
  components/
    ConvexClientProvider.tsx
```
