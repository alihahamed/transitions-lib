# Transition ideas

A working list. The library is a deliberate mix of two things: **objects** that
physically seal and reveal the page, and **reveals** whose character comes from
choreography rather than texture.

Every one of these is the same shape underneath — cover, swap the route behind
the cover, uncover — so they all fit `createTransition` with no new machinery.

**Cost** is honest build effort, not code size:

- **cheap** — mostly reuses machinery that already exists
- **medium** — one new technique to get right
- **hard** — the technique itself is the risk

---

## Shipped

| | family | engine | notes |
| --- | --- | --- | --- |
| **Crayon** | object | GSAP | Three hand-drawn strokes draw across, fatten to cover, retract. |
| **Zipper** | object | GSAP | Chain meshes behind a slider that catches twice, seals, then the panels fall open sideways. |

---

## Objects & mechanisms

Character comes from the thing itself. This is the lane crayon and zipper
established, and the most distinctive part of the library.

| | what happens | cost | reuses |
| --- | --- | --- | --- |
| **Shutter / blinds** | Slats rotate shut, route swaps, slats rotate open. | cheap | zipper's panel travel |
| **Roller shutter** | A corrugated shop shutter rattles down, then hauls back up. | cheap | zipper's repeated ribs |
| **Stitch** | A thread sews the seam closed, then unpicks itself. | cheap | crayon's stroke-dash |
| **Elevator doors** | Two heavy doors meet with a settle, then part with weight. | cheap | zipper's panel travel |
| **Paper shredder** | The page feeds into blades and comes out as strips that fall away. | medium | — |
| **Envelope** | Flaps fold in over the page, seal, then unfold. | medium | needs real 3D folds |
| **Accordion / bellows** | Pleats compress the page to nothing, then expand. | medium | — |
| **Camera aperture** | Iris blades rotate closed, then open on the new page. | medium | clip-path polygons |
| **Garage door** | Segments tilt back and away over the top of the frame. | medium | — |
| **Book page turn** | A page sweeps across with a curl and a shadow. | hard | the curl is the hard part |
| **Laces** | Eyelets cinch together and pull tight, then loosen. | hard | crossing geometry is fiddly |
| **Velcro** | Two strips press together, then peel apart with drag. | hard | hard to read as velcro |

**Pick of the group: paper shredder.** I have not seen it done as a page
transition, and the leave phase writes itself.

---

## Materials

Character comes from texture — organic, imperfect, printed.

| | what happens | cost | technique |
| --- | --- | --- | --- |
| **Paper tear** | The page rips down a jagged seam and the halves slide apart. | cheap | clip-path, no SVG at all |
| **Riso misregistration** | Colour layers slide in slightly off, then snap into register. | cheap | offset duplicates + blend modes |
| **Ink bleed** | A drop lands and floods outward with a living, wobbling edge. | medium | `feTurbulence` + `feDisplacementMap` |
| **Goo / metaball** | Blobs fly in and visibly *merge* into one another. | medium | gaussian blur + contrast |
| **Halftone dissolve** | The page breaks into big printed dots that swarm and reform. | medium | SVG pattern + mask |
| **Film burn** | The frame burns through from a hot spot, edges charring. | medium | turbulence + gradient mask |
| **Frost** | Condensation creeps in from the edges, then clears. | medium | — |
| **Sand sweep** | Particles blow across and pile up into full cover. | hard | needs a lot of elements |

**Pick of the group: riso misregistration.** Cheap, and the kind of detail
designers notice immediately.

---

## Graphic & typographic

| | what happens | cost |
| --- | --- | --- |
| **Redaction** | Black bars slam over the content, hold, then lift to reveal. | cheap |
| **Barcode** | Bars of varying widths print in across the screen. | cheap |
| **Blueprint grid** | A grid draws itself cell by cell, fills, then erases. | cheap |
| **Highlighter sweep** | One fat translucent stroke sweeps edge to edge, multiply-blended. | cheap — crayon's sibling |
| **Type mask** | The incoming page is revealed *through* giant letterforms that scale away. | medium |
| **Typewriter block** | The screen fills with a repeating glyph hammered in fast, then deleted. | medium |
| **Loading bar** | A progress bar fills, then unrolls into the page itself. | medium |

**Pick of the group: type mask.** Probably the most striking single thing on
this whole list.

---

## Choreography

No texture, no object — character comes purely from how things move. These are
the ones people will actually reach for when they do not want a spectacle on
every navigation.

| | what happens | cost | reuses |
| --- | --- | --- | --- |
| **Split** | The screen parts down the middle and the halves slide off. | cheap | zipper's panel travel |
| **Curtain lift** | Panels rise to unveil the page, with sway and weight. | cheap | zipper's droop and sag |
| **Card deal** | The incoming page deals in like a card onto a table. | cheap | — |
| **Panel cascade** | A grid of tiles flips in sequence. | cheap | — |
| **Stack shuffle** | Pages are a deck; the top one slides off to reveal the next. | cheap | — |
| **Slat wipe** | N vertical slats sweep in with stagger and skew. | cheap | — |
| **Elastic pull** | The page stretches, then snaps away. | medium | — |
| **Fold-away** | The page folds up like a map. | medium | — |

**Pick of the group: split.** The simplest thing on the list, which makes it the
honest test of whether the harness actually sped things up.

---

## Shortlist to reach eight

| order | | family | why |
| --- | --- | --- | --- |
| 3 | **Split** | choreography | Cheapest possible build. Proves the harness earns its keep. |
| 4 | **Paper shredder** | object | The spectacle piece. Most novel thing here. |
| 5 | **Redaction** | graphic | Cheap, striking, nothing like the others. |
| 6 | **Riso misregistration** | material | Print-nerd detail; very cheap. |
| 7 | **Type mask** | typographic | The showpiece. |
| 8 | **Shutter** | object | Reuses zipper machinery almost wholesale. |

Lands at **8 = 3 objects + 5 spread across the other families**, one genuinely
new technique per build at most, and four leaning on machinery that already
exists.

---

## Deliberately not doing

- **Fade, blur, plain slide.** The premise of the library is that these already
  exist everywhere and are not worth installing anything for.
- **Fold-away.** Built and removed. Two lessons worth keeping: a full-bleed
  sheet has its perspective convergence clipped by the viewport, so a fold
  reads as flat stripes sliding no matter how it is shaded; and an object
  covering the page can never feel as good as moving the pages themselves,
  because it puts a prop between the reader and their content. If it is ever
  revisited, the sheet has to be inset and it has to be short.
- **Anything needing three.js.** 101 KB gzipped against the ~30 KB the whole
  library currently weighs, plus a `.glb` the shadcn registry cannot ship at
  all. Head-on for a second and a half, shading fakes it convincingly — see how
  the zipper's teeth are lit.

---

## Notes for whoever builds these

- **View Transitions** are a separate family worth revisiting once the overlay
  set is full — scrapbook shuffle, sticker slap, zoom-through, word-becomes-title.
  Zero dependencies, but they sit on React's still-experimental `ViewTransition`,
  and the integration story differs from everything above.
- **Every transition should declare its props and controls** in
  `lib/transitions.ts`. The API table, the Customize panel and the `/lab`
  harness all render from that one declaration.
- **Render from state where you can.** The zipper's rig renders from two numbers,
  which is what lets the lab scrub it to any frame. Crayon drives the DOM
  directly and cannot be scrubbed.
