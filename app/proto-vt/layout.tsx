import { BurnMaskDefs } from './burn-mask'
import './vt.css'

export default function ProtoVtLayout({ children }: LayoutProps<'/proto-vt'>) {
  return (
    <>
      {children}
      <BurnMaskDefs />
    </>
  )
}
