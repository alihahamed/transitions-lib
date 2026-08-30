import { BurnMaskNav } from '@/app/proto-vt/burn-mask'

export default function B() {
  return (
    <main style={{ minHeight: '100dvh', background: 'linear-gradient(150deg,#33235c,#4a2b7a 55%,#2a1c4d)', padding: 40, color: 'white' }}>
      <p style={{ fontFamily: 'monospace', fontSize: 12, letterSpacing: '.2em', opacity: 0.6 }}>PAGE TWO</p>
      <h1 style={{ fontSize: 44, marginTop: 24, maxWidth: 620 }}>If you can read this through a burning hole, it works.</h1>
      <p style={{ marginTop: 32, fontSize: 18 }}>
        <BurnMaskNav href="/proto-vt">burn back →</BurnMaskNav>
      </p>
    </main>
  )
}
