'use client'

import { createViewTransition } from './view-transition-core'
import './transitions.css'

/**
 * Push.
 *
 * The incoming page travels in from the edge and the outgoing page travels the
 * same way at a fraction of the speed, so it is overtaken rather than shoved.
 * That speed difference is the whole effect — two pages moving the same
 * direction at different rates read as depth without anything being scaled,
 * tilted or faded.
 *
 * `parallax` is the ratio between them. At 0 the outgoing page does not move at
 * all and the incoming one simply covers it; around 0.3 it matches a native
 * navigation push; at 1 both travel the same distance, locked together like
 * panels of one strip, and the seam stops reading as an overlap.
 *
 *   // app/layout.tsx
 *   <PushTransition direction="left">{children}</PushTransition>
 */
export type PushOptions = {
  /** Which way the pages travel. The incoming one enters from the opposite edge. */
  direction: 'left' | 'right' | 'up' | 'down'
  /** Seconds the swap takes. */
  duration: number
  /** Divides the duration. Above 1 is faster. */
  speed: number
  /** How far the outgoing page travels, as a fraction of the incoming page's distance. */
  parallax: number
  /** How far the outgoing page darkens as it is covered, 0 to 1. */
  dim: number
}

const DEFAULTS: PushOptions = {
  direction: 'left',
  duration: 0.42,
  speed: 1,
  parallax: 0.28,
  dim: 0.22,
}

export const PushTransition = createViewTransition<PushOptions>({
  name: 'push',
  defaults: DEFAULTS,
  defs: null,
  duration: (o) => o.duration / o.speed,

  prepare: (o) => {
    const root = document.documentElement
    root.style.setProperty('--push-parallax', `${o.parallax * 100}%`)
    root.style.setProperty('--push-dim', String(1 - o.dim))

    for (const d of ['left', 'right', 'up', 'down']) {
      root.classList.toggle(`push-${d}`, d === o.direction)
    }
  },
})
