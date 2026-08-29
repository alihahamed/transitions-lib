import type { Metadata } from 'next'
import Link from 'next/link'
import { Geist, Geist_Mono } from 'next/font/google'
import { CrayonTransition } from '@/components/crayon'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'transitions — characterful page transitions for Next.js',
  description:
    'Page transitions with actual personality, installed with the shadcn CLI. One line in your layout.',
}

const links = [
  { href: '/', label: 'home' },
  { href: '/work', label: 'work' },
  { href: '/about', label: 'about' },
]

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      style={{ colorScheme: 'dark' }}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <CrayonTransition>
          <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
            <nav className="mx-auto flex h-14 w-full max-w-4xl items-center gap-6 px-6 text-sm">
              <span className="font-medium tracking-tight">
                transitions<span className="text-muted-foreground">/ui</span>
              </span>
              <div className="ml-auto flex items-center gap-5 font-mono text-xs text-muted-foreground">
                {links.map((l) => (
                  <Link key={l.href} href={l.href} className="transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                ))}
              </div>
            </nav>
          </header>
          {children}
        </CrayonTransition>
      </body>
    </html>
  )
}
