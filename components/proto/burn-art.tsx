/**
 * Film burn artwork — prototype.
 *
 * No shader and no 3D. The burn front is a radial gradient whose stops move,
 * and its edge is chewed up by feDisplacementMap driven by feTurbulence — the
 * same boiling-edge trick that gives the crayon its hand-drawn feel. The ember
 * ramp and the char share one displacement, so their ragged edges line up.
 *
 * The geometry stays the size of the frame on purpose. An earlier version grew
 * an actual circle out to ~4000 units, which blows the filter region up until
 * the browser clamps the turbulence and the burn stops visibly progressing.
 *
 * progress: 0 = untouched, 1 = fully consumed.
 */

const W = 1600
const H = 900

export type BurnOrigin =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center'

const ORIGINS: Record<BurnOrigin, [number, number]> = {
  'top-left': [0.1, 0.1],
  'top-right': [0.9, 0.1],
  'bottom-left': [0.1, 0.9],
  'bottom-right': [0.9, 0.9],
  center: [0.5, 0.5],
}

/**
 * How far the front has to travel from a given origin to swallow the frame —
 * the distance to the furthest corner, plus a hair.
 *
 * This has to be per-origin. One shared worst-case value means a centre burn
 * only needs half of it and finishes around a third of the way through the
 * range, then sits there doing nothing while the timeline runs on.
 */
const reachFrom = (cx: number, cy: number) =>
  Math.max(
    ...([0, W] as const).flatMap((x) => ([0, H] as const).map((y) => Math.hypot(cx - x, cy - y))),
  ) * 1.02

/** Ember band width, as a fraction of REACH. */
const BAND = 0.055

/**
 * The painted rects overhang the frame. feDisplacementMap pulls pixels in from
 * outside a shape's own edge, so a rect sized exactly to the viewBox gets its
 * border chewed into transparency — which shows up as the burn never quite
 * covering the corners.
 */
const OVER = 260

const pct = (n: number) => `${Math.min(100, Math.max(0, n * 100))}%`

export function BurnArt({
  progress = 0.5,
  origin = 'bottom-right',
  seed = 3,
  turbulence = 78,
}: {
  progress?: number
  origin?: BurnOrigin
  /** Changes the shape of the ragged edge without changing anything else. */
  seed?: number
  /** How far the edge is chewed up. 0 is a clean circle. */
  turbulence?: number
}) {
  const [ox, oy] = ORIGINS[origin]
  const cx = ox * W
  const cy = oy * H

  const REACH = reachFrom(cx, cy)

  /*
   * The front advances linearly, which already reads as acceleration: the area
   * consumed grows with the square of the radius. Easing it further made the
   * burn look finished before it was.
   */
  const cut = progress
  /*
   * Unique per rendered instance. SVG ids are document-global, so two burns on
   * one page sharing an id means the second silently renders the first one's
   * gradients — which looks exactly like the burn refusing to progress.
   */
  const uid = `${origin}-${seed}-${Math.round(progress * 1000)}`

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
    >
      <defs>
        <filter
          id={`chew-${uid}`}
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
          filterUnits="objectBoundingBox"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.019 0.024"
            numOctaves={5}
            seed={seed}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={turbulence}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* White hot right at the front, cooling outward. This ramp is the realism. */}
        <radialGradient
          id={`ember-${uid}`}
          gradientUnits="userSpaceOnUse"
          cx={cx}
          cy={cy}
          r={REACH}
        >
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset={pct(cut - 0.004)} stopColor="#000" stopOpacity="0" />
          <stop offset={pct(cut + 0.004)} stopColor="var(--burn-core, #fff4dc)" />
          <stop offset={pct(cut + BAND * 0.28)} stopColor="var(--burn-hot, #ffb32e)" />
          <stop offset={pct(cut + BAND * 0.6)} stopColor="var(--burn-mid, #d94a12)" />
          <stop offset={pct(cut + BAND * 0.86)} stopColor="var(--burn-edge, #6b1806)" />
          <stop offset={pct(cut + BAND)} stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>

        {/*
         * Celluloid, not paper. It does not go flat black — it darkens through a
         * warm translucent brown and only the oldest burn is properly opaque.
         */}
        <radialGradient
          id={`char-${uid}`}
          gradientUnits="userSpaceOnUse"
          cx={cx}
          cy={cy}
          r={REACH}
        >
          <stop offset="0%" stopColor="var(--burn-char, #0a0705)" stopOpacity="0.98" />
          <stop offset={pct(cut - 0.03)} stopColor="var(--burn-char, #0a0705)" stopOpacity="0.96" />
          <stop offset={pct(cut - 0.012)} stopColor="var(--burn-soot, #1e1008)" stopOpacity="0.82" />
          <stop offset={pct(cut - 0.003)} stopColor="var(--burn-soot, #2a1509)" stopOpacity="0.42" />
          <stop offset={pct(cut)} stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {progress > 0 && (
        <g filter={`url(#chew-${uid})`}>
          <rect
            x={-OVER}
            y={-OVER}
            width={W + OVER * 2}
            height={H + OVER * 2}
            fill={`url(#ember-${uid})`}
          />
          <rect
            x={-OVER}
            y={-OVER}
            width={W + OVER * 2}
            height={H + OVER * 2}
            fill={`url(#char-${uid})`}
          />
        </g>
      )}
    </svg>
  )
}
