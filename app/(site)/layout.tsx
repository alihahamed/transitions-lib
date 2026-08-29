import Link from 'next/link'

export default function SiteLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <nav className="mx-auto flex h-14 w-full max-w-5xl items-center gap-6 px-6 text-sm">
          <Link href="/" className="font-medium tracking-tight">
            transitions<span className="text-muted-foreground">/ui</span>
          </Link>
          <div className="ml-auto flex items-center gap-5 font-mono text-xs text-muted-foreground">
            <Link href="/transitions" className="transition-colors hover:text-foreground">
              gallery
            </Link>
            <a
              href="https://github.com/alihahamed/transitions-lib"
              className="transition-colors hover:text-foreground"
            >
              github
            </a>
          </div>
        </nav>
      </header>
      {children}
      <footer className="mt-auto border-t border-border/60 px-6 py-6 text-center font-mono text-[11px] text-muted-foreground">
        one line in your layout · MIT
      </footer>
    </>
  )
}
