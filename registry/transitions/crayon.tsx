'use client'

import gsap from 'gsap'
import { createTransition } from './transition-core'
import './transitions.css'

/** Three hand-drawn strokes. Wobbly on purpose — that is where the crayon feel lives. */
const STROKES = [
  'M227.549 1818.76C227.549 1818.76 406.016 2207.75 569.049 2130.26C843.431 1999.85 -264.104 1002.3 227.549 876.262C552.918 792.849 773.647 2456.11 1342.05 2130.26C1885.43 1818.76 14.9644 455.772 760.548 137.262C1342.05 -111.152 1663.5 2266.35 2209.55 1972.76C2755.6 1679.18 1536.63 384.467 1826.55 137.262C2013.5 -22.1463 2209.55 381.262 2209.55 381.262',
  'M1661.28 2255.51C1661.28 2255.51 2311.09 1960.37 2111.78 1817.01C1944.47 1696.67 718.456 2870.17 499.781 2255.51C308.969 1719.17 2457.51 1613.83 2111.78 963.512C1766.05 313.198 427.949 2195.17 132.281 1455.51C-155.219 736.292 2014.78 891.514 1708.78 252.012C1437.81 -314.29 369.471 909.169 132.281 566.512C18.1772 401.672 244.781 193.012 244.781 193.012',
  'M950.5 2450.2C950.5 2450.2 1580.3 2100.8 1350.7 1650.4C1121.1 1200.0 280.6 1850.3 450.2 1350.7C619.8 851.1 1750.4 1450.6 1950.8 950.2C2151.2 449.8 850.3 650.4 650.1 250.6C449.9 -149.2 1250.7 350.8 1250.7 350.8',
]

const paths = (overlay: HTMLDivElement) =>
  Array.from(overlay.querySelectorAll('path'))

/**
 * Crayon wipe.
 *
 * Leaving, each stroke draws itself on while its stroke-width fattens from 200
 * to 700 — that is what turns three lines into a full-screen fill without a
 * separate mask. Entering, they retract off the far end and thin back down.
 *
 *   // app/layout.tsx
 *   <CrayonTransition>{children}</CrayonTransition>
 *
 * Recolour with --crayon-1/2/3 in transitions.css.
 */
export type CrayonOptions = {
  /** Multiplies the whole timeline. Above 1 is faster. */
  speed: number
  /** Stroke width each crayon fattens to. Bigger covers the screen sooner. */
  thickness: number
  /** Seconds between one stroke starting and the next, while closing. */
  stagger: number
}

const DEFAULTS: CrayonOptions = { speed: 1, thickness: 700, stagger: 0.3 }

export const CrayonTransition = createTransition<CrayonOptions>({
  timeout: 6000,
  defaults: DEFAULTS,

  overlay: (
    <div className="crayon">
    <svg viewBox="0 0 2453 2535" fill="none" preserveAspectRatio="none">
      {STROKES.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke={`var(--crayon-${i + 1})`}
          strokeWidth={200}
          strokeLinecap="round"
        />
      ))}
    </svg>
    </div>
  ),

  // Dash the strokes to their own length so they start fully retracted.
  setup: (overlay) => {
    paths(overlay).forEach((path) => {
      const length = path.getTotalLength()
      path.style.strokeDasharray = String(length)
      path.style.strokeDashoffset = String(length)
    })
  },

  leave: ({ overlay, options, done }) => {
    const tl = gsap.timeline({ onComplete: done })

    paths(overlay).forEach((path, i) => {
      tl.to(
        path,
        {
          strokeDashoffset: 0,
          attr: { 'stroke-width': options.thickness },
          duration: 1,
          ease: 'power1.inOut',
        },
        i * options.stagger,
      )
    })

    tl.timeScale(options.speed)
    return () => tl.kill()
  },

  enter: ({ overlay, options, done }) => {
    const tl = gsap.timeline({ onComplete: done })

    paths(overlay).forEach((path, i) => {
      const length = path.getTotalLength()
      tl.to(
        path,
        {
          strokeDashoffset: -length,
          attr: { 'stroke-width': 200 },
          duration: 1,
          ease: 'power1.inOut',
          // Park it back at the start so the next leave has somewhere to draw from.
          onComplete: () => gsap.set(path, { strokeDashoffset: length }),
        },
        i * 0.1,
      )
    })

    tl.timeScale(options.speed)
    return () => tl.kill()
  },
})
