'use client'

import { useEffect, useState } from 'react'
import gsap from 'gsap'
import { createTransition } from './transition-core'
import { ZipperRig } from './zipper-rig'
import './transitions.css'

type State = { zip: number; swing: number }

/**
 * The rig renders from two numbers, so the phases only have to drive those.
 * A module-level setter is enough of a bridge — the overlay is mounted once and
 * there is never more than one navigation in flight.
 */
let push: ((v: State) => void) | null = null

function ZipperOverlay() {
  const [v, setV] = useState<State>({ zip: 0, swing: 1 })
  useEffect(() => {
    push = setV
    return () => {
      push = null
    }
  }, [])
  return <ZipperRig zip={v.zip} swing={v.swing} />
}

/** A zip catches, gives, catches again, then runs away once properly engaged. */
const CLOSING = [
  { to: 0.17, dur: 0.2, ease: 'power2.out' },
  { hold: 0.13 },
  { to: 0.36, dur: 0.18, ease: 'power2.out' },
  { hold: 0.1 },
  { to: 1, dur: 0.58, ease: 'power1.in' },
] as const

export const ZipperTransition = createTransition({
  timeout: 7000,
  overlay: <ZipperOverlay />,

  setup: () => push?.({ zip: 0, swing: 1 }),

  leave: ({ done }) => {
    const v: State = { zip: 0, swing: 1 }
    const tl = gsap.timeline({ onUpdate: () => push?.({ ...v }), onComplete: done })
    tl.to(v, { swing: 0, duration: 0.55, ease: 'power2.inOut' })
    for (const step of CLOSING) {
      if ('hold' in step) tl.to({}, { duration: step.hold })
      else tl.to(v, { zip: step.to, duration: step.dur, ease: step.ease })
    }
    return () => tl.kill()
  },

  enter: ({ done }) => {
    const v: State = { zip: 1, swing: 0 }
    const tl = gsap.timeline({ onUpdate: () => push?.({ ...v }), onComplete: done })
    // sits sealed for a beat — that is when the route swaps — then one smooth
    // pull, because a zip never catches on the way open
    tl.to({}, { duration: 1 })
      .to(v, { zip: 0, duration: 1.85, ease: 'power2.inOut' })
      .to(v, { swing: 1, duration: 1.05, ease: 'power2.inOut' }, '-=0.2')
    return () => tl.kill()
  },
})
