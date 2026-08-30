import { BurnMaskNav } from '@/app/proto-vt/burn-mask'

/* Deliberately different layout from page two, so it is obvious which one is
   rendering at any moment during the burn. */
export default function A() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        background: 'linear-gradient(150deg,#123f36,#0d5c4a 55%,#0a3b31)',
        color: 'white',
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        padding: 40,
      }}
    >
      <div>
        <p style={{ fontFamily: 'monospace', fontSize: 12, letterSpacing: '.3em', opacity: 0.55 }}>
          PAGE ONE — CENTRED
        </p>
        <h1 style={{ fontSize: 64, margin: '20px 0 0', maxWidth: 780, lineHeight: 1.05 }}>
          One fire, straight through.
        </h1>
        <p style={{ marginTop: 36, fontSize: 18 }}>
          <BurnMaskNav href="/proto-vt/b">burn to page two →</BurnMaskNav>
        </p>
      </div>
    </main>
  )
}
