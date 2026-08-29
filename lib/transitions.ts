/** Single source of truth for the gallery, the detail pages and the registry docs. */

export type Family = 'overlay' | 'view-transitions'

export type TransitionMeta = {
  slug: string
  name: string
  tagline: string
  description: string
  family: Family
  engine: string
  dependencies: string[]
  /** Swatch shown on the card and in the detail header. */
  accent: string[]
  /** Roughly how long a navigation takes, in ms. */
  duration: number
  usage: string
  notes: string[]
  /** false while a transition is still being built. */
  ready: boolean
}

export const transitions: TransitionMeta[] = [
  {
    slug: 'crayon',
    name: 'Crayon',
    tagline: 'Three strokes draw across the screen and take the page with them.',
    description:
      'Each stroke draws itself on while its stroke-width fattens from 200 to 700 — that is what turns three lines into a full-screen fill without a separate mask. The route swaps behind the ink, then the strokes retract off the far end and thin back down.',
    family: 'overlay',
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
    notes: [
      'Recolour with --crayon-1, --crayon-2 and --crayon-3 in transitions.css.',
      'Browser back and forward are not animated — history navigation snaps.',
      'The route does not start loading until the leave phase finishes.',
    ],
    ready: true,
  },
  {
    slug: 'connector',
    name: 'Connector',
    tagline: 'One id on two routes. The browser flies one into the other.',
    description:
      'A shared-element morph. Name an element on the page you leave and the page you land on, and the browser works out the geometry itself — position, size, aspect ratio. There is no animation code, only a matching name.',
    family: 'view-transitions',
    engine: 'Native',
    dependencies: [],
    accent: ['#a1a1aa', '#52525b', '#27272a'],
    duration: 320,
    usage: `import { Connector } from '@/components/connector'

// on both routes, same id
<Connector id={\`tile-\${item.id}\`}>
  <Thumb />
</Connector>`,
    notes: [
      'Ids must be unique per page — two live elements sharing one cancels the morph.',
      'Takes exactly one child element.',
      'Sits on React ViewTransition, which is still experimental.',
    ],
    ready: true,
  },
]

export const bySlug = (slug: string) => transitions.find((t) => t.slug === slug)

export const installCommand = (slug: string) =>
  `npx shadcn@latest add https://transitions-lib.vercel.app/r/${slug}.json`
