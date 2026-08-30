import Link from 'next/link'

export default function B() {
  return (
    <main
      style={{
        height: '100dvh',
        overflow: 'hidden',
        background: '#e8e4dc',
        color: '#17150f',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        padding: '56px 48px',
      }}
    >
      <p style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '.3em', opacity: 0.5 }}>
        TWO — LIGHT
      </p>
      <h1 style={{ fontSize: 76, margin: '18px 0 0', maxWidth: 900, lineHeight: 0.98, letterSpacing: '-0.03em' }}>
        And this one rises over it.
      </h1>
      <div style={{ marginTop: 'auto', display: 'grid', gap: 10, maxWidth: 420 }}>
        {['direction', 'depth', 'travel', 'dim'].map((k) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(0,0,0,.15)', paddingTop: 8, fontFamily: 'monospace', fontSize: 12 }}>
            <span>{k}</span>
            <span style={{ opacity: 0.5 }}>prop</span>
          </div>
        ))}
        <Link href="/preview/riser" style={{ color: '#17150f', fontSize: 15, marginTop: 12, width: 'fit-content', justifySelf: 'start' }}>
          ← back
        </Link>
      </div>
    </main>
  )
}
