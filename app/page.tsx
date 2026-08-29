import Link from 'next/link'

const install = `npx shadcn@latest add https://transitions-lib.vercel.app/r/connector.json`

const usage = `// app/gallery/page.tsx
<Connector id={\`tile-\${item.id}\`}>
  <Thumb />
</Connector>

// app/gallery/[id]/page.tsx  — same id, different shape
<Connector id={\`tile-\${item.id}\`}>
  <Hero />
</Connector>`

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-20">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        shadcn registry · next.js app router
      </p>
      <h1 className="mt-4 max-w-2xl text-5xl font-semibold leading-[1.05] tracking-tight">
        One id on two routes.
        <span className="text-muted-foreground"> The browser does the rest.</span>
      </h1>
      <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
        <code className="font-mono text-foreground">&lt;Connector&gt;</code> is a
        shared-element page transition built on the native View Transitions API. Name an
        element on the page you leave and the page you land on, and it morphs between
        them — position, size, aspect ratio, all handled by the browser.
      </p>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
        No animation library. No runtime. It is a React Server Component and about
        twenty lines of CSS.
      </p>

      <div className="mt-10">
        <Link
          href="/gallery"
          className="inline-block rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          See it move
        </Link>
      </div>

      <section className="mt-20 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-sm font-medium">Install</h2>
          <pre className="mt-3 overflow-x-auto rounded-xl border border-border bg-muted/40 p-4 font-mono text-[12px] leading-relaxed text-muted-foreground">
            {install}
          </pre>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Drops <code className="font-mono">components/connector.tsx</code> and{' '}
            <code className="font-mono">components/transitions.css</code> into your
            project. You own both.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-medium">Use</h2>
          <pre className="mt-3 overflow-x-auto rounded-xl border border-border bg-muted/40 p-4 font-mono text-[12px] leading-relaxed text-muted-foreground">
            {usage}
          </pre>
        </div>
      </section>

      <section className="mt-20 max-w-xl">
        <h2 className="text-sm font-medium">Notes</h2>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
          <li>
            Ids must be unique per page. Two live elements sharing one id cancels the
            morph.
          </li>
          <li>
            Tune <code className="font-mono text-foreground">--t-duration</code> and{' '}
            <code className="font-mono text-foreground">--t-ease</code> in{' '}
            <code className="font-mono">transitions.css</code>.
          </li>
          <li>
            Browsers without the View Transitions API just navigate. Nothing breaks,
            nothing to polyfill.
          </li>
        </ul>
      </section>
    </main>
  )
}
