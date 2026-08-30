'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { ZipperTransition } from '@/components/zipper'

const PALETTES = ['nickel', 'steel', 'brass', 'gunmetal', 'copper'] as const

function Frame({ children }: { children: React.ReactNode }) {
  const palette = useSearchParams().get('palette') ?? 'nickel'
  const cls = PALETTES.includes(palette as never) && palette !== 'nickel' ? `zip-${palette}` : undefined

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
