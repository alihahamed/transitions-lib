'use client'

import { TransitionRouter } from 'next-transition-router'
import { useEffect, useRef, type ReactNode } from 'react'

/** Passed to every phase. Query your own nodes out of `overlay`. */
export type TransitionContext = {
  overlay: HTMLDivElement
  /** Call when the animation is finished. The navigation waits for this. */
  done: () => void
}

/** A phase may return a cleanup function, called if the phase is interrupted. */
export type Phase = (ctx: TransitionContext) => void | (() => void)

export type TransitionConfig = {
  /** Markup that covers the screen. Rendered once, reused for every navigation. */
  overlay: ReactNode
  /** Runs once after mount — measure paths, set starting state. */
  setup?: (overlay: HTMLDivElement) => void
  /** Plays before the route changes. */
  leave: Phase
  /** Plays after the route changes. */
  enter: Phase
  /**
   * Failsafe. If a phase never calls done() the navigation continues anyway,
   * so a broken animation can never trap someone behind an opaque overlay.
   */
  timeout?: number
}

const DEFAULT_TIMEOUT = 4000

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Turns a transition config into a drop-in provider.
 *
 *   // app/layout.tsx
 *   <CrayonTransition>{children}</CrayonTransition>
 *
 * Engine-agnostic: the phases can use GSAP, Motion, or raw WAAPI. The core only
 * cares that `done()` eventually gets called.
 */
export function createTransition(config: TransitionConfig) {
  const timeout = config.timeout ?? DEFAULT_TIMEOUT

  return function Transition({ children }: { children: ReactNode }) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
      if (ref.current) config.setup?.(ref.current)
    }, [])

    const run = (phase: Phase) => (next: () => void) => {
      const overlay = ref.current

      // No overlay yet, or the user asked for less motion — navigate straight through.
      if (!overlay || prefersReducedMotion()) {
        next()
        return
      }

      let settled = false
      const done = () => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        next()
      }
      const timer = setTimeout(() => {
        console.warn(`[transition] phase exceeded ${timeout}ms, continuing`)
        done()
      }, timeout)

      let cleanup: void | (() => void)
      try {
        cleanup = phase({ overlay, done })
      } catch (error) {
        console.error('[transition] phase threw, continuing', error)
        done()
      }

      return () => {
        clearTimeout(timer)
        settled = true
        cleanup?.()
      }
    }

    return (
      <TransitionRouter auto leave={run(config.leave)} enter={run(config.enter)}>
        <div ref={ref} className="transition-overlay" aria-hidden>
          {config.overlay}
        </div>
        {children}
      </TransitionRouter>
    )
  }
}
