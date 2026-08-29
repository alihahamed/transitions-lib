import Link from 'next/link'
import type { TransitionMeta } from '@/lib/transitions'

/**
 * Thumbnail is the transition's own accent palette, not a screenshot — no video
 * files to keep in sync, and it stays honest about what the transition looks like.
 */
export function TransitionCard({ t }: { t: TransitionMeta }) {
  return (
    <Link
      href={`/transitions/${t.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border transition-colors hover:border-foreground/30"
    >
      <div className="relative flex aspect-[16/10] overflow-hidden">
        {t.accent.map((c, i) => (
          <div
            key={c}
            className="flex-1 transition-transform duration-500 ease-out group-hover:translate-y-0"
            style={{
              background: c,
              transform: `translateY(${i * 6}%)`,
            }}
          />
        ))}
        <span className="absolute bottom-2 right-2 rounded-full bg-background/80 px-2 py-0.5 font-mono text-[10px] text-muted-foreground backdrop-blur">
          {t.engine}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 border-t border-border p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-medium">{t.name}</h3>
          <span className="font-mono text-[10px] text-muted-foreground">
            {(t.duration / 1000).toFixed(2)}s
          </span>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{t.tagline}</p>
      </div>
    </Link>
  )
}
