'use client'

import { ZipperArt, Slider, ZIPPER_DIMS } from './zipper-art'
import { PALETTES, type PaletteName } from './zipper-palettes'

export type RigTuning = {
  bands: number
  slide: number // % of its own width each panel travels outward — the main move
  angle: number // a little rotateY for depth; large values foreshorten the teeth to slivers
  lag: number // temporal: each band starts this much later than the one above
  fan: number // spatial: each band swings this much further than the one above
  droop: number // degrees of outward tip on the lowest band
  fall: number // px of sag on the lowest band
  shade: number // how much a panel darkens as it turns from the light
}

export const DEFAULT_TUNING: RigTuning = {
  bands: 1,
  slide: 100,
  angle: 8,
  lag: 0.05,
  fan: 0.08,
  droop: 4,
  fall: 30,
  shade: 0.18,
}

const bandSwing = (swing: number, i: number, t: RigTuning) => {
  const span = Math.max(0.05, 1 - (t.bands - 1) * t.lag)
  return Math.min(1, Math.max(0, (swing - i * t.lag) / span))
}

function Panel({
  side,
  zip,
  swing,
  t,
}: {
  side: 'left' | 'right'
  zip: number
  swing: number
  t: RigTuning
}) {
  const dir = side === 'left' ? -1 : 1

  return (
    <div className="absolute inset-y-0 w-1/2" style={{ [side]: 0, transformStyle: 'preserve-3d' }}>
      {Array.from({ length: t.bands }, (_, i) => {
        const s = bandSwing(swing, i, t)
        const depth = t.bands === 1 ? 1 : i / (t.bands - 1)
        return (
          <div
            key={i}
            className="absolute w-full overflow-hidden"
            style={{
              top: `${(i * 100) / t.bands}%`,
              height: `${100 / t.bands}%`,
              transformOrigin: `${side} center`,
              transform: `translateX(${dir * s * t.slide * (1 + i * t.fan)}%)
                          rotateY(${dir * s * t.angle}deg)
                          rotateZ(${dir * s * t.droop * depth}deg)
                          translateY(${s * t.fall * depth}px)`,
              filter: `brightness(${1 - s * t.shade * (0.4 + 0.6 * depth)})`,
            }}
          >
            <div
              className="absolute"
              style={{
                width: '200%',
                [side]: 0,
                top: `-${i * 100}%`,
                height: `${t.bands * 100}%`,
              }}
            >
              <ZipperArt progress={zip} showSlider={false} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ZipperRig({
  zip,
  swing,
  tuning = DEFAULT_TUNING,
  palette = 'nickel',
  behind,
}: {
  zip: number
  swing: number
  tuning?: RigTuning
  palette?: PaletteName
  /** The page being revealed. Without it there is nothing to judge the swing against. */
  behind?: React.ReactNode
}) {
  const { W, H } = ZIPPER_DIMS
  const sliderY = zip === 1 ? H - 34 : zip === 0 ? 34 : zip * H

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={
        {
          perspective: '1400px',
          perspectiveOrigin: '50% 45%',
          // every colour in the artwork reads from these
          ...PALETTES[palette],
        } as React.CSSProperties
      }
    >
      {behind}
      <Panel side="left" zip={zip} swing={swing} t={tuning} />
      <Panel side="right" zip={zip} swing={swing} t={tuning} />

      {/* The slider belongs to neither panel once they hinge apart, so it rides
          in its own layer. Reuses the #metal gradient the panels already
          registered in the document. */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ opacity: 1 - swing }}
      >
        <Slider y={sliderY} />
      </svg>
    </div>
  )
}
