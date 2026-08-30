'use client'

import { createViewTransition } from './view-transition-core'
import './transitions.css'

export type RiserOptions = {
  /** Which way the incoming page arrives from. */
  direction: 'up' | 'down' | 'left' | 'right'
  /** Seconds the swap takes. */
  duration: number
  /** Divides the duration. Above 1 is faster. */
  speed: number
  /** How far the outgoing page is pushed back, 0 to 1. Smaller is further. */
  depth: number
  /** How far the outgoing page travels as it recedes, in viewport units. */
  travel: number
  /** Degrees the outgoing page leans away as it drops back. 0 is a flat scale. */
  tilt: number
  /** How dark the outgoing page goes as it falls behind, 0 to 1. */
  dim: number
}

const DEFAULTS: RiserOptions = {
  direction: 'up',
  duration: 0.7,
  speed: 1,
  depth: 0.86,
  travel: 8,
  tilt: 6,
  dim: 0.35,
}

/**
 * The outgoing page drops back into depth while the incoming page is unmasked
 * over it. No JavaScript animates anything — both halves are a transform and a
 * clip-path, so the stylesheet drives it and the browser does the rest.
 */
export const RiserTransition = createViewTransition<RiserOptions>({
  name: 'riser',
  defaults: DEFAULTS,
  defs: null,
  duration: (o) => o.duration / o.speed,

  prepare: (o) => {
    const root = document.documentElement
    root.style.setProperty('--riser-depth', String(o.depth))
    root.style.setProperty('--riser-travel', `${o.travel}vh`)
    root.style.setProperty('--riser-travel-x', `${o.travel}vw`)
    root.style.setProperty('--riser-tilt', `${o.tilt}deg`)
    root.style.setProperty('--riser-dim', String(o.dim))

    for (const d of ['up', 'down', 'left', 'right']) {
      root.classList.toggle(`riser-${d}`, d === o.direction)
    }
  },
})
