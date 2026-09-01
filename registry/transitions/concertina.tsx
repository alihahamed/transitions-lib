'use client'

import gsap from 'gsap'
import { createTransition } from './transition-core'
import './transitions.css'

/**
 * Concertina.
 *
 * The screen folds down into a strip of slats, the strip slides sideways to the
 * slot that belongs to the page you are going to, and that slot opens back out.
 *
 * The bow at the top and bottom is painted, not computed. Two arcs in the ground
 * colour sit over a row of perfectly flat slats and eat into it, which is what
 * makes the edge slats read as taller than the middle ones. Curving the slats
 * for real would mean a preserve-3d subtree, and nothing inside one of those can
 * be promoted to its own compositor layer.
 *
 * Everything that moves here is a transform. The slats are laid out at their
 * collapsed size and scaled up to cover, rather than having width and height
 * animated on forty-odd elements every frame.
 *
 *   // app/layout.tsx
 *   <ConcertinaTransition>{children}</ConcertinaTransition>
 */
export type ConcertinaOptions = {
  /** How many slats the strip is made of. Odd numbers give it a true middle. */
  slats: number
  /** Depth of the arc that bites into the top and bottom of the row. 0 is a flat row. */
  bow: number
  /** How far the strip slides per slot, in viewport widths. */
  shuffle: number
  /** How many slots either side of centre a page can land on. */
  spread: number
  /** Seconds the strip takes to fold down, and to open back out. */
  duration: number
  /** Multiplies the whole timeline. Above 1 is faster. */
  speed: number
  /** Ground and slat colours. "custom" applies no preset. */
  palette: 'mono' | 'inverse' | 'ember' | 'pine' | 'custom'
}

const DEFAULTS: ConcertinaOptions = {
  slats: 41,
  bow: 14,
  shuffle: 4,
  spread: 6,
  duration: 0.55,
  speed: 1,
  palette: 'mono',
}

/** Slat geometry, in vw/vh. Kept here because the cover scale is derived from it. */
const SLAT_W = 3
const GAP = 0.5
const SLAT_H = 45
const PITCH = SLAT_W + GAP * 2

/** Slightly over the pitch, so the slats close their seams when they cover. */
const COVER_X = (PITCH / SLAT_W) * 1.02
const COVER_Y = 100 / SLAT_H

/**
 * Which slot a path lands on. The same page always lands on the same slat, so
 * the site keeps the feel of a strip you slide along — without asking anyone to
 * hand us a list of their routes.
 */
function slotFor(path: string, spread: number) {
  let h = 0
  for (let i = 0; i < path.length; i++) h = (h * 31 + path.charCodeAt(i)) | 0
  return (Math.abs(h) % (spread * 2 + 1)) - spread
}

/**
 * The two arcs, mirrored in their own path data rather than with a CSS scale.
 * A `scale: 1 -1` on the element gets overwritten the moment GSAP writes a
 * transform to slide the arc in, which leaves the bottom one cutting the row
 * with its flat edge instead of its curve.
 */
const arcTop = (bow: number) => `M0,0 H100 V30 Q50,${30 + bow * 2} 0,30 Z`
const arcBottom = (bow: number) => `M0,60 H100 V30 Q50,${30 - bow * 2} 0,30 Z`

const q = <T extends Element>(root: ParentNode, sel: string) =>
  root.querySelector(sel) as T | null

const slatsOf = (overlay: HTMLDivElement) =>
  gsap.utils.toArray<HTMLElement>(overlay.querySelectorAll('.cc-slat'))

/** Ordered from the middle outwards, which is the order they arrive in. */
const fromMiddle = (els: HTMLElement[]) => {
  const mid = (els.length - 1) / 2
  return [...els].sort((a, b) => Math.abs(els.indexOf(a) - mid) - Math.abs(els.indexOf(b) - mid))
}

export const ConcertinaTransition = createTransition<ConcertinaOptions>({
  timeout: 9000,
  defaults: DEFAULTS,

  overlay: (options) => (
    <div
      className={`cc-stage ${options.palette === 'custom' ? '' : `cc-${options.palette}`}`}
      style={
        {
          '--cc-slat-w': `${SLAT_W}vw`,
          '--cc-gap': `${GAP}vw`,
          '--cc-slat-h': `${SLAT_H}vh`,
        } as React.CSSProperties
      }
    >
      <div className="cc-ground" />
      <div className="cc-strip">
        {Array.from({ length: options.slats }, (_, i) => (
          <div key={i} className="cc-slat" />
        ))}
      </div>
      <svg className="cc-arc is-top" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden>
        <path d={arcTop(options.bow)} />
      </svg>
      <svg className="cc-arc is-bottom" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden>
        <path d={arcBottom(options.bow)} />
      </svg>
    </div>
  ),

  // Parked open: slats flattened away, ground hidden, strip on this page's slot.
  setup: (overlay, options) => {
    gsap.set(slatsOf(overlay), { scaleX: COVER_X, scaleY: 0 })
    gsap.set(q(overlay, '.cc-ground'), { autoAlpha: 0 })
    gsap.set(q(overlay, '.cc-strip'), {
      x: `${slotFor(location.pathname, options.spread) * options.shuffle}vw`,
    })
    gsap.set(overlay.querySelectorAll('.cc-arc.is-top'), { yPercent: -110 })
    gsap.set(overlay.querySelectorAll('.cc-arc.is-bottom'), { yPercent: 110 })
  },

  leave: ({ overlay, options, done }) => {
    const tl = gsap.timeline({ onComplete: done })
    const slats = slatsOf(overlay)
    const d = options.duration

    // The slats grow out of nothing to cover, from the middle outwards.
    tl.to(fromMiddle(slats), {
      scaleY: COVER_Y,
      duration: d * 0.7,
      ease: 'power3.out',
      stagger: { each: 0.012 },
    })

    // Ground only has to exist once something is over it.
    tl.set(q(overlay, '.cc-ground'), { autoAlpha: 1 }, d * 0.45)

    // Then the whole screen folds down into the strip.
    tl.to(slats, { scaleX: 1, scaleY: 1, duration: d, ease: 'power3.inOut' }, d * 0.55)
    tl.to(
      overlay.querySelectorAll('.cc-arc'),
      { yPercent: 0, duration: d, ease: 'power3.inOut' },
      d * 0.55,
    )

    tl.timeScale(options.speed)
    return () => tl.kill()
  },

  enter: ({ overlay, options, done }) => {
    const tl = gsap.timeline({ onComplete: done })
    const slats = slatsOf(overlay)
    const d = options.duration

    // location is the destination by now, which is what makes the slot knowable
    // at all — during leave this is still the page being left.
    const slot = slotFor(location.pathname, options.spread)

    tl.to(q(overlay, '.cc-strip'), {
      x: `${slot * options.shuffle}vw`,
      duration: d * 1.15,
      ease: 'power2.inOut',
    })

    tl.to(
      overlay.querySelectorAll('.cc-arc.is-top'),
      { yPercent: -110, duration: d, ease: 'power3.inOut' },
      d * 0.9,
    )
    tl.to(
      overlay.querySelectorAll('.cc-arc.is-bottom'),
      { yPercent: 110, duration: d, ease: 'power3.inOut' },
      d * 0.9,
    )
    tl.to(slats, { scaleX: COVER_X, scaleY: COVER_Y, duration: d, ease: 'power3.inOut' }, d * 0.9)

    // Cover is solid again here, so the ground can go without being seen to.
    tl.set(q(overlay, '.cc-ground'), { autoAlpha: 0 })
    tl.to(fromMiddle(slats).reverse(), {
      scaleY: 0,
      duration: d * 0.7,
      ease: 'power3.in',
      stagger: { each: 0.012 },
    })

    tl.timeScale(options.speed)
    return () => tl.kill()
  },
})
