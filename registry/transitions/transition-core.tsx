'use client'

import { TransitionRouter } from 'next-transition-router'
import { useEffect, useRef, type ReactNode } from 'react'

/** Passed to every phase. Query your own nodes out of `overlay`. */
export type TransitionContext<O> = {
  overlay: HTMLDivElement
  /** Whatever the component was given, merged over the config defaults. */
  options: O
  /** Call when the animation is finished. The navigation waits for this. */
  done: () => void
}

/** A phase may return a cleanup function, called if the phase is interrupted. */
export type Phase<O> = (ctx: TransitionContext<O>) => void | (() => void)

export type TransitionConfig<O> = {
  /**
   * Markup that covers the screen. A function when the markup itself depends on
   * the options; otherwise rendered once and reused for every navigation.
   */
  overlay: ReactNode | ((options: O) => ReactNode)
  /** Values a consumer may override as props. */
  defaults: O
  /** Runs once after mount — measure paths, set starting state. */
  setup?: (overlay: HTMLDivElement, options: O) => void
  /** Plays before the route changes. */
  leave: Phase<O>
  /** Plays after the route changes. */
  enter: Phase<O>
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
export function createTransition<O extends object>(config: TransitionConfig<O>) {
  const timeout = config.timeout ?? DEFAULT_TIMEOUT

  return function Transition({
    children,
    ...overrides
  }: { children: ReactNode } & Partial<O>) {
    const ref = useRef<HTMLDivElement>(null)
    const options = { ...config.defaults, ...(overrides as Partial<O>) } as O

    // Phases read this rather than closing over a stale render's options.
    const latest = useRef(options)
    latest.current = options

    useEffect(() => {
      if (ref.current) config.setup?.(ref.current, latest.current)
    }, [])

    const run = (phase: Phase<O>) => (next: () => void) => {
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
        cleanup = phase({ overlay, options: latest.current, done })
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
          {typeof config.overlay === 'function' ? config.overlay(options) : config.overlay}
        </div>
        {children}
      </TransitionRouter>
    )
  }
}
