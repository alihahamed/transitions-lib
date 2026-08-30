'use client'

import { useState } from 'react'

export type Swatch = { name: string; from: string; to: string }

/**
 * The preview is a real two-route app in a frame, so the navigation is genuine
 * and cannot collide with the docs site's own routing. Changing palette reloads
 * the frame with a query param rather than reaching into it.
 */
export function PreviewFrame({
  slug,
  title,
  swatches,
}: {
  slug: string
  title: string
  swatches?: Swatch[]
}) {
  const [palette, setPalette] = useState('nickel')
  const src = palette === 'nickel' ? `/preview/${slug}` : `/preview/${slug}?palette=${palette}`

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

      {swatches && (
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          {swatches.map((s) => (
            <button
              key={s.name}
              onClick={() => setPalette(s.name)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-xs transition-colors ${
                palette === s.name
                  ? 'border-foreground/50 text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <span
                className="size-3.5 rounded-full border border-black/40"
                style={{ background: `linear-gradient(160deg, ${s.from}, ${s.to})` }}
              />
              {s.name}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
