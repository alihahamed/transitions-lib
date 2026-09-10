'use client'

import { Suspense } from 'react'
import { TearTransition, type TearOptions } from '@/components/tear'
import { usePreviewOptions } from '@/components/site/preview-options'

function Frame({ children }: { children: React.ReactNode }) {
  const options = usePreviewOptions() as Partial<TearOptions>
  return <TearTransition {...options}>{children}</TearTransition>
}

/** Bare frame — no site chrome, so the transition is the only thing moving. */
export default function TearPreviewLayout({ children }: LayoutProps<'/preview/tear'>) {
  return (
    <Suspense>
      <Frame>{children}</Frame>
    </Suspense>
  )
}
