'use client'

import { useRouter } from 'next/navigation'
import gsap from 'gsap'

/**
 * Spike: masking a View Transitions snapshot with a live SVG mask.
 *
 * If it holds up, the burn punches a hole straight through the outgoing page
 * and the real incoming page shows through it — one fire, no char, no black.
 */
/*
 * A CSS mask on a viewport-sized element works in CSS pixels, so the gradient
 * geometry has to be measured from the real viewport rather than the artwork's
 * own 1600x900 coordinate space.
 */
const OVER = 400

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

        {/* keeps the old page outside the cut */}
        <radialGradient id="vt-grad-old" gradientUnits="userSpaceOnUse" cx={0} cy={0} r={1}>
          <stop offset="0%" stopColor="#000" />
          <stop offset="0%" stopColor="#000" />
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#fff" />
        </radialGradient>

        {/* shows the new page only inside a slightly smaller cut, so an amber
            annulus is left between the two — that gap is the ember */}
        <radialGradient id="vt-grad-new" gradientUnits="userSpaceOnUse" cx={0} cy={0} r={1}>
          <stop offset="0%" stopColor="#fff" />
          <stop offset="0%" stopColor="#fff" />
          <stop offset="0%" stopColor="#000" />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>

        {/* generous region — anything outside a mask counts as hidden */}
        <mask id="vt-mask-old" maskUnits="userSpaceOnUse" x={-OVER} y={-OVER} width={8000} height={8000}>
          <g filter="url(#vt-chew)">
            <rect x={-OVER} y={-OVER} width={8000} height={8000} fill="url(#vt-grad-old)" />
          </g>
        </mask>

        <mask id="vt-mask-new" maskUnits="userSpaceOnUse" x={-OVER} y={-OVER} width={8000} height={8000}>
          <g filter="url(#vt-chew)">
            <rect x={-OVER} y={-OVER} width={8000} height={8000} fill="url(#vt-grad-new)" />
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

    const vw = document.documentElement.clientWidth
    const vh = document.documentElement.clientHeight
    const [ox, oy] = ORIGINS[Math.floor(Math.random() * ORIGINS.length)]
    const cx = ox * vw
    const cy = oy * vh
    const reach = Math.max(
      ...[0, vw].flatMap((x) => [0, vh].map((y) => Math.hypot(cx - x, cy - y))),
    ) * 1.02

    const gOld = document.getElementById('vt-grad-old')
    const gNew = document.getElementById('vt-grad-new')
    for (const g of [gOld, gNew]) {
      g?.setAttribute('cx', String(cx))
      g?.setAttribute('cy', String(cy))
      g?.setAttribute('r', String(reach))
    }

    // the amber sits behind both snapshots and shows through the gap between them
    const root = document.documentElement
    root.style.setProperty('--vt-x', `${cx}px`)
    root.style.setProperty('--vt-y', `${cy}px`)
    root.style.setProperty('--vt-reach', `${reach}px`)

    const t = document.startViewTransition(() => router.push(href))
    await t.ready

    /**
     * Width of the ember annulus in CSS pixels, not a fraction of the reach.
     * A proportional band grows as the front travels, so the fire got thicker
     * and duller the further it went.
     */
    const BAND_PX = 64
    const BAND = BAND_PX / reach

    const v = { cut: 0 }
    const oldStops = gOld ? [...gOld.querySelectorAll('stop')] : []
    const newStops = gNew ? [...gNew.querySelectorAll('stop')] : []
    const p = (n: number) => `${Math.min(100, Math.max(0, n * 100))}%`

    const paint = () => {
      // old page: gone inside the cut
      oldStops[1]?.setAttribute('offset', p(v.cut - 0.004))
      oldStops[2]?.setAttribute('offset', p(v.cut + 0.004))
      // new page: only inside the cut less the band
      newStops[1]?.setAttribute('offset', p(v.cut - BAND))
      newStops[2]?.setAttribute('offset', p(v.cut - BAND + 0.008))
      root.style.setProperty('--vt-cut', `${v.cut * reach}px`)
      root.style.setProperty('--vt-band', `${BAND_PX}px`)
    }
    paint()

    // holds the snapshot on screen for the length of the burn
    document.documentElement.animate(
      { opacity: [1, 1] },
      { duration: 1500, pseudoElement: '::view-transition-old(root)' },
    )

    gsap.to(v, { cut: 1, duration: 1.5, ease: 'power1.in', onUpdate: paint })
  }

  return (
    <a href={href} onClick={go}>
      {children}
    </a>
  )
}
