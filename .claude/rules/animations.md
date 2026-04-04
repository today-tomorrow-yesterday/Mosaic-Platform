# Animation & Transition Rules

## Core Philosophy
- **Nothing blinks into existence.** Every element that appears, disappears, or changes state must have a transition. No instant swaps.
- **Smooth, easygoing, elegant.** This is a personal dashboard — not a productivity tool. Motions should feel unhurried and refined.
- **CSS-first.** Prefer CSS animations and transitions over JS-driven style changes. Only use JS (`style.setProperty`) when cursor-tracking or distance calculations are required (e.g. proximity hover).
- **Never `transition: all`** — always name the specific properties. It causes unexpected performance issues and animates things that shouldn't move.

## Easing Curves (use these, no others)
| Curve | When to use |
|---|---|
| `cubic-bezier(0.22, 1, 0.36, 1)` | **Default enter** — spring, fast acceleration, long soft tail |
| `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | **Return to rest / settle** — slow graceful deceleration |
| `cubic-bezier(0.4, 0, 0.2, 1)` | **Standard UI** — material-style, feels purposeful |
| `cubic-bezier(0.16, 1, 0.3, 1)` | **Panel height spring** — dramatic expansion with tail |
| `linear` | **Looping animations only** (shimmer, spin) — never for one-shot transitions |
| `ease` | **Micro-interactions only** (toggle, border color) — duration ≤ 150ms |

## Timing Scale
| Category | Duration | Curve |
|---|---|---|
| Micro (highlight, border, color) | `100–150ms` | `ease` |
| Standard hover state | `150–200ms` | `ease` or `cubic-bezier(0.4,0,0.2,1)` |
| Element enter | `240–360ms` | `cubic-bezier(0.22,1,0.36,1)` |
| Element exit | `60–120ms` | `ease` |
| Content slide-in (tab/type change) | `240–280ms` | `cubic-bezier(0.22,1,0.36,1)` |
| Panel expand (width phase) | 33% of total | `cubic-bezier(0.25,0.1,0.25,1)` |
| Panel expand (height phase) | 67% of total | `cubic-bezier(0.16,1,0.3,1)` |
| Panel collapse | `~50%` of expand | `cubic-bezier(0.4,0,0.6,0)` → `cubic-bezier(0.4,0,0.2,1)` |
| Return to rest (card hover) | `720ms` | `cubic-bezier(0.25,0.46,0.45,0.94)` |

## Hover — Two-Speed Card System
Cards use a two-speed transition system to feel responsive while hovering but graceful when releasing:

```css
/* Fast: while cursor is actively driving a card */
.bento-prox-container {
  transition: transform 0.13s linear;
}

/* Slow: card returning to rest (add .settling class via JS) */
.bento-prox-container.settling {
  transition: transform 0.72s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

- Add `.settling` class **before** setting CSS variables back to resting state
- Remove `.settling` class **when** the card becomes the focused card again
- The dim overlay (`--prox-dim`) uses the same slow curve: `0.55s cubic-bezier(0.25,0.46,0.45,0.94)`
- **DO NOT** use `onMouseEnter`/`onMouseLeave` for hover animations — use CSS `:hover` pseudo-classes or the existing proximity system

## Content That Changes (Tabs, Settings, Type Switches)
When content swaps due to user selection (e.g. clicking a different background type or tab):

1. Wrap the changing section in a div with a `key` that includes the selected value
2. Apply a slide-in animation to that div
3. React will remount the div on key change, replaying the animation automatically

```tsx
<div
  key={`${stackId}::${selectedType}`}
  style={{ animation: "bgSettingsIn 260ms cubic-bezier(0.22,1,0.36,1) both" }}
>
  {/* content */}
</div>
```

```css
@keyframes bgSettingsIn {
  from { opacity: 0; transform: translateX(16px); }
  to   { opacity: 1; transform: translateX(0); }
}
```

- Direction: **always slide in from the right** (new content comes from `translateX(+N)`)
- This applies to: tab panels, settings sections, type-specific controls, stack switches

## Panel Expand/Collapse (Fixed-Position Overlays)
For panels that grow from a small trigger (e.g. Glass Lab):

- Animate **actual `width` and `height`** — never `scale` transforms (scale distorts content)
- Use `overflow: hidden` + `box-sizing: border-box` on the wrapper to clip content during expansion
- Two-phase sequence: **width first, then height** (or reverse for collapse)
- Content inside the panel starts invisible (`opacity: 0`) and cascades in **after** the panel looks visually complete
- Spring curves front-load motion — the panel looks done at ~65% of total duration. Time content delays to that visual completion point, not the mathematical end

```css
@keyframes panelIn {
  0%   { width: <trigger-w>;  height: <trigger-h>; animation-timing-function: cubic-bezier(0.25,0.1,0.25,1); }
  33%  { width: <full-w>;     height: <trigger-h>; animation-timing-function: cubic-bezier(0.16,1,0.3,1); }
  100% { width: <full-w>;     height: <full-h>; }
}
```

## Element Cascade (Staggered Children)
When a container finishes expanding, child sections should cascade top-to-bottom:

```tsx
// Header section
style={{ animation: "glabElIn 360ms cubic-bezier(0.22,1,0.36,1) 580ms both" }}

// Sub-section (80ms after)
style={{ animation: "glabElIn 360ms cubic-bezier(0.22,1,0.36,1) 660ms both" }}

// Content area (80ms after that)
style={{ animation: "glabElIn 360ms cubic-bezier(0.22,1,0.36,1) 740ms both" }}
```

- Stagger: **60–80ms** between sections
- Direction: `translateY(-22px) → translateY(0)` (sections drop into frame from above)
- Use `animation-fill-mode: both` so sections are invisible before their delay fires
- Exit (on close): `60–100ms ease both` — content disappears fast so the container can collapse cleanly

## Element Reappearance (Slide-In from Edge)
When a UI element was hidden while something else was open (e.g. the Lab trigger button):

- Use a CSS animation + React `key` increment — **not** a CSS `opacity` transition
- For right-edge elements: slide in from `translateX(+N)` (off-screen right)
- Only trigger on the relevant state transition, **not on initial mount** — use a ref to track previous state:

```tsx
const prevOpenRef = useRef(false)
const [animKey, setAnimKey] = useState(0)

useEffect(() => {
  if (!isOpen && prevOpenRef.current) setAnimKey(k => k + 1)
  prevOpenRef.current = isOpen
}, [isOpen])
```

## Shimmer Borders
Use the `@property` + `conic-gradient` technique on a 1px-padding wrapper:

```css
@property --lab-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
@keyframes shimmer { to { --lab-angle: 360deg; } }
.shimmer-wrap {
  animation: shimmer 2.64s linear infinite;
  background: conic-gradient(from var(--lab-angle) at 50% 50%, ...);
  padding: 1px;          /* border thickness */
  padding-right: 0;      /* flush against screen edge if applicable */
}
```

- The inner element gets `background` to cover the gradient, creating a border-only effect
- Speed: `2.5–3s` for elegant, unhurried rotation — never faster than 2s
- Apply the same shimmer class to related elements (trigger + panel) so they share animation state

## CSS Hover via Class (Not onMouseEnter/Leave)
```css
.my-button {
  transition: background 0.18s ease, color 0.15s ease;
}
.my-button:hover {
  background: rgba(255,255,255,0.07);
}
.my-button::after {
  /* decorative underline, indicator, etc. */
  transform: scaleX(0);
  transition: transform 0.2s cubic-bezier(0.22,1,0.36,1);
}
.my-button:hover::after {
  transform: scaleX(1);
}
```

- Add CSS classes via `<style>` tags in the component or `globals.css`
- Never `onMouseEnter`/`onMouseLeave` for pure visual hover — those belong to server components' forbidden list and are unnecessary here

## `will-change`
- Add `will-change: transform` to elements frequently animated via transform (proximity cards, panels)
- Do **not** add it speculatively — only on elements with known frequent animation
