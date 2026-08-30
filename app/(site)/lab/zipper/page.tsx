import { ZipperArt } from '@/components/lab/zipper-art'

const states = [
  { p: 1, label: 'closed' },
  { p: 0.55, label: 'mid-zip' },
  { p: 0, label: 'open' },
]

export default function ZipperLab() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Zipper — artwork prototype</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Shading only, no animation yet. Judging whether the specular band, contact shadow
        and slider read as metal before anything moves.
      </p>

      <div className="mt-10 grid grid-cols-3 gap-6">
        {states.map((s) => (
          <div key={s.label}>
            <div className="h-[420px] overflow-hidden rounded-xl border border-border bg-[#0b0b0c]">
              <ZipperArt progress={s.p} />
            </div>
            <p className="mt-2 text-center font-mono text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-16 text-sm font-medium">Tooth detail — meshed above, parted below</h2>
      <div className="mt-3 h-[520px] w-[340px] overflow-hidden rounded-xl border border-border bg-[#0b0b0c]">
        <ZipperArt progress={0.5} view="120 250 180 275" />
      </div>

      <h2 className="mt-16 text-sm font-medium">
        Close crop — checking both rows point inward
      </h2>
      <div className="mt-3 h-[420px] w-[420px] overflow-hidden rounded-xl border border-border bg-[#0b0b0c]">
        <ZipperArt progress={0.5} view="140 336 140 140" />
      </div>
    </main>
  )
}
