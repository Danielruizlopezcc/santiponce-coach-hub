import Link from 'next/link'
import { CLUB, LEGAL_NAV, PUBLIC_NAV } from '@/lib/club'

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background/70 backdrop-blur">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-sm font-bold text-foreground">{CLUB.shortName}</p>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            {CLUB.legalName}. Plataforma oficial del club. Temporada{' '}
            {CLUB.season}.
          </p>
        </div>

        <nav aria-label="Enlaces" className="text-sm">
          <p className="mb-3 font-semibold text-foreground">Navegación</p>
          <ul className="flex flex-col gap-2">
            {PUBLIC_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded text-muted-foreground outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Información legal" className="text-sm">
          <p className="mb-3 font-semibold text-foreground">Legal</p>
          <ul className="flex flex-col gap-2">
            {LEGAL_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded text-muted-foreground outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-border/60">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} {CLUB.legalName}. Todos los derechos
          reservados.
        </p>
      </div>
    </footer>
  )
}
