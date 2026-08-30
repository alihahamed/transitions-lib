'use client'

import { useMemo, useState } from 'react'
import type { Control } from '@/lib/transitions'

export type Values = Record<string, string | number>

export const defaultsOf = (controls: Control[]): Values =>
  Object.fromEntries(controls.map((c) => [c.key, c.def]))

/** Only what differs from the defaults, so the preview URL stays readable. */
export const changedOnly = (controls: Control[], values: Values) =>
  Object.fromEntries(
    controls.filter((c) => values[c.key] !== c.def).map((c) => [c.key, String(values[c.key])]),
  )

function Row({
  control,
  value,
  onChange,
}: {
  control: Control
  value: string | number
  onChange: (v: string | number) => void
}) {
  const base =
    'flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2.5'

  if (control.kind === 'color') {
    return (
      <label className={base}>
        <span className="flex-1 text-[13px]">{control.label}</span>
        <input
          type="color"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="size-5 cursor-pointer rounded border border-border bg-transparent"
        />
        <code className="w-[4.5rem] rounded bg-muted px-1.5 py-0.5 text-center font-mono text-[11px] text-muted-foreground">
          {String(value)}
        </code>
      </label>
    )
  }

  if (control.kind === 'select') {
    return (
      <label className={base}>
        <span className="flex-1 text-[13px]">{control.label}</span>
        <select
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[11px] text-foreground"
        >
          {control.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    )
  }

  return (
    <label className={base}>
      <span className="w-24 shrink-0 text-[13px]">{control.label}</span>
      <input
        type="range"
        min={control.min}
        max={control.max}
        step={control.step}
        value={Number(value)}
        onChange={(e) => onChange(+e.target.value)}
        className="min-w-0 flex-1"
      />
      <code className="w-12 shrink-0 text-right font-mono text-[11px] text-muted-foreground">
        {Number(value)}
      </code>
    </label>
  )
}

/**
 * Renders whatever a transition declares. Nothing here knows what a zip or a
 * crayon is — the same panel serves the docs page and the lab harness.
 */
export function Customize({
  controls,
  values,
  onChange,
  onReset,
  title = 'Customize',
}: {
  controls: Control[]
  values: Values
  onChange: (next: Values) => void
  onReset: () => void
  title?: string
}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        <button
          onClick={onReset}
          className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          reset
        </button>
      </div>
      <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
        {controls.map((c) => (
          <Row
            key={c.key}
            control={c}
            value={values[c.key] ?? c.def}
            onChange={(v) => onChange({ ...values, [c.key]: v })}
          />
        ))}
      </div>
    </div>
  )
}

/** Convenience for pages that just want local state. */
export function useCustomize(controls: Control[]) {
  const initial = useMemo(() => defaultsOf(controls), [controls])
  const [values, setValues] = useState<Values>(initial)
  const query = useMemo(
    () => new URLSearchParams(changedOnly(controls, values)).toString(),
    [controls, values],
  )
  return { values, setValues, reset: () => setValues(initial), query }
}
