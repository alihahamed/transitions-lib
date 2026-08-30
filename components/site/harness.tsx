'use client'

import { useRef, useState } from 'react'
import type { Control } from '@/lib/transitions'
import { Customize, useCustomize } from './customize'

/**
 * Generic workbench. It knows nothing transition-specific — a transition
 * declares its controls and (optionally) the state it can be scrubbed to, and
 * gets this for free.
 *
 * The preview runs in a frame so the transition drives a real navigation
 * rather than a simulation of one.
 */
export function Harness({
  slug,
  controls,
  scrub,
}: {
  slug: string
  controls: Control[]
  scrub?: { key: string; label: string }[]
}) {
  const { values, setValues, reset, query } = useCustomize(controls)
  const [nudge, setNudge] = useState(0)
  const frame = useRef<HTMLIFrameElement>(null)

  const src = query ? `/preview/${slug}?${query}` : `/preview/${slug}`

  /** Click the link inside the frame — the only honest way to start a real navigation. */
  const play = () => {
    const doc = frame.current?.contentDocument
    const link = doc?.querySelector<HTMLAnchorElement>('a[href^="/preview/"]')
    if (link) link.click()
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border">
        <iframe
          key={`${src}#${nudge}`}
          ref={frame}
          src={src}
          title={`${slug} lab`}
          className="block h-[520px] w-full bg-background"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={play}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Play a navigation
        </button>
        <button
          onClick={() => setNudge((n) => n + 1)}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          Reload frame
        </button>
        <a
          href={src}
          target="_blank"
          className="ml-auto font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          open full size ↗
        </a>
      </div>

      <div className="mt-6">
        <Customize
          controls={controls}
          values={values}
          onChange={setValues}
          onReset={reset}
          title="Tuning"
        />
      </div>

      {scrub && (
        <p className="mt-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
          scrubbable state: {scrub.map((s) => s.key).join(', ')}
        </p>
      )}

      <div className="mt-6 rounded-xl border border-border bg-muted/20 p-4">
        <p className="text-xs text-muted-foreground">Current settings as props</p>
        <pre className="mt-2 overflow-x-auto font-mono text-[12px] text-foreground">
          {query
            ? `<Transition ${Object.entries(values)
                .filter(([k]) => controls.find((c) => c.key === k)?.def !== values[k])
                .map(([k, v]) => (typeof v === 'string' ? `${k}="${v}"` : `${k}={${v}}`))
                .join(' ')} />`
            : '<Transition />   // all defaults'}
        </pre>
      </div>
    </>
  )
}
