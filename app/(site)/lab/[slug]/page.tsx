import { notFound } from 'next/navigation'
import Link from 'next/link'
import { transitions, bySlug } from '@/lib/transitions'
import { Harness } from '@/components/site/harness'

export function generateStaticParams() {
  return transitions.map(({ slug }) => ({ slug }))
}

export default async function Lab({ params }: PageProps<'/lab/[slug]'>) {
  const { slug } = await params
  const t = bySlug(slug)
  if (!t) notFound()

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-14">
      <nav className="font-mono text-xs text-muted-foreground">
        <Link href={`/transitions/${t.slug}`} className="transition-colors hover:text-foreground">
          {t.slug}
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-foreground">lab</span>
      </nav>

      <h1 className="mt-5 text-3xl font-semibold tracking-tight">{t.name} — lab</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        A workbench, not a demo. Scrub the transition to any frame by hand, play the
        real timelines, and dial every knob live. Whatever you settle on here is what
        gets baked in as the component defaults.
      </p>

      <div className="mt-8">
        <Harness slug={t.slug} controls={t.controls} scrub={t.scrub} />
      </div>
    </main>
  )
}
