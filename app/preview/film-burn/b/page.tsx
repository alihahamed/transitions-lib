import Link from 'next/link'

export default function B() {
  return (
    <main
      style={{
        height: '100dvh',
        overflow: 'hidden',
        background: 'linear-gradient(150deg,#33235c,#4a2b7a 55%,#2a1c4d)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: 48,
      }}
    >
      <p style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '.3em', opacity: 0.55 }}>
        PAGE TWO — BOTTOM LEFT
      </p>
      <h1 style={{ fontSize: 34, margin: '14px 0 0', maxWidth: 460, lineHeight: 1.15 }}>
        Different layout on purpose.
      </h1>
      <div style={{ height: 1, background: 'rgba(255,255,255,.25)', margin: '22px 0', maxWidth: 460 }} />
      <p style={{ fontSize: 16 }}>
        <Link href="/preview/film-burn">burn back →</Link>
      </p>
    </main>
  )
}
