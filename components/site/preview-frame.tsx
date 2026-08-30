'use client'

import type { Control } from '@/lib/transitions'
import { Customize, useCustomize } from './customize'

/**
 * The preview is a real two-route app in a frame, so the navigation is genuine
 * and cannot collide with the docs site's own routing. Customising reloads the
 * frame with the changed values as a query, rather than reaching into it.
 */
export function PreviewFrame({
  slug,
  title,
  controls,
}: {
  slug: string
  title: string
  controls: Control[]
}) {
  const { values, setValues, reset, query } = useCustomize(controls)
  const src = query ? `/preview/${slug}?${query}` : `/preview/${slug}`

  return (
    <>
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium">Preview</h2>
        <a
          href={src}
          target="_blank"
          className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          open full size ↗
        </a>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-border">
        <iframe
          key={src}
          src={src}
          title={`${title} preview`}
          className="block h-[420px] w-full bg-background"
        />
      </div>

      <div className="mt-4">
        <Customize controls={controls} values={values} onChange={setValues} onReset={reset} />
      </div>

      {query && (
        <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
          {'<'}
          {title.replace(/\s+/g, '')}Transition{' '}
          {Object.entries(values)
            .filter(([k]) => controls.find((c) => c.key === k)?.def !== values[k])
            .map(([k, v]) => (typeof v === 'string' ? `${k}="${v}"` : `${k}={${v}}`))
            .join(' ')}
          {'>'}
        </p>
      )}
    </>
  )
}
