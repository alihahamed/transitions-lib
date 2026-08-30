import Link from 'next/link'

/*
 * Cool mid-tones, flat colour. Fire needs the page dark enough for the white
 * core and amber to punch, but light enough that the deep red tail still
 * registers — white loses the tail, near-black loses it too. Pine sits at 0.13
 * luminance, which holds both ends.
 */
export default function A() {
  return (
    <main
      style={{
        height: '100dvh',
        overflow: 'hidden',
        background: '#3c6f62',
        color: '#f2f7f5',
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        padding: 40,
      }}
    >
      <div>
        <p style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '.3em', opacity: 0.6 }}>
          PAGE ONE — CENTRED
        </p>
        <h1 style={{ fontSize: 52, margin: '18px 0 0', maxWidth: 620, lineHeight: 1.05 }}>
          One fire, straight through.
        </h1>
        <p style={{ marginTop: 30, fontSize: 16 }}>
          <Link href="/preview/film-burn/b" style={{ color: '#ffd9a0' }}>
            burn to page two →
          </Link>
        </p>
      </div>
    </main>
  )
}
