import Link from 'next/link'
import { notFound } from 'next/navigation'
import { transitions, bySlug, installCommand } from '@/lib/transitions'
import { CodeBlock } from '@/components/site/code-block'
import { PreviewFrame } from '@/components/site/preview-frame'

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

      <section className="mt-10">
        <PreviewFrame slug={t.slug} title={t.name} swatches={t.swatches} />
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

      {t.swatches && (
        <section className="mt-12">
          <h2 className="text-sm font-medium">Colour</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Every colour reads from a CSS variable, so a preset is only a class. Put one
            on any ancestor of the transition, or set the variables yourself for anything
            the presets do not cover.
          </p>
          <div className="mt-3">
            <CodeBlock
              label="app/globals.css"
              code={`:root {
  --zip-metal-hi:   #ffffff;
  --zip-metal:      #d7d2c8;
  --zip-metal-mid:  #8f887c;
  --zip-metal-lo:   #4a453e;
  --zip-metal-edge: #211f1c;
  --zip-tape:       #3d3d46;
  --zip-tape-lo:    #26262c;
}`}
            />
          </div>
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
