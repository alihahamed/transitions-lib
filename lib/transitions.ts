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
  /** false while a transition is still being built. */
  ready: boolean
}

export const transitions: TransitionMeta[] = [
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
