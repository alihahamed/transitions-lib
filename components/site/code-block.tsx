'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-muted/30">
      {label && (
        <div className="border-b border-border/60 px-4 py-2 font-mono text-[11px] text-muted-foreground">
          {label}
        </div>
      )}
      <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-muted-foreground">
        {code}
      </pre>
      <button
        onClick={copy}
        aria-label="Copy to clipboard"
        className="absolute right-2 top-2 rounded-md border border-border bg-background/80 p-1.5 text-muted-foreground opacity-0 backdrop-blur transition-all hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  )
}
