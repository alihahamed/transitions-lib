'use client'

import { createViewTransition } from './view-transition-core'
import './transitions.css'

/**
 * Spaces.
 *
 * The way macOS switches desktops. The two pages are one rigid strip with a
 * thin gap between them, and the strip slides across on a spring — fast out
 * of the gate, a long soft landing, no overshoot unless you ask for one. As
 * it starts to move both pages lift off the surface a little and cast a
 * shadow onto the backdrop, and they settle back down as they land.
 *
 * Direction comes from where you are going. Give it the order of your routes
 * and a page further along slides in from the right, a page further back from
 * the left, as though they really were laid out in a row. Anything not in the
 * list uses `direction`.
 *
 * Zero dependencies: the browser runs it off the stylesheet. The only script
 * work is choosing the direction and writing the spring as a CSS linear()
 * easing before the snapshot is taken.
 *
 *   // app/layout.tsx
 *   <SpacesTransition routes={['/', '/work', '/about']}>{children}</SpacesTransition>
 */
export type SpacesOptions = {
  /** Your routes in order, left to right. Decides which way a navigation slides. */
  routes: string[]
  /** Which way the pages travel when the destination is not in `routes`. */
  direction: 'left' | 'right'
  /** Seconds the switch takes, landing included. */
  duration: number
  /** Divides the duration. Above 1 is faster. */
  speed: number
  /** Space between the two pages while they travel, in px. */
  gap: number
  /** How far the pages shrink while in flight, in percent. 0 keeps them flat on the surface. */
  lift: number
  /** How far short of the full distance the outgoing page travels, 0 to 1. Above 0 it is overtaken rather than carried, and the gap goes. */
  parallax: number
  /** Overshoot on landing, 0 to 0.4. 0 is critically damped, the way macOS does it. */
  bounce: number
  /** What shows in the gap and around the lifted pages. "custom" leaves --spaces-backdrop to you. */
  backdrop: 'dark' | 'light' | 'custom'
}

const DEFAULTS: SpacesOptions = {
  routes: [],
  direction: 'left',
  duration: 0.55,
  speed: 1,
  gap: 12,
  lift: 4,
  parallax: 0,
  bounce: 0,
  backdrop: 'dark',
}

/** Index of the route that owns a path: exact match first, else the longest prefix. */
function slot(routes: string[], path: string): number {
  let best = -1
  let bestLen = -1
  routes.forEach((r, i) => {
    const hit = path === r || (r !== '/' && path.startsWith(r.endsWith('/') ? r : r + '/'))
    if (hit && r.length > bestLen) {
      best = i
      bestLen = r.length
    }
  })
  return best
}

/**
 * A damped spring as a CSS linear() easing. Simulated rather than solved in
 * closed form so one function covers both the critically damped case and the
 * bouncy one. The stiffness is chosen so that, with no bounce, the strip has
 * covered 58% of the distance a fifth of the way in and is within half a
 * percent at the end, and it leaves with some initial velocity: a switch is a
 * flick, not a release from rest.
 */
function spring(bounce: number, samples = 48): string {
  const w = 7
  const zeta = Math.max(0.5, 1 - bounce)
  let x = -1
  let v = 0.5 * w
  const per = 100
  const steps = samples * per
  const dt = 1 / steps
  const pts: string[] = ['0']
  for (let i = 1; i <= steps; i++) {
    const a = -w * w * x - 2 * zeta * w * v
    v += a * dt
    x += v * dt
    if (i % per === 0) pts.push(i === steps ? '1' : (1 + x).toFixed(4))
  }
  return `linear(${pts.join(', ')})`
}

export const SpacesTransition = createViewTransition<SpacesOptions>({
  name: 'spaces',
  defaults: DEFAULTS,
  defs: null,
  duration: (o) => o.duration / o.speed,

  prepare: (o, nav) => {
    const root = document.documentElement
    const from = slot(o.routes, nav.from)
    const to = slot(o.routes, nav.to)
    const travel = from >= 0 && to >= 0 && from !== to ? (to > from ? 'left' : 'right') : o.direction

    root.style.setProperty('--spaces-dir', travel === 'left' ? '-1' : '1')
    root.style.setProperty('--spaces-gap', `${o.gap}px`)
    root.style.setProperty('--spaces-lift', String(1 - o.lift / 100))
    root.style.setProperty('--spaces-stay', String(1 - o.parallax))
    root.style.setProperty('--spaces-ease', spring(o.bounce))
    for (const b of ['dark', 'light']) root.classList.toggle(`spaces-${b}`, b === o.backdrop)
  },
})
