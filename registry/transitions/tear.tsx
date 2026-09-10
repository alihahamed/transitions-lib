'use client'

import gsap from 'gsap'
import {
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  DirectionalLight,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  RepeatWrapping,
  Scene,
  ShadowMaterial,
  WebGLRenderer,
} from 'three'
import { createTransition } from './transition-core'
import './transitions.css'

/**
 * Tear.
 *
 * A sheet of paper is lowered over the page, the route swaps behind it, and
 * the sheet is torn in two: a jagged seam races down from the top while the
 * halves are pulled apart, then they come free and fall out of frame.
 *
 * The paper is a real cloth: a grid of particles joined by distance
 * constraints and stepped with Verlet integration at a fixed 120Hz, with
 * gravity down the screen, a little air lift so it billows as it drops, and
 * the page itself as a wall it cannot pass behind. The tear is a row of
 * zero-length links between two cloths that are cut one by one; everything
 * else — the fluttering edge, the wedge opening at the top, the halves
 * curling as they fall — falls out of the simulation. Rendered with three.js:
 * a lit, smooth-shaded mesh with the tooth of art paper in a normal map and a soft shadow cast
 * onto the page beneath, so folds read as folds. The one transition in the
 * library that carries a real dependency for its drawing.
 *
 * No two tears are alike: the seam, which half comes free first, how hard
 * each side is pulled and the gust that carries the pieces off are drawn
 * fresh for every navigation.
 *
 *   // app/layout.tsx
 *   <TearTransition>{children}</TearTransition>
 */
export type TearOptions = {
  /** Particles across the sheet. Rows follow from the aspect ratio. More is finer and costlier. */
  cols: number
  /** How much the paper resists bending, 0.2 to 1. Low is cloth, high is card. */
  stiffness: number
  /** Gravity, in screen heights per second squared. */
  gravity: number
  /** How fast the halves are pulled apart, in screen widths per second. */
  pull: number
  /** How often the seam jogs sideways as it runs down, 0 to 1. */
  jag: number
  /** Seconds the tear takes to run from top to bottom. */
  duration: number
  /** Multiplies the whole thing. Above 1 is faster. */
  speed: number
  /** Paper colour. "page" takes the current page's background, so it is the page itself that tears. "custom" applies no preset, leaving --tear-paper and --tear-fibre to you. */
  paper: 'chalk' | 'kraft' | 'newsprint' | 'ink' | 'page' | 'custom'
  /** "low" drops the shadow, the bump and some of the mesh for weaker devices. "auto" picks by device. */
  quality: 'auto' | 'high' | 'low'
}

const DEFAULTS: TearOptions = {
  cols: 32,
  stiffness: 0.8,
  gravity: 2.4,
  pull: 0.5,
  jag: 0.6,
  duration: 0.35,
  speed: 1,
  paper: 'chalk',
  quality: 'auto',
}

/** Fixed simulation step. The draw runs at the display rate; the physics does not. */
const STEP = 1 / 120
const DAMP = 0.985
const ITER = 6
/** Air lift: how hard falling paper is pushed off the wall, per unit of downward speed. */
const LIFT = 0.9
/** Pull back towards the page, per unit of distance from it, so a lifted sheet settles flat again. */
const WALL = 14
/** The sheet is dropped, not lowered: the pins fall under this many screen heights per second squared until they hit their mark. */
const DROP_G = 10
const BLEED = 0.03
/** The pinned top row sits well above the frame, so a half still in the hand never shows as a strip along the top. */
const BLEED_TOP = 0.09
/** The sheet runs on past the bottom, so a curled lower edge never uncovers the page. */
const BLEED_BOTTOM = 0.16
const SETTLE = 0.33
const HOLD = 0.06
/** After this long in free fall gravity ramps up to clear stragglers; the phase ends at FALL_CAP regardless. */
const FALL_RAMP = 0.9
const FALL_CAP = 3
/** How fast a bent bend-link forgets its rest length: paper keeps its creases, cloth does not. */
const PLASTIC = 0.03
/** Length of the fibrous fringe along the torn edge, in px. Kept small on purpose. */
const FRINGE = 2

type Particle = {
  x: number; y: number; z: number
  px: number; py: number; pz: number
  rx: number; ry: number
  pinned: boolean
  on: boolean
  r: number
}
type Link = { a: Particle; b: Particle; rest: number; k: number; alive: boolean; bend: boolean }
type Cell = { pts: Particle[]; parity: number }
type Cloth = {
  side: -1 | 1
  ps: Particle[]
  links: Link[]
  cells: Cell[]
  pins: Particle[]
  seam: Particle[]
  /** Interior particles with their four neighbours, as index quintuples, for render-time smoothing. */
  smooth: Int32Array
}

type View = { mesh: Mesh; geo: BufferGeometry; fringe: Mesh | null; fringeGeo: BufferGeometry | null }

type Rig = {
  w: number
  h: number
  sheetH: number
  rows: number
  cloths: [Cloth, Cloth]
  seamLinks: Link[]
  torn: number
  views: [View, View]
  /** Seam bookkeeping for drawing: per row, the seam vertex index in each cloth and its outer neighbour. */
  seamL: Int32Array
  seamR: Int32Array
  seamLn: Int32Array
  seamRn: Int32Array
  /** Per-navigation character: pull strength per side, when each side lets go, and a sideways gust. */
  pull: [number, number]
  release: [number, number]
  gust: number
  /** Where the tear hesitates on its way down, as spans of eased progress. */
  holds: { at: number; len: number }[]
}

/** The renderer, lights and catcher plane. Made once, kept for the life of the page. */
type Gl = {
  renderer: WebGLRenderer
  scene: Scene
  camera: PerspectiveCamera
  key: DirectionalLight
  catcher: Mesh
  paper: MeshStandardMaterial
  fibre: MeshStandardMaterial
  low: boolean
}
let gl: Gl | null = null

/** Where the last pointer went down, as fractions of the viewport. The seam starts above it. */
let pointer = { x: 0.5, y: 0.4 }

function lowQuality(o: TearOptions) {
  if (o.quality !== 'auto') return o.quality === 'low'
  const nav = navigator as Navigator & { deviceMemory?: number }
  const phone = Math.min(screen.width, screen.height) < 820
  return (nav.hardwareConcurrency || 8) <= 4 || (nav.deviceMemory || 8) <= 4 || phone
}

/**
 * A torn edge, as an alpha map for a strip that straddles the seam. Across the
 * strip (v) the inner part is solid paper, so it hides the mesh's straight
 * edge; the boundary wanders, so the visible edge is ragged at a scale finer
 * than the mesh; beyond it individual strands of fibre stick out, a few of
 * them long, with a little fuzz between.
 */
function fringeTexture() {
  const W = 1024, H = 64
  const rnd = rng(11)
  // The ragged boundary, as a random walk with a gentle pull back to the middle.
  // It has to stay outside the mesh's own edge (v = 0.375 across this strip), since
  // the mesh is drawn regardless; the ragged part is paper that reaches beyond it.
  const edge = new Float32Array(W)
  let e = 0.5
  for (let x = 0; x < W; x++) {
    e += (rnd() - 0.5) * 0.1 + (0.5 - e) * 0.06
    edge[x] = Math.max(0.4, Math.min(0.66, e))
  }
  // Strands: two to three pixels wide, of varying length and strength.
  const strand = new Float32Array(W)
  const strength = new Float32Array(W)
  for (let k = 0; k < 190; k++) {
    const x0 = (rnd() * W) | 0
    const len = rnd() < 0.25 ? 0.25 + rnd() * 0.32 : 0.06 + rnd() * 0.16
    const str = 0.6 + rnd() * 0.4
    const wdt = 3 + ((rnd() * 3) | 0)
    for (let d = 0; d < wdt; d++) {
      const x = (x0 + d) % W
      strand[x] = Math.max(strand[x], len)
      strength[x] = Math.max(strength[x], str)
    }
  }
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(W, H)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = y / (H - 1)
      const b = edge[x]
      let a: number
      if (v <= b) a = 1
      else {
        const beyond = v - b
        const fuzz = Math.exp(-beyond / 0.03) * 0.4
        const st = beyond < strand[x] ? strength[x] * (1 - beyond / strand[x]) : 0
        a = Math.max(fuzz, st)
      }
      const i = (y * W + x) * 4
      img.data[i] = img.data[i + 1] = img.data[i + 2] = (a * 255) | 0
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new CanvasTexture(c)
  tex.wrapS = RepeatWrapping
  return tex
}

function paperTextures(): { map: CanvasTexture; bump: CanvasTexture } {
  const N = 512
  const rnd = rng(7)
  const L = 16
  const lattice = new Float32Array((L + 1) * (L + 1))
  for (let i = 0; i < lattice.length; i++) lattice[i] = rnd()
  const mottle = (x: number, y: number) => {
    const fx = (x / N) * L, fy = (y / N) * L
    const ix = Math.floor(fx), iy = Math.floor(fy)
    const tx = fx - ix, ty = fy - iy
    const at = (a: number, b: number) => lattice[(b % L) * (L + 1) + (a % L)]
    const top = at(ix, iy) * (1 - tx) + at(ix + 1, iy) * tx
    const bot = at(ix, iy + 1) * (1 - tx) + at(ix + 1, iy + 1) * tx
    return top * (1 - ty) + bot * ty
  }
  const fibre = new Float32Array(N * N)
  for (let k = 0; k < 9000; k++) {
    const x0 = rnd() * N, y0 = rnd() * N
    const ang = (rnd() - 0.5) * 1.2 + (rnd() < 0.5 ? 0 : Math.PI)
    const len = 4 + rnd() * 14
    const str = 0.35 + rnd() * 0.65
    for (let t = 0; t < len; t++) {
      const x = ((x0 + Math.cos(ang) * t) | 0) & (N - 1)
      const y = ((y0 + Math.sin(ang) * t) | 0) & (N - 1)
      fibre[y * N + x] = Math.min(1, fibre[y * N + x] + str)
    }
  }
  const make = (fn: (x: number, y: number) => number) => {
    const c = document.createElement('canvas')
    c.width = c.height = N
    const ctx = c.getContext('2d')!
    const img = ctx.createImageData(N, N)
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const v = Math.max(0, Math.min(255, fn(x, y) * 255)) | 0
        const i = (y * N + x) * 4
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v
        img.data[i + 3] = 255
      }
    }
    ctx.putImageData(img, 0, 0)
    const tex = new CanvasTexture(c)
    tex.wrapS = tex.wrapT = RepeatWrapping
    tex.repeat.set(2, 2)
    tex.anisotropy = 4
    return tex
  }
  const map = make((x, y) => 0.92 + 0.08 * mottle(x, y) - 0.065 * fibre[y * N + x] + (rnd() - 0.5) * 0.03)
  const bump = make((x, y) => 0.5 + 0.28 * (mottle(x, y) - 0.5) + 0.36 * fibre[y * N + x] + (rnd() - 0.5) * 0.09)
  return { map, bump }
}

function getGl(canvas: HTMLCanvasElement, low: boolean): Gl {
  if (gl) return gl
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: !low, powerPreference: 'high-performance' })
  renderer.setClearColor(0x000000, 0)
  renderer.shadowMap.enabled = !low
  renderer.shadowMap.type = PCFShadowMap
  const scene = new Scene()
  const camera = new PerspectiveCamera(30, 1, 1, 100000)
  scene.add(new AmbientLight(0xffffff, 1.0))
  const key = new DirectionalLight(0xffffff, 1.95)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.bias = -0.0008
  key.shadow.radius = 6
  scene.add(key, key.target)
  const fill = new DirectionalLight(0xffffff, 0.5)
  fill.position.set(1, -1, 2)
  scene.add(fill)
  const tex = paperTextures()
  const paper = new MeshStandardMaterial({
    roughness: 0.96,
    metalness: 0,
    side: DoubleSide,
    map: tex.map,
    bumpMap: low ? null : tex.bump,
    bumpScale: 0.7,
    vertexColors: true,
  })
  // The same paper, so where the strip overlaps the sheet it is invisible; only
  // the alpha map's ragged boundary and strands show. Vertex colour lifts the
  // strands towards white, like exposed pulp.
  const fibre = paper.clone()
  fibre.alphaMap = fringeTexture()
  fibre.alphaMap.channel = 1
  fibre.transparent = true
  fibre.depthWrite = false
  fibre.polygonOffset = true
  fibre.polygonOffsetFactor = -2
  const catcher = new Mesh(new PlaneGeometry(1, 1), new ShadowMaterial({ opacity: 0.32 }))
  catcher.receiveShadow = true
  if (!low) scene.add(catcher)
  gl = { renderer, scene, camera, key, catcher, paper, fibre, low }
  return gl
}

/** The background behind the middle of the screen: the nearest painted ancestor of whatever is there. */
function pageColour(w: number, h: number): string | null {
  const clear = (c: string) => !c || c === 'transparent' || /^rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0\)$/.test(c)
  let el: Element | null = document.elementFromPoint(w / 2, h / 2)
  while (el) {
    const bg = getComputedStyle(el).backgroundColor
    if (!clear(bg)) return bg
    el = el.parentElement
  }
  for (const e of [document.body, document.documentElement]) {
    const bg = getComputedStyle(e).backgroundColor
    if (!clear(bg)) return bg
  }
  return null
}

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

function rng(seed: number) {
  let a = seed || 1
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Measured fresh at the start of every leave, so a resized window never gets a stale sheet. */
function prepare(overlay: HTMLDivElement, o: TearOptions, seed: string, previous: Rig | null): Rig | null {
  const canvas = overlay.querySelector('canvas')
  if (!canvas) return null
  let g: Gl
  try {
    g = getGl(canvas, lowQuality(o))
  } catch {
    return null
  }
  if (previous) discard(g, previous)

  const w = canvas.clientWidth
  const h = canvas.clientHeight
  g.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, g.low ? 1 : 2))
  g.renderer.setSize(w, h, false)
  // The camera sits so that the z = 0 plane maps 1:1 onto the viewport.
  const cam = g.camera
  cam.aspect = w / h
  cam.position.set(0, 0, h / 2 / Math.tan((cam.fov * Math.PI) / 360))
  cam.lookAt(0, 0, 0)
  cam.updateProjectionMatrix()
  const big = Math.max(w, h)
  g.key.position.set(-0.55 * w, 0.75 * h, 0.9 * big)
  g.key.target.position.set(0, 0, 0)
  const sc = g.key.shadow.camera
  sc.left = -0.8 * w
  sc.right = 0.8 * w
  sc.top = 0.8 * h
  sc.bottom = -0.8 * h
  sc.near = 1
  sc.far = 4 * big
  sc.updateProjectionMatrix()
  g.catcher.scale.set(w * 2, h * 2, 1)
  g.catcher.position.set(0, 0, -1)

  const host = overlay.firstElementChild as Element
  const style = getComputedStyle(host)
  let colour = style.getPropertyValue('--tear-paper').trim() || '#f1ede4'
  if (o.paper === 'page') colour = pageColour(w, h) ?? colour
  g.paper.color.set(colour)
  g.fibre.color.set(colour)

  const cols = Math.max(8, Math.round(g.low ? Math.min(o.cols, 20) : o.cols))
  const sheetW = w * (1 + 2 * BLEED)
  const sheetH = h * (1 + BLEED_TOP + BLEED_BOTTOM)
  const cellW = sheetW / cols
  const rows = Math.max(10, Math.round(sheetH / cellW))
  const cellH = sheetH / rows
  const x0 = -BLEED * w
  const y0 = -BLEED_TOP * h

  // The seam: a column per particle row, wandering at most one cell per row.
  const rand = rng(hash(seed))
  // How this particular tear behaves: which side lets go first, how hard each
  // is pulled, and which way the wind is blowing as the pieces come down.
  const first = rand() < 0.5 ? 0 : 1
  const pull: [number, number] = [0.7 + rand() * 0.7, 0.7 + rand() * 0.7]
  const release: [number, number] = [0, 0]
  release[1 - first] = 0.04 + rand() * 0.1
  const gust = (rand() < 0.5 ? -1 : 1) * (0.15 + rand() * 0.45)
  // Where the tear hesitates: two or three catches on the way down, then a rip to catch up.
  const holds: { at: number; len: number }[] = []
  for (let a = 0.12 + rand() * 0.2; a < 0.85 && holds.length < 3; a += 0.18 + rand() * 0.22) {
    holds.push({ at: a, len: 0.035 + rand() * 0.045 })
  }
  // The seam starts above where the pointer went down and leans towards that
  // point on its way, so the tear feels caused rather than played.
  const clickCol = Math.round((Math.min(0.85, Math.max(0.15, pointer.x)) * w - x0) / cellW)
  const clickRow = Math.round((Math.min(0.9, Math.max(0.1, pointer.y)) * h - y0) / cellH)
  const v: number[] = []
  let c = clickCol + Math.round((rand() - 0.5) * 2)
  for (let r = 0; r <= rows; r++) {
    if (r > 0 && rand() < o.jag) {
      if (r <= clickRow && c !== clickCol && rand() < 0.65) c += Math.sign(clickCol - c)
      else c += rand() < 0.5 ? -1 : 1
    }
    c = Math.max(2, Math.min(cols - 2, c))
    v.push(c)
  }

  const idx = (cc: number, r: number) => r * (cols + 1) + cc
  const cloth = (side: -1 | 1): Cloth => {
    const ps: Particle[] = []
    for (let r = 0; r <= rows; r++) {
      for (let cc = 0; cc <= cols; cc++) {
        const on = side < 0 ? cc <= v[r] : cc >= v[r]
        const x = x0 + cc * cellW
        const y = y0 + r * cellH
        ps.push({ x, y, z: 0, px: x, py: y, pz: 0, rx: x, ry: y, pinned: r === 0, on, r })
      }
    }
    const links: Link[] = []
    const join = (a: Particle, b: Particle, k: number, bend = false) => {
      if (!a.on || !b.on) return
      links.push({ a, b, rest: Math.hypot(a.x - b.x, a.y - b.y), k, alive: true, bend })
    }
    const bend = 0.3 + 0.7 * o.stiffness
    for (let r = 0; r <= rows; r++) {
      for (let cc = 0; cc <= cols; cc++) {
        const p = ps[idx(cc, r)]
        if (!p.on) continue
        if (cc < cols) join(p, ps[idx(cc + 1, r)], 1)
        if (r < rows) join(p, ps[idx(cc, r + 1)], 1)
        if (cc < cols && r < rows) join(p, ps[idx(cc + 1, r + 1)], 0.85)
        if (cc < cols && r > 0) join(p, ps[idx(cc + 1, r - 1)], 0.85)
        if (cc + 2 <= cols) join(p, ps[idx(cc + 2, r)], bend, true)
        if (r + 2 <= rows) join(p, ps[idx(cc, r + 2)], bend, true)
        // Longer reach, so a compression buckles into a broad fold rather than a ripple per cell.
        if (cc + 3 <= cols) join(p, ps[idx(cc + 3, r)], bend * 0.6, true)
        if (r + 3 <= rows) join(p, ps[idx(cc, r + 3)], bend * 0.6, true)
      }
    }
    const cells: Cell[] = []
    for (let r = 0; r < rows; r++) {
      for (let cc = 0; cc < cols; cc++) {
        const pts = [ps[idx(cc, r)], ps[idx(cc + 1, r)], ps[idx(cc + 1, r + 1)], ps[idx(cc, r + 1)]].filter((p) => p.on)
        if (pts.length >= 3) cells.push({ pts, parity: (cc + r) & 1 })
      }
    }
    const quint: number[] = []
    for (let r = 1; r < rows; r++) {
      for (let cc = 1; cc < cols; cc++) {
        const i = idx(cc, r)
        const n = [idx(cc - 1, r), idx(cc + 1, r), idx(cc, r - 1), idx(cc, r + 1)]
        if (ps[i].on && n.every((k) => ps[k].on)) quint.push(i, ...n)
      }
    }
    return {
      side,
      ps,
      links,
      cells,
      pins: ps.filter((p) => p.on && p.pinned),
      seam: v.map((cc, r) => ps[idx(cc, r)]),
      smooth: Int32Array.from(quint),
    }
  }

  const left = cloth(-1)
  const right = cloth(1)
  const seamLinks: Link[] = left.seam.map((a, r) => ({ a, b: right.seam[r], rest: 0, k: 1, alive: true, bend: false }))

  const view = (cl: Cloth): View => {
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(new Float32Array(cl.ps.length * 3), 3))
    const uv = new Float32Array(cl.ps.length * 2)
    cl.ps.forEach((p, i) => {
      uv[2 * i] = (p.rx - x0) / sheetW
      uv[2 * i + 1] = 1 - (p.ry - y0) / sheetH
    })
    geo.setAttribute('uv', new BufferAttribute(uv, 2))
    const col = new Float32Array(cl.ps.length * 3).fill(1)
    geo.setAttribute('color', new BufferAttribute(col, 3))
    const index: number[] = []
    const at = (p: Particle) => cl.ps.indexOf(p)
    for (const cell of cl.cells) {
      const q = cell.pts.map(at)
      // Reversed against screen order, so the face points at the camera once y is
      // flipped. Quads alternate which diagonal they split on, checkerboard
      // fashion; one diagonal everywhere shades folds as a sawtooth.
      if (q.length === 3) index.push(q[0], q[2], q[1])
      else if (cell.parity) index.push(q[0], q[3], q[1], q[1], q[3], q[2])
      else index.push(q[0], q[2], q[1], q[0], q[3], q[2])
    }
    geo.setIndex(index)
    const mesh = new Mesh(geo, g.paper)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.frustumCulled = false
    g.scene.add(mesh)

    // The fringe: a strip along the seam, two vertices per row, that is drawn
    // only where the seam has torn. Its outer edge hangs out into the gap.
    let fringe: Mesh | null = null
    let fringeGeo: BufferGeometry | null = null
    {
      const n = rows + 1
      fringeGeo = new BufferGeometry()
      fringeGeo.setAttribute('position', new BufferAttribute(new Float32Array(n * 2 * 3), 3))
      fringeGeo.setAttribute('normal', new BufferAttribute(new Float32Array(n * 2 * 3), 3))
      // The paper texture continues across the strip; the alpha map runs along it.
      const fuv = new Float32Array(n * 2 * 2)
      const fcol = new Float32Array(n * 2 * 3)
      const inset = 0.6 * FRINGE
      for (let r = 0; r < n; r++) {
        const sp = cl.seam[r]
        const ux = (sp.rx - x0) / sheetW
        const uy = 1 - (sp.ry - y0) / sheetH
        const du = (cl.side * inset) / sheetW
        fuv[4 * r] = ux - du
        fuv[4 * r + 1] = uy
        fuv[4 * r + 2] = ux + (cl.side * FRINGE) / sheetW
        fuv[4 * r + 3] = uy
        fcol[6 * r] = fcol[6 * r + 1] = fcol[6 * r + 2] = 1
        fcol[6 * r + 3] = fcol[6 * r + 4] = fcol[6 * r + 5] = 1.12
      }
      fringeGeo.setAttribute('uv', new BufferAttribute(fuv, 2))
      fringeGeo.setAttribute('color', new BufferAttribute(fcol, 3))
      // The alpha map's own coordinates: along the seam and across the strip.
      const fuv2 = new Float32Array(n * 2 * 2)
      for (let r = 0; r < n; r++) {
        const u = (r * cellH) / 700
        fuv2[4 * r] = u
        fuv2[4 * r + 1] = 0
        fuv2[4 * r + 2] = u
        fuv2[4 * r + 3] = 1
      }
      fringeGeo.setAttribute('uv1', new BufferAttribute(fuv2, 2))
      const fi: number[] = []
      for (let r = 0; r < rows; r++) {
        const a = 2 * r, b = 2 * r + 1, c2 = 2 * r + 2, d = 2 * r + 3
        fi.push(a, b, d, a, d, c2)
      }
      fringeGeo.setIndex(fi)
      fringeGeo.setDrawRange(0, 0)
      fringe = new Mesh(fringeGeo, g.fibre)
      fringe.frustumCulled = false
      fringe.renderOrder = 1
      // No shadows on the strip: the sheet's own shadow would land on it as a dark hairline.
      fringe.receiveShadow = false
      g.scene.add(fringe)
    }
    return { mesh, geo, fringe, fringeGeo }
  }

  const seamL = Int32Array.from(v.map((cc, r) => idx(cc, r)))
  const seamR = Int32Array.from(v.map((cc, r) => idx(cc, r)))
  const seamLn = Int32Array.from(v.map((cc, r) => idx(cc - 1, r)))
  const seamRn = Int32Array.from(v.map((cc, r) => idx(cc + 1, r)))

  return {
    w, h, sheetH, rows, cloths: [left, right], seamLinks, torn: 0, views: [view(left), view(right)],
    seamL, seamR, seamLn, seamRn, pull, release, gust, holds,
  }
}

function discard(g: Gl, r: Rig) {
  for (const v of r.views) {
    g.scene.remove(v.mesh)
    v.geo.dispose()
    if (v.fringe) g.scene.remove(v.fringe)
    v.fringeGeo?.dispose()
  }
}

function step(rig: Rig, o: TearOptions, time: number, gScale = 1, wall = WALL) {
  const g = o.gravity * rig.h * gScale
  const zMax = 0.3 * rig.w
  // The gust only matters once the sheet is torn and coming down.
  const gustX = rig.torn > 0 ? rig.gust * g : 0
  const kx = 7 / rig.w
  for (const cl of rig.cloths) {
    for (const p of cl.ps) {
      if (!p.on || p.pinned) continue
      const vx = (p.x - p.px) * DAMP
      const vy = (p.y - p.py) * DAMP
      const vz = (p.z - p.pz) * DAMP
      const speed = vy / STEP
      // Air is not still: a slow wave across the sheet and down it, scaled by how
      // fast it is falling, so a dropping sheet flutters rather than sinking flat.
      const flutter = Math.sin(p.x * kx + time * 9) * Math.cos(p.y * kx * 0.6 - time * 5)
      const az = LIFT * speed * (1 + 0.6 * flutter) - wall * p.z
      const ax = gustX + 0.12 * Math.abs(speed) * flutter
      p.px = p.x
      p.py = p.y
      p.pz = p.z
      p.x += vx + ax * STEP * STEP
      p.y += vy + g * STEP * STEP
      p.z += vz + az * STEP * STEP
    }
  }
  for (let i = 0; i < ITER; i++) {
    for (const cl of rig.cloths) solve(cl.links)
    solve(rig.seamLinks)
  }
  // Creases stay. Once the sheet is being torn, a bend link found shorter than
  // its rest length — the sign of a fold across it — lets its rest length creep
  // down towards what it is, so the fold does not spring back out.
  if (rig.torn > 0) {
    for (const cl of rig.cloths) {
      for (const l of cl.links) {
        if (!l.bend) continue
        const d = Math.hypot(l.b.x - l.a.x, l.b.y - l.a.y, l.b.z - l.a.z)
        if (d < l.rest) l.rest += (d - l.rest) * PLASTIC
      }
    }
  }
  for (const cl of rig.cloths) {
    for (const p of cl.ps) {
      if (!p.on || p.pinned) continue
      if (p.z < 0) {
        // Against the page: cannot pass behind it, and it drags a little.
        p.z = 0
        p.pz = 0
        p.px = p.x - (p.x - p.px) * 0.97
        p.py = p.y - (p.y - p.py) * 0.97
      } else if (p.z > zMax) {
        p.z = zMax
      }
    }
  }
}

function solve(links: Link[]) {
  for (const l of links) {
    if (!l.alive) continue
    const { a, b } = l
    const dx = b.x - a.x
    const dy = b.y - a.y
    const dz = b.z - a.z
    const d = Math.hypot(dx, dy, dz)
    if (d === 0) continue
    const diff = ((d - l.rest) / d) * l.k
    if (a.pinned && b.pinned) continue
    const wa = a.pinned ? 0 : b.pinned ? 1 : 0.5
    const wb = 1 - wa
    a.x += dx * diff * wa
    a.y += dy * diff * wa
    a.z += dz * diff * wa
    b.x -= dx * diff * wb
    b.y -= dy * diff * wb
    b.z -= dz * diff * wb
  }
}

/** Kinematic pins: the hands. Every pinned particle sits at its rest position plus an offset. */
function pin(rig: Rig, dx: number, dy: number, dz: number, perSide = false) {
  rig.cloths.forEach((cl, i) => {
    const sx = perSide ? cl.side * dx * rig.pull[i] : dx
    for (const p of cl.pins) {
      if (!p.pinned) continue
      p.px = p.x
      p.py = p.y
      p.pz = p.z
      p.x = p.rx + sx
      p.y = p.ry + dy
      p.z = dz
    }
  })
}

/**
 * Pushes particle positions into the meshes and renders a frame. Interior
 * vertices are drawn at a blend of their own position and their neighbours',
 * which keeps the broad folds and takes the cell-scale zigzag out of the
 * shading. The simulation itself is untouched.
 */
function draw(rig: Rig) {
  if (!gl) return
  const { w, h } = rig
  const cx = w / 2
  const cy = h / 2
  rig.cloths.forEach((cl, i) => {
    const v = rig.views[i]
    const pos = v.geo.attributes.position as BufferAttribute
    const arr = pos.array as Float32Array
    const ps = cl.ps
    for (let j = 0; j < ps.length; j++) {
      const p = ps[j]
      arr[3 * j] = p.x - cx
      arr[3 * j + 1] = cy - p.y
      arr[3 * j + 2] = p.z
    }
    const colAttr = v.geo.attributes.color as BufferAttribute
    const col = colAttr.array as Float32Array
    const q = cl.smooth
    const creaseScale = 1 / (0.05 * rig.w)
    for (let k = 0; k < q.length; k += 5) {
      const p = ps[q[k]]
      const a = ps[q[k + 1]], b = ps[q[k + 2]], c = ps[q[k + 3]], d = ps[q[k + 4]]
      const j = q[k]
      const mx = 0.25 * (a.x + b.x + c.x + d.x)
      const my = 0.25 * (a.y + b.y + c.y + d.y)
      const mz = 0.25 * (a.z + b.z + c.z + d.z)
      arr[3 * j] = 0.5 * (p.x + mx) - cx
      arr[3 * j + 1] = cy - 0.5 * (p.y + my)
      arr[3 * j + 2] = 0.5 * (p.z + mz)
      // Where the sheet bends hard the pulp is compressed and catches less light: a crease.
      const bendAmt = Math.hypot(p.x - mx, p.y - my, p.z - mz) * creaseScale
      const shade = 1 - Math.min(0.28, bendAmt * bendAmt * 2.5)
      col[3 * j] = shade
      col[3 * j + 1] = shade
      col[3 * j + 2] = shade
    }
    pos.needsUpdate = true
    colAttr.needsUpdate = true
  })

  // While a seam row is still joined the two halves are one sheet, and must be
  // drawn as one: the duplicate vertices get one smoothed position, and after
  // the normals are computed per mesh, one shared normal. Without this the
  // seam shows as a ridge in the paper before it has torn.
  const [L, R] = rig.cloths
  const pl = rig.views[0].geo.attributes.position.array as Float32Array
  const pr = rig.views[1].geo.attributes.position.array as Float32Array
  const rows = rig.seamL.length
  // The pinned top row and the free bottom row are not smoothed, so their seam vertex is left alone too.
  for (let r = 1; r < rows - 1; r++) {
    if (!rig.seamLinks[r].alive) continue
    const a = L.ps[rig.seamL[r]], b = R.ps[rig.seamR[r]]
    const ln = L.ps[rig.seamLn[r]], rn = R.ps[rig.seamRn[r]]
    const up = r > 0 ? L.seam[r - 1] : a
    const dn = r < rows - 1 ? L.seam[r + 1] : a
    const px = 0.5 * (a.x + b.x), py = 0.5 * (a.y + b.y), pz = 0.5 * (a.z + b.z)
    const mx = 0.25 * (ln.x + rn.x + up.x + dn.x)
    const my = 0.25 * (ln.y + rn.y + up.y + dn.y)
    const mz = 0.25 * (ln.z + rn.z + up.z + dn.z)
    const x = 0.5 * (px + mx) - cx, y = cy - 0.5 * (py + my), z = 0.5 * (pz + mz)
    const i = 3 * rig.seamL[r], j = 3 * rig.seamR[r]
    pl[i] = x; pl[i + 1] = y; pl[i + 2] = z
    pr[j] = x; pr[j + 1] = y; pr[j + 2] = z
  }
  for (const v of rig.views) v.geo.computeVertexNormals()
  const nl = rig.views[0].geo.attributes.normal as BufferAttribute
  const nr = rig.views[1].geo.attributes.normal as BufferAttribute
  const nla = nl.array as Float32Array, nra = nr.array as Float32Array
  for (let r = 0; r < rows; r++) {
    if (!rig.seamLinks[r].alive) continue
    const i = 3 * rig.seamL[r], j = 3 * rig.seamR[r]
    let x = nla[i] + nra[j], y = nla[i + 1] + nra[j + 1], z = nla[i + 2] + nra[j + 2]
    const l = Math.hypot(x, y, z) || 1
    x /= l; y /= l; z /= l
    nla[i] = x; nla[i + 1] = y; nla[i + 2] = z
    nra[j] = x; nra[j + 1] = y; nra[j + 2] = z
  }
  nl.needsUpdate = true
  nr.needsUpdate = true

  // The fringe follows the torn part of each edge, hanging out into the gap
  // along the direction from the sheet's interior to its edge.
  if (rig.torn > 0) {
    const torn = Math.min(rows, Math.ceil(rig.torn) + 1)
    rig.cloths.forEach((cl, i) => {
      const v = rig.views[i]
      if (!v.fringeGeo) return
      const fp = v.fringeGeo.attributes.position as BufferAttribute
      const fa = fp.array as Float32Array
      const seamIdx = i === 0 ? rig.seamL : rig.seamR
      const nbrIdx = i === 0 ? rig.seamLn : rig.seamRn
      const fn = v.fringeGeo.attributes.normal as BufferAttribute
      const fna = fn.array as Float32Array
      const sheetN = (i === 0 ? nl : nr).array as Float32Array
      const inset = 0.6 * FRINGE
      for (let r = 0; r < torn; r++) {
        const p = cl.ps[seamIdx[r]]
        const n = cl.ps[nbrIdx[r]]
        let ox = p.x - n.x, oy = p.y - n.y, oz = p.z - n.z
        const l = Math.hypot(ox, oy, oz) || 1
        ox /= l
        oy /= l
        oz /= l
        const k = 6 * r
        // Inner vertex a little inside the sheet, outer out in the gap.
        fa[k] = p.x - ox * inset - cx
        fa[k + 1] = cy - (p.y - oy * inset)
        fa[k + 2] = p.z - oz * inset + 0.4
        fa[k + 3] = p.x + ox * FRINGE - cx
        fa[k + 4] = cy - (p.y + oy * FRINGE)
        fa[k + 5] = p.z + oz * FRINGE + 0.4
        const si = 3 * seamIdx[r]
        fna[k] = fna[k + 3] = sheetN[si]
        fna[k + 1] = fna[k + 4] = sheetN[si + 1]
        fna[k + 2] = fna[k + 5] = sheetN[si + 2]
      }
      fp.needsUpdate = true
      fn.needsUpdate = true
      v.fringeGeo.setDrawRange(0, Math.max(0, torn - 1) * 6)
    })
  }
  gl.renderer.render(gl.scene, gl.camera)
}

/**
 * Runs a phase on GSAP's ticker: fixed physics steps, one draw per frame, and
 * `phase(t)` decides when it is over. Returns the cleanup the core expects.
 */
function run(
  rig: Rig,
  o: TearOptions,
  before: (t: number) => number | void,
  isDone: (t: number) => boolean,
  done: () => void,
  wallAt: (t: number) => number = () => WALL,
) {
  let t = 0
  let acc = 0
  const tick = (_time: number, deltaMs: number) => {
    const dt = Math.min(deltaMs / 1000, 0.05) * o.speed
    t += dt
    acc += dt
    let n = 0
    while (acc >= STEP && n < 6) {
      const gScale = before(t - acc) || 1
      step(rig, o, t - acc, gScale, wallAt(t - acc))
      acc -= STEP
      n++
    }
    draw(rig)
    if (isDone(t)) {
      gsap.ticker.remove(tick)
      done()
    }
  }
  gsap.ticker.add(tick)
  return () => gsap.ticker.remove(tick)
}

const easeIn = (x: number) => x * x

/** The overlay is mounted once and there is never more than one navigation in flight. */
let rig: Rig | null = null

export const TearTransition = createTransition<TearOptions>({
  timeout: 6000,
  defaults: DEFAULTS,

  overlay: (o) => (
    <div className={`tear ${o.paper === 'custom' || o.paper === 'page' ? '' : `tear-${o.paper}`}`}>
      <canvas aria-hidden />
    </div>
  ),

  setup: (overlay, options) => {
    document.addEventListener(
      'pointerdown',
      (e) => {
        pointer = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight }
      },
      { capture: true, passive: true },
    )
    // Make the WebGL context while the page is idle, so the first navigation does not pay for it.
    const canvas = overlay.querySelector('canvas')
    if (!canvas) return
    const make = () => {
      try {
        getGl(canvas, lowQuality(options))
      } catch {
        /* no WebGL: prepare() will bail and the navigation goes through plainly */
      }
    }
    if ('requestIdleCallback' in window) window.requestIdleCallback(make)
    else setTimeout(make, 0)
  },

  leave: ({ overlay, options: o, done }) => {
    rig = prepare(overlay, o, String(Math.random()), rig)
    if (!rig) {
      done()
      return
    }
    const r = rig
    // Start with the sheet's bottom edge just above the frame, hanging from the
    // pins, so the first frame of the drop already shows it arriving.
    const lift = r.sheetH - BLEED_TOP * r.h + 4
    for (const cl of r.cloths) for (const p of cl.ps) { p.y -= lift; p.py = p.y }

    // Free fall from rest, stopped dead at the mark. The cloth below carries on
    // for a moment and is caught by its own constraints, which is the landing.
    const g = DROP_G * r.h
    const tHit = Math.sqrt((2 * lift) / g)
    return run(
      r,
      o,
      (t) => {
        const fallen = Math.min(lift, 0.5 * g * t * t)
        pin(r, 0, fallen - lift, 0)
      },
      (t) => t >= tHit + SETTLE,
      done,
      // In the air the sheet is free to billow; once the pins stop it is pressed flat.
      (t) => (t < tHit ? 1.5 : WALL),
    )
  },

  enter: ({ overlay, options: o, done }) => {
    rig ??= prepare(overlay, o, String(Math.random()), null)
    if (!rig) {
      done()
      return
    }
    const r = rig
    const released = [false, false]
    const tearEnd = HOLD + o.duration

    return run(
      r,
      o,
      (t) => {
        if (t < HOLD) return
        const u = Math.min(1, (t - HOLD) / o.duration)
        // The front accelerates, catching two or three times on the way and
        // ripping ahead after each catch. Every link, the bottom one included,
        // is cut by the time it arrives.
        let f = easeIn(u)
        for (const hd of r.holds) if (f > hd.at && f < hd.at + hd.len) f = hd.at
        const front = u >= 1 ? r.seamLinks.length : r.seamLinks.length * f
        // Cut the seam down to the front, and flick the freed edges toward the viewer.
        for (let i = r.torn | 0; i < front && i < r.seamLinks.length; i++) {
          const l = r.seamLinks[i]
          if (!l.alive) continue
          l.alive = false
          l.a.pz = l.a.z - 320 * STEP
          l.b.pz = l.b.z - 320 * STEP
          l.a.px = l.a.x + 90 * STEP
          l.b.px = l.b.x - 90 * STEP
        }
        r.torn = Math.max(r.torn, front)

        if (!released[0] || !released[1]) {
          // The hands pull apart while the tear runs, then hold still and let go.
          const since = Math.min(t, tearEnd) - HOLD
          const dx = o.pull * r.w * since
          const dz = Math.min(0.12 * r.w, 0.35 * r.w * since)
          pin(r, dx, 0, dz, true)
          r.cloths.forEach((cl, i) => {
            if (released[i] || t < tearEnd + 0.02 + r.release[i]) return
            // This hand lets go. Carry the pull's velocity into the freed particles.
            released[i] = true
            for (const p of cl.pins) {
              p.pinned = false
              p.px = p.x - cl.side * o.pull * r.pull[i] * r.w * STEP
            }
          })
        }
        // A piece that is still hanging about well into the fall gets pulled
        // down harder, so nothing is ever cut off mid-air by the cap.
        const falling = t - tearEnd - FALL_RAMP
        return falling > 0 ? 1 + falling * 4 : 1
      },
      (t) => {
        if (t < tearEnd) return false
        if (t > tearEnd + FALL_CAP) return true
        // Over once every particle is below the frame or off its side. Perspective
        // only ever pushes things further out, so the flat positions are a safe test.
        for (const cl of r.cloths) {
          for (const p of cl.ps) {
            if (p.on && p.y < r.h + 8 && p.x > -8 && p.x < r.w + 8) return false
          }
        }
        return true
      },
      () => {
        if (gl) {
          discard(gl, r)
          gl.renderer.clear()
        }
        rig = null
        done()
      },
    )
  },
})
