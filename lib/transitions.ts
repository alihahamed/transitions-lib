/** Single source of truth for the gallery, the detail pages and the registry docs. */

/** One row of the API table. */
export type PropDoc = {
  name: string
  type: string
  /** Shown in the Default column; '—' for required props. */
  def: string
  description: string
}

/**
 * One knob. The same declaration drives the Customize panel on the docs page
 * and the scrub harness at /lab — neither has to know anything transition
 * specific.
 */
export type Control =
  | { kind: 'select'; key: string; label: string; options: string[]; def: string }
  | { kind: 'range'; key: string; label: string; min: number; max: number; step: number; def: number }
  | { kind: 'color'; key: string; label: string; def: string }

export type TransitionMeta = {
  slug: string
  name: string
  tagline: string
  description: string
  engine: string
  dependencies: string[]
  /** Swatch shown on the card and in the detail header. */
  accent: string[]
  /** Roughly how long a navigation takes, in ms. */
  duration: number
  usage: string
  notes: string[]
  /** Palette presets, if the transition ships any. */
  swatches?: { name: string; from: string; to: string }[]
  /** Component props, for the API table. */
  props: PropDoc[]
  /** Live knobs, for Customize and the lab harness. */
  controls: Control[]
  /** State the harness can scrub, if the transition renders from one. */
  scrub?: { key: string; label: string }[]
  /** Shown as a notice on the detail page when a transition needs something. */
  requires?: string
  /** false while a transition is still being built. */
  ready: boolean
}

export const transitions: TransitionMeta[] = [
  {
    slug: 'slate',
    name: 'Slate',
    tagline: 'A clapperboard rises over the page, claps, and is pulled away from the next one.',
    description:
      'A clapperboard rises into frame from the bottom with its stick open and covers the page. The stick claps shut \u2014 that is the moment the screen is fully covered, and the route swaps behind it. The stick lifts again and the new page shows in the gap it leaves above the board, then the whole slate is pulled down out of frame. Nothing fades; every reveal is a piece of board moving. The motion is written as a hand would do it: the rise overshoots a hair and settles, the stick falls under gravity and rebounds once, the slate dips on the impact, and the pull-out starts slow and accelerates away.',
    engine: 'GSAP',
    dependencies: ['gsap', 'next-transition-router'],
    accent: ['#141414', '#f2efe8', '#ff9d3c'],
    duration: 1500,
    usage: `import { SlateTransition } from '@/components/slate'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SlateTransition>{children}</SlateTransition>
      </body>
    </html>
  )
}`,
    swatches: [
      { name: 'ink', from: '#141414', to: '#f2efe8' },
      { name: 'chalk', from: '#f2efe8', to: '#141414' },
      { name: 'ember', from: '#170a04', to: '#ff9d3c' },
    ],
    props: [
      { name: 'children', type: 'ReactNode', def: '\u2014', description: 'Your app. Wrap the contents of <body>. (Required)' },
      { name: 'angle', type: 'number', def: '20', description: 'Degrees the stick opens.' },
      { name: 'stick', type: 'number', def: '12', description: 'Height of the stick, in vh. The lip below it on the board is the same height.' },
      { name: 'finish', type: '"striped" | "plain"', def: '"striped"', description: 'Diagonal stripes on the stick and lip, or flat board.' },
      { name: 'hinge', type: '"left" | "right"', def: '"left"', description: 'Which end the stick pivots on.' },
      { name: 'duration', type: 'number', def: '0.5', description: 'Seconds the slate takes to rise into frame, and to be pulled out.' },
      { name: 'hold', type: 'number', def: '0.08', description: 'Seconds the stick stays shut after the route swaps, before it lifts.' },
      { name: 'speed', type: 'number', def: '1', description: 'Multiplies the whole timeline. Above 1 is faster.' },
      { name: 'palette', type: '"ink" | "chalk" | "ember" | "custom"', def: '"ink"', description: 'Board and stripe colours. "custom" applies no preset, leaving --slate-board and --slate-stripe to you.' },
    ],
    controls: [
      { kind: 'select', key: 'palette', label: 'Palette', options: ['ink', 'chalk', 'ember'], def: 'ink' },
      { kind: 'select', key: 'finish', label: 'Finish', options: ['striped', 'plain'], def: 'striped' },
      { kind: 'select', key: 'hinge', label: 'Hinge', options: ['left', 'right'], def: 'left' },
      { kind: 'range', key: 'angle', label: 'Angle', min: 6, max: 40, step: 1, def: 20 },
      { kind: 'range', key: 'stick', label: 'Stick height', min: 6, max: 24, step: 1, def: 12 },
      { kind: 'range', key: 'duration', label: 'Duration', min: 0.2, max: 1.2, step: 0.05, def: 0.5 },
      { kind: 'range', key: 'hold', label: 'Hold', min: 0, max: 0.6, step: 0.02, def: 0.08 },
      { kind: 'range', key: 'speed', label: 'Speed', min: 0.4, max: 2.5, step: 0.05, def: 1 },
    ],
    notes: [
      'The clap is the cut. The screen is only fully covered for the beat the stick is shut, and that is when the route swaps.',
      'The stick opens far enough that its tip leaves the frame, the way a real clapstick swings well clear of the board. The gap above the board is where the new page is first seen.',
      'Browser back and forward are not animated \u2014 history navigation snaps.',
    ],
    ready: false,
  },
  {
    slug: 'dither',
    name: 'Dither',
    tagline: 'The page dissolves through an ordered dither \u2014 dots, checker, weave, solid.',
    description:
      'A grid of square cells fills the screen in Bayer order: a sparse lattice first, then the checkerboard between, then the weave that closes it, then solid \u2014 the fade-to-black of an 8-bit console, or a halftone print building up tone. Each cell pops rather than fades. The route swaps behind the solid screen and the same sequence runs backwards to reveal it. It is drawn on a canvas from a single fill level, so a 32-column grid costs a few hundred fillRects a frame and nothing at rest, and the cells stay square on any viewport.',
    engine: 'GSAP',
    dependencies: ['gsap', 'next-transition-router'],
    accent: ['#0a0a0a', '#6b6b6b', '#f2efe8'],
    duration: 1200,
    usage: `import { DitherTransition } from '@/components/dither'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <DitherTransition>{children}</DitherTransition>
      </body>
    </html>
  )
}`,
    swatches: [
      { name: 'ink', from: '#0a0a0a', to: '#3a3a3a' },
      { name: 'paper', from: '#f2efe8', to: '#cfc9bd' },
      { name: 'blueprint', from: '#1f4470', to: '#0b1a2e' },
      { name: 'ember', from: '#170a04', to: '#5a2a10' },
    ],
    props: [
      { name: 'children', type: 'ReactNode', def: '\u2014', description: 'Your app. Wrap the contents of <body>. (Required)' },
      { name: 'cells', type: 'number', def: '32', description: 'Columns across the screen. Rows follow from the aspect ratio, so the cells stay square.' },
      { name: 'matrix', type: '2 | 4 | 8', def: '4', description: 'Size of the Bayer matrix. 4 gives 16 visible steps \u2014 the classic console fade. 8 is smoother, 2 is four blunt stages.' },
      { name: 'duration', type: 'number', def: '0.5', description: 'Seconds the screen takes to fill, and to clear.' },
      { name: 'hold', type: 'number', def: '0.2', description: 'Seconds the screen stays solid before clearing. The route swaps during this beat.' },
      { name: 'speed', type: 'number', def: '1', description: 'Multiplies the whole timeline. Above 1 is faster.' },
      { name: 'palette', type: '"ink" | "paper" | "blueprint" | "ember" | "custom"', def: '"ink"', description: 'Colour of the cells. "custom" applies no preset, leaving --dither-ground to you.' },
    ],
    controls: [
      { kind: 'select', key: 'palette', label: 'Palette', options: ['ink', 'paper', 'blueprint', 'ember'], def: 'ink' },
      { kind: 'range', key: 'cells', label: 'Cells across', min: 8, max: 64, step: 4, def: 32 },
      { kind: 'select', key: 'matrix', label: 'Matrix', options: ['2', '4', '8'], def: '4' },
      { kind: 'range', key: 'duration', label: 'Duration', min: 0.2, max: 1.5, step: 0.05, def: 0.5 },
      { kind: 'range', key: 'hold', label: 'Hold', min: 0, max: 1, step: 0.05, def: 0.2 },
      { kind: 'range', key: 'speed', label: 'Speed', min: 0.4, max: 2.5, step: 0.05, def: 1 },
    ],
    scrub: [{ key: 'fill', label: 'fill \u2014 0 clear, 1 solid' }],
    notes: [
      'Cells pop on and off; nothing fades. Linear timing on purpose \u2014 a constant rate of cells is what keeps the weave\u2019s steps evenly spaced.',
      'Drawn on a canvas from one number. Nothing is in the DOM per cell, so cells across is free to go high.',
      'Browser back and forward are not animated \u2014 history navigation snaps.',
    ],
    ready: true,
  },
  {
    slug: 'concertina',
    name: 'Concertina',
    tagline: 'The screen folds into a strip of slats, slides to the page\u2019s slot, and opens back out.',
    description:
      'The page shrinks into one slot of a row of slats, the row slides along to the slot belonging to the page you are going to, and the new page opens back out of it. The page really is the middle slat \u2014 it is clipped down to that slot rather than being covered by anything, so the row stays a band with ground above and below it. The slot is derived from the path, so a given page always lands on the same slat and the site keeps the feel of a strip you slide along. The bow along the top and bottom is painted rather than computed: two arcs in the ground colour lie over a row of perfectly flat slats and bite into it, which is what makes the outer slats read as taller than the middle ones.',
    engine: 'GSAP',
    dependencies: ['gsap', 'next-transition-router'],
    accent: ['#0d0d0f', '#f6f4ef', '#7fd0b4'],
    duration: 2800,
    usage: `import { ConcertinaTransition } from '@/components/concertina'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ConcertinaTransition>{children}</ConcertinaTransition>
      </body>
    </html>
  )
}`,
    swatches: [
      { name: 'mono', from: '#0d0d0f', to: '#f6f4ef' },
      { name: 'inverse', from: '#f2efe8', to: '#17171a' },
      { name: 'ember', from: '#170a04', to: '#ff9d3c' },
      { name: 'pine', from: '#0b1a16', to: '#7fd0b4' },
    ],
    props: [
      { name: 'children', type: 'ReactNode', def: '\u2014', description: 'Your app. Wrap the contents of <body>. (Required)' },
      { name: 'slats', type: 'number', def: '41', description: 'How many slats the row is made of. It has to stay wider than the screen once shuffled.' },
      { name: 'bow', type: 'number', def: '17', description: 'Depth of the arc that bites into the top and bottom of the row. 0 leaves the row flat.' },
      { name: 'shuffle', type: 'number', def: '4', description: 'How far the strip slides per slot, in viewport widths.' },
      { name: 'spread', type: 'number', def: '6', description: 'How many slots either side of centre a page can land on.' },
      { name: 'duration', type: 'number', def: '1', description: 'Seconds the page takes to shrink into the slot, and to open back out. The shrink runs on power4.inOut and the expansion on the gentler power3.inOut, matching the reference.' },
      { name: 'speed', type: 'number', def: '1', description: 'Multiplies the whole timeline. Above 1 is faster.' },
      { name: 'palette', type: '"mono" | "inverse" | "ember" | "pine" | "custom"', def: '"mono"', description: 'Ground and slat colours. "custom" applies no preset, leaving your own CSS variables in charge.' },
    ],
    controls: [
      { kind: 'select', key: 'palette', label: 'Palette', options: ['mono', 'inverse', 'ember', 'pine'], def: 'mono' },
      { kind: 'range', key: 'slats', label: 'Slats', min: 15, max: 61, step: 2, def: 41 },
      { kind: 'range', key: 'bow', label: 'Bow', min: 0, max: 30, step: 1, def: 17 },
      { kind: 'range', key: 'span', label: 'Span', min: 20, max: 100, step: 2, def: 60 },
      { kind: 'range', key: 'spread', label: 'Spread', min: 0, max: 12, step: 1, def: 6 },
      { kind: 'range', key: 'duration', label: 'Duration', min: 0.3, max: 1.6, step: 0.05, def: 1 },
      { kind: 'range', key: 'speed', label: 'Speed', min: 0.4, max: 2.5, step: 0.05, def: 1 },
    ],
    notes: [
      'The slot a page lands on comes from a hash of its path, so it is stable without you listing your routes anywhere.',
      'The row slides by exactly one slat pitch per slot, so whichever slat lands at the centre lines up with the page.',
      'The slats never resize. The page is clipped into one slot and back out, which is what keeps the row a band instead of turning the screen into stripes.',
      'Browser back and forward are not animated \u2014 history navigation snaps.',
    ],
    ready: true,
  },
  {
    slug: 'push',
    name: 'Push',
    tagline: 'The page you are leaving is overtaken rather than shoved off.',
    description:
      'Both pages travel the same direction, the outgoing one at a fraction of the speed, so it falls behind and is covered. That difference in rate is the whole effect — two things moving the same way at different speeds read as depth without anything being scaled, tilted or faded. The incoming page carries a shadow on its leading edge so the seam between them stays legible while they overlap.',
    engine: 'Native',
    dependencies: [],
    accent: ['#20242c', '#8d97a8', '#2c2721'],
    duration: 420,
    requires:
      'The View Transitions API — Chrome 111+, Safari 18+, Firefox 132+. Older browsers navigate normally with no animation. Nothing breaks, but there is no fallback effect.',
    usage: `import { PushTransition } from '@/components/push'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PushTransition direction="left">{children}</PushTransition>
      </body>
    </html>
  )
}`,
    props: [
      { name: 'children', type: 'ReactNode', def: '—', description: 'Your app. Wrap the contents of <body>. (Required)' },
      { name: 'direction', type: '"left" | "right" | "up" | "down"', def: '"left"', description: 'Which way the pages travel. The incoming one enters from the opposite edge.' },
      { name: 'duration', type: 'number', def: '0.42', description: 'Seconds the swap takes.' },
      { name: 'speed', type: 'number', def: '1', description: 'Divides the duration. Above 1 is faster.' },
      { name: 'parallax', type: 'number', def: '0.28', description: "How far the outgoing page travels, as a fraction of the incoming page's distance. At 0 it stays put and is simply covered; around 0.3 matches a native navigation push; at 1 both travel together as one strip." },
      { name: 'dim', type: 'number', def: '0.22', description: 'How far the outgoing page darkens as it is covered, 0 to 1.' },
    ],
    controls: [
      { kind: 'select', key: 'direction', label: 'Direction', options: ['left', 'right', 'up', 'down'], def: 'left' },
      { kind: 'range', key: 'duration', label: 'Duration', min: 0.15, max: 1.2, step: 0.01, def: 0.42 },
      { kind: 'range', key: 'parallax', label: 'Parallax', min: 0, max: 1, step: 0.02, def: 0.28 },
      { kind: 'range', key: 'dim', label: 'Dim', min: 0, max: 0.7, step: 0.01, def: 0.22 },
    ],
    notes: [
      'No dependencies and no JavaScript animating anything — the stylesheet drives both halves.',
      'Browser back and forward are not animated — history navigation snaps.',
    ],
    ready: false,
  },
  {
    slug: 'riser',
    name: 'Riser',
    tagline: 'The page behind drops back while the next one rises over it.',
    description:
      'The outgoing page leans away and drops back while the incoming page slides in over it as a card, casting a shadow across it. It recedes into the edge the new page arrives at rather than sliding off, so it stays visible behind the whole way. Perspective distance does as much work as the angle here — a shallow lean through a long perspective barely registers, so both are exposed. Nothing but transforms, which is why the stylesheet can drive it with no JavaScript touching a frame.',
    engine: 'Native',
    dependencies: [],
    accent: ['#f4f2ee', '#7a7a80', '#141416'],
    duration: 700,
    requires:
      'The View Transitions API — Chrome 111+, Safari 18+, Firefox 132+. Older browsers navigate normally with no animation. Nothing breaks, but there is no fallback effect.',
    usage: `import { RiserTransition } from '@/components/riser'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <RiserTransition direction="up">{children}</RiserTransition>
      </body>
    </html>
  )
}`,
    props: [
      { name: 'children', type: 'ReactNode', def: '—', description: 'Your app. Wrap the contents of <body>. (Required)' },
      { name: 'direction', type: '"up" | "down" | "left" | "right"', def: '"up"', description: 'Which edge the incoming page arrives from. The outgoing page recedes the opposite way.' },
      { name: 'duration', type: 'number', def: '0.7', description: 'Seconds the swap takes.' },
      { name: 'speed', type: 'number', def: '1', description: 'Divides the duration. Above 1 is faster.' },
      { name: 'depth', type: 'number', def: '0.82', description: 'How far the outgoing page is pushed back, 0 to 1. Smaller is further away.' },
      { name: 'travel', type: 'number', def: '8', description: 'How far the outgoing page travels as it recedes, in viewport units.' },
      { name: 'tilt', type: 'number', def: '18', description: 'Degrees the outgoing page leans away as it drops back. 0 is a flat scale with no depth.' },
      { name: 'perspective', type: 'number', def: '800', description: 'Perspective distance in pixels. Shorter is a more dramatic lean.' },
      { name: 'dim', type: 'number', def: '0.35', description: 'How dark the outgoing page goes as it falls behind, 0 to 1.' },
    ],
    controls: [
      { kind: 'select', key: 'direction', label: 'Direction', options: ['up', 'down', 'left', 'right'], def: 'up' },
      { kind: 'range', key: 'duration', label: 'Duration', min: 0.25, max: 2, step: 0.05, def: 0.7 },
      { kind: 'range', key: 'depth', label: 'Depth', min: 0.5, max: 1, step: 0.01, def: 0.82 },
      { kind: 'range', key: 'travel', label: 'Travel', min: 0, max: 40, step: 1, def: 8 },
      { kind: 'range', key: 'tilt', label: 'Tilt', min: 0, max: 30, step: 1, def: 18 },
      { kind: 'range', key: 'perspective', label: 'Perspective', min: 500, max: 2200, step: 50, def: 800 },
      { kind: 'range', key: 'dim', label: 'Dim', min: 0, max: 1, step: 0.05, def: 0.35 },
    ],
    notes: [
      'No dependencies and no JavaScript animating anything — the stylesheet drives both halves.',
      'Nothing is assumed about your markup. It does not reach into your headings or split any text.',
      'Browser back and forward are not animated — history navigation snaps.',
    ],
    ready: true,
  },
  {
    slug: 'film-burn',
    name: 'Film Burn',
    tagline: 'The page catches alight and the fire burns straight through it.',
    description:
      "A ragged front spreads from the ignition point, its edge chewed up by a displacement map so the boundary moves the way fire does. The outgoing page is masked away inside the front and the incoming page is masked to show only inside a slightly smaller one, which leaves a burning annulus between them — the fire is its own colour rather than a tint of whichever pages happen to be on screen. One continuous burn, no char and no covered beat, because the browser holds a snapshot of the page you are leaving while the page you are arriving at is already rendered underneath it.",
    engine: 'Native',
    dependencies: [],
    accent: ['#fff4dc', '#ffb32e', '#6b1806'],
    duration: 1500,
    requires:
      'The View Transitions API — Chrome 111+, Safari 18+, Firefox 132+. Older browsers navigate normally with no animation. Nothing breaks, but there is no fallback effect.',
    usage: `import { FilmBurnTransition } from '@/components/film-burn'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <FilmBurnTransition palette="ember">{children}</FilmBurnTransition>
      </body>
    </html>
  )
}`,
    props: [
      { name: 'children', type: 'ReactNode', def: '—', description: 'Your app. Wrap the contents of <body>. (Required)' },
      { name: 'origin', type: '"random" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center"', def: '"random"', description: 'Where the fire starts. "random" picks a fresh corner on every navigation.' },
      { name: 'palette', type: '"ember" | "magnesium" | "cold" | "toxic" | "custom"', def: '"ember"', description: 'Colour of the fire. "custom" applies no preset, leaving your own variables in charge.' },
      { name: 'duration', type: 'number', def: '1.5', description: 'Seconds the burn takes to cross the page.' },
      { name: 'speed', type: 'number', def: '1', description: 'Divides the duration. Above 1 is faster.' },
      { name: 'band', type: 'number', def: '64', description: 'Thickness of the burning edge, in pixels.' },
      { name: 'turbulence', type: 'number', def: '78', description: 'How ragged the edge is. 0 is a clean circle.' },
      { name: 'seed', type: 'number', def: '3', description: 'Changes the shape of the raggedness without changing anything else.' },
    ],
    controls: [
      { kind: 'select', key: 'origin', label: 'Origin', options: ['random', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'], def: 'random' },
      { kind: 'select', key: 'palette', label: 'Palette', options: ['ember', 'magnesium', 'cold', 'toxic'], def: 'ember' },
      { kind: 'range', key: 'duration', label: 'Duration', min: 0.5, max: 3.5, step: 0.05, def: 1.5 },
      { kind: 'range', key: 'band', label: 'Edge thickness', min: 12, max: 180, step: 4, def: 64 },
      { kind: 'range', key: 'turbulence', label: 'Edge chew', min: 0, max: 160, step: 4, def: 78 },
      { kind: 'range', key: 'seed', label: 'Shape', min: 1, max: 20, step: 1, def: 3 },
    ],
    notes: [
      'Four palettes ship as presets. For anything else pass palette="custom" and set --burn-core, --burn-hot, --burn-mid and --burn-edge yourself.',
      'No dependencies at all — the browser composites the two pages and an SVG displacement map does the ragged edge.',
      'Browser back and forward are not animated — history navigation snaps.',
    ],
    ready: true,
  },
  {
    slug: 'zipper',
    name: 'Zipper',
    tagline: 'A zip runs up the screen, seals the page, then falls open sideways.',
    description:
      'The panels travel in and meet, then a slider runs up the seam from the bottom — catching twice before it runs, the way a real zip does. It closes upward and opens downward because that is the way a jacket works, so the chain is meshed below the slider and still parted above it. The route swaps behind the sealed screen. Coming back, it unzips in one smooth pull and the two halves fall outward with a tilt.',
    engine: 'GSAP',
    dependencies: ['gsap', 'next-transition-router'],
    accent: ['#d7d2c8', '#8f887c', '#3d3d46'],
    duration: 4840,
    usage: `import { ZipperTransition } from '@/components/zipper'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ZipperTransition>{children}</ZipperTransition>
      </body>
    </html>
  )
}`,
    swatches: [
      { name: 'nickel', from: '#ffffff', to: '#211f1c' },
      { name: 'steel', from: '#f8fbfe', to: '#171b20' },
      { name: 'brass', from: '#fff8dd', to: '#2b2107' },
      { name: 'gunmetal', from: '#c6ccd4', to: '#101216' },
      { name: 'copper', from: '#ffe9d6', to: '#23110a' },
    ],
    props: [
      { name: 'children', type: 'ReactNode', def: '—', description: 'Your app. Wrap the contents of <body>. (Required)' },
      { name: 'palette', type: '"nickel" | "steel" | "brass" | "gunmetal" | "copper" | "custom"', def: '"nickel"', description: 'Metal and tape colours. "custom" applies no preset class, leaving your own CSS variables in charge.' },
      { name: 'speed', type: 'number', def: '1', description: 'Multiplies the whole timeline. Above 1 is faster.' },
      { name: 'sealHold', type: 'number', def: '1', description: 'Seconds the screen stays sealed before unzipping. The route swaps during this beat.' },
      { name: 'unzip', type: 'number', def: '1.85', description: 'Seconds the slider takes to run back down.' },
      { name: 'pitch', type: 'number', def: '18', description: "Vertical spacing between teeth — the chain's density." },
      { name: 'head', type: 'number', def: '13', description: 'Tooth height. Overlap with its neighbour is head − pitch/2.' },
      { name: 'slide', type: 'number', def: '100', description: 'How far each panel travels outward, as a percentage of its own width.' },
    ],
    controls: [
      { kind: 'select', key: 'palette', label: 'Palette', options: ['nickel', 'steel', 'brass', 'gunmetal', 'copper'], def: 'nickel' },
      { kind: 'range', key: 'speed', label: 'Speed', min: 0.4, max: 2.5, step: 0.05, def: 1 },
      { kind: 'range', key: 'sealHold', label: 'Seal hold', min: 0, max: 2, step: 0.05, def: 1 },
      { kind: 'range', key: 'unzip', label: 'Unzip', min: 0.4, max: 3, step: 0.05, def: 1.85 },
      { kind: 'range', key: 'pitch', label: 'Pitch', min: 10, max: 40, step: 1, def: 18 },
      { kind: 'range', key: 'head', label: 'Tooth height', min: 6, max: 26, step: 1, def: 13 },
      { kind: 'range', key: 'slide', label: 'Panel travel', min: 0, max: 130, step: 2, def: 100 },
    ],
    scrub: [
      { key: 'zip', label: 'Zip — 1 closed, 0 open' },
      { key: 'swing', label: 'Swing — 0 shut, 1 travelled away' },
    ],
    notes: [
      'Five presets ship as classes — put zip-brass, zip-steel, zip-gunmetal or zip-copper on any ancestor.',
      'Or set --zip-metal-hi/-metal/-mid/-lo/-edge and --zip-tape/-lo yourself for any colour you like.',
      'Two static chain layers and a clip-path, so a 200-tooth chain costs two transforms a frame.',
      'Browser back and forward are not animated — history navigation snaps.',
    ],
    ready: true,
  },
  {
    slug: 'crayon',
    name: 'Crayon',
    tagline: 'Three strokes draw across the screen and take the page with them.',
    description:
      'Each stroke draws itself on while its stroke-width fattens from 200 to 700 — that is what turns three lines into a full-screen fill without a separate mask. The route swaps behind the ink, then the strokes retract off the far end and thin back down.',
    engine: 'GSAP',
    dependencies: ['gsap', 'next-transition-router'],
    accent: ['#ff2d87', '#aaff00', '#0066ff'],
    duration: 1750,
    usage: `import { CrayonTransition } from '@/components/crayon'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CrayonTransition>{children}</CrayonTransition>
      </body>
    </html>
  )
}`,
    props: [
      { name: 'children', type: 'ReactNode', def: '—', description: 'Your app. Wrap the contents of <body>. (Required)' },
      { name: 'speed', type: 'number', def: '1', description: 'Multiplies the whole timeline. Above 1 is faster.' },
      { name: 'thickness', type: 'number', def: '700', description: 'Stroke width each crayon fattens to. Bigger covers the screen sooner.' },
      { name: 'stagger', type: 'number', def: '0.3', description: 'Seconds between one stroke starting and the next, while closing.' },
    ],
    controls: [
      { kind: 'range', key: 'speed', label: 'Speed', min: 0.4, max: 2.5, step: 0.05, def: 1 },
      { kind: 'range', key: 'thickness', label: 'Thickness', min: 300, max: 1100, step: 20, def: 700 },
      { kind: 'range', key: 'stagger', label: 'Stagger', min: 0, max: 0.8, step: 0.02, def: 0.3 },
      { kind: 'color', key: 'crayon1', label: 'Stroke 1', def: '#ff2d87' },
      { kind: 'color', key: 'crayon2', label: 'Stroke 2', def: '#aaff00' },
      { kind: 'color', key: 'crayon3', label: 'Stroke 3', def: '#0066ff' },
    ],
    notes: [
      'Recolour with --crayon-1, --crayon-2 and --crayon-3 in transitions.css.',
      'Browser back and forward are not animated — history navigation snaps.',
      'The route does not start loading until the leave phase finishes.',
    ],
    ready: true,
  },
]

export const bySlug = (slug: string) => transitions.find((t) => t.slug === slug)

export const installCommand = (slug: string) =>
  `npx shadcn@latest add https://transitions-lib.vercel.app/r/${slug}.json`
