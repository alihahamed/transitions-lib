'use client'

import { Suspense } from 'react'
import { FilmBurnTransition, type FilmBurnOptions } from '@/components/film-burn'
import { usePreviewOptions } from '@/components/site/preview-options'

function Frame({ children }: { children: React.ReactNode }) {
  const options = usePreviewOptions() as Partial<FilmBurnOptions>
  return <FilmBurnTransition {...options}>{children}</FilmBurnTransition>
}

/** Bare frame — no site chrome, so the transition is the only thing moving. */
export default function FilmBurnPreviewLayout({ children }: LayoutProps<'/preview/film-burn'>) {
  return (
    <Suspense>
      <Frame>{children}</Frame>
    </Suspense>
  )
}
