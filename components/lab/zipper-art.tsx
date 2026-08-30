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

const PITCH = 20 // vertical distance between teeth on one side
const BASE = 7 // neck height where the tooth meets the tape
/**
 * Head height. It exceeds PITCH/2, so consecutive teeth overlap by
 * HEAD - PITCH/2 and braid into each other — that overlap is the interlock.
 * Push it much further and each tooth starts burying the lower third of the
 * one before it, which is where the dark core and the reflected bounce live.
 */
const HEAD = 14
const LEN = 34 // how far a tooth reaches from its tape edge
const NECK = 19 // how much of that length is the narrow neck
const OVERLAP = 8 // how far past centre a meshed head crosses — heads only
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
  const r = 2.2
  return `M 0 ${-b}
    L ${NECK} ${-b}
    L ${NECK + 3.5} ${-h + r}
    Q ${NECK + 4.5} ${-h} ${NECK + 7} ${-h}
    L ${LEN - r} ${-h}
    Q ${LEN} ${-h} ${LEN} ${-h + r}
    L ${LEN} ${h - r}
    Q ${LEN} ${h} ${LEN - r} ${h}
    L ${NECK + 7} ${h}
    Q ${NECK + 4.5} ${h} ${NECK + 3.5} ${h - r}
    L ${NECK} ${b}
    L 0 ${b} Z`
}

function Tooth({ x, y, flip }: { x: number; y: number; flip?: boolean }) {
  const d = toothPath()
  const h = HEAD / 2
  return (
    <g transform={`translate(${x} ${y}) ${flip ? 'scale(-1 1)' : ''}`}>
      <path d={d} fill="url(#metal)" />
      {/* shading along the length, so base and tip are not as bright as the belly */}
      <path d={d} fill="url(#form)" />
      {/* primary specular, faded at both ends so it has no hard terminator */}
      <rect x={NECK * 0.35} y={-h + 1.4} width={LEN - NECK * 0.35 - 2} height={1.1} rx={0.55} fill="url(#spec)" />
      {/* reflected light along the bottom edge — the main reason metal reads as
          metal rather than plastic */}
      <rect x={NECK + 4} y={h - 2.2} width={LEN - NECK - 6} height={1} rx={0.5} fill="url(#bounce)" />
      {/* highlight wrapping the head */}
      <rect x={NECK + 6} y={-h + 3} width={LEN - NECK - 9} height={HEAD - 6} rx={2} fill="url(#tip)" />
      {/* the socket the opposing tooth seats into */}
      <ellipse cx={NECK + 11} cy={0} rx={3.6} ry={2.4} fill="rgba(0,0,0,.42)" />
      <ellipse cx={NECK + 11} cy={-0.7} rx={3} ry={1.7} fill="rgba(255,255,255,.1)" />
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

  // Alternating draw order is what makes a closed zip read as one chain rather
  // than two columns lying side by side — each tooth overlaps the one before it.
  const teeth = []
  for (let i = 0; i < Math.ceil(H / PITCH) + 1; i++) {
    const ly = i * PITCH
    const ry = i * PITCH + PITCH / 2 // half-pitch offset so the rows interleave
    teeth.push(
      <Tooth key={`l${i}`} y={ly} x={lerp(CX + OVERLAP, CX - GAP, parting(ly, sliderY)) - LEN} />,
      <Tooth key={`r${i}`} y={ry} flip x={lerp(CX - OVERLAP, CX + GAP, parting(ry, sliderY)) + LEN} />,
    )
  }

  return (
    <svg viewBox={view ?? `0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="xMidYMid slice">
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
