import type { Metadata } from 'next'
import Link from 'next/link'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'transitions — page transitions for shadcn',
  description:
    'Page transitions and shared-element connectors built on the native View Transitions API. Install with the shadcn CLI.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      style={{ colorScheme: 'dark' }}
    >
      <body className="bg-background text-foreground min-h-full flex flex-col">
        <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
          <nav className="mx-auto flex h-14 w-full max-w-5xl items-center gap-6 px-6 text-sm">
            <Link href="/" className="font-medium tracking-tight">
              transitions<span className="text-muted-foreground">/ui</span>
            </Link>
            <div className="ml-auto flex items-center gap-5 text-muted-foreground">
              <Link href="/gallery" className="hover:text-foreground transition-colors">
                Connector
              </Link>
            </div>
          </nav>
        </header>
        {children}
        <footer className="mt-auto border-t border-border/60 px-6 py-6 text-center text-xs text-muted-foreground">
          Native View Transitions API · no animation library · MIT
        </footer>
      </body>
    </html>
  )
}
