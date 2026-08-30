import gsap from 'gsap'

/** zip: 1 = closed (screen sealed), 0 = open. swing: 0 = panels shut, 1 = travelled away. */
export type ZipState = { zip: number; swing: number }

type Step = { to: number; dur: number; ease?: string } | { hold: number }

/**
 * A zip does not close at a constant rate. It catches, you tug, it gives a
 * little, catches again, then runs away once the teeth are properly engaged.
 * Two short pulls with a beat between, then it goes.
 */
const CLOSING: Step[] = [
  { to: 0.17, dur: 0.14, ease: 'power2.out' },
  { hold: 0.09 },
  { to: 0.36, dur: 0.13, ease: 'power2.out' },
  { hold: 0.06 },
  { to: 1, dur: 0.46, ease: 'power1.in' },
]

type Opts = {
  /** Multiplies the whole timeline. >1 is faster. */
  speed?: number
  onUpdate?: () => void
  onComplete?: () => void
}

/** Panels travel in, meet, then the slider runs down and seals the screen. */
export function zipLeave(v: ZipState, { speed = 1, onUpdate, onComplete }: Opts = {}) {
  const tl = gsap.timeline({ onUpdate, onComplete })

  // eased both ends — the panels gather speed and settle as they meet, rather
  // than arriving at full tilt
  tl.to(v, { swing: 0, duration: 0.5, ease: 'power2.inOut' })

  for (const step of CLOSING) {
    if ('hold' in step) tl.to({}, { duration: step.hold })
    else tl.to(v, { zip: step.to, duration: step.dur, ease: step.ease })
  }

  tl.timeScale(speed)
  return tl
}

/**
 * Unzipping is one smooth pull — it never catches on the way open. The
 * asymmetry is part of why the closing stutter reads as real.
 */
export function zipEnter(v: ZipState, { speed = 1, onUpdate, onComplete }: Opts = {}) {
  const tl = gsap.timeline({ onUpdate, onComplete })

  tl.to(v, { zip: 0, duration: 0.68, ease: 'power2.inOut' })
    .to(v, { swing: 1, duration: 0.9, ease: 'power2.inOut' }, '-=0.18')

  tl.timeScale(speed)
  return tl
}

const LEAVE = 0.5 + 0.88
const ENTER = 0.68 + 0.9 - 0.18

export const zipDuration = (speed = 1) => Math.round(((LEAVE + ENTER) / speed) * 1000)
