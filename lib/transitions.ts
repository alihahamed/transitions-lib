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
    slug: 'foldaway',
    name: 'Fold-away',
    tagline: 'A sheet unfolds over the page, then folds itself up and drops off the edge.',
    description:
      'The panels are nested rather than stacked — each one hinges off the top edge of the one below it inside a shared 3D context, so rotating a panel carries every panel above it and the sheet collapses onto itself the way folded paper actually does. It opens the shallowest crease first and closes the deepest first, which is the order your hands would use. The route swaps while the sheet is spread, so the fold is the reveal.',
    engine: 'GSAP',
    dependencies: ['gsap', 'next-transition-router'],
    accent: ['#d8c9ad', '#bfae8e', '#5c4a2c'],
    duration: 2100,
    usage: `import { FoldAwayTransition } from '@/components/foldaway'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <FoldAwayTransition panels={4}>{children}</FoldAwayTransition>
      </body>
    </html>
  )
}`,
    swatches: [
      { name: 'kraft', from: '#d8c9ad', to: '#bfae8e' },
      { name: 'newsprint', from: '#e9e5db', to: '#d0cabc' },
      { name: 'blueprint', from: '#1f4470', to: '#17334f' },
      { name: 'ink', from: '#26242a', to: '#1a181d' },
    ],
    props: [
      { name: 'children', type: 'ReactNode', def: '—', description: 'Your app. Wrap the contents of <body>. (Required)' },
      { name: 'direction', type: '"bottom" | "top" | "left" | "right"', def: '"bottom"', description: 'Which edge the sheet folds down to and leaves through.' },
      { name: 'panels', type: 'number', def: '4', description: 'How many panels the sheet is folded into. More panels means more creases and a taller stack.' },
      { name: 'speed', type: 'number', def: '1', description: 'Multiplies the whole timeline. Above 1 is faster.' },
      { name: 'unfold', type: 'number', def: '0.52', description: 'Seconds one crease takes to open.' },
      { name: 'fold', type: 'number', def: '0.44', description: 'Seconds one crease takes to close.' },
      { name: 'stagger', type: 'number', def: '0.11', description: 'Seconds between one crease moving and the next. Tightens as the stack gets heavier.' },
      { name: 'inset', type: 'number', def: '12', description: 'How far the sheet sits in from the edge, as a percentage. This margin is what makes the fold read as 3D — at 0 the sheet is full-bleed, its perspective is clipped away, and the fold reads as flat stripes sliding.' },
      { name: 'paper', type: '"kraft" | "newsprint" | "blueprint" | "ink" | "custom"', def: '"kraft"', description: 'Paper stock. "custom" applies no preset, leaving your own CSS variables in charge.' },
    ],
    controls: [
      { kind: 'select', key: 'direction', label: 'Direction', options: ['bottom', 'top', 'left', 'right'], def: 'bottom' },
      { kind: 'select', key: 'paper', label: 'Paper', options: ['kraft', 'newsprint', 'blueprint', 'ink'], def: 'kraft' },
      { kind: 'range', key: 'panels', label: 'Panels', min: 2, max: 8, step: 1, def: 4 },
      { kind: 'range', key: 'speed', label: 'Speed', min: 0.4, max: 2.5, step: 0.05, def: 1 },
      { kind: 'range', key: 'unfold', label: 'Unfold', min: 0.2, max: 1.4, step: 0.02, def: 0.52 },
      { kind: 'range', key: 'fold', label: 'Fold', min: 0.2, max: 1.4, step: 0.02, def: 0.44 },
      { kind: 'range', key: 'stagger', label: 'Stagger', min: 0, max: 0.4, step: 0.01, def: 0.11 },
      { kind: 'range', key: 'inset', label: 'Inset', min: 0, max: 24, step: 1, def: 12 },
    ],
    notes: [
      'Four paper stocks ship as presets. For anything else pass paper="custom" and set --fold-paper, --fold-table and --fold-crease yourself.',
      'Nothing is captured or screenshotted — the sheet is its own object, so it folds identically over any page.',
      'Browser back and forward are not animated — history navigation snaps.',
    ],
    ready: true,
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
    tagline: 'A zip runs down the screen, seals the page, then falls open sideways.',
    description:
      'The panels travel in and meet, then a slider runs down the seam — catching twice before it runs, the way a real zip does. The route swaps behind the sealed screen. Coming back, it unzips in one smooth pull and the two halves fall outward with a tilt.',
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
      { name: 'unzip', type: 'number', def: '1.85', description: 'Seconds the slider takes to run back up.' },
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
