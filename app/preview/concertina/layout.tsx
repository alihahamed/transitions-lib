'use client'

import { Suspense } from 'react'
import { ConcertinaTransition, type ConcertinaOptions } from '@/components/concertina'
import { usePreviewOptions } from '@/components/site/preview-options'

function Frame({ children }: { children: React.ReactNode }) {
  const options = usePreviewOptions() as Partial<ConcertinaOptions>
  return <ConcertinaTransition {...options}>{children}</ConcertinaTransition>
}

/** Bare frame — no site chrome, so the transition is the only thing moving. */
export default function ConcertinaPreviewLayout({ children }: LayoutProps<'/preview/concertina'>) {
  return (
    <Suspense>
      <Frame>{children}</Frame>
    </Suspense>
  )
}
