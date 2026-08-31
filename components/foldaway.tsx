'use client'

import gsap from 'gsap'
import type { ReactNode } from 'react'
import { createTransition } from './transition-core'
import './transitions.css'

/**
 * Fold-away.
 *
 * A sheet of paper unfolds across the screen, the route swaps behind it, then it
 * folds itself back down into a strip and drops off the edge.
 *
 * The panels are *nested*, not stacked — each one hinges off the top edge of the
 * one below it inside a shared `preserve-3d` context. That is what makes it a
 * real fold rather than a row of independent flips: rotating a panel carries
 * every panel above it, so the sheet collapses onto itself the way folded paper
 * actually does. Folding the deepest crease first and unfolding the shallowest
 * first is the same order your hands would use.
 *
 *   // app/layout.tsx
 *   <FoldAwayTransition panels={4}>{children}</FoldAwayTransition>
 */
export type FoldAwayOptions = {
  /** Which edge the sheet folds down to and leaves through. */
  direction: 'bottom' | 'top' | 'left' | 'right'
  /** How many panels the sheet is folded into. More panels, more creases. */
  panels: number
  /** Multiplies the whole timeline. Above 1 is faster. */
  speed: number
  /** Seconds one crease takes to open. */
  unfold: number
  /** Seconds one crease takes to close. */
  fold: number
  /** Seconds between one crease moving and the next. */
  stagger: number
  /** Paper stock. "custom" applies no preset, leaving your own variables in charge. */
  paper: 'kraft' | 'newsprint' | 'blueprint' | 'ink' | 'custom'
}

const DEFAULTS: FoldAwayOptions = {
  direction: 'bottom',
  panels: 4,
  speed: 1,
  unfold: 0.5,
  fold: 0.42,
  stagger: 0.12,
  paper: 'kraft',
}

/** How dark a panel goes once it has turned away from the light. */
const SHADE = 0.45

const faces = (
  <>
    <div className="fold-face fold-front" />
    <div className="fold-face fold-back" />
  </>
)

/**
 * Builds the panels inside out, so panel 2 ends up wrapping 3, wrapping 4…
 * The base panel never rotates — it is the part of the sheet lying on the edge
 * that everything else folds down onto.
 */
function sheet(panels: number): ReactNode {
  let nested: ReactNode = null
  for (let i = panels; i >= 2; i--) {
    nested = (
      <div key={i} className="fold-band" data-fold={i}>
        {faces}
        {nested}
      </div>
    )
  }
  return (
    <div className="fold-band fold-root">
      {faces}
      {nested}
    </div>
  )
}

/** Document order is outermost crease first, which is also unfolding order. */
const creases = (overlay: HTMLDivElement) =>
  gsap.utils.toArray<HTMLElement>(overlay.querySelectorAll('.fold-band[data-fold]'))

const strip = (overlay: HTMLDivElement) =>
  overlay.querySelector<HTMLElement>('.foldaway-slide')

export const FoldAwayTransition = createTransition<FoldAwayOptions>({
  timeout: 8000,
  defaults: DEFAULTS,

  overlay: (options) => (
    <div
      className={`foldaway fold-${options.direction} paper-${options.paper}`}
      style={{ '--fold-panels': options.panels } as React.CSSProperties}
    >
      <div className="foldaway-rig">
        <div className="foldaway-slide">{sheet(options.panels)}</div>
      </div>
    </div>
  ),

  // Park it folded and just off the edge, which is also where enter() leaves it.
  setup: (overlay) => {
    gsap.set(strip(overlay), { yPercent: 100 })
    gsap.set(creases(overlay), { rotateX: -180, '--fold-shade': SHADE })
  },

  leave: ({ overlay, options, done }) => {
    const tl = gsap.timeline({ onComplete: done })

    tl.to(strip(overlay), { yPercent: 0, duration: 0.4, ease: 'power3.out' })

    // Shallowest crease first — the last fold you made is the first one you open.
    creases(overlay).forEach((crease, i) => {
      const at = 0.28 + i * options.stagger
      tl.to(crease, { rotateX: 0, duration: options.unfold, ease: 'power2.inOut' }, at)
      tl.to(crease, { '--fold-shade': 0, duration: options.unfold, ease: 'power1.out' }, at)
    })

    tl.timeScale(options.speed)
    return () => tl.kill()
  },

  enter: ({ overlay, options, done }) => {
    const tl = gsap.timeline({ onComplete: done })

    // Deepest crease first, so the sheet collapses onto the base panel.
    creases(overlay)
      .reverse()
      .forEach((crease, i) => {
        const at = i * options.stagger
        tl.to(crease, { rotateX: -180, duration: options.fold, ease: 'power2.inOut' }, at)
        tl.to(crease, { '--fold-shade': SHADE, duration: options.fold, ease: 'power1.in' }, at)
      })

    tl.to(strip(overlay), { yPercent: 100, duration: 0.45, ease: 'power2.in' }, '>-0.12')

    tl.timeScale(options.speed)
    return () => tl.kill()
  },
})
