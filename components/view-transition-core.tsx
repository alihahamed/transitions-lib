'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export type ViewTransitionConfig<O> = {
  /**
   * Scopes this transition's stylesheet. The core puts `vt-<name>` on the
   * document element for the duration of the navigation, so two installed
   * transitions cannot both claim ::view-transition-old(root) — and neither
   * restyles a view transition it did not start.
   */
  name: string
  /** Values a consumer may override as props. */
  defaults: O
  /**
   * Rendered once and kept mounted. Masks and filters the stylesheet refers to
   * live here — they must sit above the page, because a page unmounts during
   * the navigation and would take its own defs with it.
   */
  defs: ReactNode | ((options: O) => ReactNode)
  /** Runs once per navigation, before the snapshot is taken. `nav` says where from and where to. */
  prepare?: (options: O, nav: { from: string; to: string }) => void
  /**
   * Drives one frame. progress runs 0 to 1. Omit it when the stylesheet does
   * the animating — the core still holds the snapshot open for the duration.
   */
  paint?: (progress: number, options: O) => void
  /** Seconds the transition should last. */
  duration: (options: O) => number
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Left alone: new tab, modified click, downloads, external, and same-page hashes. */
const isPlainInternalLink = (a: HTMLAnchorElement, e: MouseEvent) => {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false
  if (a.target && a.target !== '_self') return false
  if (a.hasAttribute('download')) return false
  const url = new URL(a.href, location.href)
  if (url.origin !== location.origin) return false
  if (url.pathname === location.pathname && url.hash) return false
  return true
}

/**
 * Turns a View Transitions config into a drop-in provider.
 *
 *   // app/layout.tsx
 *   <FilmBurnTransition>{children}</FilmBurnTransition>
 *
 * Unlike an overlay transition, this one has the outgoing page and the incoming
 * page on screen at the same time — the browser snapshots the old one — so the
 * effect can cut through one to the other rather than covering and uncovering.
 *
 * Browsers without the API navigate normally. Nothing breaks; there is simply
 * no animation.
 */
export function createViewTransition<O extends object>(config: ViewTransitionConfig<O>) {
  return function Transition({
    children,
    ...overrides
  }: { children: ReactNode } & Partial<O>) {
    const router = useRouter()
    const options = { ...config.defaults, ...(overrides as Partial<O>) } as O
    const latest = useRef(options)
    latest.current = options

    useEffect(() => {
      const onClick = (e: MouseEvent) => {
        const a = (e.target as Element | null)?.closest?.('a')
        if (!a || !isPlainInternalLink(a, e)) return

        const href = a.getAttribute('href')
        if (!href) return

        if (!document.startViewTransition || prefersReducedMotion()) return

        e.preventDefault()
        const o = latest.current
        const seconds = config.duration(o)

        try {
          config.prepare?.(o, { from: location.pathname, to: new URL(href, location.href).pathname })
          config.paint?.(0, o)
        } catch (error) {
          console.error('[transition] prepare failed, navigating plainly', error)
          router.push(href)
          return
        }

        const root = document.documentElement
        root.classList.add(`vt-${config.name}`)
        root.style.setProperty('--vt-duration', `${seconds}s`)

        const transition = document.startViewTransition(() => {
          router.push(href)
        })

        const cleanup = () => root.classList.remove(`vt-${config.name}`)
        transition.finished.then(cleanup, cleanup)

        transition.ready
          .then(() => {
            // Holds the snapshot on screen. Without an animation of its own the
            // browser ends the transition on the next frame and the pseudo
            // elements vanish before anything has been drawn.
            document.documentElement.animate(
              { opacity: [1, 1] },
              { duration: seconds * 1000, pseudoElement: '::view-transition-old(root)' },
            )

            if (!config.paint) return

            const start = performance.now()
            const step = () => {
              const t = Math.min(1, (performance.now() - start) / (seconds * 1000))
              try {
                config.paint!(t, o)
              } catch (error) {
                console.error('[transition] paint failed', error)
                return
              }
              if (t < 1) requestAnimationFrame(step)
            }
            requestAnimationFrame(step)
          })
          .catch(() => {
            /* transition was skipped or superseded; the navigation still happened */
          })
      }

      document.addEventListener('click', onClick)
      return () => document.removeEventListener('click', onClick)
    }, [router])

    return (
      <>
        {children}
        {typeof config.defs === 'function' ? config.defs(options) : config.defs}
      </>
    )
  }
}
