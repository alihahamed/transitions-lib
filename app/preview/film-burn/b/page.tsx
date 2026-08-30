import Link from 'next/link'

export default function B() {
  return (
    <main
      style={{
        height: '100dvh',
        overflow: 'hidden',
        background: '#4c5f80',
        color: '#f1f4f9',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: 48,
      }}
    >
      <p style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '.3em', opacity: 0.6 }}>
        PAGE TWO — BOTTOM LEFT
      </p>
      <h1 style={{ fontSize: 34, margin: '14px 0 0', maxWidth: 460, lineHeight: 1.15 }}>
        Different layout on purpose.
      </h1>
      <div style={{ height: 1, background: 'rgba(255,255,255,.28)', margin: '22px 0', maxWidth: 460 }} />
      <p style={{ fontSize: 16 }}>
        <Link href="/preview/film-burn" style={{ color: '#ffd9a0' }}>
          burn back →
        </Link>
      </p>
    </main>
  )
}
