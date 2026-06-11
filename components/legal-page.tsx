import type { ReactNode } from 'react'
import Link from 'next/link'
import { LEGAL_NAV } from '@/lib/club'
import { cn } from '@/lib/utils'

type LegalPageProps = {
  title: string
  updatedAt: string
  current: string
  children: ReactNode
}

export function LegalPage({
  title,
  updatedAt,
  current,
  children,
}: LegalPageProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="grid gap-10 lg:grid-cols-[16rem_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav aria-label="Documentos legales">
            <p className="mb-3 text-sm font-semibold text-foreground">
              Información legal
            </p>
            <ul className="flex flex-col gap-1">
              {LEGAL_NAV.map((item) => {
                const active = item.href === current
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'block rounded-md px-3 py-2 text-sm transition-colors outline-none',
                        'hover:bg-accent hover:text-accent-foreground',
                        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        active
                          ? 'bg-accent font-medium text-accent-foreground'
                          : 'text-muted-foreground',
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </aside>

        <article className="min-w-0">
          <header className="border-b border-border/60 pb-6">
            <h1 className="text-3xl font-bold tracking-tight text-balance text-foreground">
              {title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Última actualización: {updatedAt}
            </p>
          </header>

          <div className="mt-8 flex flex-col gap-6 text-pretty leading-relaxed text-muted-foreground">
            {children}
          </div>
        </article>
      </div>
    </div>
  )
}

export function LegalSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  )
}
