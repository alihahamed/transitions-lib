/**
 * Zipper artwork.
 *
 * No geometry, only shading: a specular band along each tooth's top edge, a
 * contact shadow beneath, and a slider with a lit top face.
 *
 * progress: 0 = fully open, 1 = fully closed.
 */

/**
 * The box is deliberately close to a real viewport. preserveAspectRatio="slice"
 * scales by max(containerW/W, containerH/H), so a small box magnifies the
 * artwork on a large screen — a 420-wide box lands at 4.5x on a 1900px display,
 * which is what made the teeth huge and soft at full size.
 */
const W = 1100
const H = 700
const CX = W / 2

export const DEFAULT_PITCH = 18 // vertical distance between teeth on one side
const BASE = 9 // tooth height where it meets the tape
/**
 * Tooth height. Meshed teeth are drawn over one another, so consecutive teeth
 * overlap by head - pitch/2 and that overlap is the interlock. Too little and
 * the chain reads as separate blocks; too much and each tooth buries the lower
 * third of the one before it, which is where the dark core and the reflected
 * bounce live — the joined chain then looks flat next to the separated rows.
 */
export const DEFAULT_HEAD = 13
const LEN = 34 // how far a tooth reaches from its tape edge
const OVERLAP = 14 // how far past centre a meshed tooth crosses
const GAP = 60 // how far each tape sits from centre once fully parted
const TAPER = 150 // distance below the slider over which the rows fan apart

export const SLIDER_INSET = 40 // how far the parked slider sits from each edge
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
const toothPath = (HEAD: number) => {
  const b = BASE / 2
  const h = HEAD / 2
  return `M 0 ${-b}
    L ${LEN * 0.44} ${-b}
    L ${LEN * 0.62} ${-h}
    L ${LEN - 2.5} ${-h}
    Q ${LEN} ${-h} ${LEN} ${-h + 2.5}
    L ${LEN} ${h - 2.5}
    Q ${LEN} ${h} ${LEN - 2.5} ${h}
    L ${LEN * 0.62} ${h}
    L ${LEN * 0.44} ${b}
    L 0 ${b} Z`
}

function Tooth({ x, y, flip, head: HEAD }: { x: number; y: number; flip?: boolean; head: number }) {
  const d = toothPath(HEAD)
  const h = HEAD / 2
  return (
    <g transform={`translate(${x} ${y}) ${flip ? 'scale(-1 1)' : ''}`}>
      <path d={d} fill="url(#metal)" />
      {/* shading along the length, so base and tip are not as bright as the belly */}
      <path d={d} fill="url(#form)" />
      {/* primary specular, faded at both ends so it has no hard terminator */}
      <rect x={LEN * 0.2} y={-h + 1.5} width={LEN * 0.7} height={1.1} rx={0.55} fill="url(#spec)" />
      {/* reflected light along the bottom edge — the main reason metal reads as
          metal rather than plastic */}
      <rect x={LEN * 0.3} y={h - 2.4} width={LEN * 0.5} height={1.1} rx={0.55} fill="url(#bounce)" />
      {/* highlight wrapping the flared head */}
      <rect x={LEN * 0.62} y={-h + 3.4} width={LEN * 0.36} height={HEAD - 7} rx={2.4} fill="url(#tip)" />
    </g>
  )
}

export function ZipperArt({
  progress = 1,
  view,
  showSlider = true,
  pitch: PITCH = DEFAULT_PITCH,
  head = DEFAULT_HEAD,
}: {
  progress?: number
  /** Vertical spacing between teeth on one side — the chain's density. */
  pitch?: number
  /** Tooth height. Overlap with the tooth before it is head - pitch/2. */
  head?: number
  /** Crop to a region, for inspecting the teeth up close. */
  view?: string
  /** Off when the rig draws the slider in its own layer, above the hinged panels. */
  showSlider?: boolean
}) {
  // Continuous across the whole range on purpose. Special-casing the ends made
  // the slider jump ~34 units the instant progress hit exactly 0 or 1, which
  // read as the travel stuttering backwards and repeating itself.
  const sliderY = SLIDER_INSET + progress * (H - SLIDER_INSET * 2)

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

  // Alternating draw order is what makes a closed zip read as one chain rather
  // than two columns lying side by side — each tooth overlaps the one before it.
  const teeth = []
  for (let i = 0; i < Math.ceil(H / PITCH) + 1; i++) {
    const ly = i * PITCH
    const ry = i * PITCH + PITCH / 2 // half-pitch offset so the rows interleave
    teeth.push(
      <Tooth key={`l${i}`} head={head} y={ly} x={lerp(CX + OVERLAP, CX - GAP, parting(ly, sliderY)) - LEN} />,
      <Tooth
        key={`r${i}`}
        head={head}
        y={ry}
        flip
        x={lerp(CX - OVERLAP, CX + GAP, parting(ry, sliderY)) + LEN}
      />,
    )
  }

  return (
    <svg viewBox={view ?? `0 0 ${W} ${H}`} className="zip-fill" preserveAspectRatio="xMidYMid slice">
      <defs>
        {/* Real metal is not a linear ramp: a bright rim, a fast falloff, a dark
            core, then light bouncing back up off whatever is underneath. */}
        {/* A thin rim rather than a bright plateau, and a bottom that stops at
            metal-lo instead of near-black. The previous ramp ended almost black
            and began almost white, so every tooth boundary read as an outline. */}
        <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--zip-metal-edge, #211f1c)" />
          <stop offset="5%" stopColor="var(--zip-metal-lo, #4a453e)" />
          <stop offset="13%" stopColor="var(--zip-metal, #d7d2c8)" />
          <stop offset="34%" stopColor="var(--zip-metal, #d7d2c8)" />
          <stop offset="56%" stopColor="var(--zip-metal-mid, #8f887c)" />
          <stop offset="78%" stopColor="var(--zip-metal-edge, #211f1c)" />
          <stop offset="92%" stopColor="var(--zip-metal-mid, #8f887c)" />
          <stop offset="100%" stopColor="var(--zip-metal-lo, #4a453e)" />
        </linearGradient>
        <linearGradient id="spec" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="18%" stopColor="rgba(255,255,255,.95)" />
          <stop offset="52%" stopColor="rgba(255,255,255,.6)" />
          <stop offset="88%" stopColor="rgba(255,255,255,.1)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <linearGradient id="bounce" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="45%" stopColor="rgba(255,255,255,.22)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        {/* Form along the tooth's length — dark where it sits in the tape, open
            through the middle, falling away again over the flared tip. Without
            this the ends are as bright as the belly and read as flat. */}
        <linearGradient id="form" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(0,0,0,.6)" />
          <stop offset="16%" stopColor="rgba(0,0,0,.12)" />
          <stop offset="58%" stopColor="rgba(0,0,0,0)" />
          <stop offset="84%" stopColor="rgba(0,0,0,.14)" />
          <stop offset="100%" stopColor="rgba(0,0,0,.4)" />
        </linearGradient>
        {/* the flared head is a rounded form and catches its own highlight */}
        <linearGradient id="tip" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="70%" stopColor="rgba(255,255,255,.3)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
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
          <feDropShadow dx="0.3" dy="1.1" stdDeviation="0.85" floodColor="#000" floodOpacity="0.62" />
        </filter>
      </defs>

      <path d={leftTape} fill="url(#tape)" />
      <path d={rightTape} fill="url(#tape)" />
      <g filter="url(#cast)">{teeth}</g>
      {showSlider && <Slider y={sliderY} />}
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
