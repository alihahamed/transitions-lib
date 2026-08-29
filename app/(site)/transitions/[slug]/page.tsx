import Link from 'next/link'
import { notFound } from 'next/navigation'
import { transitions, bySlug, installCommand } from '@/lib/transitions'
import { CodeBlock } from '@/components/site/code-block'

export function generateStaticParams() {
  return transitions.map(({ slug }) => ({ slug }))
}

export default async function TransitionPage({ params }: PageProps<'/transitions/[slug]'>) {
  const { slug } = await params
  const t = bySlug(slug)
  if (!t) notFound()

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <nav className="font-mono text-xs text-muted-foreground">
        <Link href="/transitions" className="transition-colors hover:text-foreground">
          transitions
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-foreground">{t.slug}</span>
      </nav>

      <header className="mt-6">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-semibold tracking-tight">{t.name}</h1>
          <span className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {t.engine}
          </span>
        </div>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">{t.tagline}</p>
      </header>

      {/* Preview — a real two-route app in a frame, so the navigation is genuine
          and cannot collide with the docs site's own routing. */}
      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium">Preview</h2>
          <a
            href={`/preview/${t.slug}`}
            target="_blank"
            className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            open full size ↗
          </a>
        </div>
        <div className="mt-3 overflow-hidden rounded-xl border border-border">
          <iframe
            src={`/preview/${t.slug}`}
            title={`${t.name} preview`}
            className="block h-[420px] w-full bg-background"
          />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-medium">Installation</h2>
        <div className="mt-3">
          <CodeBlock code={installCommand(t.slug)} label="CLI" />
        </div>
        {t.dependencies.length > 0 && (
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            pulls in {t.dependencies.join(', ')}
          </p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-medium">Usage</h2>
        <div className="mt-3">
          <CodeBlock code={t.usage} label="app/layout.tsx" />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-medium">How it works</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.description}</p>
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-medium">Worth knowing</h2>
        <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
          {t.notes.map((n) => (
            <li key={n} className="flex gap-2.5">
              <span className="text-border">·</span>
              {n}
            </li>
          ))}
        </ul>
      </section>

      <nav className="mt-16 flex flex-wrap gap-2 border-t border-border/60 pt-8">
        {transitions
          .filter((o) => o.slug !== t.slug)
          .map((o) => (
            <Link
              key={o.slug}
              href={`/transitions/${o.slug}`}
              className="rounded-full border border-border px-3.5 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
            >
              {o.name} →
            </Link>
          ))}
      </nav>
    </main>
  )
}
