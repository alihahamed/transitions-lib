import Link from 'next/link'
import { transitions } from '@/lib/transitions'
import { TransitionCard } from '@/components/site/transition-card'

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-20">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        shadcn registry · next.js app router
      </p>
      <h1 className="mt-4 max-w-2xl text-5xl font-semibold leading-[1.05] tracking-tight">
        Page transitions with
        <span className="text-muted-foreground"> a hand in them.</span>
      </h1>
      <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
        Not fades. A clapperboard that claps, a strip of slats that folds, a zip that
        closes, two desks that slide past on a spring. Each one covers the screen, swaps
        the route behind itself, and leaves. Install one with the shadcn CLI and wrap your
        layout — that is the whole integration.
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/transitions"
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Browse transitions
        </Link>
        <a
          href="https://github.com/alihahamed/transitions-lib"
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          GitHub
        </a>
      </div>

      <section className="mt-20 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
        {[
          ['01', 'Install', 'npx shadcn add …/r/slate.json'],
          ['02', 'Wrap', '<SlateTransition>{children}</SlateTransition>'],
          ['03', 'Done', 'Every <Link> is intercepted. Nothing else changes.'],
        ].map(([n, title, body]) => (
          <div key={n} className="bg-background p-5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">{n}</p>
            <h3 className="mt-2 text-sm font-medium">{title}</h3>
            <p className="mt-1.5 break-words font-mono text-[11px] leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>

      <section className="mt-20">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium">Latest</h2>
          <Link
            href="/transitions"
            className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            all {transitions.length} →
          </Link>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {transitions.slice(0, 3).map((t) => (
            <TransitionCard key={t.slug} t={t} />
          ))}
        </div>
      </section>
    </main>
  )
}
