'use client'

import { useState, useRef } from 'react'
import gsap from 'gsap'
import { ZipperRig, DEFAULT_TUNING, type RigTuning } from '@/components/lab/zipper-rig'
import {
  zipLeave,
  zipEnter,
  zipDuration,
  DEFAULT_SEAL_HOLD,
  DEFAULT_UNZIP,
  DEFAULT_OVERSHOOT,
} from '@/components/lab/zipper-timeline'
import { PALETTE_NAMES, PALETTES, type PaletteName } from '@/components/lab/zipper-palettes'

const knobs: { key: keyof RigTuning; min: number; max: number; step: number; hint: string }[] = [
  { key: 'slide', min: 0, max: 130, step: 2, hint: 'how far each panel travels outward — the main move' },
  { key: 'angle', min: 0, max: 40, step: 1, hint: 'depth tilt; past ~15 the teeth foreshorten to slivers' },
  { key: 'bands', min: 1, max: 16, step: 1, hint: '1 = rigid board, more = floppier fabric' },
  { key: 'lag', min: 0, max: 0.1, step: 0.005, hint: 'how much the lower bands trail' },
  { key: 'fan', min: 0, max: 0.25, step: 0.01, hint: 'how much further the lower bands go' },
  { key: 'droop', min: 0, max: 20, step: 1, hint: 'outward tip from gravity' },
  { key: 'fall', min: 0, max: 80, step: 2, hint: 'vertical sag' },
  { key: 'shade', min: 0, max: 0.8, step: 0.05, hint: 'darkening as it turns from the light' },
]

export default function ZipperLab() {
  const [zip, setZip] = useState(1)
  const [swing, setSwing] = useState(0)
  const [t, setT] = useState<RigTuning>(DEFAULT_TUNING)
  const [speed, setSpeed] = useState(1)
  const [sealHold, setSealHold] = useState(DEFAULT_SEAL_HOLD)
  const [unzip, setUnzip] = useState(DEFAULT_UNZIP)
  const [overshoot, setOvershoot] = useState(DEFAULT_OVERSHOOT)
  const [palette, setPalette] = useState<PaletteName>('nickel')
  const tl = useRef<gsap.core.Timeline | null>(null)

  const run = (phase: 'leave' | 'enter' | 'cycle') => {
    tl.current?.kill()
    // leave starts from a page on screen; enter starts from a sealed one
    // a cycle begins where a leave does: page on screen, panels away
    const from = phase === 'enter' ? { zip: 1, swing: 0 } : { zip: 0, swing: 1 }
    const v = { ...from }
    setZip(v.zip)
    setSwing(v.swing)

    const sync = () => { setZip(v.zip); setSwing(v.swing) }

    if (phase === 'cycle') {
      const master = gsap.timeline()
      master.add(zipLeave(v, { speed, onUpdate: sync }))
      // no gap here — the enter timeline holds at the seal itself, so the real
      // transition gets the same beat the cycle does
      master.add(zipEnter(v, { speed, sealHold, unzip, overshoot, onUpdate: sync }))
      tl.current = master
    } else {
      tl.current = phase === 'leave'
        ? zipLeave(v, { speed, onUpdate: sync })
        : zipEnter(v, { speed, sealHold, unzip, overshoot, onUpdate: sync })
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Zipper — motion rig</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        The panels travel outward and part, with only a little tilt for depth — heavy
        rotateY foreshortens the teeth into unreadable slivers. Droop and sag carry the
        falling-sideways read instead.
      </p>

      <div className="mt-8 h-[520px] overflow-hidden rounded-xl border border-border">
        <ZipperRig
          zip={zip}
          swing={swing}
          tuning={t}
          palette={palette}
          behind={
            <div className="absolute inset-0 flex flex-col justify-center gap-4 bg-[#0e5c4a] px-12">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/50">
                the page underneath
              </p>
              <p className="max-w-md text-4xl font-semibold leading-tight tracking-tight text-white">
                This is what the panels are hiding.
              </p>
            </div>
          }
        />
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {([['zip', zip, setZip, '1 closed → 0 open'], ['swing', swing, setSwing, '0 shut → 1 fanned']] as const).map(
          ([label, val, set, hint]) => (
            <label key={label} className="block">
              <span className="font-mono text-xs text-muted-foreground">
                {label} · {(val as number).toFixed(2)} <span className="opacity-60">— {hint}</span>
              </span>
              <input
                type="range" min={0} max={1} step={0.01} value={val as number}
                onChange={(e) => (set as (n: number) => void)(+e.target.value)}
                className="mt-2 w-full"
              />
            </label>
          ),
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          onClick={() => run('leave')}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Leave — zip it shut
        </button>
        <button
          onClick={() => run('enter')}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          Enter — unzip
        </button>
        <button
          onClick={() => run('cycle')}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          Full cycle
        </button>
      </div>

      <label className="mt-6 block max-w-sm">
        <span className="font-mono text-xs text-muted-foreground">
          speed · {speed.toFixed(2)}x{' '}
          <span className="opacity-60">— round trip ≈ {zipDuration(speed, sealHold, unzip)}ms</span>
        </span>
        <input
          type="range" min={0.4} max={2.5} step={0.05} value={speed}
          onChange={(e) => setSpeed(+e.target.value)}
          className="mt-2 w-full"
        />
      </label>

      <label className="mt-5 block max-w-sm">
        <span className="font-mono text-xs text-muted-foreground">
          seal hold · {sealHold.toFixed(2)}s{' '}
          <span className="opacity-60">— beat at full cover, where the route swaps</span>
        </span>
        <input
          type="range" min={0} max={1.2} step={0.05} value={sealHold}
          onChange={(e) => setSealHold(+e.target.value)}
          className="mt-2 w-full"
        />
      </label>

      <label className="mt-5 block max-w-sm">
        <span className="font-mono text-xs text-muted-foreground">
          overshoot · {overshoot.toFixed(1)}{' '}
          <span className="opacity-60">
            — 0 is ease-in-out; higher carries the panels past and back
          </span>
        </span>
        <input
          type="range" min={0} max={3} step={0.1} value={overshoot}
          onChange={(e) => setOvershoot(+e.target.value)}
          className="mt-2 w-full"
        />
      </label>

      <label className="mt-5 block max-w-sm">
        <span className="font-mono text-xs text-muted-foreground">
          unzip · {unzip.toFixed(2)}s{' '}
          <span className="opacity-60">— how long the slider takes to run back up</span>
        </span>
        <input
          type="range" min={0.4} max={2.5} step={0.05} value={unzip}
          onChange={(e) => setUnzip(+e.target.value)}
          className="mt-2 w-full"
        />
      </label>

      <h2 className="mt-14 text-sm font-medium">Palette</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        {PALETTE_NAMES.map((name) => (
          <button
            key={name}
            onClick={() => setPalette(name)}
            className={`flex items-center gap-2.5 rounded-full border px-3 py-1.5 font-mono text-xs transition-colors ${
              palette === name
                ? 'border-foreground/50 text-foreground'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <span
              className="size-4 rounded-full border border-black/40"
              style={{
                background: `linear-gradient(160deg, ${PALETTES[name]['--zip-metal-hi']}, ${PALETTES[name]['--zip-metal-mid']}, ${PALETTES[name]['--zip-metal-edge']})`,
              }}
            />
            {name}
          </button>
        ))}
      </div>

      <h2 className="mt-14 text-sm font-medium">Tuning</h2>
      <div className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {knobs.map((k) => (
          <label key={k.key} className="block">
            <span className="font-mono text-xs text-muted-foreground">
              {k.key} · {t[k.key]} <span className="opacity-60">— {k.hint}</span>
            </span>
            <input
              type="range" min={k.min} max={k.max} step={k.step} value={t[k.key]}
              onChange={(e) => setT({ ...t, [k.key]: +e.target.value })}
              className="mt-2 w-full"
            />
          </label>
        ))}
      </div>

      <button
        onClick={() => setT(DEFAULT_TUNING)}
        className="mt-6 rounded-lg border border-border px-4 py-2 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        reset tuning
      </button>
    </main>
  )
}
