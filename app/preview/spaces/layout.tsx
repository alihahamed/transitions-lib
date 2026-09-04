'use client'

import { Suspense } from 'react'
import { SpacesTransition, type SpacesOptions } from '@/components/spaces'
import { usePreviewOptions } from '@/components/site/preview-options'

/* The two preview pages in order, so going to B slides left and coming back slides right. */
const ROUTES = ['/preview/spaces', '/preview/spaces/b']

function Frame({ children }: { children: React.ReactNode }) {
  const options = usePreviewOptions() as Partial<SpacesOptions>
  return <SpacesTransition routes={ROUTES} {...options}>{children}</SpacesTransition>
}

/** Bare frame — no site chrome, so the transition is the only thing moving. */
export default function SpacesPreviewLayout({ children }: LayoutProps<'/preview/spaces'>) {
  return (
    <Suspense>
      <Frame>{children}</Frame>
    </Suspense>
  )
}
