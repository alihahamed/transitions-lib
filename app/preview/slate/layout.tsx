'use client'

import { Suspense } from 'react'
import { SlateTransition, type SlateOptions } from '@/components/slate'
import { usePreviewOptions } from '@/components/site/preview-options'

function Frame({ children }: { children: React.ReactNode }) {
  const options = usePreviewOptions() as Partial<SlateOptions>
  return <SlateTransition {...options}>{children}</SlateTransition>
}

/** Bare frame — no site chrome, so the transition is the only thing moving. */
export default function SlatePreviewLayout({ children }: LayoutProps<'/preview/slate'>) {
  return (
    <Suspense>
      <Frame>{children}</Frame>
    </Suspense>
  )
}
