'use client'

import gsap from 'gsap'
import { createTransition } from './transition-core'
import './transitions.css'

/**
 * Concertina.
 *
 * The page shrinks into one slot of a row of slats, the row slides along to the
 * slot that belongs to the page you are going to, and the new page opens back
 * out of it.
 *
 * The page really is the middle slat — it is clipped down to that slot rather
 * than being covered by anything. Slats that grow to cover the screen instead
 * turn the whole thing into stripes, which is the opposite of the effect: the
 * row is meant to stay a band with ground above and below it.
 *
 * The bow along the top and bottom is painted, not computed. Two arcs in the
 * ground colour lie over a row of perfectly flat slats and bite into it, which
 * is what makes the outer slats read as taller than the middle ones. Curving
 * them for real would mean a preserve-3d subtree, and nothing inside one of
 * those can be promoted to its own compositor layer.
 *
 *   // app/layout.tsx
 *   <ConcertinaTransition>{children}</ConcertinaTransition>
 */
export type ConcertinaOptions = {
  /** How many slats the row is made of. It has to stay wider than the screen once shuffled. */
  slats: number
  /** Depth of the arc that bites into the top and bottom of the row. 0 is a flat row. */
  bow: number
  /** Width of the window the row lives in, in viewport widths. */
  span: number
  /** How many slots either side of centre a page can land on. */
  spread: number
  /** Seconds the page takes to shrink into the slot, and to open back out. */
  duration: number
  /** Multiplies the whole timeline. Above 1 is faster. */
  speed: number
  /** Ground and slat colours. "custom" applies no preset. */
  palette: 'mono' | 'inverse' | 'ember' | 'pine' | 'custom'
}

const DEFAULTS: ConcertinaOptions = {
  slats: 41,
  bow: 17,
  span: 60,
  spread: 6,
  duration: 1,
  speed: 1,
  palette: 'mono',
}

/** Slat geometry in vw/vh. The slot the page shrinks to is one slat's footprint. */
const SLAT_W = 3
const GAP = 0.5
const SLAT_H = 45

/*
 * One slat plus its gaps. The row slides by exactly this per slot, so whichever
 * slat lands at the centre lines up with the page's slot — a shuffle distance
 * that is not a whole number of pitches leaves the page opening out of the gap
 * between two slats.
 */
const PITCH = SLAT_W + GAP * 2

/**
 * The page cropped toward one slat's footprint. 0 is the whole screen, 1 is a
 * single slot.
 *
 * Driven off a number rather than handed to GSAP as two clip-path strings: it
 * reads the current value back in px and the target is in vh/vw, and rather
 * than interpolate across the units it snaps straight to the end — the page
 * arrived at the slot in a frame instead of travelling there.
 */
/*
 * Where the arc's curve crosses the middle of the row, in vh. The page's crop is
 * anchored to this so it sits flush with the slats either side of it rather
 * than standing proud of them.
 */
const ARC_H = 50
const slotTop = (bow: number) => ((30 + bow) / 60) * ARC_H

/**
 * How deep the arcs bite, at the centre of the row, in vh. This one number is
 * the law: the arcs are positioned to it, the slats are cut to it,
 * and the page's crop is anchored to it. Everything used to derive its own
 * version of "where the arc is" and they drifted apart.
 */
const bite = (p: number, bow: number) => slotTop(bow) * p

/**
 * Centre-to-end depth of the arc's dip, in vh. Constant, because the arcs
 * translate rigidly — only where they sit changes, never their shape.
 */
const arcSag = (bow: number) => (bow * ARC_H) / 60

/** yPercent that puts the arc's curve at `bite` deep. Element is ARC_H tall. */
const arcAt = (p: number, bow: number) => (2 * slotTop(bow) * (p - 1) * 50) / ARC_H

/**
 * The page's crop, as a path carrying the same curve the arcs cut into the
 * slats.
 *
 * An inset rectangle cannot: the page is lifted above the overlay so the arcs
 * bite everything except it, and a straight-edged panel in a bowed row is
 * exactly what gives it away.
 *
 * Anchored to `bite` rather than to the arcs' measured position, so it lands on
 * the curve the arcs cut, by construction. Deriving it from the arc's
 * absolute offset instead let the two disagree by 182px at a third of the way
 * in — the page overhanging the white bar it is supposed to be turning into.
 */
function clipAt(p: number, bow: number, el: HTMLElement, spanVw: number) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const r = el.getBoundingClientRect()
  const y = (viewportY: number) => viewportY - r.top
  const x = (viewportX: number) => viewportX - r.left

  const left = ((100 - SLAT_W) / 2) * p * 0.01 * vw
  const right = vw - left

  /*
   * The arcs span the window, not the screen, so the page's edges sit partway
   * along the dip and are cut less deeply than its centre. For a parabola that
   * falls off with the square of the distance from the middle.
   */
  const winW = (100 - (100 - spanVw) * p) * 0.01 * vw
  const u = Math.min(1, (right - left) / winW)
  const centre = bite(p, bow)
  const edge = centre - arcSag(bow) * u * u

  // Control point placed so the curve's own midpoint lands exactly on `centre`,
  // from mid = (P0 + 2C + P2) / 4 on a symmetric span.
  const ctrl = 2 * centre - edge
  const yT = edge * 0.01 * vh
  const cT = ctrl * 0.01 * vh
  const yB = vh - yT
  const cB = vh - cT
  const cx = x(vw / 2)

  return `path("M ${x(left)} ${y(yT)} Q ${cx} ${y(cT)} ${x(right)} ${y(yT)} L ${x(right)} ${y(yB)} Q ${cx} ${y(cB)} ${x(left)} ${y(yB)} Z")`
}

/**
 * Fades the page out over the last of its travel, where it is already a sliver
 * three viewport-widths wide — small enough that the swap to the slat behind it
 * is not something you can catch.
 */
/**
 * How solid the page is. The slat standing in for it sits directly behind it,
 * cut to the same curve, so fading the page is the same as veiling it in the
 * bar's own white
 * — the trick theirs does with a .main-overlay panel inside the page container.
 *
 * Linear in p, which is linear in the bar's width, and the same curve in both
 * directions — the expansion is the compression run backwards, so the bar
 * arrives with the same whiteness it left with and gives it up at the same
 * rate. Measured against theirs the page is 0.17 visible at 17% open, 0.40 at
 * 40%, 0.71 at 71%. It still reads as revealing late because the width is
 * eased: the bar barely widens through its first half, so most of both the
 * opening and the fade land in the back half.
 *
 * Two other curves were tried here and both were wrong in opposite ways.
 * Holding the page back until the bar was mostly open flashed, because the
 * width was already whipping when the page arrived. Letting it go solid early
 * gave a dark page-shape growing with no white left in it — the row's
 * whiteness is the thing being handed over, and this is where it happens.
 */
const veil = (p: number) => 1 - p

/*
 * Two eases, not one. Fitted against their live transition: the shrink is
 * power4.inOut but the expansion is power3.inOut, and their source agrees —
 * separate timelines with separate defaults. Running power4 both ways makes the
 * panel sit almost still and then whip open, which is what reads as flashing
 * in rather than expanding. Over the same 847ms, power4 is only 0.11 open a
 * third of the way through where theirs is 0.17, so it has to make the rest up
 * in half the time.
 */
const EASE_CLOSE = 'power4.inOut'
const EASE_OPEN = 'power3.inOut'

/**
 * Sizes the window to a whole, even number of pixels and centres it on whole
 * pixels, so both of its edges land on the pixel grid.
 *
 * Sized in vw and centred with a -50% translate it sat at 365.602px on an
 * 1828px viewport, and Chrome draws a hairline where an overflow: hidden edge
 * falls between pixels with a composited child behind it. The slats are that
 * child for the whole transition, so the hairline was white, full height, and
 * grew as the row slid — the lines at the sides.
 */
const sizeWindow = (win: HTMLElement | null, vw: number) => {
  const w = 2 * Math.round((vw * 0.01 * window.innerWidth) / 2)
  gsap.set(win, { width: w, left: Math.round((window.innerWidth - w) / 2) })
}

/**
 * Which slat is currently at the centre of the screen. The row is centred, so
 * the middle one sits there when it has not travelled; every pitch it moves
 * puts its neighbour there instead.
 */
const centreSlat = (slats: ArrayLike<Element>, slotOffset: number) =>
  Math.round((slats.length - 1) / 2) - slotOffset

/**
 * How many slots the row has travelled, read back off its computed transform.
 * Off the DOM rather than GSAP's cache: the cache answered 0 for a row the
 * browser had at 73px, which put the page's bar one pitch off centre.
 */
const slotAt = (strip: HTMLElement | null) => {
  if (!strip) return 0
  const x = new DOMMatrix(getComputedStyle(strip).transform).m41
  return Math.round(x / (PITCH * 0.01 * window.innerWidth))
}

/**
 * Puts one slat above its neighbours. It has to paint over them once it is wide
 * enough to reach them, and being a flex item it would otherwise be ordered by
 * position in the row.
 */
const lift = (slats: ArrayLike<HTMLElement>, active: number) => {
  for (let i = 0; i < slats.length; i++) gsap.set(slats[i], { zIndex: i === active ? 1 : 0 })
}

/**
 * Every moving part from one number. 0 is a full screen, 1 is a single bar in
 * the row.
 *
 * The page's stand-in is one of the row's own slats, scaled — not a panel over
 * the top of them. As a separate element it travelled on its own, painted above
 * the row rather than among it, and read as a white box growing over the bars
 * instead of a bar growing. Being a slat, it also rides the row's travel for
 * free.
 *
 * The window narrows as it does, the way theirs takes .home-load__inner from
 * 100vw to 60vw, so the row and its arcs are only uncovered as it gets out of
 * the way.
 */
function paint(
  p: number,
  o: { bow: number; span: number },
  page: HTMLElement[],
  win: HTMLElement | null,
  arcs: NodeListOf<Element> | null,
  slats: NodeListOf<Element>,
  /** Index of the slat standing in for the page. */
  active: number,
  /*
   * Whether the row is already at full height. Coming back it is — it grew
   * during the shuffle — so only width moves and the arcs pulling back are what
   * shape the expansion.
   */
  tall = false,
) {
  const wideVw = 100 - (100 - SLAT_W) * p
  /*
   * The slats are full height at the start and only settle to the band by the
   * end, the way theirs run height 100vh to 45vh. Left at 45vh throughout, the
   * arcs do not reach them until p = 0.75 — so for three quarters of the shrink
   * the row was flat-topped rectangles instead of a bow.
   */
  const rowVh = tall ? 100 : 100 - (100 - SLAT_H) * p

  page.forEach((el) =>
    gsap.set(el, { clipPath: clipAt(p, o.bow, el, o.span), opacity: veil(p) }),
  )
  sizeWindow(win, 100 - (100 - o.span) * p)

  /*
   * Opposite signs. They retreat off opposite edges, so one value for both
   * carries the bottom arc up into the middle of the screen — a second curve
   * across the page, which is not a curve at all but the wrong arc.
   */
  const arcY = arcAt(p, o.bow)
  arcs?.forEach((a) =>
    gsap.set(a, { yPercent: a.classList.contains('is-bottom') ? -arcY : arcY }),
  )

  gsap.set(slats, { scaleY: rowVh / SLAT_H })
  /*
   * Only the standing-in slat widens, and it widens by width, not scale. Width
   * reflows the row, so the neighbours are pushed outward as it grows — the
   * whole row opening up, which is what an accordion does. Scaled, it grew over
   * neighbours that never moved, and read as a box laid on top of the bars.
   */
  gsap.set(slats[active], { width: `${wideVw}vw` })
}

/**
 * Which slot a path lands on. The same page always lands on the same slat, so
 * the site keeps the feel of a strip you slide along — without asking anyone to
 * hand us a list of their routes.
 */
function slotFor(path: string, spread: number) {
  let h = 0
  for (let i = 0; i < path.length; i++) h = (h * 31 + path.charCodeAt(i)) | 0
  return (Math.abs(h) % (spread * 2 + 1)) - spread
}

/**
 * The two arcs, mirrored in their own path data rather than with a CSS scale.
 * A `scale: 1 -1` on the element gets overwritten the moment GSAP writes a
 * transform to slide the arc in, which leaves the bottom one cutting the row
 * with its flat edge instead of its curve.
 */
const arcTop = (bow: number) => `M0,0 H100 V30 Q50,${30 + bow * 2} 0,30 Z`
const arcBottom = (bow: number) => `M0,60 H100 V30 Q50,${30 - bow * 2} 0,30 Z`

const q = <T extends Element>(root: ParentNode, sel: string) =>
  root.querySelector(sel) as T | null

/**
 * The page, found rather than wrapped. The core renders the overlay as a
 * sibling of the page inside <body>, so the page is reachable without putting a
 * div around anyone's layout — a wrapper breaks height:100% chains and sticky
 * positioning, which is too high a price for a drop-in.
 */
const IGNORE = new Set(['SCRIPT', 'STYLE', 'LINK', 'TEMPLATE', 'NEXT-ROUTE-ANNOUNCER'])
const pageOf = (overlay: HTMLDivElement) =>
  Array.from(overlay.parentElement?.children ?? []).filter(
    (el): el is HTMLElement =>
      el instanceof HTMLElement && el !== overlay && !IGNORE.has(el.tagName),
  )

/** Above the overlay, so the ground and slats sit behind the page as it shrinks. */
const LIFT = { position: 'relative' as const, zIndex: 101 }

export const ConcertinaTransition = createTransition<ConcertinaOptions>({
  timeout: 9000,
  defaults: DEFAULTS,

  overlay: (options) => (
    <div
      className={`cc-stage ${options.palette === 'custom' ? '' : `cc-${options.palette}`}`}
      style={
        {
          '--cc-slat-w': `${SLAT_W}vw`,
          '--cc-gap': `${GAP}vw`,
          '--cc-slat-h': `${SLAT_H}vh`,
          '--cc-window': `${options.span}vw`,
        } as React.CSSProperties
      }
    >
      <div className="cc-ground" />
      {/*
        The row lives in a window rather than running edge to edge, and the arcs
        live in it too. Across a narrower span the same curve is far steeper at
        its ends, which is what slants the outermost slats.
      */}
      <div className="cc-window">
        <div className="cc-strip">
          {Array.from({ length: options.slats }, (_, i) => (
            <div key={i} className="cc-slat" />
          ))}
        </div>
        <svg className="cc-arc is-top" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden>
          <path d={arcTop(options.bow)} />
        </svg>
        <svg className="cc-arc is-bottom" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden>
          <path d={arcBottom(options.bow)} />
        </svg>
      </div>
    </div>
  ),

  setup: (overlay, options) => {
    // Same element leave() and enter() toggle — hiding the stage here while
    // those showed the overlay left the ground and slats permanently invisible.
    gsap.set(overlay, { autoAlpha: 0 })
    gsap.set(q(overlay, '.cc-strip'), {
      x: `${slotFor(location.pathname, options.spread) * PITCH}vw`,
    })
    // Parked where paint(0) would put them, so the first frame of a navigation
    // is continuous with the resting state rather than a jump.
    gsap.set(overlay.querySelectorAll('.cc-arc.is-top'), { yPercent: arcAt(0, options.bow) })
    gsap.set(overlay.querySelectorAll('.cc-arc.is-bottom'), { yPercent: -arcAt(0, options.bow) })
    gsap.set(overlay.querySelectorAll('.cc-slat'), { scaleY: 1, zIndex: 0, clearProps: 'width' })
    sizeWindow(q<HTMLElement>(overlay, '.cc-window'), options.span)
  },

  leave: ({ overlay, options, done }) => {
    const tl = gsap.timeline({ onComplete: done })
    const page = pageOf(overlay)
    const win = q<HTMLElement>(overlay, '.cc-window')
    const strip = q<HTMLElement>(overlay, '.cc-strip')
    const arcs = overlay.querySelectorAll('.cc-arc')
    const slats = overlay.querySelectorAll<HTMLElement>('.cc-slat')

    // Whichever slat the row is parked over. Read back rather than remembered,
    // so it survives a reload or an interrupted navigation.
    const active = centreSlat(slats, slotAt(strip))
    lift(slats, active)

    gsap.set(overlay, { autoAlpha: 1 })
    gsap.set(page, LIFT)
    paint(0, options, page, win, arcs, slats, active)

    const at = { p: 0 }
    tl.to(at, {
      p: 1,
      duration: options.duration,
      ease: EASE_CLOSE,
      onUpdate: () => paint(at.p, options, page, win, arcs, slats, active),
    })

    tl.timeScale(options.speed)
    return () => tl.kill()
  },

  enter: ({ overlay, options, done }) => {
    const page = pageOf(overlay)
    const win = q<HTMLElement>(overlay, '.cc-window')
    const strip = q<HTMLElement>(overlay, '.cc-strip')
    const arcs = overlay.querySelectorAll('.cc-arc')
    const slats = overlay.querySelectorAll<HTMLElement>('.cc-slat')

    // The slat the page collapsed into. It rides away with the row.
    const leaving = centreSlat(slats, slotAt(strip))

    /*
     * Synchronously, not as a timeline step. The route has already swapped by
     * the time enter runs, so a fresh unclipped page is mounted and one frame of
     * it at full size is enough to read as a flash.
     */
    gsap.set(page, LIFT)
    paint(1, options, page, win, arcs, slats, leaving)

    const tl = gsap.timeline({
      onComplete: () => {
        // Hand the page back exactly as it was found, and park the row so the
        // next navigation starts where this one began.
        gsap.set(pageOf(overlay), { clearProps: 'clipPath,position,zIndex,opacity' })
        gsap.set(slats, { scaleY: 1, zIndex: 0, clearProps: 'width' })
        done()
      },
    })

    // location is the destination by now, which is what makes the slot knowable
    // at all — during leave this is still the page being left.
    const slot = slotFor(location.pathname, options.spread)
    const arriving = centreSlat(slats, slot)

    /*
     * Only the page, and against a fresh query. enter() runs either side of
     * React committing the new page, so the node styled synchronously above is
     * sometimes the one being replaced — the incoming one then renders
     * unclipped and fully opaque for a frame.
     */
    const holdPage = () => {
      const live = pageOf(overlay)
      gsap.set(live, LIFT)
      live.forEach((el) =>
        gsap.set(el, { clipPath: clipAt(1, options.bow, el, options.span), opacity: veil(1) }),
      )
    }

    const shuffle = options.duration / 1.25
    tl.to(strip, {
      x: `${slot * PITCH}vw`,
      duration: shuffle,
      ease: 'power2.inOut',
      onUpdate: holdPage,
    })

    // The band becomes full-height columns as it slides, which is what leaves
    // the arcs alone to shape the expansion that follows.
    tl.to(slats, { scaleY: 100 / SLAT_H, duration: shuffle, ease: 'power2.inOut' }, '<')

    /*
     * The slat that has arrived at the centre takes over. Both are a plain bar
     * of the same colour at this point, so the handover is not visible — and it
     * is what makes the page grow out of the row rather than out of something
     * laid over it.
     */
    tl.call(() => {
      gsap.set(slats[leaving], { clearProps: 'width' })
      lift(slats, arriving)
    })

    const at = { p: 1 }
    tl.to(at, {
      p: 0,
      duration: options.duration,
      ease: EASE_OPEN,
      onUpdate: () => paint(at.p, options, pageOf(overlay), win, arcs, slats, arriving, true),
    })
    tl.set(overlay, { autoAlpha: 0 })

    tl.timeScale(options.speed)
    return () => tl.kill()
  },
})
