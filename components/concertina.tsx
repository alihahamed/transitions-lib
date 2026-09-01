'use client'

import gsap from 'gsap'
import { createTransition } from './transition-core'
import './transitions.css'

/**
 * Concertina.
 *
 * The page shrinks into one slot of a row of slats, the row slides along to the
 * slot that belongs to the page you are going to, and the new page opens back
 * out of it.
 *
 * The page really is the middle slat — it is clipped down to that slot rather
 * than being covered by anything. Slats that grow to cover the screen instead
 * turn the whole thing into stripes, which is the opposite of the effect: the
 * row is meant to stay a band with ground above and below it.
 *
 * The bow along the top and bottom is painted, not computed. Two arcs in the
 * ground colour lie over a row of perfectly flat slats and bite into it, which
 * is what makes the outer slats read as taller than the middle ones. Curving
 * them for real would mean a preserve-3d subtree, and nothing inside one of
 * those can be promoted to its own compositor layer.
 *
 *   // app/layout.tsx
 *   <ConcertinaTransition>{children}</ConcertinaTransition>
 */
export type ConcertinaOptions = {
  /** How many slats the row is made of. It has to stay wider than the screen once shuffled. */
  slats: number
  /** Depth of the arc that bites into the top and bottom of the row. 0 is a flat row. */
  bow: number
  /** Width of the window the row lives in, in viewport widths. */
  span: number
  /** How many slots either side of centre a page can land on. */
  spread: number
  /** Seconds the page takes to shrink into the slot, and to open back out. */
  duration: number
  /** Multiplies the whole timeline. Above 1 is faster. */
  speed: number
  /** How far the page is pushed back as it shrinks, 0 to 1. */
  recede: number
  /** Ground and slat colours. "custom" applies no preset. */
  palette: 'mono' | 'inverse' | 'ember' | 'pine' | 'custom'
}

const DEFAULTS: ConcertinaOptions = {
  slats: 41,
  bow: 14,
  span: 60,
  spread: 6,
  duration: 0.8,
  speed: 1,
  recede: 0.06,
  palette: 'mono',
}

/** Slat geometry in vw/vh. The slot the page shrinks to is one slat's footprint. */
const SLAT_W = 3
const GAP = 0.5
const SLAT_H = 45

/*
 * One slat plus its gaps. The row slides by exactly this per slot, so whichever
 * slat lands at the centre lines up with the page's slot — a shuffle distance
 * that is not a whole number of pitches leaves the page opening out of the gap
 * between two slats.
 */
const PITCH = SLAT_W + GAP * 2

/**
 * The page cropped toward one slat's footprint. 0 is the whole screen, 1 is a
 * single slot.
 *
 * Driven off a number rather than handed to GSAP as two clip-path strings: it
 * reads the current value back in px and the target is in vh/vw, and rather
 * than interpolate across the units it snaps straight to the end — the page
 * arrived at the slot in a frame instead of travelling there.
 */
const clipAt = (p: number, bow: number) =>
  `inset(${slotTop(bow) * p}vh ${((100 - SLAT_W) / 2) * p}vw)`

/*
 * Where the arc's curve crosses the middle of the row, which is how far down a
 * centre slat is bitten. The page sits above the arcs, so clipping it to the
 * full slat height would leave it standing proud of the neighbours it is meant
 * to be one of. ARC_H is the arc element's height and 30/60 its flat edge in
 * viewBox units.
 */
const ARC_H = 50
const slotTop = (bow: number) => ((30 + bow) / 60) * ARC_H

/**
 * Fades the page out over the last of its travel, where it is already a sliver
 * three viewport-widths wide — small enough that the swap to the slat behind it
 * is not something you can catch.
 */
const HANDOFF = 0.82
const handoff = (p: number) => (p < HANDOFF ? 1 : 1 - (p - HANDOFF) / (1 - HANDOFF))

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

/**
 * The page, found rather than wrapped. The core renders the overlay as a
 * sibling of the page inside <body>, so the page is reachable without putting a
 * div around anyone's layout — a wrapper breaks height:100% chains and sticky
 * positioning, which is too high a price for a drop-in.
 */
const IGNORE = new Set(['SCRIPT', 'STYLE', 'LINK', 'TEMPLATE', 'NEXT-ROUTE-ANNOUNCER'])
const pageOf = (overlay: HTMLDivElement) =>
  Array.from(overlay.parentElement?.children ?? []).filter(
    (el): el is HTMLElement =>
      el instanceof HTMLElement && el !== overlay && !IGNORE.has(el.tagName),
  )

/** Above the overlay, so the ground and slats sit behind the page as it shrinks. */
const LIFT = { position: 'relative' as const, zIndex: 101 }

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
          '--cc-window': `${options.span}vw`,
        } as React.CSSProperties
      }
    >
      <div className="cc-ground" />
      {/*
        The row lives in a window rather than running edge to edge, and the arcs
        live in it too. Across a narrower span the same curve is far steeper at
        its ends, which is what slants the outermost slats.
      */}
      <div className="cc-window">
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
    </div>
  ),

  setup: (overlay, options) => {
    // Same element leave() and enter() toggle — hiding the stage here while
    // those showed the overlay left the ground and slats permanently invisible.
    gsap.set(overlay, { autoAlpha: 0 })
    gsap.set(q(overlay, '.cc-strip'), {
      x: `${slotFor(location.pathname, options.spread) * PITCH}vw`,
    })
    gsap.set(overlay.querySelectorAll('.cc-arc.is-top'), { yPercent: -110 })
    gsap.set(overlay.querySelectorAll('.cc-arc.is-bottom'), { yPercent: 110 })
  },

  leave: ({ overlay, options, done }) => {
    const tl = gsap.timeline({ onComplete: done })
    const page = pageOf(overlay)
    const d = options.duration

    // Ground and slats come up behind the page, which still covers them whole.
    gsap.set(overlay, { autoAlpha: 1 })
    gsap.set(page, { ...LIFT, clipPath: clipAt(0, options.bow), scale: 1, opacity: 1 })

    // The page shrinks to one slat's footprint, revealing the row around it.
    const at = { p: 0 }
    tl.to(at, {
      p: 1,
      duration: d,
      ease: 'power4.inOut',
      onUpdate: () =>
        gsap.set(page, {
          clipPath: clipAt(at.p, options.bow),
          scale: 1 - options.recede * at.p,
          // Handed over to the slat waiting underneath in the last stretch, so
          // the row ends up all one colour. Left showing, the page's own
          // background sits in the row as a dark gap instead of a bar.
          opacity: handoff(at.p),
        }),
    })
    tl.to(overlay.querySelectorAll('.cc-arc'), { yPercent: 0, duration: d, ease: 'power3.inOut' }, '<')

    tl.timeScale(options.speed)
    return () => tl.kill()
  },

  enter: ({ overlay, options, done }) => {
    const tl = gsap.timeline({
      onComplete: () => {
        // Hand the page back exactly as it was found.
        gsap.set(pageOf(overlay), { clearProps: 'clipPath,transform,position,zIndex,opacity' })
        done()
      },
    })
    const page = pageOf(overlay)
    const d = options.duration

    // location is the destination by now, which is what makes the slot knowable
    // at all — during leave this is still the page being left.
    const slot = slotFor(location.pathname, options.spread)

    /*
     * Synchronously, not as a timeline step. The route has already swapped by
     * the time enter runs, so a fresh unclipped page is mounted and one frame of
     * it at full size is enough to read as a flash.
     */
    gsap.set(page, { ...LIFT, clipPath: clipAt(1, options.bow), scale: 1 - options.recede, opacity: 0 })

    tl.to(q(overlay, '.cc-strip'), {
      x: `${slot * PITCH}vw`,
      duration: d * 0.9,
      ease: 'power2.inOut',
    })

    const at = { p: 1 }
    tl.to(
      at,
      {
        p: 0,
        duration: d,
        ease: 'power4.inOut',
        onUpdate: () =>
          gsap.set(page, {
            clipPath: clipAt(at.p, options.bow),
            scale: 1 - options.recede * at.p,
            opacity: handoff(at.p),
          }),
      },
      '>-0.12',
    )
    tl.to(
      overlay.querySelectorAll('.cc-arc.is-top'),
      { yPercent: -110, duration: d, ease: 'power3.inOut' },
      '<',
    )
    tl.to(
      overlay.querySelectorAll('.cc-arc.is-bottom'),
      { yPercent: 110, duration: d, ease: 'power3.inOut' },
      '<',
    )
    tl.set(overlay, { autoAlpha: 0 })

    tl.timeScale(options.speed)
    return () => tl.kill()
  },
})
