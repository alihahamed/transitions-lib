'use client'

import { useEffect } from 'react'
import { createViewTransition } from './view-transition-core'
import './transitions.css'

export type BurnOrigin =
  | 'random'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center'

export type FilmBurnOptions = {
  /** Where the fire starts. 'random' picks a fresh corner every navigation. */
  origin: BurnOrigin
  /** Colour of the fire. Presets ship as classes; 'custom' leaves your CSS alone. */
  palette: 'ember' | 'magnesium' | 'cold' | 'toxic' | 'custom'
  /** Seconds the burn takes to cross the page. */
  duration: number
  /** Multiplies the duration. Above 1 is faster. */
  speed: number
  /** Thickness of the burning edge, in pixels. */
  band: number
  /** How ragged the edge is. 0 is a clean circle. */
  turbulence: number
  /** Changes the shape of the raggedness without changing anything else. */
  seed: number
}

const DEFAULTS: FilmBurnOptions = {
  origin: 'random',
  palette: 'ember',
  duration: 1.5,
  speed: 1,
  band: 64,
  turbulence: 78,
  seed: 3,
}

const CORNERS = [
  [0.1, 0.1],
  [0.9, 0.1],
  [0.1, 0.9],
  [0.9, 0.9],
] as const

const SPOTS: Record<Exclude<BurnOrigin, 'random'>, readonly [number, number]> = {
  'top-left': [0.1, 0.1],
  'top-right': [0.9, 0.1],
  'bottom-left': [0.1, 0.9],
  'bottom-right': [0.9, 0.9],
  center: [0.5, 0.5],
}

/** Set once per navigation so paint() and the CSS agree on the geometry. */
let reach = 1
let band = 64

const OVER = 400
const el = (id: string) => document.getElementById(id)
const pct = (n: number) => `${Math.min(100, Math.max(0, n * 100))}%`

function Defs({ options }: { options: FilmBurnOptions }) {
  /*
   * The palette goes on the document element rather than a wrapper. The
   * view-transition pseudo elements inherit custom properties from the root,
   * not from wherever the component happens to sit in the tree.
   */
  useEffect(() => {
    const root = document.documentElement
    const classes = ['burn-ember', 'burn-magnesium', 'burn-cold', 'burn-toxic']
    root.classList.remove(...classes)
    if (options.palette !== 'custom') root.classList.add(`burn-${options.palette}`)
    return () => root.classList.remove(...classes)
  }, [options.palette])

  return (
    <svg width="0" height="0" aria-hidden style={{ position: 'absolute' }}>
      <defs>
        <filter id="burn-chew" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.019 0.024"
            numOctaves={4}
            seed={options.seed}
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale={options.turbulence}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* keeps the outgoing page outside the front */}
        <radialGradient id="burn-grad-old" gradientUnits="userSpaceOnUse" cx={0} cy={0} r={1}>
          <stop offset="0%" stopColor="#000" />
          <stop offset="0%" stopColor="#000" />
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#fff" />
        </radialGradient>

        {/* shows the incoming page inside a slightly smaller front, leaving an
            annulus between the two for the fire to burn in */}
        <radialGradient id="burn-grad-new" gradientUnits="userSpaceOnUse" cx={0} cy={0} r={1}>
          <stop offset="0%" stopColor="#fff" />
          <stop offset="0%" stopColor="#fff" />
          <stop offset="0%" stopColor="#000" />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>

        {/* generous region — anything outside a mask counts as hidden */}
        <mask id="burn-mask-old" maskUnits="userSpaceOnUse" x={-OVER} y={-OVER} width={8000} height={8000}>
          <g filter="url(#burn-chew)">
            <rect x={-OVER} y={-OVER} width={8000} height={8000} fill="url(#burn-grad-old)" />
          </g>
        </mask>

        <mask id="burn-mask-new" maskUnits="userSpaceOnUse" x={-OVER} y={-OVER} width={8000} height={8000}>
          <g filter="url(#burn-chew)">
            <rect x={-OVER} y={-OVER} width={8000} height={8000} fill="url(#burn-grad-new)" />
          </g>
        </mask>
      </defs>
    </svg>
  )
}

export const FilmBurnTransition = createViewTransition<FilmBurnOptions>({
  name: 'film-burn',
  defaults: DEFAULTS,
  defs: (options) => <Defs options={options} />,
  duration: (o) => o.duration / o.speed,

  prepare: (o) => {
    const vw = document.documentElement.clientWidth
    const vh = document.documentElement.clientHeight
    const [ox, oy] =
      o.origin === 'random' ? CORNERS[Math.floor(Math.random() * CORNERS.length)] : SPOTS[o.origin]

    const cx = ox * vw
    const cy = oy * vh
    // far enough to swallow the frame from wherever it started
    reach =
      Math.max(...[0, vw].flatMap((x) => [0, vh].map((y) => Math.hypot(cx - x, cy - y)))) * 1.02
    band = o.band

    for (const id of ['burn-grad-old', 'burn-grad-new']) {
      const g = el(id)
      g?.setAttribute('cx', String(cx))
      g?.setAttribute('cy', String(cy))
      g?.setAttribute('r', String(reach))
    }

    const root = document.documentElement
    root.style.setProperty('--burn-x', `${cx}px`)
    root.style.setProperty('--burn-y', `${cy}px`)
    root.style.setProperty('--burn-band', `${band}px`)
  },

  paint: (t) => {
    // the area consumed grows with the square of the radius, so a linear front
    // already reads as accelerating
    const cut = t
    const gap = band / reach
    const oldStops = el('burn-grad-old')?.querySelectorAll('stop')
    const newStops = el('burn-grad-new')?.querySelectorAll('stop')

    oldStops?.[1]?.setAttribute('offset', pct(cut - 0.004))
    oldStops?.[2]?.setAttribute('offset', pct(cut + 0.004))
    newStops?.[1]?.setAttribute('offset', pct(cut - gap))
    newStops?.[2]?.setAttribute('offset', pct(cut - gap + 0.008))

    document.documentElement.style.setProperty('--burn-cut', `${cut * reach}px`)
  },
})
