import Link from 'next/link'

export default function B() {
  return (
    <main
      style={{
        height: '100dvh',
        overflow: 'hidden',
        background: '#f2ede4',
        color: '#14110e',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: 48,
      }}
    >
      <p style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '.3em', opacity: 0.45 }}>
        PAGE TWO — BOTTOM LEFT
      </p>
      <h1 style={{ fontSize: 34, margin: '14px 0 0', maxWidth: 460, lineHeight: 1.15 }}>
        Different layout on purpose.
      </h1>
      <div style={{ height: 1, background: 'rgba(0,0,0,.18)', margin: '22px 0', maxWidth: 460 }} />
      <p style={{ fontSize: 16 }}>
        <Link href="/preview/film-burn" style={{ color: '#b8460f' }}>
          burn back →
        </Link>
      </p>
    </main>
  )
}
