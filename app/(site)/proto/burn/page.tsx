import { BurnArt, type BurnOrigin } from '@/components/proto/burn-art'

const STEPS = [0.2, 0.45, 0.7, 1]
const ORIGINS: BurnOrigin[] = ['bottom-right', 'top-left', 'center']

function Cell({ progress, origin }: { progress: number; origin: BurnOrigin }) {
  return (
    <div>
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border">
        {/* the page being consumed */}
        <div className="absolute inset-0 flex flex-col justify-center gap-2 bg-[#0e5c4a] px-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
            the page
          </p>
          <p className="text-xl font-semibold leading-tight tracking-tight text-white">
            Burning away.
          </p>
        </div>
        <BurnArt progress={progress} origin={origin} />
      </div>
      <p className="mt-1.5 text-center font-mono text-[11px] text-muted-foreground">
        {Math.round(progress * 100)}%
      </p>
    </div>
  )
}

export default function BurnProto() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Film burn — artwork prototype</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Static frames, no animation yet. Judging the ember ramp and the celluloid char
        before anything moves. The ragged edge is one displacement map shared by both
        the ember ring and the char, so they stay locked together.
      </p>

      {ORIGINS.map((origin) => (
        <section key={origin} className="mt-10">
          <h2 className="font-mono text-xs text-muted-foreground">origin: {origin}</h2>
          <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {STEPS.map((p) => (
              <Cell key={p} progress={p} origin={origin} />
            ))}
          </div>
        </section>
      ))}

      <h2 className="mt-14 text-sm font-medium">Edge detail — the ember ramp up close</h2>
      <div className="mt-3 h-[420px] w-full max-w-2xl overflow-hidden rounded-xl border border-border">
        <div className="relative h-full w-full">
          <div className="absolute inset-0 bg-[#0e5c4a]" />
          <div className="absolute inset-0 scale-[2.2] origin-bottom-right">
            <BurnArt progress={0.12} origin="bottom-right" />
          </div>
        </div>
      </div>
    </main>
  )
}
