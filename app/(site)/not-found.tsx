import Link from 'next/link'
import { transitions } from '@/lib/transitions'

export default function NotFound() {
  const shipped = transitions.filter((t) => t.ready)
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">404</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">
        Nothing here.
        <span className="text-muted-foreground"> The route swapped and no page came.</span>
      </h1>
      <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
        The address may have changed, or it never existed. Every transition that has
        shipped is a step away.
      </p>
      <nav className="mt-10 flex flex-wrap gap-2">
        <Link
          href="/"
          className="rounded-full bg-primary px-3.5 py-1.5 font-mono text-xs text-primary-foreground transition-opacity hover:opacity-90"
        >
          home
        </Link>
        {shipped.map((t) => (
          <Link
            key={t.slug}
            href={`/transitions/${t.slug}`}
            className="rounded-full border border-border px-3.5 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            {t.name}
          </Link>
        ))}
      </nav>
    </main>
  )
}
