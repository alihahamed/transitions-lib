'use client'

import { Suspense } from 'react'
import { CrayonTransition, type CrayonOptions } from '@/components/crayon'
import { usePreviewOptions, cssVars } from '@/components/site/preview-options'

const COLOURS = { crayon1: '--crayon-1', crayon2: '--crayon-2', crayon3: '--crayon-3' }

function Frame({ children }: { children: React.ReactNode }) {
  const options = usePreviewOptions()
  const { crayon1, crayon2, crayon3, ...rest } = options
  return (
    <div style={{ display: 'contents', ...cssVars(options, COLOURS) }}>
      <CrayonTransition {...(rest as Partial<CrayonOptions>)}>{children}</CrayonTransition>
    </div>
  )
}

/** Bare frame — no site chrome, so the transition is the only thing moving. */
export default function CrayonPreviewLayout({ children }: LayoutProps<'/preview/crayon'>) {
  return (
    <Suspense>
      <Frame>{children}</Frame>
    </Suspense>
  )
}
