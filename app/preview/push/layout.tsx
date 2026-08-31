'use client'

import { Suspense } from 'react'
import { PushTransition, type PushOptions } from '@/components/push'
import { usePreviewOptions } from '@/components/site/preview-options'

function Frame({ children }: { children: React.ReactNode }) {
  const options = usePreviewOptions() as Partial<PushOptions>
  return <PushTransition {...options}>{children}</PushTransition>
}

/** Bare frame — no site chrome, so the transition is the only thing moving. */
export default function PushPreviewLayout({ children }: LayoutProps<'/preview/push'>) {
  return (
    <Suspense>
      <Frame>{children}</Frame>
    </Suspense>
  )
}
