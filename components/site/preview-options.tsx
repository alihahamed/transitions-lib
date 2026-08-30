'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

const NUMERIC = /^-?\d+(\.\d+)?$/

/**
 * Options for a preview frame, read from the query string.
 *
 * Held in state rather than read straight off the URL: the links between the
 * two preview routes carry no query, so reading directly would reset every
 * option the moment the page transitions. The preview layout spans both routes
 * and does not remount, so the last values asked for are the ones that stick.
 */
export function usePreviewOptions(): Record<string, string | number> {
  const params = useSearchParams()
  const parse = () =>
    Object.fromEntries(
      [...params.entries()].map(([k, v]) => [k, NUMERIC.test(v) ? Number(v) : v]),
    )

  const [options, setOptions] = useState(parse)

  useEffect(() => {
    const next = parse()
    if (Object.keys(next).length) setOptions(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  return options
}

/** Colour overrides arrive as plain keys; map them onto the CSS variables. */
export const cssVars = (options: Record<string, string | number>, map: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(map)
      .filter(([key]) => options[key] != null)
      .map(([key, variable]) => [variable, String(options[key])]),
  ) as React.CSSProperties
