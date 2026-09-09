import type { Metadata } from 'next'
import { transitions } from '@/lib/transitions'
import { TransitionCard } from '@/components/site/transition-card'

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Every shipped transition. Something covers the screen, the route swaps behind it, it leaves.',
}

export default function Gallery() {
  const shipped = transitions.filter((t) => t.ready)
  const native = shipped.filter((t) => t.dependencies.length === 0).length
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-20">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {shipped.length} shipped · {native} with no dependencies · {shipped.length - native} on GSAP
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">Transitions</h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
        Something covers the screen, the route swaps behind it, it leaves. Each one
        installs on its own and brings only its own dependencies.
      </p>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shipped.map((t) => (
          <TransitionCard key={t.slug} t={t} />
        ))}
      </div>
    </main>
  )
}
