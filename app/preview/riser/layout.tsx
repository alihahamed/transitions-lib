'use client'

import { Suspense } from 'react'
import { RiserTransition, type RiserOptions } from '@/components/riser'
import { usePreviewOptions } from '@/components/site/preview-options'

function Frame({ children }: { children: React.ReactNode }) {
  const options = usePreviewOptions() as Partial<RiserOptions>
  return <RiserTransition {...options}>{children}</RiserTransition>
}

/** Bare frame — no site chrome, so the transition is the only thing moving. */
export default function RiserPreviewLayout({ children }: LayoutProps<'/preview/riser'>) {
  return (
    <Suspense>
      <Frame>{children}</Frame>
    </Suspense>
  )
}
