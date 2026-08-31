'use client'

import gsap from 'gsap'
import type { ReactNode } from 'react'
import { createTransition } from './transition-core'
import './transitions.css'

/**
 * Fold-away.
 *
 * A sheet of paper slides on, unfolds across the screen, the route swaps behind
 * it, then it folds itself back into a strip and drops off the edge.
 *
 * The panels are *nested*, not stacked — each one hinges off the top edge of the
 * one below it inside a shared `preserve-3d` context. That is what makes it a
 * real fold rather than a row of independent flips: rotating a panel carries
 * every panel above it, so the sheet collapses onto itself the way folded paper
 * actually does.
 *
 * Two things the geometry depends on:
 *
 * The sheet is inset from the viewport and the backdrop behind it does the
 * covering. A full-bleed sheet has its side edges clipped, so its perspective
 * convergence is never visible and the fold reads as flat stripes sliding. With
 * margins you see the lifted panel taper, which is the whole effect.
 *
 * The rotation is negative. Folding with +180 sends a panel's leading edge to
 * negative z — it swings away behind the sheet and disappears. Negative brings
 * it forward over the panel below, which is what a fold looks like.
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
  /** Seconds one crease takes to fall shut. */
  fold: number
  /** Seconds between one crease moving and the next. */
  stagger: number
  /**
   * How far the sheet sits in from the edge, as a percentage. This is what makes
   * the fold read as 3D. It also has to clear the magnification: a panel leaning
   * toward the viewer projects wider than it is, and too small a margin lets it
   * clip on the viewport edge mid-fold.
   */
  inset: number
  /** Paper stock. "custom" applies no preset, leaving your own variables in charge. */
  paper: 'kraft' | 'newsprint' | 'blueprint' | 'ink' | 'custom'
}

const DEFAULTS: FoldAwayOptions = {
  direction: 'bottom',
  panels: 4,
  speed: 1,
  unfold: 0.52,
  fold: 0.44,
  stagger: 0.11,
  inset: 12,
  paper: 'kraft',
}

/** How dark a panel goes once it has turned away from the light. */
const SHADE = 0.34
/** How dark the panel underneath goes when a flap is over it. */
const CAST = 0.55
/** Degrees a crease travels past its mark before settling back. */
const OVERSHOOT = 7

/*
 * One face, not two. Both sides of a blank sheet look the same, and a second
 * face would double the elements the 3D subtree has to re-rasterise every
 * frame — nothing inside a preserve-3d context can be promoted to its own
 * compositor layer, so element count is the cost that matters here.
 */
const faces = (
  <>
    <div className="fold-face">
      <div className="fold-shade" />
    </div>
    <div className="fold-cast" />
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

const q = <T extends Element>(root: ParentNode, sel: string) => root.querySelector(sel) as T | null

/**
 * A crease travels a little past its mark and settles back, so it lands with
 * some weight instead of easing politely into place.
 */
function swing(
  tl: gsap.core.Timeline,
  crease: HTMLElement,
  to: number,
  duration: number,
  at: number,
  ease: string,
) {
  const past = duration * 0.8
  const overshoot = to + (to < 0 ? -OVERSHOOT : OVERSHOOT)
  tl.to(crease, { rotateX: overshoot, duration: past, ease }, at)
  tl.to(crease, { rotateX: to, duration: duration - past, ease: 'power2.out' }, at + past)
}

/**
 * Creases tighten up as the stack gets heavier, so the collapse gathers pace
 * rather than ticking along at a fixed interval.
 */
const offsets = (count: number, stagger: number) => {
  const out: number[] = []
  let t = 0
  for (let i = 0; i < count; i++) {
    out.push(t)
    t += stagger * (1 - i * 0.09)
  }
  return out
}

export const FoldAwayTransition = createTransition<FoldAwayOptions>({
  timeout: 8000,
  defaults: DEFAULTS,

  overlay: (options) => (
    <div
      className={`foldaway fold-${options.direction} paper-${options.paper}`}
      style={
        {
          '--fold-panels': options.panels,
          '--fold-inset': `${options.inset}%`,
        } as React.CSSProperties
      }
    >
      <div className="foldaway-rig">
        <div className="foldaway-slide">
          <div className="fold-backdrop" />
          <div className="fold-sheet">{sheet(options.panels)}</div>
        </div>
      </div>
    </div>
  ),

  // Park it folded and just off the edge, which is also where enter() leaves it.
  setup: (overlay) => {
    gsap.set(q(overlay, '.foldaway-slide'), { yPercent: 100 })
    gsap.set(creases(overlay), { rotateX: -180 })
    gsap.set(overlay.querySelectorAll('.fold-shade'), { opacity: SHADE })
    gsap.set(overlay.querySelectorAll('.fold-cast'), { opacity: CAST })
  },

  leave: ({ overlay, options, done }) => {
    const tl = gsap.timeline({ onComplete: done })
    const panels = creases(overlay)
    const at = offsets(panels.length, options.stagger)

    tl.to(q(overlay, '.foldaway-slide'), { yPercent: 0, duration: 0.46, ease: 'power3.out' })

    // Shallowest crease first — the last fold you made is the first one you open.
    panels.forEach((crease, i) => {
      const start = 0.3 + at[i]
      swing(tl, crease, 0, options.unfold, start, 'power3.out')
      tl.to(
        crease.querySelectorAll('.fold-shade'),
        { opacity: 0, duration: options.unfold, ease: 'power1.out' },
        start,
      )
      // The panel it was lying on comes back into the light as it lifts away.
      tl.to(
        q(crease.parentElement!, ':scope > .fold-cast'),
        { opacity: 0, duration: options.unfold * 0.7, ease: 'power2.out' },
        start,
      )
    })

    tl.timeScale(options.speed)
    return () => tl.kill()
  },

  enter: ({ overlay, options, done }) => {
    const tl = gsap.timeline({ onComplete: done })
    // Deepest crease first, so the sheet collapses onto the base panel.
    const panels = creases(overlay).reverse()
    const at = offsets(panels.length, options.stagger)

    panels.forEach((crease, i) => {
      const start = at[i]
      // power2.in — a falling flap picks up speed rather than easing down.
      swing(tl, crease, -180, options.fold, start, 'power2.in')
      tl.to(
        crease.querySelectorAll('.fold-shade'),
        { opacity: SHADE, duration: options.fold, ease: 'power1.in' },
        start,
      )
      tl.to(
        q(crease.parentElement!, ':scope > .fold-cast'),
        { opacity: CAST, duration: options.fold * 0.8, ease: 'power2.in' },
        start,
      )
    })

    tl.to(
      q(overlay, '.foldaway-slide'),
      { yPercent: 100, duration: 0.5, ease: 'power2.in' },
      '>-0.14',
    )

    tl.timeScale(options.speed)
    return () => tl.kill()
  },
})
