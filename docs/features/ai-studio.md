# AI Studio

**App:** `apps/platform` — route `/studio`
**URL:** `atlas-homevault.com/studio`
**Status:** In Development

## What It Is

AI Studio is a conversational app builder. The user describes what they want — "a habit tracker with a weekly grid and streak counters" — and the AI generates a fully working, interactive React application that renders in a live preview right next to the conversation. No code knowledge required.

Generated apps are called **prototypes**. They run entirely in the browser using a sandboxed iframe. Users can iterate on them through conversation, save them to their dashboard, and eventually promote them to become permanent Mosaic apps backed by real infrastructure.

## Intent

Most software ideas die because the gap between idea and working code is too wide. AI Studio closes that gap to a single sentence. The intent is not to replace development — it is to give non-technical family members a place to experiment with personalised tools without ever touching a code editor.

The Studio is also the creative layer of Mosaic. Permanent apps (Budget, Home, etc.) are functional but fixed. The Studio is where users invent things that don't exist yet.

## How to Use It

1. From the dashboard, click the **Build** card in the AI Studio section
2. The Studio opens full-screen with a chat panel on the left and a live preview on the right
3. Type what you want to build, or tap one of the suggestion chips to start from an example
4. Watch the progress indicator as the AI designs, writes, and previews the app
5. When the preview appears, interact with it — it is a real working application
6. Use the refinement chips below the AI response to iterate ("Add dark mode", "Make the chart interactive")
7. Click **Save** to persist the prototype to your dashboard
8. Use the **...** menu for additional actions: Export ZIP, Share URL, Promote to App

## Features

### Chat Interface

The left panel is a conversational thread. Messages are typed by the user and replied to by the AI. The AI response has three parts:

1. **Prose description** — what was built and key design choices
2. **Code block** — the generated JSX, collapsible with a toggle
3. **Refinement chips** — 3–4 tappable suggestions for next steps

Tapping a refinement chip pre-fills the input field with a concrete follow-up prompt. The user can edit it before sending.

### Generation Progress

While the AI is generating, a 4-step progress indicator replaces the typing dots:

1. Reading your idea
2. Designing the layout
3. Writing the components
4. Finishing touches

Steps complete in sequence with checkmarks. This gives visual feedback during the 10–30 second generation window and prevents the "is it broken?" question.

### Live Preview

The right panel renders the generated app in a sandboxed iframe. The sandbox:

- Loads React 18 and ReactDOM from unpkg CDN
- Loads Tailwind CSS from CDN for styling
- Uses Babel standalone to transpile JSX in the browser
- Runs with `sandbox="allow-scripts allow-same-origin"` — no network access, no form submission, no popups

The iframe is refreshed whenever new code is generated. The device toggle in the preview toolbar switches between desktop (full width) and mobile (390px, phone frame).

### Error Handling

If the generated code throws a JavaScript error, the iframe sends a `postMessage` to the parent. The Studio catches this and shows a warm red overlay on the preview with the error message and a **"Fix this error"** button. Clicking the button automatically sends the error back to the AI with a request to fix it — one click, no copy-pasting.

### Version History

Each AI response that contains code is labelled `v1`, `v2`, `v3` etc. A "Restore this version" button appears on hover beside each label, allowing the user to roll back the live preview to any earlier state in the conversation without losing the conversation history.

### Overflow Menu (`...`)

Three additional actions available from the header:

| Action | What it Does |
|--------|-------------|
| Share URL | Generates a public link to view the prototype |
| Export ZIP | Downloads a standalone HTML file that works offline |
| Promote to App | Begins the process of turning the prototype into a permanent Mosaic app |

Export ZIP is fully functional — it generates an `index.html` with all CDN dependencies inline so the file works by simply opening it in a browser.

### Demo Mode

When `NEXT_PUBLIC_STUDIO_AI_ENABLED` is not set to `"true"`, the Studio runs in demo mode. All prompts return the Garden Monitor demo app after a 2.4-second simulated delay. This is useful for local development without an API key.

## Technical Architecture

### API Route

`POST /api/studio/generate`

Requires authentication (Clerk). Accepts:

```json
{ "messages": [{ "role": "user" | "assistant", "content": "..." }] }
```

Returns a Server-Sent Events stream. Event format:

```
data: {"text": "..."}   streaming text chunks
data: [DONE]            generation complete
data: {"error": "..."}  error occurred
```

Uses `claude-opus-4-6` with a system prompt that enforces:
- Single `App` component output
- No import statements (React is global via UMD)
- Tailwind CSS for all styling
- Realistic placeholder data
- Mobile-friendly responsive layout
- Bullet-point refinement suggestions at the end of each response

### Iframe Sandbox

The iframe document is built by `buildIframeDoc(code)` which wraps the user's component in a full HTML document with CDN scripts. The document includes:

```js
window.onerror = function(msg) {
  window.parent.postMessage({ type: 'preview-error', message: msg }, '*')
}
```

This is the only communication channel between the iframe and the Studio — the parent listens for `preview-error` messages and surfaces them in the error overlay.

### Code Extraction

The AI response is parsed by `extractCodeAndProse()`:

1. A regex extracts the fenced code block: ` ```jsx ... ``` `
2. The remaining prose becomes the assistant message
3. Bullet points at the end of the prose become refinement chips
4. If no bullet points are found, a set of generic defaults is used

### State Management

The Studio is a single large client component (`StudioClient.tsx`) with the following key state:

| State | Purpose |
|-------|---------|
| `messages` | Full conversation history |
| `code` | Currently displayed code in the preview |
| `buildStep` | 0–4, drives the generation progress indicator |
| `previewError` | Error message from iframe, drives error overlay |
| `versionCount` | Increments with each generation, labels `v1`, `v2`... |
| `isBuilding` | Disables input during generation |

## Planned: Prototype Persistence

The Convex backend for storing prototypes is not yet built. When complete, it will use:

```
prototypeApps table:
  name            string
  code            string       (latest version)
  ownerId         string       (Clerk user ID)
  status          draft | saved | promoted | archived
  conversationHistory  array  (full message thread)
  createdAt       number
  updatedAt       number
```

On first successful generation, the prototype will auto-save. The Save button will confirm the name and write to Convex. Saved prototypes will appear as cards on the platform dashboard below the Build card.

## Planned: Prototype Promotion

Promotion turns a sandboxed prototype into a real Mosaic app with its own Convex project, subdomain, and deployment. The intended flow:

1. User clicks "Promote to App" from the `...` menu
2. A dialog summarises what will be created
3. The prototype code becomes the starting scaffold for a new Next.js app
4. A new Convex project is provisioned
5. The app appears in the platform bento grid

This is a significant infrastructure undertaking and is not yet started.

## Files

```
apps/platform/src/
  app/
    studio/
      page.tsx                  Route wrapper — server component
      StudioClient.tsx          All Studio UI and logic — client component
    api/
      studio/
        generate/
          route.ts              Streaming Claude API endpoint
  components/
    BuildCard.tsx               Dashboard entry card
```
