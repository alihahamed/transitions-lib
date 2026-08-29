# transitions

Characterful page transitions for the Next.js App Router, installed with the shadcn CLI.

Not fades and slides. Strokes that draw themselves across the screen, swap the route
behind their own ink, and retract away.

## Install

```bash
npx shadcn@latest add https://transitions-lib.vercel.app/r/crayon.json
```

Then one line in your layout:

```tsx
// app/layout.tsx
import { CrayonTransition } from '@/components/crayon'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <CrayonTransition>{children}</CrayonTransition>
      </body>
    </html>
  )
}
```

That's the whole integration. Your existing `<Link>`s are intercepted automatically —
nothing else to change.

Recolour with `--crayon-1`, `--crayon-2`, `--crayon-3` in `components/transitions.css`.

## Writing a transition

Every transition is the same two things: markup that covers the screen, and two phases
that move it. `transition-core` handles the rest.

```tsx
export const MyTransition = createTransition({
  overlay: <svg>…</svg>,

  // Runs once after mount — measure things, set the starting state.
  setup: (overlay) => { … },

  // Plays before the route changes.
  leave: ({ overlay, done }) => {
    const tl = gsap.timeline({ onComplete: done })
    …
    return () => tl.kill()
  },

  // Plays after the route changes.
  enter: ({ overlay, done }) => { … },
})
```

The core is **engine-agnostic**. It hands you the overlay element and waits for `done()`.
Crayon uses GSAP; another transition could use Motion. One engine per transition, never
both in the same one.

Every transition gets these for free:

- **Link interception** via `next-transition-router`
- **Timeout failsafe** — if a phase never calls `done()`, the navigation continues anyway,
  so a broken animation can never trap someone behind an opaque overlay
- **`prefers-reduced-motion`** — skips the animation and navigates instantly

## Registry

| item | dependencies |
| --- | --- |
| `crayon` | `gsap`, `next-transition-router` |

## Known limits

- **Browser back/forward is not animated.** `next-transition-router` has no popstate
  handling, so history navigation snaps.
- **Overlay transitions cost real time.** The route does not start loading until the leave
  phase finishes — crayon is ~1.75s. Right for a portfolio, wrong for an app.
- **`router.push()` skips the animation** unless you use `useTransitionRouter`.

## Development

```bash
npm run dev                  # demo site, doubles as the registry host
npx shadcn@latest build      # regenerate public/r/*.json from registry.json
```
