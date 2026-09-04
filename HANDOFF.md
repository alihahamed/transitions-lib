# Handoff

State of transitions-lib at the end of the session on 2026-09-04, written so the
next session can pick up without re-deriving anything. Read `CLAUDE.md` for the
standing conventions; this file is the situation.

## What the project is

A page-transition component library for the Next.js App Router, installed
through a shadcn custom registry (`npx shadcn add <url>/r/<slug>.json`). Each
transition is a drop-in provider wrapped around `{children}` in
`app/layout.tsx`; existing `<Link>`s are intercepted automatically.

- Stack: Next.js 16.3, React 19.2, Tailwind v4, shadcn 4.19, GSAP 3.15,
  next-transition-router 0.2.11. Dev server is Ali's, on `:3000`.
- Goal Ali set: **eight transitions** before designing the site, finalising
  its style, getting a domain, and fixing the install URL. The install URL in
  `lib/transitions.ts` still points at `transitions-lib.vercel.app`, which is
  not deployed — clean-install tests use the dev server's `/r/` instead.

## Where it stands

**Shipped (6)** — in `registry.json`, built to `public/r/`, `ready: true`,
listed on `/transitions`:

| slug | lane | engine | core |
| --- | --- | --- | --- |
| crayon | object | GSAP | transition-core |
| zipper | object | GSAP | transition-core |
| film-burn | material | none | view-transition-core |
| riser | choreography | none | view-transition-core |
| concertina | object | GSAP | transition-core |
| dither | graphic | GSAP (canvas) | transition-core |

**Lab only (1)** — `push` (choreography, View Transitions, parallax 0.28,
420ms, `power3`). Built, verified, `ready: false`, not in the registry.
Ali has not signed off; it is at `/lab/push`.

**Removed** — `fold-away`. Built, reworked, reverted (`8379929`). Lessons are
recorded in `TRANSITIONS.md` under "Deliberately not doing": a full-bleed
sheet clips its own perspective, and an object over the page can never feel
as good as moving the pages themselves.

**Clean-install verified** for crayon, zipper, concertina, dither (fresh app,
`shadcn add`, `next build`, served and driven, 0 console errors). Not yet run
for film-burn, riser, push.

**Two slots left to reach eight.** Ali asked for ideas; the list and my two
picks are at the end of this file. He has not chosen.

## Architecture

- `registry/transitions/transition-core.tsx` — overlay model. `createTransition({
  defaults, overlay, setup?, leave, enter, timeout? })`. Phases get
  `{ overlay, options, done }`; a phase may return a cleanup. Link interception
  via `TransitionRouter auto`. Reduced motion skips the animation.
- `registry/transitions/view-transition-core.tsx` — `createViewTransition({
  name, defaults, defs, prepare?, paint?, duration })`. Puts `vt-<name>` on
  `<html>` for the navigation so two installed transitions cannot both claim
  `::view-transition-old(root)`. Holds the snapshot open with a keep-alive
  animation. Playwright cannot capture these pseudo-elements.
- `components/` mirrors `registry/transitions/` (copy on every edit).
- `lib/transitions.ts` — one declaration per transition drives the card, the
  API table, Customize, `/lab`, and `ready`. `installCommand()` lives here.
- `app/preview/<slug>/{layout,page,b/page}.tsx` — bare two-page frame. The
  layout reads `usePreviewOptions()` (query string → props, held in state so
  it survives the in-frame navigation). `PreviewShell` takes `bg` and `fg`.
- `app/(site)/lab/[slug]` — `Harness`: iframe of the preview, "Play a
  navigation" (clicks the link inside the frame), live controls, "open full
  size". The gallery at `/transitions` filters on `ready`.
- `registry.json` → `npx shadcn build` → `public/r/*.json`. The shared
  `transitions.css` is embedded in every bundle, so a CSS change means a
  rebuild of all of them.

## Per-transition notes worth knowing

**concertina** (`registry/transitions/concertina.tsx`) — reverse-engineered
from accordion.net.au (Barba + GSAP; the bow is two painted arc images over a
flat slat row, no 3D; `loaderMiddle` is a real slat sized by `width`; a white
`.main-overlay` inside the page container is the veil; leave `power4.inOut`,
outro `power3.inOut`, ~847ms; shuffle `loadDuration/1.25`).
- One law: `bite(p) = slotTop(bow) * p` positions the arcs, cuts the slats,
  anchors the page's crop. Everything paints from `p` in `paint()`.
- The page is **found, not wrapped**: element siblings of the overlay in
  `<body>` (skipping SCRIPT/STYLE/LINK/TEMPLATE/NEXT-ROUTE-ANNOUNCER). Lifted
  with `position: relative; z-index: 101` for the duration and restored with
  `clearProps`. Its crop is a `path()` carrying the arc curve (a sub-span of
  a quadratic is a quadratic; control from `mid = (P0 + 2C + P2)/4`). It is
  cropped, never scaled — a scale left a white frame.
- The page's stand-in is **one of the row's slats**, widened by `width` (so
  the flex row reflows and neighbours are pushed apart), not `scaleX`. It
  rides the row's shuffle for free. `centreSlat()`/`slotAt()` read the row's
  travel off the computed transform — GSAP's cache answered 0 for 73px.
- Row: 41 slats, 3vw + 0.5vw gaps (`PITCH` 4vw), window `span` 60vw sized to
  whole pixels (`sizeWindow`) — a fractional `overflow: hidden` edge drew a
  full-height hairline. Slats run 100vh → 45vh on leave, full height across
  the shuffle, arcs alone shape the expansion.
- Slot per page = hash of pathname (`slotFor`), so a page always lands on the
  same bar. Shuffle happens in `enter`, where `location` is the destination.
- Veil is linear in `p` both directions (mirror). Two other curves were tried
  and both were wrong in opposite ways; see commits `fe33065`, `2c6a183`,
  `47457f6`.
- Defaults: `bow 17`, `duration 1.0`, `spread 6`, `span 60`, `slats 41`.
  Meta estimate 2800ms.
- Known limit: the page crop assumes the page element is viewport-sized and
  unscrolled. Their site pins `top: -scrollY`; ours does not handle scroll.

**dither** (`registry/transitions/dither.tsx`) — from teletech.events (a
fixed 32×32 grid of divs, random pop in over 0.5s, then a hard navigation;
their cells are 57×28 rectangles). Ours is a **canvas** painted from one
fill level; tiled Bayer order (`matrix` 2/4/8, default 4); `cells` 32 across
with rows from the aspect ratio so cells are square; `duration 0.5`,
`hold 0.2`, linear; cells pop, nothing fades. `prepare()` measures on every
leave. Verified the 16 tile positions light in matrix order 0→15 and clear
15→0. A module-level `rig` holds the canvas state.

**push** — `::view-transition-new(root)` travels in, old travels the same
way at `parallax` × distance; `brightness()` for the dim (opacity would
cross-dissolve with the page already rendered behind). `parallax 0.28`,
`420ms`, `cubic-bezier(0.2, 0, 0, 1)`.

**zipper** — closes upward now (`19fc0a6`): travel, `parting()`, slider art
(wide mouth up) and the slider's exit all flipped together; the pull tab
still hangs down. `sliderYFor()` is the single source for slider position.

**film-burn** — the scoping bug: `.vt-film-burn ::view-transition-old(root)`
(with a space) matches nothing. Fixed in `cff76c5`.

**riser** — 700ms, `tilt 18`, `perspective 800`, CSS-driven, no `paint`.

**crayon** — `.crayon svg` scoping; the old `.transition-overlay svg` rule
forced every later transition's svg to full size and was still in the built
bundles until `3bf5f83`.

## Methodology that paid off, and traps that bit

- Reverse-engineer a site by reading its inline/JS source **and** sampling
  it frame by frame with `gsap.globalTimeline.timeScale(0.1–0.2)`. Fit eases
  numerically against `power3`/`power4` rather than eyeballing — the eye was
  wrong twice. For hard-navigating sites, stash samples in `sessionStorage`
  on `pagehide` and read them on the next page.
- Sampling windows shorter than the transition produced two false "the
  expansion never runs" readings. Compute the length at the chosen speed.
- A hand-frozen frame verifies maths, not wiring: the arc-sign bug looked
  perfect frozen and was wrong live.
- `elementFromPoint` is blind inside the overlay (`pointer-events: none`).
  Scan rects geometrically instead.
- GSAP snaps `clip-path` when current (px) and target (vh/vw) units differ;
  drive it from a number in `onUpdate`. `gsap.getProperty` can disagree with
  the DOM; read `getComputedStyle().transform`.
- Python `str.replace` on lines that differ only by indentation matches the
  substring inside the longer line and silently edits the wrong phase.
- Perf from headless Chrome is not Ali's machine. Riser measured *worse* per
  frame than fold-away and felt premium; what mattered was one gesture in
  ~0.7s versus five events over 2.1s.
- `next build` while `next dev` runs is fine, but delete `.next/types`
  afterwards. Kill throwaway servers by port.

## Session commit log (newest first)

```
538cfe6 List dither in the gallery
f82aec7 Add dither to the registry
13018b5 Add dither, lab only
62d8464 List concertina in the gallery
3bf5f83 Add concertina to the registry
8637325 Deepen the bow and slow the whole navigation a little
47457f6 Mirror the compression's veil on the expansion
2c6a183 Reveal the page instead of fading it in, and put the window on the pixel grid
a87f04a Widen the page's bar by layout, and find it off the DOM
070d12e Make the page's bar one of the row's own slats
4bc8ab6 Carry the page's bar with the row when it shuffles
2f6f02c Retreat the two arcs in opposite directions
cb3f0fa Put every moving part on one law
775fdf9 Take the expansion's ease off the reference
2e8549f Draw the arc into the page's own clip
469d70e Let the arcs shape the expansion
23be5f9 Match the reveal curve to the reference
fe33065 Hold the page back until the bar has opened
4d27141 Shrink the page through a bar, not into a slot
57f4c65 Put the row in a window and hand the page off to a slat
4dd8a6c Make the page the middle slat
6a8ce6d Add concertina, lab only
19fc0a6 Zip upward, the way a jacket does
622fa1d Add push, lab only
8379929 Remove fold-away
c8bb59e Give the fold something to be seen against
e89a775 Wire fold-away into the gallery, lab and registry
329bbab Fold a sheet of paper over the page
cff76c5 Fix the burn's scoping selector
```

## Open items, in priority order

1. **Pick the last two transitions.** Ali asked for ideas "in the domain of
   the previous three" and got three lanes. My picks: **CRT power-off**
   (canvas, dither's rig, distinctive) and **card flip** (View Transitions,
   push's skeleton, zero deps). Other candidates: halftone, static, Game of
   Life, threshold dissolve; venetian blinds, equaliser, staircase, iris,
   ticker; deck, slat reveal (gradient mask on the VT snapshot), seam split.
   The earlier shortlist in `TRANSITIONS.md` (paper shredder, redaction, riso
   misregistration, type mask) still stands too. Discuss before building.
2. **push** — waiting on Ali's sign-off at `/lab/push`; then promote with the
   two-commit pattern.
3. **`TRANSITIONS.md` "Shipped" table** lists only crayon and zipper; it is
   six now. Ali knows; not yet asked to fix.
4. Clean-install tests for film-burn, riser, push.
5. After eight: site design, style, domain, and the install URL.
6. Dither twists Ali did not pick — colour pop, resolution ramp, route-seeded
   order — are cheap follow-ons as props, not slots.

## How to drive it

- Lab: `localhost:3000/lab/<slug>`. Preview: `/preview/<slug>` and `/b`;
  `?speed=0.2` (and any prop) in the query.
- The Playwright browser window is the one Ali screenshots from; navigating
  it opens the page for him.
- Scratchpad clean-install apps from this session: `clean-cc`, `clean-dither`
  under the session scratchpad. Disposable.
