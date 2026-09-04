@AGENTS.md

# transitions-lib

A page-transition component library for the Next.js App Router, distributed as a
shadcn custom registry. Public repo: github.com/alihahamed/transitions-lib.
For where the work stands and what to do next, read `HANDOFF.md` first.

## Working with Ali

- Open every reply with "Ali". Keep explanations concise and in plain terms.
- **Discuss before building.** Present findings and a recommendation, then stop
  and ask. He has interrupted builds that started unasked more than once.
- He is the visual judge. He pastes screenshots; treat them as the spec.
- Commit after each piece of output, as scoped commits with reasoned messages
  (see `git log` for the house style). Push to `main`.
- New transitions go to the lab first (`ready: false`, no `registry.json`
  entry). Promote only on his sign-off, as two commits: registry entry + built
  bundle, then the gallery listing.

## Invariants

- `registry/transitions/*` is the source; `components/*` is a mirror the app
  imports. **Every edit to a registry file must be copied to `components/`.**
- `lib/transitions.ts` is the single source for the gallery card, API table,
  Customize panel and `/lab` harness. Props, controls, `scrub`, `requires`
  and `ready` all live there. The gallery filters on `ready`.
- `registry/transitions/transitions.css` is shared and bundled into **every**
  registry item. After changing it or `registry.json`, run `npx shadcn build`
  and commit `public/r/`.
- Scope selectors to the transition (`.crayon svg`, `.dither canvas`). A rule
  like `.transition-overlay svg` outranks any single class a later transition
  puts on its own element and silently breaks it.
- View-transition rules are `.vt-<name>::view-transition-old(root)` — no space
  before `::`. The pseudo belongs to the root element, not a descendant.
- One engine per transition: GSAP on `transition-core` (overlay), or the View
  Transitions API on `view-transition-core`. Never both. No three.js — the
  registry cannot ship binaries and the library weighs ~30 KB.

## Verifying

- Test in `/lab/<slug>` (iframe of `/preview/<slug>`, `?speed=0.2` slows it).
  Playwright is available; `browser_evaluate` with per-frame `rAF` sampling
  is the reliable instrument. Screenshots race the animation and never capture
  view-transition pseudo-elements.
- Sampling windows must exceed the transition's length at the chosen speed.
  A hand-frozen frame tests the maths, not the wiring — measure the live run.
- Frame drops from headless Chrome are not the user's machine, and they were
  not what made a transition feel cheap: event count and duration were.
- Clean-install test: `create-next-app` in the scratchpad, `shadcn init -y -d`,
  `shadcn add http://localhost:3000/r/<slug>.json`, wire into `app/layout.tsx`,
  `next build`, then serve and drive a navigation. Kill servers by port
  (`fuser -k 3939/tcp`), never `pkill -f` with a pattern in your own command.
- After a production `next build`, `rm -rf .next/types` or `tsc` sees stale
  route types against the dev server's.
