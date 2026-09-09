'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentProps } from 'react'

/** A header link that knows when its section is the one on screen. */
export function NavLink({ href, className = '', ...rest }: ComponentProps<typeof Link> & { href: string }) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(href + '/')
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`transition-colors hover:text-foreground ${active ? 'text-foreground' : ''} ${className}`}
      {...rest}
    />
  )
}
