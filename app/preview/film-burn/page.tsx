import Link from 'next/link'

export default function A() {
  return (
    <main
      style={{
        height: '100dvh',
        overflow: 'hidden',
        background: 'linear-gradient(150deg,#123f36,#0d5c4a 55%,#0a3b31)',
        color: 'white',
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        padding: 40,
      }}
    >
      <div>
        <p style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '.3em', opacity: 0.55 }}>
          PAGE ONE — CENTRED
        </p>
        <h1 style={{ fontSize: 52, margin: '18px 0 0', maxWidth: 620, lineHeight: 1.05 }}>
          One fire, straight through.
        </h1>
        <p style={{ marginTop: 30, fontSize: 16 }}>
          <Link href="/preview/film-burn/b">burn to page two →</Link>
        </p>
      </div>
    </main>
  )
}
