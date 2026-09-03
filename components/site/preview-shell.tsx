import Link from 'next/link'
import type { ReactNode } from 'react'

/** Full-bleed clickable panel used inside the preview frames. */
export function PreviewShell({
  step,
  href,
  accent,
  bg,
  fg,
  children,
}: {
  step: string
  href: string
  accent: string
  /** Some transitions need something to happen against — char on black is invisible. */
  bg?: string
  /** Text colour, for a light bg where the site's light text would vanish. */
  fg?: string
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex h-dvh flex-col justify-between overflow-hidden p-10"
      style={bg || fg ? { background: bg, color: fg } : undefined}
    >
      <span className="font-mono text-xs uppercase tracking-[0.2em]" style={{ color: accent }}>
        page {step}
      </span>
      <p className="max-w-sm text-2xl font-medium leading-snug tracking-tight">{children}</p>
      <span className="font-mono text-[11px] text-muted-foreground">click anywhere →</span>
    </Link>
  )
}
