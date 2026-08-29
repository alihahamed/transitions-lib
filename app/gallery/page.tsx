import Link from 'next/link'
import { Connector } from '@/components/connector'
import { items, gradient } from '@/lib/gallery'

export default function Gallery() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-20">
      <h1 className="text-4xl font-semibold tracking-tight">Connector</h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
        Each tile and its detail hero share one{' '}
        <code className="font-mono text-foreground">id</code>. The browser works out the
        geometry and flies one into the other — there is no animation code behind this,
        only a matching name.
      </p>

      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {items.map((item) => (
          <Link key={item.id} href={`/gallery/${item.id}`} className="group">
            <Connector id={`tile-${item.id}`}>
              <div
                className="aspect-[4/3] rounded-2xl border border-border/60"
                style={{ background: gradient(item) }}
              />
            </Connector>
            <Connector id={`label-${item.id}`}>
              <p className="mt-3 text-sm font-medium transition-colors group-hover:text-muted-foreground">
                {item.name}
              </p>
            </Connector>
          </Link>
        ))}
      </div>
    </main>
  )
}
