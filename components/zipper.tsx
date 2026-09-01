'use client'

import { useEffect, useState } from 'react'
import gsap from 'gsap'
import { createTransition } from './transition-core'
import { ZipperRig } from './zipper-rig'
import { DEFAULT_PITCH, DEFAULT_HEAD } from './zipper-art'
import './transitions.css'

export type ZipperOptions = {
  /** Metal and tape colours. Presets ship as classes; 'custom' leaves your own CSS alone. */
  palette: 'nickel' | 'steel' | 'brass' | 'gunmetal' | 'copper' | 'custom'
  /** Multiplies the whole timeline. Above 1 is faster. */
  speed: number
  /** Seconds the screen stays sealed before unzipping. The route swaps here. */
  sealHold: number
  /** Seconds the slider takes to run back down. */
  unzip: number
  /** Vertical spacing between teeth — the chain's density. */
  pitch: number
  /** Tooth height. Overlap with its neighbour is head - pitch/2. */
  head: number
  /** How far each panel travels outward, as a percentage of its own width. */
  slide: number
}

const DEFAULTS: ZipperOptions = {
  palette: 'nickel',
  speed: 1,
  sealHold: 1,
  unzip: 1.85,
  pitch: DEFAULT_PITCH,
  head: DEFAULT_HEAD,
  slide: 100,
}

type State = { zip: number; swing: number }

/**
 * The rig renders from two numbers, so the phases only have to drive those.
 * A module-level setter is enough of a bridge — the overlay is mounted once and
 * there is never more than one navigation in flight.
 */
let push: ((v: State) => void) | null = null

function ZipperOverlay({ options }: { options: ZipperOptions }) {
  const [v, setV] = useState<State>({ zip: 0, swing: 1 })
  useEffect(() => {
    push = setV
    return () => {
      push = null
    }
  }, [])

  const cls = options.palette === 'custom' ? undefined : `zip-${options.palette}`
  return (
    <div className={cls} style={{ display: 'contents' }}>
      <ZipperRig
        zip={v.zip}
        swing={v.swing}
        tuning={{ pitch: options.pitch, head: options.head, slide: options.slide }}
      />
    </div>
  )
}

/** A zip catches, gives, catches again, then runs away once properly engaged. */
const CLOSING = [
  { to: 0.17, dur: 0.2, ease: 'power2.out' },
  { hold: 0.13 },
  { to: 0.36, dur: 0.18, ease: 'power2.out' },
  { hold: 0.1 },
  { to: 1, dur: 0.58, ease: 'power1.in' },
] as const

export const ZipperTransition = createTransition<ZipperOptions>({
  timeout: 12000,
  defaults: DEFAULTS,
  overlay: (options) => <ZipperOverlay options={options} />,

  setup: () => push?.({ zip: 0, swing: 1 }),

  leave: ({ options, done }) => {
    const v: State = { zip: 0, swing: 1 }
    const tl = gsap.timeline({ onUpdate: () => push?.({ ...v }), onComplete: done })
    tl.to(v, { swing: 0, duration: 0.55, ease: 'power2.inOut' })
    for (const step of CLOSING) {
      if ('hold' in step) tl.to({}, { duration: step.hold })
      else tl.to(v, { zip: step.to, duration: step.dur, ease: step.ease })
    }
    tl.timeScale(options.speed)
    return () => tl.kill()
  },

  enter: ({ options, done }) => {
    const v: State = { zip: 1, swing: 0 }
    const tl = gsap.timeline({ onUpdate: () => push?.({ ...v }), onComplete: done })
    // sits sealed for a beat — that is when the route swaps — then one smooth
    // pull, because a zip never catches on the way open
    tl.to({}, { duration: options.sealHold })
      .to(v, { zip: 0, duration: options.unzip, ease: 'power2.inOut' })
      .to(v, { swing: 1, duration: 1.05, ease: 'power2.inOut' }, '-=0.2')
    tl.timeScale(options.speed)
    return () => tl.kill()
  },
})
