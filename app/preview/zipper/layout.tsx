'use client'

import { Suspense } from 'react'
import { ZipperTransition, type ZipperOptions } from '@/components/zipper'
import { usePreviewOptions } from '@/components/site/preview-options'

function Frame({ children }: { children: React.ReactNode }) {
  const options = usePreviewOptions() as Partial<ZipperOptions>
  return <ZipperTransition {...options}>{children}</ZipperTransition>
}

/** Bare frame — no site chrome, so the transition is the only thing moving. */
export default function ZipperPreviewLayout({ children }: LayoutProps<'/preview/zipper'>) {
  return (
    <Suspense>
      <Frame>{children}</Frame>
    </Suspense>
  )
}
