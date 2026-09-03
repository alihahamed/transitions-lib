'use client'

import { Suspense } from 'react'
import { DitherTransition, type DitherOptions } from '@/components/dither'
import { usePreviewOptions } from '@/components/site/preview-options'

function Frame({ children }: { children: React.ReactNode }) {
  const options = usePreviewOptions() as Partial<DitherOptions>
  return <DitherTransition {...options}>{children}</DitherTransition>
}

/** Bare frame — no site chrome, so the transition is the only thing moving. */
export default function DitherPreviewLayout({ children }: LayoutProps<'/preview/dither'>) {
  return (
    <Suspense>
      <Frame>{children}</Frame>
    </Suspense>
  )
}
