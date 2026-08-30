/**
 * Static zipper artwork — prototype.
 *
 * No geometry, only shading: a specular band along each tooth's top edge, a
 * contact shadow beneath, and a slider with a lit top face.
 *
 * progress: 0 = fully open, 1 = fully closed.
 */

const W = 420
const H = 640
const CX = W / 2

const PITCH = 21 // vertical distance between teeth on one side
const BASE = 11 // tooth height where it meets the tape
const HEAD = 17 // tooth height at the tip — the flare is what locks it
const LEN = 34 // how far a tooth reaches from its tape edge
const OVERLAP = 9 // how far past centre a meshed tooth crosses
const GAP = 34 // how far each tape sits from centre once fully parted
const TAPER = 120 // distance below the slider over which the rows fan apart

const SLIDER_W = 52
const SLIDER_H = 72

/**
 * How far apart the rows are at a given y. Zero above the slider, then eased
 * out to full over TAPER — the rows funnel out of the slider's mouth rather
 * than jumping to their final width.
 */
const parting = (y: number, sliderY: number) => {
  if (y <= sliderY) return 0
  const t = Math.min(1, (y - sliderY) / TAPER)
  return 1 - (1 - t) * (1 - t) // easeOutQuad
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Flares toward the tip so meshed teeth visibly lock between their neighbours. */
const toothPath = () => {
  const b = BASE / 2
  const h = HEAD / 2
  return `M 0 ${-b}
    L ${LEN * 0.5} ${-b}
    C ${LEN * 0.78} ${-h} ${LEN * 0.86} ${-h} ${LEN - 4} ${-h}
    Q ${LEN} ${-h} ${LEN} ${-h + 4}
    L ${LEN} ${h - 4}
    Q ${LEN} ${h} ${LEN - 4} ${h}
    C ${LEN * 0.86} ${h} ${LEN * 0.78} ${h} ${LEN * 0.5} ${b}
    L 0 ${b} Z`
}

function Tooth({ x, y, flip }: { x: number; y: number; flip?: boolean }) {
  const d = toothPath()
  const h = HEAD / 2
  return (
    <g transform={`translate(${x} ${y}) ${flip ? 'scale(-1 1)' : ''}`}>
      <path d={d} fill="url(#metal)" />
      {/* occlusion where the tooth meets the tape — a gradient, not a line */}
      <path d={d} fill="url(#occl)" />
      {/* primary specular, faded at both ends so it has no hard terminator */}
      <rect x={LEN * 0.22} y={-h + 1.6} width={LEN * 0.66} height={1.9} rx={0.95} fill="url(#spec)" />
      {/* reflected light along the bottom edge — the main reason metal reads as
          metal rather than plastic */}
      <rect x={LEN * 0.3} y={h - 2.4} width={LEN * 0.5} height={1.1} rx={0.55} fill="url(#bounce)" />
    </g>
  )
}

export function ZipperArt({
  progress = 1,
  view,
  showSlider = true,
}: {
  progress?: number
  /** Crop to a region, for inspecting the teeth up close. */
  view?: string
  /** Off when the rig draws the slider in its own layer, above the hinged panels. */
  showSlider?: boolean
}) {
  const sliderY = progress * H // 1 = closed, slider has run all the way down

  // Tape inner edges follow the same taper the teeth do, so fabric and metal
  // fan out together instead of the tape stepping open in one jump.
  const edge: string[] = []
  for (let y = 0; y <= H; y += 8) {
    edge.push(`${lerp(CX, CX - GAP, parting(y, sliderY))} ${y}`)
  }
  const leftTape = `M 0 0 L ${edge.join(' L ')} L 0 ${H} Z`
  const rightEdge = edge.map((p) => {
    const [x, y] = p.split(' ').map(Number)
    return `${2 * CX - x} ${y}`
  })
  const rightTape = `M ${W} 0 L ${rightEdge.join(' L ')} L ${W} ${H} Z`

  const left = []
  const right = []
  for (let i = 0; i < Math.ceil(H / PITCH) + 1; i++) {
    const ly = i * PITCH
    const ry = i * PITCH + PITCH / 2 // half-pitch offset so the rows interleave
    left.push(<Tooth key={i} y={ly} x={lerp(CX + OVERLAP, CX - GAP, parting(ly, sliderY)) - LEN} />)
    right.push(
      <Tooth key={i} y={ry} flip x={lerp(CX - OVERLAP, CX + GAP, parting(ry, sliderY)) + LEN} />,
    )
  }

  return (
    <svg viewBox={view ?? `0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        {/* Real metal is not a linear ramp: a bright rim, a fast falloff, a dark
            core, then light bouncing back up off whatever is underneath. */}
        <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--zip-metal-hi, #ffffff)" />
          <stop offset="9%" stopColor="var(--zip-metal-hi, #ffffff)" />
          <stop offset="26%" stopColor="var(--zip-metal, #d7d2c8)" />
          <stop offset="49%" stopColor="var(--zip-metal-mid, #8f887c)" />
          <stop offset="73%" stopColor="var(--zip-metal-lo, #4a453e)" />
          <stop offset="89%" stopColor="var(--zip-metal-mid, #8f887c)" />
          <stop offset="100%" stopColor="var(--zip-metal-edge, #211f1c)" />
        </linearGradient>
        <linearGradient id="spec" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="30%" stopColor="rgba(255,255,255,.55)" />
          <stop offset="62%" stopColor="rgba(255,255,255,.28)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <linearGradient id="bounce" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="45%" stopColor="rgba(255,255,255,.22)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <linearGradient id="occl" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(0,0,0,.5)" />
          <stop offset="22%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>
        <linearGradient id="tape" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--zip-tape-lo, #26262c)" />
          <stop offset="50%" stopColor="var(--zip-tape, #3d3d46)" />
          <stop offset="100%" stopColor="var(--zip-tape-lo, #26262c)" />
        </linearGradient>
        {/* One filter per row rather than per tooth — the rows interleave, so
            each already casts onto the other, and it is 2 filters not 60. */}
        <radialGradient id="castSoft">
          <stop offset="0%" stopColor="rgba(0,0,0,.5)" />
          <stop offset="60%" stopColor="rgba(0,0,0,.22)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <filter id="cast" x="-25%" y="-25%" width="160%" height="160%">
          <feDropShadow dx="0.4" dy="1.5" stdDeviation="1.5" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>

      <path d={leftTape} fill="url(#tape)" />
      <path d={rightTape} fill="url(#tape)" />
      <g filter="url(#cast)">{left}</g>
      <g filter="url(#cast)">{right}</g>
      {showSlider && <Slider y={progress === 1 ? H - 34 : progress === 0 ? 34 : sliderY} />}
    </svg>
  )
}

/**
 * Narrow end up — the single meshed chain leaves there. Wide mouth down, where
 * the two rows feed in. Getting this backwards is what made the parted teeth
 * look detached from the slider.
 */
export function Slider({ y }: { y: number }) {
  const w = SLIDER_W
  const h = SLIDER_H
  const neck = 17
  return (
    <g transform={`translate(${CX} ${y})`}>
      <ellipse cx={0} cy={h / 2 - 6} rx={w / 2 + 8} ry={12} fill="url(#castSoft)" />
      <path
        d={`M ${-neck / 2} ${-h / 2}
            L ${neck / 2} ${-h / 2}
            L ${neck / 2 + 3} ${-h / 2 + 16}
            L ${w / 2} ${h / 2 - 10}
            Q ${w / 2} ${h / 2} ${w / 2 - 10} ${h / 2}
            L ${-w / 2 + 10} ${h / 2}
            Q ${-w / 2} ${h / 2} ${-w / 2} ${h / 2 - 10}
            L ${-neck / 2 - 3} ${-h / 2 + 16} Z`}
        fill="url(#metal)"
      />
      {/* lit top face, faded rather than a flat white plate */}
      <path
        d={`M ${-neck / 2 + 1.5} ${-h / 2 + 2} L ${neck / 2 - 1.5} ${-h / 2 + 2} L ${neck / 2 + 1} ${-h / 2 + 10} L ${-neck / 2 - 1} ${-h / 2 + 10} Z`}
        fill="url(#spec)"
      />
      {/* pull tab, hanging off the wide end */}
      <rect x={-4} y={h / 2 - 12} width={8} height={16} rx={3} fill="url(#metal)" />
      <rect
        x={-13}
        y={h / 2 + 2}
        width={26}
        height={38}
        rx={7}
        fill="none"
        stroke="url(#metal)"
        strokeWidth={6}
      />
    </g>
  )
}

export const ZIPPER_DIMS = { W, H, CX }
