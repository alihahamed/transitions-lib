'use client'

import { useRouter } from 'next/navigation'
import gsap from 'gsap'

/**
 * Spike: masking a View Transitions snapshot with a live SVG mask.
 *
 * If it holds up, the burn punches a hole straight through the outgoing page
 * and the real incoming page shows through it — one fire, no char, no black.
 */
const W = 1600
const H = 900
const OVER = 260

const ORIGINS = [
  [0.1, 0.1],
  [0.9, 0.1],
  [0.1, 0.9],
  [0.9, 0.9],
] as const

/**
 * The mask lives in the layout, not the page. A page unmounts during the
 * navigation and takes its own <defs> with it, leaving the mask reference
 * pointing at a detached element that never animates.
 */
export function BurnMaskDefs() {
  return (
    <svg width="0" height="0" aria-hidden style={{ position: 'absolute' }}>
      <defs>
        <filter id="vt-chew" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.019 0.024" numOctaves={4} seed={3} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={78} xChannelSelector="R" yChannelSelector="G" />
        </filter>

        <radialGradient id="vt-burn-grad" gradientUnits="userSpaceOnUse" cx={0} cy={0} r={1}>
          <stop offset="0%" stopColor="#000" />
          <stop offset="0%" stopColor="#000" />
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#fff" />
        </radialGradient>

        <mask id="vt-burn" maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
          <g filter="url(#vt-chew)">
            <rect x={-OVER} y={-OVER} width={W + OVER * 2} height={H + OVER * 2} fill="url(#vt-burn-grad)" />
          </g>
        </mask>
      </defs>
    </svg>
  )
}

export function BurnMaskNav({ href, children }: { href: string; children: React.ReactNode }) {
  const router = useRouter()

  const go = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!document.startViewTransition) {
      router.push(href)
      return
    }

    const [ox, oy] = ORIGINS[Math.floor(Math.random() * ORIGINS.length)]
    const cx = ox * W
    const cy = oy * H
    const reach = Math.max(
      ...[0, W].flatMap((x) => [0, H].map((y) => Math.hypot(cx - x, cy - y))),
    ) * 1.02

    const grad = document.getElementById('vt-burn-grad')
    grad?.setAttribute('cx', String(cx))
    grad?.setAttribute('cy', String(cy))
    grad?.setAttribute('r', String(reach))

    const t = document.startViewTransition(() => router.push(href))
    await t.ready

    const v = { cut: 0 }
    const stops = grad ? [...grad.querySelectorAll('stop')] : []
    const p = (n: number) => `${Math.min(100, Math.max(0, n * 100))}%`
    const paint = () => {
      // black burns through to the new page, white keeps the old one
      stops[1]?.setAttribute('offset', p(v.cut - 0.004))
      stops[2]?.setAttribute('offset', p(v.cut + 0.004))
    }

    // holds the snapshot on screen for the length of the burn
    document.documentElement.animate(
      { opacity: [1, 1] },
      { duration: 1400, pseudoElement: '::view-transition-old(root)' },
    )

    gsap.to(v, { cut: 1, duration: 1.4, ease: 'power1.in', onUpdate: paint })
  }

  return (
    <a href={href} onClick={go}>
      {children}
    </a>
  )
}
