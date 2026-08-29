const install = `npx shadcn@latest add \\
  https://transitions-lib.vercel.app/r/crayon.json`

const usage = `// app/layout.tsx
import { CrayonTransition } from '@/components/crayon'

<body>
  <CrayonTransition>{children}</CrayonTransition>
</body>`

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-20">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        shadcn registry · next.js app router
      </p>
      <h1 className="mt-4 max-w-2xl text-5xl font-semibold leading-[1.05] tracking-tight">
        Page transitions with
        <span className="text-muted-foreground"> a hand in them.</span>
      </h1>
      <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
        Not fades. Not slides. Strokes that draw themselves across the screen, swap the
        route behind their own ink, and retract away. Click <span className="font-mono text-foreground">work</span> or{' '}
        <span className="font-mono text-foreground">about</span> up there.
      </p>

      <section className="mt-16 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-sm font-medium">Install</h2>
          <pre className="mt-3 overflow-x-auto rounded-xl border border-border bg-muted/40 p-4 font-mono text-[12px] leading-relaxed text-muted-foreground">
            {install}
          </pre>
        </div>
        <div>
          <h2 className="text-sm font-medium">Use</h2>
          <pre className="mt-3 overflow-x-auto rounded-xl border border-border bg-muted/40 p-4 font-mono text-[12px] leading-relaxed text-muted-foreground">
            {usage}
          </pre>
        </div>
      </section>

      <section className="mt-16 max-w-xl">
        <h2 className="text-sm font-medium">What you get for free</h2>
        <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
          <li>· Link interception — your <code className="font-mono">&lt;Link&gt;</code>s already work</li>
          <li>· Timeout failsafe — a broken animation can never trap someone behind the overlay</li>
          <li>· <code className="font-mono">prefers-reduced-motion</code> — navigates instantly instead</li>
          <li>· Recolour with <code className="font-mono">--crayon-1/2/3</code></li>
        </ul>
      </section>
    </main>
  )
}
