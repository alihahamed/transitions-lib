import { ZipperTransition } from '@/components/zipper'

/** Bare frame — no site chrome, so the transition is the only thing moving. */
export default function ZipperPreviewLayout({ children }: LayoutProps<'/preview/zipper'>) {
  return <ZipperTransition>{children}</ZipperTransition>
}
