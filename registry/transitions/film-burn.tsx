'use client'

import { useEffect, useState } from 'react'
import gsap from 'gsap'
import { createTransition } from './transition-core'
import { BurnArt, type BurnOrigin } from './burn-art'
import './transitions.css'

export type FilmBurnOptions = {
  /** Where the fire starts. 'random' picks a fresh corner on every navigation. */
  origin: BurnOrigin | 'random'
  /** Multiplies the whole timeline. Above 1 is faster. */
  speed: number
  /** Seconds the fire takes to consume the page. */
  burn: number
  /** Seconds the char takes to burn away again, revealing the new page. */
  reveal: number
  /** How far the ember edge is chewed up. 0 is a clean circle. */
  turbulence: number
}

const DEFAULTS: FilmBurnOptions = {
  origin: 'random',
  speed: 1,
  burn: 0.62,
  reveal: 0.5,
  turbulence: 78,
}

const CORNERS: BurnOrigin[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right']
const pickCorner = () => CORNERS[Math.floor(Math.random() * CORNERS.length)]

type State = {
  /** How far the front has travelled. */
  burn: number
  /** 'cover' eats the page; 'clear' eats the char away again. */
  mode: 'cover' | 'clear'
  origin: BurnOrigin
  /** Kept mounted at rest so the filter is already warm — see below. */
  live: boolean
}

const REST: State = { burn: 0, mode: 'cover', origin: 'bottom-right', live: false }

/**
 * The overlay renders from a handful of values, so the phases only have to
 * drive those. A module-level setter is enough of a bridge — the overlay mounts
 * once and there is never more than one navigation in flight.
 */
let push: ((v: State) => void) | null = null

function BurnOverlay({ options }: { options: FilmBurnOptions }) {
  const [v, setV] = useState<State>(REST)
  useEffect(() => {
    push = setV
    return () => {
      push = null
    }
  }, [])

  /*
   * Rendered even at rest, just hidden. Mounting the SVG and compiling its
   * filter costs a frame, and doing that on the first frame of the transition
   * is a visible hitch exactly as the fire catches.
   */
  return (
    <div className="burn" style={{ visibility: v.live ? 'visible' : 'hidden' }}>
      <BurnArt
        progress={v.burn}
        origin={v.origin}
        mode={v.mode}
        turbulence={options.turbulence}
      />
    </div>
  )
}

export const FilmBurnTransition = createTransition<FilmBurnOptions>({
  timeout: 6000,
  defaults: DEFAULTS,
  overlay: (options) => <BurnOverlay options={options} />,

  setup: () => push?.(REST),

  /**
   * Fire catches, hesitates for a beat, then runs. The pause is what makes the
   * ember readable — a front that races the whole way is over before the eye
   * has resolved any of the detail.
   */
  leave: ({ options, done }) => {
    const origin = options.origin === 'random' ? pickCorner() : options.origin
    const v: State = { burn: 0, mode: 'cover', origin, live: true }
    const tl = gsap.timeline({ onUpdate: () => push?.({ ...v }), onComplete: done })

    tl.to(v, { burn: 0.16, duration: options.burn * 0.3, ease: 'power2.out' })
      .to({}, { duration: options.burn * 0.12 })
      .to(v, { burn: 1, duration: options.burn * 0.72, ease: 'power2.in' })

    tl.timeScale(options.speed)
    return () => tl.kill()
  },

  /**
   * The same fire keeps going and eats the char away, rather than a flash or a
   * fade. Quicker than the burn on purpose: the page catching alight is the
   * part worth watching, and a second long beat is where a transition starts to
   * wear out its welcome.
   */
  enter: ({ options, done }) => {
    const origin = options.origin === 'random' ? pickCorner() : options.origin
    const v: State = { burn: 0, mode: 'clear', origin, live: true }
    const tl = gsap.timeline({
      onUpdate: () => push?.({ ...v }),
      onComplete: () => {
        push?.(REST)
        done()
      },
    })

    tl.to(v, { burn: 1, duration: options.reveal, ease: 'power1.inOut' })

    tl.timeScale(options.speed)
    return () => tl.kill()
  },
})
