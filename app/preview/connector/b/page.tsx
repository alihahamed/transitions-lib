import Link from 'next/link'
import { Connector } from '@/components/connector'

export default function B() {
  return (
    <main className="flex min-h-dvh flex-col justify-center gap-6 p-10">
      <p className="font-mono text-xs text-muted-foreground">
        <Link href="/preview/connector">← back</Link>
      </p>
      <Connector id="preview-tile">
        <div
          className="aspect-[21/9] w-full rounded-2xl"
          style={{ background: 'linear-gradient(140deg,#a1a1aa,#27272a)' }}
        />
      </Connector>
    </main>
  )
}
