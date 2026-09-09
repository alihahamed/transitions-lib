import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { transitions, bySlug, installCommand } from '@/lib/transitions'
import { CodeBlock } from '@/components/site/code-block'
import { PreviewFrame } from '@/components/site/preview-frame'
import { ApiReference } from '@/components/site/api-reference'

export function generateStaticParams() {
  return transitions.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps<'/transitions/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const t = bySlug(slug)
  if (!t) return {}
  return { title: t.name, description: t.tagline }
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

      {t.requires && (
        <div className="mt-8 flex gap-3 rounded-xl border border-border bg-muted/30 p-4">
          <span className="mt-px font-mono text-xs text-muted-foreground">needs</span>
          <p className="text-[13px] leading-relaxed text-muted-foreground">{t.requires}</p>
        </div>
      )}

      <section className="mt-10">
        <PreviewFrame slug={t.slug} title={t.name} controls={t.controls} />
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
        <h2 className="text-sm font-medium">API Reference</h2>
        <div className="mt-3">
          <ApiReference props={t.props} />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-medium">How it works</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.description}</p>
      </section>

      {t.swatches && (
        <section className="mt-12">
          <h2 className="text-sm font-medium">Colour</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Every colour reads from a CSS variable, so a preset is only a class. Pass one
            as <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">palette</code>,
            or set the variables yourself in your stylesheet for anything the presets do
            not cover.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {t.swatches.map((s) => (
              <li
                key={s.name}
                className="flex items-center gap-2.5 rounded-full border border-border py-1.5 pl-1.5 pr-3.5"
              >
                <span className="flex overflow-hidden rounded-full border border-border/60">
                  <span className="size-4" style={{ background: s.from }} />
                  <span className="size-4" style={{ background: s.to }} />
                </span>
                <span className="font-mono text-xs text-muted-foreground">{s.name}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

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

      <nav aria-label="More transitions" className="mt-16 border-t border-border/60 pt-8">
        <h2 className="text-sm font-medium">More transitions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
        {transitions
          .filter((o) => o.slug !== t.slug && o.ready)
          .map((o) => (
            <Link
              key={o.slug}
              href={`/transitions/${o.slug}`}
              className="rounded-full border border-border px-3.5 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
            >
              {o.name} →
            </Link>
          ))}
        </div>
      </nav>
    </main>
  )
}
