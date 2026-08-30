import Link from 'next/link'

export default function A() {
  return (
    <main
      style={{
        height: '100dvh',
        overflow: 'hidden',
        background: '#141416',
        color: '#f4f2ee',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        padding: '56px 48px',
      }}
    >
      <p style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '.3em', opacity: 0.5 }}>
        ONE — INDEX
      </p>
      <h1 style={{ fontSize: 76, margin: '18px 0 0', maxWidth: 900, lineHeight: 0.98, letterSpacing: '-0.03em' }}>
        The page behind you falls away.
      </h1>
      <div style={{ marginTop: 'auto', display: 'flex', gap: 40, alignItems: 'flex-end' }}>
        <p style={{ fontSize: 15, maxWidth: 320, opacity: 0.65, lineHeight: 1.5 }}>
          Watch the outgoing page shrink back rather than simply vanish. That depth is
          the whole trick.
        </p>
        <Link href="/preview/riser/b" style={{ color: '#f4f2ee', fontSize: 15, width: 'fit-content' }}>
          next →
        </Link>
      </div>
    </main>
  )
}
