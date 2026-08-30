import { BurnMaskNav } from '@/app/proto-vt/burn-mask'

export default function A() {
  return (
    <main style={{ minHeight: '100dvh', background: 'linear-gradient(150deg,#123f36,#0d5c4a 55%,#0a3b31)', padding: 40, color: 'white' }}>
      <p style={{ fontFamily: 'monospace', fontSize: 12, letterSpacing: '.2em', opacity: 0.6 }}>PAGE ONE</p>
      <h1 style={{ fontSize: 44, marginTop: 24, maxWidth: 620 }}>One fire. The page behind should show through the hole.</h1>
      <p style={{ marginTop: 32, fontSize: 18 }}>
        <BurnMaskNav href="/proto-vt/b">burn to page two →</BurnMaskNav>
      </p>
    </main>
  )
}
