const projects = [
  ['Kestrel', 'Identity and site for a small aviation studio'],
  ['Nine Mile', 'Editorial platform, 40k words a week'],
  ['Halcyon', 'Booking flow rebuilt around one screen'],
  ['Ferrous', 'Hardware catalogue, 12k SKUs'],
]

export default function Work() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-20">
      <h1 className="text-5xl font-semibold tracking-tight">Work</h1>
      <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
        A second page, so the strokes have somewhere to go. Navigate back and forth and
        watch the stagger — each stroke leaves on its own beat.
      </p>
      <ul className="mt-12 divide-y divide-border/60 border-y border-border/60">
        {projects.map(([name, note]) => (
          <li key={name} className="flex flex-wrap items-baseline gap-x-6 gap-y-1 py-5">
            <span className="w-32 font-medium">{name}</span>
            <span className="text-sm text-muted-foreground">{note}</span>
          </li>
        ))}
      </ul>
    </main>
  )
}
