import { transitions } from '@/lib/transitions'
import { TransitionCard } from '@/components/site/transition-card'

const families = [
  { id: 'overlay', label: 'Overlay', blurb: 'Something covers the screen, the route swaps behind it, it leaves.' },
  { id: 'view-transitions', label: 'View Transitions', blurb: 'Elements travel between routes. No dependencies, no runtime.' },
] as const

export default function Gallery() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-20">
      <h1 className="text-4xl font-semibold tracking-tight">Transitions</h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
        Each one installs on its own and brings only its own dependencies. Pick one per
        project.
      </p>

      {families.map((f) => {
        const items = transitions.filter((t) => t.family === f.id)
        if (!items.length) return null

        return (
          <section key={f.id} className="mt-16">
            <h2 className="text-sm font-medium">{f.label}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{f.blurb}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((t) => (
                <TransitionCard key={t.slug} t={t} />
              ))}
            </div>
          </section>
        )
      })}
    </main>
  )
}
