'use client'

import { ZipperArt, Slider, ZIPPER_DIMS, DEFAULT_PITCH, DEFAULT_HEAD, SLIDER_INSET } from './zipper-art'

export type RigTuning = {
  bands: number
  slide: number // % of its own width each panel travels outward — the main move
  angle: number // a little rotateY for depth; large values foreshorten the teeth to slivers
  lag: number // temporal: each band starts this much later than the one above
  fan: number // spatial: each band swings this much further than the one above
  pitch: number // vertical spacing between teeth — the chain's density
  head: number // tooth height; overlap with its neighbour is head - pitch/2
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
  pitch: DEFAULT_PITCH,
  head: DEFAULT_HEAD,
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
    <div className="zip-panel" style={{ [side]: 0, transformStyle: 'preserve-3d' }}>
      {Array.from({ length: t.bands }, (_, i) => {
        const s = bandSwing(swing, i, t)
        const depth = t.bands === 1 ? 1 : i / (t.bands - 1)
        return (
          <div
            key={i}
            className="zip-band"
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
              className="zip-band-art"
              style={{
                width: '200%',
                [side]: 0,
                top: `-${i * 100}%`,
                height: `${t.bands * 100}%`,
              }}
            >
              <ZipperArt progress={zip} showSlider={false} pitch={t.pitch} head={t.head} />
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
  tuning,
}: {
  zip: number
  swing: number
  tuning?: Partial<RigTuning>
}) {
  const t = { ...DEFAULT_TUNING, ...tuning }
  const { W, H } = ZIPPER_DIMS
  const sliderY = SLIDER_INSET + zip * (H - SLIDER_INSET * 2)

  return (
    <div
      className="zip-rig"
      style={{ perspective: '1400px', perspectiveOrigin: '50% 45%' }}
    >
      <Panel side="left" zip={zip} swing={swing} t={t} />
      <Panel side="right" zip={zip} swing={swing} t={t} />

      {/* The slider belongs to neither panel once they hinge apart, so it rides
          in its own layer, and rides up out through the top as the panels
          leave rather than dissolving in place — a slider that fades reads as a
          bug, not as leaving. Reuses the #metal gradient the panels already
          registered in the document. */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        className="zip-slider-layer"
        style={{ transform: `translateY(${-swing * 42}%)` }}
      >
        <Slider y={sliderY} />
      </svg>
    </div>
  )
}
