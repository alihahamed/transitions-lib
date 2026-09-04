'use client'

import gsap from 'gsap'
import { createTransition } from './transition-core'
import './transitions.css'

/**
 * Slate.
 *
 * A clapperboard rises into frame from the bottom, stick open, and covers the
 * page. The stick claps shut — that is the moment the screen is fully covered
 * and the route swaps behind it. The stick lifts again and the new page shows
 * in the gap it leaves above the board, then the whole slate is pulled down
 * out of frame. Nothing fades; every reveal is a piece of board moving.
 *
 * The motion is written as a hand would do it. The slate comes into shot
 * off-square — leaning away, rolled a few degrees, a touch small — and
 * squares up as it arrives, a hair high, then settles. Flat and full-width
 * from the first frame it read as a wipe; the lean and roll are what make it
 * a thing being held over the page. The stick falls under gravity and
 * rebounds once, the slate dips on impact and the hand absorbs it, the lift
 * is quick with a soft stop, and the pull-out takes it away the same way it
 * came, slow then gone.
 *
 *   // app/layout.tsx
 *   <SlateTransition>{children}</SlateTransition>
 */
export type SlateOptions = {
  /** Degrees the stick opens. */
  angle: number
  /** Height of the stick as a share of the viewport height, in vh. */
  stick: number
  /** Which end the stick pivots on. */
  hinge: 'left' | 'right'
  /** Seconds the slate takes to rise into frame, and to be pulled out. */
  duration: number
  /** Seconds the stick stays shut after the route swaps, before it lifts. */
  hold: number
  /** How far the slate drops after the clap, in vh, bringing the stick's top edge into frame. 0 keeps it flush. */
  settle: number
  /** Sideways travel on the way in and out, in vw, from the hinge side — the arc of the hand. 0 is straight up and down. */
  drift: number
  /** Jolt of the slate at the clap, in px. 0 for none. */
  shake: number
  /** Multiplies the whole timeline. Above 1 is faster. */
  speed: number
  /** Board and stripe colours. "custom" applies no preset, leaving --slate-board and --slate-stripe to you. */
  palette: 'ink' | 'chalk' | 'custom'
}

const DEFAULTS: SlateOptions = {
  angle: 20,
  stick: 12,
  hinge: 'left',
  duration: 0.5,
  hold: 0.08,
  settle: 7,
  drift: 5,
  shake: 2,
  speed: 1,
  palette: 'ink',
}

const parts = (overlay: HTMLDivElement) => ({
  rig: overlay.querySelector<HTMLElement>('.slate-rig'),
  stick: overlay.querySelector<HTMLElement>('.slate-stick'),
})

/** Open is a lift of the far end: anticlockwise on a left hinge, clockwise on a right one. */
const open = (o: SlateOptions) => (o.hinge === 'left' ? -o.angle : o.angle)

/** Parked below the frame and hidden. */
const park = (rig: HTMLElement) => gsap.set(rig, { yPercent: 100, visibility: 'hidden' })

/**
 * Where the slate sits for the clap, as a yPercent: a hair above flush, so the
 * impact dip lands at flush rather than below it and the top edge of the stick
 * never uncovers the page while the screen is meant to be covered.
 */
const SEAT = -0.8

/**
 * How far below the frame the slate has to be for all of it to be out of
 * shot, as a yPercent. One screen height clears the board, but the open stick
 * stands well above the board at its far end — a screen width times the sine
 * of the angle — so the whole thing has to start that much lower, and the tip
 * of the stick is the first thing to come into view.
 */
const clearance = (rig: HTMLElement, o: SlateOptions) => {
  const w = rig.clientWidth
  const h = rig.clientHeight
  const tip = w * Math.sin((o.angle * Math.PI) / 180) + (o.stick / 100) * h
  return 100 + (tip / h) * 100
}

/**
 * The off-square pose the slate holds while it is in the hand: leaning away at
 * the top, rolled towards the hinge side, and a little small. Pivoting at the
 * bottom edge, where the hand is. Everything here is zero once it has arrived.
 */
const held = (o: SlateOptions, roll: number) => ({
  rotationX: 12,
  rotation: o.hinge === 'left' ? -roll : roll,
  xPercent: o.hinge === 'left' ? -o.drift : o.drift,
  scale: 0.94,
})
const SQUARE = { rotationX: 0, rotation: 0, xPercent: 0, scale: 1 }

export const SlateTransition = createTransition<SlateOptions>({
  timeout: 6000,
  defaults: DEFAULTS,

  overlay: (o) => (
    <div
      className={[
        'slate',
        `slate-hinge-${o.hinge}`,
        o.palette === 'custom' ? '' : `slate-${o.palette}`,
      ].join(' ')}
      style={{ '--slate-stick': `${o.stick}vh` } as React.CSSProperties}
    >
      <div className="slate-rig">
        <div className="slate-stick" />
        <div className="slate-board">
          <div className="slate-lip" />
        </div>
      </div>
    </div>
  ),

  setup: (overlay, options) => {
    const { rig, stick } = parts(overlay)
    if (rig) park(rig)
    if (stick) gsap.set(stick, { rotation: open(options) })
  },

  leave: ({ overlay, options: o, done }) => {
    const { rig, stick } = parts(overlay)
    if (!rig || !stick) {
      done()
      return
    }
    const d = o.duration
    const tl = gsap.timeline({ onComplete: done })

    gsap.set(rig, {
      visibility: 'visible',
      yPercent: clearance(rig, o),
      transformPerspective: 800,
      transformOrigin: '50% 100%',
      ...held(o, 5),
    })
    gsap.set(stick, { rotation: open(o) })

    // Rise: a reach, bell-shaped velocity, squaring up on the way, a hair too
    // high, then set down.
    tl.to(rig, { yPercent: SEAT - 1.5, ...SQUARE, duration: d, ease: 'power2.inOut' })
    tl.to(rig, { yPercent: SEAT, duration: 0.14, ease: 'power2.inOut' })

    // Clap: gravity and a flick of the wrist, then one rebound. It begins while
    // the slate is still setting down, so the arrival and the clap are one gesture.
    tl.to(stick, { rotation: 0, duration: 0.15, ease: 'power3.in' }, '-=0.08')
    tl.addLabel('impact')
    tl.to(stick, { rotation: open(o) * 0.07, duration: 0.05, ease: 'power1.out' })
    tl.to(stick, { rotation: 0, duration: 0.07, ease: 'power1.in' })

    // The hand takes the hit: the whole slate dips and comes back, with a
    // sideways jolt that dies out in a few frames.
    tl.to(rig, { yPercent: 0, duration: 0.05, ease: 'power2.out' }, 'impact')
    tl.to(rig, { yPercent: SEAT, duration: 0.22, ease: 'power2.out' }, 'impact+=0.05')
    if (o.shake) {
      const j = o.shake
      tl.to(rig, { x: j, duration: 0.03, ease: 'power1.out' }, 'impact')
      tl.to(rig, { x: -j * 0.6, duration: 0.04, ease: 'power1.inOut' }, 'impact+=0.03')
      tl.to(rig, { x: j * 0.3, duration: 0.04, ease: 'power1.inOut' }, 'impact+=0.07')
      tl.to(rig, { x: 0, duration: 0.05, ease: 'power1.out' }, 'impact+=0.11')
    }

    tl.timeScale(o.speed)
    return () => tl.kill()
  },

  enter: ({ overlay, options: o, done }) => {
    const { rig, stick } = parts(overlay)
    if (!rig || !stick) {
      done()
      return
    }
    const d = o.duration
    const tl = gsap.timeline({
      onComplete: () => {
        park(rig)
        done()
      },
    })

    gsap.set(rig, {
      visibility: 'visible',
      yPercent: SEAT,
      x: 0,
      transformPerspective: 800,
      transformOrigin: '50% 100%',
      ...SQUARE,
    })
    gsap.set(stick, { rotation: 0 })

    // The hand relaxes after the hit: the slate settles down a few vh and the
    // top edge of the stick comes into frame, with the new page above it.
    tl.to(rig, { yPercent: o.settle, duration: 0.24, ease: 'power2.out' }, o.hold)

    // Lift: the thumb flicks it open, soft stop with a touch of overshoot.
    tl.to(stick, { rotation: open(o), duration: 0.3, ease: 'back.out(1.5)' }, o.hold + 0.1)

    // Pull-out, once it has settled and while the stick is still lifting: it
    // drops, rolls the other way and leans off as the hand takes it, slow
    // then away.
    tl.to(rig, { yPercent: clearance(rig, o), ...held(o, -4), duration: d, ease: 'power3.in' }, o.hold + 0.3)

    tl.timeScale(o.speed)
    return () => tl.kill()
  },
})
