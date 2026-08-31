'use client'

import { Suspense } from 'react'
import { FoldAwayTransition, type FoldAwayOptions } from '@/components/foldaway'
import { usePreviewOptions } from '@/components/site/preview-options'

function Frame({ children }: { children: React.ReactNode }) {
  const options = usePreviewOptions() as Partial<FoldAwayOptions>
  return <FoldAwayTransition {...options}>{children}</FoldAwayTransition>
}

/** Bare frame — no site chrome, so the transition is the only thing moving. */
export default function FoldAwayPreviewLayout({ children }: LayoutProps<'/preview/foldaway'>) {
  return (
    <Suspense>
      <Frame>{children}</Frame>
    </Suspense>
  )
}
