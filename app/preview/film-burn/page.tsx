import Link from 'next/link'

/* Light pages on purpose — fire reads much better against white than it does
   against a dark background, where the char end of the ramp disappears. */
export default function A() {
  return (
    <main
      style={{
        height: '100dvh',
        overflow: 'hidden',
        background: '#ffffff',
        color: '#14110e',
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        padding: 40,
      }}
    >
      <div>
        <p style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '.3em', opacity: 0.45 }}>
          PAGE ONE — CENTRED
        </p>
        <h1 style={{ fontSize: 52, margin: '18px 0 0', maxWidth: 620, lineHeight: 1.05 }}>
          One fire, straight through.
        </h1>
        <p style={{ marginTop: 30, fontSize: 16 }}>
          <Link href="/preview/film-burn/b" style={{ color: '#b8460f' }}>
            burn to page two →
          </Link>
        </p>
      </div>
    </main>
  )
}
