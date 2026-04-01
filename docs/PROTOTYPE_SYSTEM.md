# Mosaic — Prototype System Design

## Overview

The Prototype System is the AI-powered app creation engine inside Mosaic. A family member describes an idea in plain language; an AI agent builds a working React application in real time; the user iterates until it's right; then they can keep using it or promote it to a full permanent app.

---

## App Lifecycle

```
IDEA → BUILDING → PROTOTYPE → [iterate] → PROMOTED
                                   ↓
                               ARCHIVED
```

| State | Description | Landing page appearance |
|-------|-------------|------------------------|
| `building` | AI is currently generating the app | Pulsing shimmer card with progress indicator |
| `prototype` | App exists, user can view + edit | Dashed-border card with "Edit" + "Open" actions |
| `promoted` | Elevated to a permanent app | Full-color permanent card (like Home/Budget) |
| `archived` | Hidden from dashboard | Not shown |

---

## The Studio UI

### Layout
A full-screen overlay or dedicated route (`/studio` or `/studio/[id]`) with two panes:

```
┌────────────────────────────────────────────────────┐
│  ← Back   🌸 Garden Monitor                  [Save] │
├──────────────────────┬─────────────────────────────┤
│                      │                             │
│   AI Chat            │   Live Preview              │
│                      │                             │
│   [message history]  │   ┌─────────────────────┐  │
│                      │   │                     │  │
│                      │   │  <iframe sandbox>   │  │
│                      │   │                     │  │
│   ────────────────── │   └─────────────────────┘  │
│   Describe a change  │                             │
│   [_______________]  │   [Fullscreen] [Copy code]  │
│   [Send]             │                             │
└──────────────────────┴─────────────────────────────┘
```

### Chat Panel
- Full message history with the AI
- Code blocks shown collapsed with a "Show code" toggle
- Streaming response as the AI generates
- "Rebuild from scratch" option in overflow menu

### Preview Panel
- Sandboxed iframe containing the transpiled React app
- Auto-refreshes when AI produces new code
- "Fullscreen" button for testing the app
- "Copy source" button for power users
- Error overlay if the code fails to compile

---

## Sandbox Execution Environment

### Approach: In-Browser Transpilation

The prototype app runs entirely in the browser — no server required for execution.

```
AI generates JSX/React code
         ↓
Babel standalone (@babel/standalone) transpiles to ES5
         ↓
Code injected into sandboxed iframe as a blob URL
         ↓
React + ReactDOM loaded from CDN inside the iframe
         ↓
App renders
```

### Iframe Sandbox Attributes
```html
<iframe
  sandbox="allow-scripts allow-same-origin"
  srcdoc="..."
/>
```

The `srcdoc` contains a complete HTML document:
```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.development.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.development.js"></script>
  <link rel="stylesheet" href="https://cdn.tailwindcss.com">
</head>
<body>
  <div id="root"></div>
  <script>
    // Babel-transpiled user code injected here
    // ReactDOM.createRoot(document.getElementById('root')).render(<App />)
  </script>
</body>
</html>
```

### Limitations
- No file system access
- No server-side code (no API routes, no databases)
- Network requests are sandboxed
- Complex npm packages not available (only React, standard browser APIs, Tailwind CDN)
- For data persistence: localStorage inside the iframe (ephemeral per session)

### Future: Server-Side Prototypes
When a prototype needs real data persistence, the AI can generate a Convex schema + functions alongside the React frontend. A shared "prototype" Convex project handles all prototype backends, namespaced by prototype ID.

---

## AI Agent Integration

### Model
Claude claude-sonnet-4-6 (or Claude Opus 4.6 for complex apps). The AI receives:
- A system prompt describing the sandbox capabilities and constraints
- The user's description
- The current code (for iteration requests)
- Error messages from the sandbox if the current code is broken

### System Prompt (Draft)
```
You are a React application builder. You generate complete, working React 
components that run in a browser sandbox with Tailwind CSS available.

Rules:
- Output ONLY valid JSX. No import statements (React is global).
- Use Tailwind CSS for all styling.
- The entry component must be named `App` and exported as default.
- No TypeScript (plain JavaScript only).
- No external libraries beyond React and Tailwind.
- Make the UI polished and mobile-friendly.
- Include realistic placeholder data so the app looks complete.
```

### Streaming
The AI streams its response. The preview panel shows a "Building..." state until the first complete code block is detected, then renders immediately. Subsequent streaming updates are buffered and applied when complete.

---

## Landing Page — Prototype Cards

### Visual Distinction
Prototype cards use a **shimmer border animation** and a "Prototype" badge to differentiate them from permanent cards.

```
┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐
╎  🌱 Prototype                     [Edit] [···] ╎
╎                                                ╎
╎  Garden Monitor                                ╎
╎  Track soil moisture, sunlight, and            ╎
╎  seasonal planting windows.                    ╎
╎                                                ╎
╎  [Open app ↗]             by Sarah  Mar 2026  ╎
└╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘
```

- Border: animated gradient (season accent → violet → blue, rotating)
- Background: white, no colored tint
- Badge: small "Prototype" pill in top-left
- Actions: Edit (opens Studio), overflow menu (Archive, Promote...)
- Footer: creator name + creation date

### Build Card (the entry point)
Always the last card in the grid. Static visual, inviting the user to create something:

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
│                                               │
│   ✨                                          │
│                                               │
│   AI Studio                                   │
│   Describe any idea. Your AI builds           │
│   a working app — no code needed.             │
│                                               │
│                      [Start building →]       │
│                                               │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
```

---

## Promotion Flow

When a user wants to promote a prototype to a permanent app:

1. Owner clicks "Promote" in the prototype card overflow menu
2. A form collects:
   - App name (becomes the subdomain slug)
   - Description
   - Icon selection
3. An admin approval step (owner only, since this creates infrastructure)
4. System creates:
   - New Next.js app in `apps/{name}/`
   - New Convex project (or namespace in shared project)
   - Vercel deployment
   - DNS record for subdomain
5. The landing page card transitions from prototype to permanent style

---

## Data Model (Convex — Platform App)

```ts
// convex/schema.ts (platform app)
defineTable("prototypeApps", {
  name: v.string(),
  description: v.string(),
  ownerId: v.string(),              // Clerk user ID
  code: v.string(),                 // Current JSX source
  status: v.union(
    v.literal("building"),
    v.literal("prototype"),
    v.literal("promoted"),
    v.literal("archived")
  ),
  conversationHistory: v.array(v.object({
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    timestamp: v.number(),
  })),
  createdAt: v.number(),
  updatedAt: v.number(),
})
```

---

## Open Questions

- **Subdomain strategy for promoted apps**: Dedicated subdomain vs `/apps/{slug}` route?
- **Convex isolation**: Shared prototype Convex project with namespacing vs per-prototype projects?
- **Collaboration**: Can multiple family members co-edit a prototype?
- **Version history**: Should the system keep code snapshots for rollback?
- **Asset handling**: Images/files in prototypes — use public CDN URLs for now?
- **Mobile Studio**: The split-pane Studio might not work well on phone. Consider a tabbed view (Chat | Preview) on mobile.
