'use client'

import { useState, useRef } from 'react'
import gsap from 'gsap'
import { ZipperRig, DEFAULT_TUNING, type RigTuning } from '@/components/lab/zipper-rig'

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
  const tl = useRef<gsap.core.Timeline | null>(null)

  const play = () => {
    tl.current?.kill()
    const v = { zip: 1, swing: 0 }
    setZip(1)
    setSwing(0)
    tl.current = gsap
      .timeline({ onUpdate: () => { setZip(v.zip); setSwing(v.swing) } })
      .to(v, { zip: 0, duration: 0.85, ease: 'power2.inOut' })
      .to(v, { swing: 1, duration: 1.1, ease: 'back.out(1.3)' }, '-=0.35')
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

      <button
        onClick={play}
        className="mt-6 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Play the enter sequence
      </button>

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
