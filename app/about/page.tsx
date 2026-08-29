export default function About() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-20">
      <h1 className="text-5xl font-semibold tracking-tight">About</h1>
      <div className="mt-6 max-w-xl space-y-5 text-base leading-relaxed text-muted-foreground">
        <p>
          Every transition in this registry is the same two things: some markup that
          covers the screen, and two timelines that move it. The shared core handles link
          interception, the timeout failsafe and reduced-motion, so a new transition is
          only ever the interesting part.
        </p>
        <p>
          The core is engine-agnostic. It hands you the overlay element and waits for you
          to call <code className="font-mono text-foreground">done()</code>. Crayon uses
          GSAP. Something else could use Motion. One engine per transition, never both.
        </p>
      </div>
    </main>
  )
}
