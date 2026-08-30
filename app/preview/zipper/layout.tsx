'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { ZipperTransition } from '@/components/zipper'

const PALETTES = ['nickel', 'steel', 'brass', 'gunmetal', 'copper'] as const

function Frame({ children }: { children: React.ReactNode }) {
  const params = useSearchParams()

  /*
   * Held in state rather than read straight off the URL. The links between the
   * two preview routes carry no query, so reading the param directly would
   * snap the palette back to default the moment the page zips over.
   * This layout spans both routes and does not remount, so the last palette
   * asked for is the one that sticks.
   */
  const [palette, setPalette] = useState(() => params.get('palette') ?? 'nickel')

  useEffect(() => {
    const next = params.get('palette')
    if (next && PALETTES.includes(next as never)) setPalette(next)
  }, [params])

  const cls = palette !== 'nickel' ? `zip-${palette}` : undefined

  // The class only has to sit above the overlay — the variables inherit down.
  return (
    <div className={cls} style={{ display: 'contents' }}>
      <ZipperTransition>{children}</ZipperTransition>
    </div>
  )
}

/** Bare frame — no site chrome, so the transition is the only thing moving. */
export default function ZipperPreviewLayout({ children }: LayoutProps<'/preview/zipper'>) {
  return (
    <Suspense>
      <Frame>{children}</Frame>
    </Suspense>
  )
}
