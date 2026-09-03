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
  bow: 14,
  span: 60,
  spread: 6,
  duration: 0.85,
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
 * Where the arc's curve crosses the middle of the row, in vh. The lead is sized
 * to this so it sits flush with the slats either side of it rather than
 * standing proud of them.
 */
const ARC_H = 50
const slotTop = (bow: number) => ((30 + bow) / 60) * ARC_H
/** Height of the slot, once the arc has taken its bite out of both ends. */
const slotH = (bow: number) => 100 - 2 * slotTop(bow)

/**
 * How deep the arcs bite, at the centre of the row, in vh. This one number is
 * the law: the arcs are positioned to it, the slats and the lead are cut to it,
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
 * the lead's own top and bottom by construction. Deriving it from the arc's
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
 * How solid the page is. The lead sits directly behind it tracking its crop
 * exactly, so fading the page is the same as veiling it in the bar's own white
 * — the trick theirs does with a .main-overlay panel inside the page container.
 *
 * Linear in p, which is linear in the bar's width, which is what theirs does:
 * measured against their live transition the page is 0.17 visible at 17% open,
 * 0.40 at 40%, 0.71 at 71%. It still reads as revealing late because the width
 * is eased — the bar barely widens through its first half, so most of both the
 * opening and the fade land in the back half. Holding the fade back on top of
 * that is doing the easing's job twice.
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
 * Every moving part from one number. 0 is a full screen, 1 is a single bar in
 * the row.
 *
 * The lead is the piece that was missing. It is the page's stand-in: a panel
 * that starts the size of the whole screen and shrinks to a bar, tracking the
 * page's own crop exactly so the page appears to *become* it. Without it the
 * page just vanishes into a slot, and the wide-to-thin stage — which is most of
 * what the effect reads as — never happens.
 *
 * The window narrows as the lead does, the way theirs takes .home-load__inner
 * from 100vw to 60vw, so the row and its arcs are only revealed as the lead
 * gets out of the way.
 */
function paint(
  p: number,
  o: { bow: number; span: number },
  page: HTMLElement[],
  lead: HTMLElement | null,
  win: HTMLElement | null,
  arcs: NodeListOf<Element> | null,
  slats: NodeListOf<Element> | null,
  /*
   * Whether the row is already at full height. Coming back it is — it grew
   * during the shuffle — so only width moves and the arcs pulling back are what
   * shape the expansion.
   */
  tall = false,
) {
  const wideVw = 100 - (100 - SLAT_W) * p

  page.forEach((el) =>
    gsap.set(el, { clipPath: clipAt(p, o.bow, el, o.span), opacity: veil(p) }),
  )
  /*
   * Always full height, and left to the arcs to trim. The lead lives under them,
   * so they cut it to exactly the curve the page is clipped to — sizing it to
   * the slot instead left it a rectangle under a bowed page, and the slats
   * behind showed through the page's corners where it had nothing to back it.
   */
  gsap.set(lead, { scaleX: wideVw / SLAT_W, scaleY: 100 / slotH(o.bow) })
  gsap.set(win, { width: `${100 - (100 - o.span) * p}vw` })
  /*
   * Opposite signs. They retreat off opposite edges, so one value for both
   * carries the bottom arc up into the middle of the screen — a second curve
   * across the page, which is not a curve at all but the wrong arc.
   */
  const arcY = arcAt(p, o.bow)
  arcs?.forEach((a) =>
    gsap.set(a, { yPercent: a.classList.contains('is-bottom') ? -arcY : arcY }),
  )

  /*
   * The slats are full height at the start and only settle to the band by the
   * end, the way theirs run height 100vh to 45vh. Left at 45vh throughout, the
   * arcs do not reach them until p = 0.75 — so for three quarters of the shrink
   * the row was flat-topped rectangles instead of a bow.
   */
  gsap.set(slats, { scaleY: (tall ? 100 : 100 - (100 - SLAT_H) * p) / SLAT_H })
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
        {/* Sits below the arcs so it gets the same bite the real slats do. */}
        <div className="cc-lead" style={{ height: `${slotH(options.bow)}vh` }} />
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
    gsap.set(overlay.querySelectorAll('.cc-slat'), { scaleY: 1 })
  },

  leave: ({ overlay, options, done }) => {
    const tl = gsap.timeline({ onComplete: done })
    const page = pageOf(overlay)
    const lead = q<HTMLElement>(overlay, '.cc-lead')
    const win = q<HTMLElement>(overlay, '.cc-window')
    const arcs = overlay.querySelectorAll('.cc-arc')
    const slats = overlay.querySelectorAll('.cc-slat')

    // Ground and row come up behind a full-screen lead, which the page covers.
    gsap.set(overlay, { autoAlpha: 1 })
    gsap.set(page, LIFT)
    paint(0, options, page, lead, win, arcs, slats)

    const at = { p: 0 }
    tl.to(at, {
      p: 1,
      duration: options.duration,
      ease: EASE_CLOSE,
      onUpdate: () => paint(at.p, options, page, lead, win, arcs, slats),
    })

    tl.timeScale(options.speed)
    return () => tl.kill()
  },

  enter: ({ overlay, options, done }) => {
    const page = pageOf(overlay)
    const lead = q<HTMLElement>(overlay, '.cc-lead')
    const win = q<HTMLElement>(overlay, '.cc-window')
    const arcs = overlay.querySelectorAll('.cc-arc')
    const slats = overlay.querySelectorAll('.cc-slat')

    /*
     * Synchronously, not as a timeline step. The route has already swapped by
     * the time enter runs, so a fresh unclipped page is mounted and one frame of
     * it at full size is enough to read as a flash.
     */
    gsap.set(page, LIFT)
    paint(1, options, page, lead, win, arcs, slats)

    const tl = gsap.timeline({
      onComplete: () => {
        // Hand the page back exactly as it was found, and park the row at band
        // height so the next navigation starts where this one began.
        gsap.set(pageOf(overlay), { clearProps: 'clipPath,position,zIndex,opacity' })
        gsap.set(slats, { scaleY: 1 })
        done()
      },
    })

    // location is the destination by now, which is what makes the slot knowable
    // at all — during leave this is still the page being left.
    const slot = slotFor(location.pathname, options.spread)

    /*
     * Only the page, and against a fresh query. enter() runs either side of
     * React committing the new page, so the node styled synchronously above is
     * sometimes the one being replaced — the incoming one then renders
     * unclipped and fully opaque for a frame. Nothing else needs repainting
     * while the row slides, and repainting the row here would fight the travel
     * below.
     */
    const holdPage = () => {
      const live = pageOf(overlay)
      gsap.set(live, LIFT)
      live.forEach((el) =>
        gsap.set(el, { clipPath: clipAt(1, options.bow, el, options.span), opacity: veil(1) }),
      )
    }

    const strip = q<HTMLElement>(overlay, '.cc-strip')
    const shuffle = options.duration / 1.25

    /*
     * The bar the page collapsed into is one of the row's, so it travels with
     * the row. Pinned at the centre it sat still while everything slid past it,
     * which reads as the row moving around a bar rather than the row moving.
     *
     * Both are driven off one tweened number rather than two tweens with the
     * same duration and ease — those still slipped 22px apart, and a bar
     * dragging behind its own row is exactly the thing being fixed.
     *
     * The lead is reset to the centre before the expansion. Nothing shows: the
     * row travels a whole number of pitches, so another slat is at the centre
     * by then, exactly where the lead lands and the same colour.
     */
    const from = gsap.getProperty(strip, 'x') as number
    const to = slot * PITCH * 0.01 * window.innerWidth
    const ride = { x: from }

    tl.to(ride, {
      x: to,
      duration: shuffle,
      ease: 'power2.inOut',
      onUpdate: () => {
        gsap.set(strip, { x: ride.x })
        gsap.set(lead, { x: ride.x - from })
        holdPage()
      },
    })

    // The band becomes full-height columns as it slides, which is what leaves
    // the arcs alone to shape the expansion that follows.
    tl.to(slats, { scaleY: 100 / SLAT_H, duration: shuffle, ease: 'power2.inOut' }, '<')

    tl.set(lead, { x: 0 })

    // The bar the row landed on widens back out, and the page grows out of it.
    const at = { p: 1 }
    tl.to(
      at,
      {
        p: 0,
        duration: options.duration,
        ease: EASE_OPEN,
        onUpdate: () => paint(at.p, options, pageOf(overlay), lead, win, arcs, slats, true),
      },
      '>-0.12',
    )
    tl.set(overlay, { autoAlpha: 0 })

    tl.timeScale(options.speed)
    return () => tl.kill()
  },
})
