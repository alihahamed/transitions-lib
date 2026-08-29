import Link from 'next/link'
import { Connector } from '@/components/connector'

export default function A() {
  return (
    <main className="flex min-h-dvh flex-col justify-center gap-6 p-10">
      <p className="font-mono text-xs text-muted-foreground">click the tile</p>
      <Link href="/preview/connector/b" className="w-fit">
        <Connector id="preview-tile">
          <div
            className="size-24 rounded-xl"
            style={{ background: 'linear-gradient(140deg,#a1a1aa,#27272a)' }}
          />
        </Connector>
      </Link>
    </main>
  )
}
