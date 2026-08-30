import type { PropDoc } from '@/lib/transitions'

export function ApiReference({ props }: { props: PropDoc[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {['Property', 'Type', 'Default'].map((h) => (
              <th key={h} className="px-4 py-2.5 text-xs font-medium text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.map((p) => (
            <tr key={p.name} className="border-b border-border/60 last:border-0 align-top">
              <td className="px-4 py-4">
                <div className="font-mono text-[13px] text-foreground">{p.name}</div>
                <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
                  {p.description}
                </p>
              </td>
              <td className="px-4 py-4">
                <code className="inline-block max-w-[16rem] rounded-md bg-muted px-2 py-1 font-mono text-[11px] leading-relaxed text-muted-foreground">
                  {p.type}
                </code>
              </td>
              <td className="px-4 py-4">
                {p.def === '—' ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  <code className="rounded-md bg-muted px-2 py-1 font-mono text-[11px] text-muted-foreground">
                    {p.def}
                  </code>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
