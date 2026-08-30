/**
 * Static zipper artwork — prototype.
 *
 * No geometry, only shading: a specular band along each tooth's top edge, a
 * contact shadow underneath, and a slider with a lit top face.
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
const GAP = 40 // how far the tapes part once unzipped

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
  return (
    <g transform={`translate(${x} ${y}) ${flip ? 'scale(-1 1)' : ''}`}>
      <path d={d} transform="translate(1 2.5)" fill="rgba(0,0,0,.65)" />
      <path d={d} fill="url(#metal)" stroke="rgba(0,0,0,.7)" strokeWidth={0.8} />
      <rect x={LEN * 0.28} y={-HEAD / 2 + 2} width={LEN * 0.6} height={2.2} rx={1.1} fill="url(#spec)" />
      <rect x={LEN * 0.3} y={HEAD / 2 - 3.6} width={LEN * 0.5} height={1.6} rx={0.8} fill="rgba(0,0,0,.45)" />
    </g>
  )
}

export function ZipperArt({
  progress = 1,
  view,
}: {
  progress?: number
  /** Crop to a region, for inspecting the teeth up close. */
  view?: string
}) {
  const sliderY = progress * H // 1 = closed, slider has run all the way down
  const openLeft = CX - GAP
  const openRight = CX + GAP

  const leftTape = `M 0 0 L ${CX} 0 L ${CX} ${sliderY} L ${openLeft} ${sliderY} L ${openLeft} ${H} L 0 ${H} Z`
  const rightTape = `M ${W} 0 L ${CX} 0 L ${CX} ${sliderY} L ${openRight} ${sliderY} L ${openRight} ${H} L ${W} ${H} Z`

  const teeth = []
  for (let i = 0; i < Math.ceil(H / PITCH) + 1; i++) {
    const ly = i * PITCH
    const ry = i * PITCH + PITCH / 2 // half-pitch offset so the rows interleave
    teeth.push(
      <Tooth key={`l${i}`} y={ly} x={ly < sliderY ? CX + OVERLAP - LEN : openLeft - LEN} />,
      <Tooth key={`r${i}`} y={ry} flip x={ry < sliderY ? CX - OVERLAP + LEN : openRight + LEN} />,
    )
  }

  return (
    <svg
      viewBox={view ?? `0 0 ${W} ${H}`}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--zip-metal-hi, #ffffff)" />
          <stop offset="16%" stopColor="var(--zip-metal, #d7d2c8)" />
          <stop offset="46%" stopColor="var(--zip-metal-mid, #8f887c)" />
          <stop offset="78%" stopColor="var(--zip-metal-lo, #4a453e)" />
          <stop offset="100%" stopColor="var(--zip-metal-edge, #211f1c)" />
        </linearGradient>
        <linearGradient id="spec" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="40%" stopColor="rgba(255,255,255,.95)" />
          <stop offset="100%" stopColor="rgba(255,255,255,.1)" />
        </linearGradient>
        <linearGradient id="tape" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--zip-tape-lo, #17171a)" />
          <stop offset="50%" stopColor="var(--zip-tape, #232329)" />
          <stop offset="100%" stopColor="var(--zip-tape-lo, #17171a)" />
        </linearGradient>
      </defs>

      <path d={leftTape} fill="url(#tape)" />
      <path d={rightTape} fill="url(#tape)" />
      {teeth}
      {progress > 0 && progress < 1 && <Slider y={sliderY} />}
      {progress === 1 && <Slider y={H - 40} />}
      {progress === 0 && <Slider y={40} />}
    </svg>
  )
}

function Slider({ y }: { y: number }) {
  const w = 50
  const h = 70
  return (
    <g transform={`translate(${CX} ${y})`}>
      <ellipse cx={0} cy={h / 2 - 6} rx={w / 2 + 7} ry={11} fill="rgba(0,0,0,.55)" />
      <path
        d={`M ${-w / 2} ${-h / 2} L ${w / 2} ${-h / 2} L ${w / 2 - 9} ${h / 2} L ${-w / 2 + 9} ${h / 2} Z`}
        fill="url(#metal)"
      />
      <path
        d={`M ${-w / 2 + 3} ${-h / 2 + 3} L ${w / 2 - 3} ${-h / 2 + 3} L ${w / 2 - 6} ${-h / 2 + 13} L ${-w / 2 + 6} ${-h / 2 + 13} Z`}
        fill="rgba(255,255,255,.55)"
      />
      <rect x={-4} y={h / 2 - 10} width={8} height={16} rx={3} fill="url(#metal)" />
      <rect
        x={-13}
        y={h / 2 + 4}
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
