import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Connector } from '@/components/connector'
import { items, byId, gradient } from '@/lib/gallery'

export function generateStaticParams() {
  return items.map(({ id }) => ({ id }))
}

export default async function Detail({ params }: PageProps<'/gallery/[id]'>) {
  const { id } = await params
  const item = byId(id)
  if (!item) notFound()

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-20">
      <Link
        href="/gallery"
        className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        ← gallery
      </Link>

      <Connector id={`tile-${item.id}`}>
        <div
          className="mt-6 aspect-[21/9] w-full rounded-3xl border border-border/60"
          style={{ background: gradient(item) }}
        />
      </Connector>

      <Connector id={`label-${item.id}`}>
        <h1 className="mt-8 text-5xl font-semibold tracking-tight">{item.name}</h1>
      </Connector>

      <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
        {item.note}
      </p>

      <pre className="mt-10 inline-block rounded-xl border border-border bg-muted/40 px-4 py-3 font-mono text-[12px] text-muted-foreground">
        {`<Connector id="tile-${item.id}">…</Connector>`}
      </pre>
    </main>
  )
}
