import gsap from 'gsap'

/** zip: 1 = closed (screen sealed), 0 = open. swing: 0 = panels shut, 1 = travelled away. */
export type ZipState = { zip: number; swing: number }

type Step = { to: number; dur: number; ease?: string } | { hold: number }

/**
 * A zip does not close at a constant rate. It catches, you tug, it gives a
 * little, catches again, then runs away once the teeth are properly engaged.
 */
const CLOSING: Step[] = [
  { to: 0.17, dur: 0.20, ease: 'power2.out' },
  { hold: 0.13 },
  { to: 0.36, dur: 0.18, ease: 'power2.out' },
  { hold: 0.10 },
  { to: 1, dur: 0.58, ease: 'power1.in' },
]

const CLOSING_TIME = CLOSING.reduce((n, s) => n + ('hold' in s ? s.hold : s.dur), 0)

const PANELS_IN = 0.55
export const DEFAULT_UNZIP = 1.2
const PANELS_OUT = 1.05
const OVERLAP = 0.2

/** Beat between the screen sealing and the zip coming back down. */
export const DEFAULT_SEAL_HOLD = 0.4

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
  tl.to(v, { swing: 0, duration: PANELS_IN, ease: 'power2.inOut' })

  for (const step of CLOSING) {
    if ('hold' in step) tl.to({}, { duration: step.hold })
    else tl.to(v, { zip: step.to, duration: step.dur, ease: step.ease })
  }

  tl.timeScale(speed)
  return tl
}

/**
 * Sits sealed for a beat — that is when the route swaps, so the pause is doing
 * real work as well as looking right — then one smooth pull. A zip never
 * catches on the way open; the asymmetry is why the closing stutter reads as
 * deliberate rather than as dropped frames.
 */
export function zipEnter(
  v: ZipState,
  {
    speed = 1,
    sealHold = DEFAULT_SEAL_HOLD,
    unzip = DEFAULT_UNZIP,
    onUpdate,
    onComplete,
  }: Opts & { sealHold?: number; unzip?: number } = {},
) {
  const tl = gsap.timeline({ onUpdate, onComplete })

  if (sealHold > 0) tl.to({}, { duration: sealHold })

  tl.to(v, { zip: 0, duration: unzip, ease: 'power2.inOut' })
    .to(v, { swing: 1, duration: PANELS_OUT, ease: 'power2.inOut' }, `-=${OVERLAP}`)

  tl.timeScale(speed)
  return tl
}

export const zipDuration = (
  speed = 1,
  sealHold = DEFAULT_SEAL_HOLD,
  unzip = DEFAULT_UNZIP,
) =>
  Math.round(
    ((PANELS_IN + CLOSING_TIME + sealHold + unzip + PANELS_OUT - OVERLAP) / speed) * 1000,
  )
