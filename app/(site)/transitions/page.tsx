import { transitions } from '@/lib/transitions'
import { TransitionCard } from '@/components/site/transition-card'

export default function Gallery() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-20">
      <h1 className="text-4xl font-semibold tracking-tight">Transitions</h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
        Something covers the screen, the route swaps behind it, it leaves. Each one
        installs on its own and brings only its own dependencies.
      </p>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {transitions.filter((t) => t.ready).map((t) => (
          <TransitionCard key={t.slug} t={t} />
        ))}
      </div>
    </main>
  )
}
