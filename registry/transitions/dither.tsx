'use client'

import gsap from 'gsap'
import { createTransition } from './transition-core'
import './transitions.css'

/**
 * Dither.
 *
 * A grid of square cells fills the screen in Bayer order — a sparse lattice
 * first, then the checkerboard between, then the weave that closes it, then
 * solid — the fade-to-black of an 8-bit console, or a halftone building up
 * tone. Each cell pops rather than fades. The route swaps behind the solid
 * screen, then the same sequence runs backwards to reveal it.
 *
 * Drawn on a canvas from one number rather than a thousand divs: the harness
 * can scrub it, the cells stay square on any viewport, and it costs nothing
 * at rest.
 *
 *   // app/layout.tsx
 *   <DitherTransition>{children}</DitherTransition>
 */
export type DitherOptions = {
  /** Columns across the screen. Rows follow from the aspect ratio, so cells stay square. */
  cells: number
  /** Size of the Bayer matrix — 2, 4 or 8. Smaller is a coarser, more visible weave. */
  matrix: 2 | 4 | 8
  /** Seconds the screen takes to fill, and to clear. */
  duration: number
  /** Seconds the screen stays solid before clearing. The route swaps during this beat. */
  hold: number
  /** Multiplies the whole timeline. Above 1 is faster. */
  speed: number
  /** Colour of the cells. "custom" applies no preset, leaving --dither-ground to you. */
  palette: 'ink' | 'paper' | 'blueprint' | 'ember' | 'custom'
}

const DEFAULTS: DitherOptions = {
  cells: 32,
  matrix: 4,
  duration: 0.5,
  hold: 0.2,
  speed: 1,
  palette: 'ink',
}

/**
 * Bayer matrix of size n, values 0..n²-1, built by the recurrence
 * M(2n) = [[4M, 4M+2], [4M+3, 4M+1]]. Tiled over the grid, it orders the cells
 * so that every threshold step is spread evenly across the screen — which is
 * what makes the fill read as a weave tightening rather than a region growing.
 */
function bayer(n: number): number[][] {
  let m = [[0]]
  while (m.length < n) {
    const s = m.length
    const next = Array.from({ length: s * 2 }, () => new Array<number>(s * 2).fill(0))
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const v = m[y][x] * 4
        next[y][x] = v
        next[y][x + s] = v + 2
        next[y + s][x] = v + 3
        next[y + s][x + s] = v + 1
      }
    }
    m = next
  }
  return m
}

type Rig = {
  ctx: CanvasRenderingContext2D
  cols: number
  rows: number
  cell: number
  w: number
  h: number
  /** One threshold per cell, 0..1. A cell is on once the fill level passes it. */
  t: Float32Array
  color: string
}

/** Measured fresh at the start of every leave, so a resized window never draws a stale grid. */
function prepare(overlay: HTMLDivElement, o: DitherOptions): Rig | null {
  const canvas = overlay.querySelector('canvas')
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return null

  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const cols = Math.max(1, Math.round(o.cells))
  const cell = w / cols
  const rows = Math.ceil(h / cell)
  const n = o.matrix
  const m = bayer(n)
  const steps = n * n
  const t = new Float32Array(cols * rows)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) t[y * cols + x] = (m[y % n][x % n] + 0.5) / steps
  }

  const host = overlay.firstElementChild as Element
  const color = getComputedStyle(host).getPropertyValue('--dither-ground').trim() || '#0a0a0a'
  return { ctx, cols, rows, cell, w, h, t, color }
}

/**
 * Draws the grid at a fill level: 0 is clear, 1 is solid. Cells are on or off,
 * never in between — that is the pop. Edges are rounded to whole pixels so
 * neighbouring cells share a boundary instead of leaving a hairline.
 */
function paint(rig: Rig, fill: number) {
  const { ctx, cols, rows, cell, w, h, t, color } = rig
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = color
  for (let y = 0; y < rows; y++) {
    const y0 = Math.round(y * cell)
    const y1 = Math.round((y + 1) * cell)
    for (let x = 0; x < cols; x++) {
      if (t[y * cols + x] <= fill) {
        const x0 = Math.round(x * cell)
        const x1 = Math.round((x + 1) * cell)
        ctx.fillRect(x0, y0, x1 - x0, y1 - y0)
      }
    }
  }
}

/** The overlay is mounted once and there is never more than one navigation in flight. */
let rig: Rig | null = null

export const DitherTransition = createTransition<DitherOptions>({
  timeout: 6000,
  defaults: DEFAULTS,

  overlay: (o) => (
    <div className={`dither ${o.palette === 'custom' ? '' : `dither-${o.palette}`}`}>
      <canvas aria-hidden />
    </div>
  ),

  leave: ({ overlay, options, done }) => {
    rig = prepare(overlay, options)
    if (!rig) {
      done()
      return
    }
    const r = rig
    const v = { fill: 0 }
    // Linear on purpose: a constant rate of cells, the way the reference's
    // stagger is. Easing this would bunch the weave's steps at one end.
    const tl = gsap.timeline({ onComplete: done })
    tl.to(v, { fill: 1, duration: options.duration, ease: 'none', onUpdate: () => paint(r, v.fill) })
    tl.timeScale(options.speed)
    return () => tl.kill()
  },

  enter: ({ overlay, options, done }) => {
    rig ??= prepare(overlay, options)
    if (!rig) {
      done()
      return
    }
    const r = rig
    paint(r, 1)
    const v = { fill: 1 }
    const tl = gsap.timeline({
      onComplete: () => {
        paint(r, 0)
        done()
      },
    })
    // Sits solid for a beat — that is when the route swaps — then clears in
    // reverse order, so the last cells in are the first cells out.
    tl.to({}, { duration: options.hold })
    tl.to(v, { fill: 0, duration: options.duration, ease: 'none', onUpdate: () => paint(r, v.fill) })
    tl.timeScale(options.speed)
    return () => tl.kill()
  },
})
