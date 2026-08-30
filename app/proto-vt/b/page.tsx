import { BurnMaskNav } from '@/app/proto-vt/burn-mask'

/* Bottom-left, stacked, ruled — nothing like page one, so there is no
   mistaking one for the other mid-burn. */
export default function B() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        background: 'linear-gradient(150deg,#33235c,#4a2b7a 55%,#2a1c4d)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: 56,
      }}
    >
      <p style={{ fontFamily: 'monospace', fontSize: 12, letterSpacing: '.3em', opacity: 0.55 }}>
        PAGE TWO — BOTTOM LEFT
      </p>
      <h1 style={{ fontSize: 40, margin: '16px 0 0', maxWidth: 520, lineHeight: 1.15 }}>
        Different layout on purpose.
      </h1>
      <div style={{ height: 1, background: 'rgba(255,255,255,.25)', margin: '28px 0', maxWidth: 520 }} />
      <p style={{ fontSize: 18 }}>
        <BurnMaskNav href="/proto-vt">burn back →</BurnMaskNav>
      </p>
    </main>
  )
}
