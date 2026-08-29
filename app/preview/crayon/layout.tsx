import { CrayonTransition } from '@/components/crayon'

/** Bare frame — no site chrome, so the transition is the only thing moving. */
export default function CrayonPreviewLayout({ children }: LayoutProps<'/preview/crayon'>) {
  return <CrayonTransition>{children}</CrayonTransition>
}
