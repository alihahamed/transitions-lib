'use client'

import gsap from 'gsap'
import {
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  DirectionalLight,
  DoubleSide,
  HemisphereLight,
  NeutralToneMapping,
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
 * a lit, smooth-shaded mesh with a paper-grain bump and a soft shadow cast
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
  /** Paper colour. "custom" applies no preset, leaving --tear-paper and --tear-fibre to you. */
  paper: 'chalk' | 'kraft' | 'newsprint' | 'custom'
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
}

/** Fixed simulation step. The draw runs at the display rate; the physics does not. */
const STEP = 1 / 120
const DAMP = 0.985
const ITER = 6
/** Air lift: how hard falling paper is pushed off the wall, per unit of downward speed. */
const LIFT = 0.9
/** Pull back towards the page, per unit of distance from it, so a lifted sheet settles flat again. */
const WALL = 14
const BLEED = 0.03
/** The sheet runs on past the bottom, so a curled lower edge never uncovers the page. */
const BLEED_BOTTOM = 0.16
const DROP = 0.42
const SETTLE = 0.33
const HOLD = 0.06
/** After this long in free fall gravity ramps up to clear stragglers; the phase ends at FALL_CAP regardless. */
const FALL_RAMP = 0.9
const FALL_CAP = 3

type Particle = {
  x: number; y: number; z: number
  px: number; py: number; pz: number
  rx: number; ry: number
  pinned: boolean
  on: boolean
  r: number
}
type Link = { a: Particle; b: Particle; rest: number; k: number; alive: boolean }
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

type View = { mesh: Mesh; geo: BufferGeometry }

type Rig = {
  w: number
  h: number
  sheetH: number
  rows: number
  cloths: [Cloth, Cloth]
  seamLinks: Link[]
  torn: number
  views: [View, View]
  /** Per-navigation character: pull strength per side, when each side lets go, and a sideways gust. */
  pull: [number, number]
  release: [number, number]
  gust: number
}

/** The renderer, lights and catcher plane. Made once, kept for the life of the page. */
type Gl = {
  renderer: WebGLRenderer
  scene: Scene
  camera: PerspectiveCamera
  key: DirectionalLight
  catcher: Mesh
  paper: MeshStandardMaterial
}
let gl: Gl | null = null

/**
 * Paper, as two layers of noise. A soft mottle at a large scale, the way pulp
 * dries unevenly, and a fine grain of short fibres on top. The colour map is
 * kept very close to white so the material colour decides the paper; the bump
 * map carries the same pattern with the fibres emphasised, for tooth.
 */
function paperTextures(): { map: CanvasTexture; bump: CanvasTexture; rough: CanvasTexture } {
  const N = 1024
  const rnd = rng(7)
  // Value noise on a lattice, bilinear and tiling, at a given cell count.
  const noise = (L: number) => {
    const lattice = new Float32Array(L * L)
    for (let i = 0; i < lattice.length; i++) lattice[i] = rnd()
    return (x: number, y: number) => {
      const fx = (x / N) * L, fy = (y / N) * L
      const ix = Math.floor(fx), iy = Math.floor(fy)
      const tx = fx - ix, ty = fy - iy
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty)
      const at = (a: number, b: number) => lattice[(b % L) * L + (a % L)]
      const top = at(ix, iy) * (1 - sx) + at(ix + 1, iy) * sx
      const bot = at(ix, iy + 1) * (1 - sx) + at(ix + 1, iy + 1) * sx
      return top * (1 - sy) + bot * sy
    }
  }
  const coarse = noise(8)
  const mid = noise(32)
  const fine = noise(128)
  // Three octaves: the pulp's uneven drying, the sheet's cloudiness, and the
  // tooth. Evaluated once into a table; three maps read from it.
  const table = new Float32Array(N * N)
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) table[y * N + x] = 0.5 * coarse(x, y) + 0.3 * mid(x, y) + 0.2 * fine(x, y)
  const mottle = (x: number, y: number) => table[y * N + x]
  const fibre = new Float32Array(N * N)
  // Short fibres: many faint strokes at random angles, mostly along the grain.
  for (let k = 0; k < 42000; k++) {
    const x0 = rnd() * N, y0 = rnd() * N
    const ang = (rnd() - 0.5) * 1.4 + (rnd() < 0.5 ? 0 : Math.PI)
    const len = 6 + rnd() * 22
    const str = 0.25 + rnd() * 0.5
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
    tex.repeat.set(1.6, 1.6)
    tex.anisotropy = 8
    return tex
  }
  const map = make((x, y) => 0.9 + 0.1 * mottle(x, y) - 0.07 * fibre[y * N + x] + (rnd() - 0.5) * 0.03)
  const bump = make((x, y) => 0.5 + 0.3 * (mottle(x, y) - 0.5) + 0.45 * fibre[y * N + x] + (rnd() - 0.5) * 0.1)
  // Slightly glossier where the pulp is dense, matte on the fibres: a hint of sheen that moves with the folds.
  const rough = make((x, y) => 0.86 + 0.1 * (1 - mottle(x, y)) + 0.04 * fibre[y * N + x])
  return { map, bump, rough }
}

function getGl(canvas: HTMLCanvasElement): Gl {
  if (gl) return gl
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' })
  renderer.setClearColor(0x000000, 0)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFShadowMap
  renderer.toneMapping = NeutralToneMapping
  renderer.toneMappingExposure = 0.92
  const scene = new Scene()
  const camera = new PerspectiveCamera(30, 1, 1, 100000)
  // Daylight through a window: a warm key from the upper left, cool sky above, a
  // touch of bounce from below, and a soft fill from the other side.
  scene.add(new AmbientLight(0xffffff, 0.22))
  scene.add(new HemisphereLight(0xe6edff, 0xcfc6b8, 0.65))
  const key = new DirectionalLight(0xfff7ee, 2.0)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.bias = -0.0006
  key.shadow.normalBias = 2
  key.shadow.radius = 8
  scene.add(key, key.target)
  const fill = new DirectionalLight(0xdde6ff, 0.45)
  fill.position.set(1, -0.6, 1.5)
  scene.add(fill)
  const tex = paperTextures()
  const paper = new MeshStandardMaterial({
    roughness: 1,
    metalness: 0,
    side: DoubleSide,
    map: tex.map,
    bumpMap: tex.bump,
    bumpScale: 1.1,
    roughnessMap: tex.rough,
    vertexColors: true,
  })
  const catcher = new Mesh(new PlaneGeometry(1, 1), new ShadowMaterial({ opacity: 0.32 }))
  catcher.receiveShadow = true
  scene.add(catcher)
  gl = { renderer, scene, camera, key, catcher, paper }
  return gl
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
    g = getGl(canvas)
  } catch {
    return null
  }
  if (previous) discard(g, previous)

  const w = canvas.clientWidth
  const h = canvas.clientHeight
  g.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  g.renderer.setSize(w, h, false)
  // The camera sits so that the z = 0 plane maps 1:1 onto the viewport.
  const cam = g.camera
  cam.aspect = w / h
  cam.position.set(0, 0, h / 2 / Math.tan((cam.fov * Math.PI) / 360))
  cam.lookAt(0, 0, 0)
  cam.updateProjectionMatrix()
  const big = Math.max(w, h)
  g.key.position.set(-0.45 * w, 0.7 * h, 1.3 * big)
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
  g.paper.color.set(style.getPropertyValue('--tear-paper').trim() || '#f1ede4')

  const cols = Math.max(8, Math.round(o.cols))
  const sheetW = w * (1 + 2 * BLEED)
  const sheetH = h * (1 + BLEED + BLEED_BOTTOM)
  const cellW = sheetW / cols
  const rows = Math.max(10, Math.round(sheetH / cellW))
  const cellH = sheetH / rows
  const x0 = -BLEED * w
  const y0 = -BLEED * h

  // The seam: a column per particle row, wandering at most one cell per row.
  const rand = rng(hash(seed))
  // How this particular tear behaves: which side lets go first, how hard each
  // is pulled, and which way the wind is blowing as the pieces come down.
  const first = rand() < 0.5 ? 0 : 1
  const pull: [number, number] = [0.7 + rand() * 0.7, 0.7 + rand() * 0.7]
  const release: [number, number] = [0, 0]
  release[1 - first] = 0.06 + rand() * 0.16
  const gust = (rand() < 0.5 ? -1 : 1) * (0.15 + rand() * 0.45)
  const v: number[] = []
  let c = Math.round(cols / 2 + (rand() - 0.5) * cols * 0.3)
  for (let r = 0; r <= rows; r++) {
    if (r > 0 && rand() < o.jag) c += rand() < 0.5 ? -1 : 1
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
    const join = (a: Particle, b: Particle, k: number) => {
      if (!a.on || !b.on) return
      links.push({ a, b, rest: Math.hypot(a.x - b.x, a.y - b.y), k, alive: true })
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
        if (cc + 2 <= cols) join(p, ps[idx(cc + 2, r)], bend)
        if (r + 2 <= rows) join(p, ps[idx(cc, r + 2)], bend)
        // Longer reach, so a compression buckles into a broad fold rather than a ripple per cell.
        if (cc + 3 <= cols) join(p, ps[idx(cc + 3, r)], bend * 0.6)
        if (r + 3 <= rows) join(p, ps[idx(cc, r + 3)], bend * 0.6)
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
  const seamLinks: Link[] = left.seam.map((a, r) => ({ a, b: right.seam[r], rest: 0, k: 1, alive: true }))

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
    return { mesh, geo }
  }

  return { w, h, sheetH, rows, cloths: [left, right], seamLinks, torn: 0, views: [view(left), view(right)], pull, release, gust }
}

function discard(g: Gl, r: Rig) {
  for (const v of r.views) {
    g.scene.remove(v.mesh)
    v.geo.dispose()
  }
}

function step(rig: Rig, o: TearOptions, gScale = 1) {
  const g = o.gravity * rig.h * gScale
  const zMax = 0.3 * rig.w
  // The gust only matters once the sheet is torn and coming down.
  const ax = rig.torn > 0 ? rig.gust * g : 0
  for (const cl of rig.cloths) {
    for (const p of cl.ps) {
      if (!p.on || p.pinned) continue
      const vx = (p.x - p.px) * DAMP
      const vy = (p.y - p.py) * DAMP
      const vz = (p.z - p.pz) * DAMP
      const az = LIFT * (vy / STEP) - WALL * p.z
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
    v.geo.computeVertexNormals()
  })
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
      step(rig, o, gScale)
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

const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2)
const easeIn = (x: number) => x * x

/** The overlay is mounted once and there is never more than one navigation in flight. */
let rig: Rig | null = null

export const TearTransition = createTransition<TearOptions>({
  timeout: 6000,
  defaults: DEFAULTS,

  overlay: (o) => (
    <div className={`tear ${o.paper === 'custom' ? '' : `tear-${o.paper}`}`}>
      <canvas aria-hidden />
    </div>
  ),

  setup: (overlay) => {
    // Make the WebGL context while the page is idle, so the first navigation does not pay for it.
    const canvas = overlay.querySelector('canvas')
    if (!canvas) return
    const make = () => {
      try {
        getGl(canvas)
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
    // Start with the whole sheet above the frame, hanging from the pins.
    const lift = r.sheetH + 24
    for (const cl of r.cloths) for (const p of cl.ps) { p.y -= lift; p.py = p.y }

    return run(
      r,
      o,
      (t) => {
        const k = Math.min(1, t / DROP)
        pin(r, 0, -lift * (1 - easeInOut(k)), 0)
      },
      (t) => t >= DROP + SETTLE,
      done,
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
        // Every link, the bottom one included, is cut by the time the front arrives.
        const front = u >= 1 ? r.seamLinks.length : r.seamLinks.length * easeIn(u)
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
          const since = t - HOLD
          const dx = o.pull * r.w * since
          const dz = Math.min(0.12 * r.w, 0.35 * r.w * since)
          pin(r, dx, 0, dz, true)
          r.cloths.forEach((cl, i) => {
            if (released[i] || t < tearEnd + 0.05 + r.release[i]) return
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
