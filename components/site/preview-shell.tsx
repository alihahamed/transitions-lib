import Link from 'next/link'
import type { ReactNode } from 'react'

/** Full-bleed clickable panel used inside the preview frames. */
export function PreviewShell({
  step,
  href,
  accent,
  children,
}: {
  step: string
  href: string
  accent: string
  children: ReactNode
}) {
  return (
    <Link href={href} className="flex min-h-dvh flex-col justify-between p-10">
      <span className="font-mono text-xs uppercase tracking-[0.2em]" style={{ color: accent }}>
        page {step}
      </span>
      <p className="max-w-sm text-2xl font-medium leading-snug tracking-tight">{children}</p>
      <span className="font-mono text-[11px] text-muted-foreground">click anywhere →</span>
    </Link>
  )
}
