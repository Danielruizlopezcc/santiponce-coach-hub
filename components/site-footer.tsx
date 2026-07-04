import Image from 'next/image'
import Link from 'next/link'
import { CLUB, LEGAL_NAV } from '@/lib/club'

const FOOTER_COLUMNS = [
  {
    title: 'Club',
    links: [
      { label: 'Inicio', href: '/' },
      { label: 'Noticias', href: '/noticias' },
      { label: 'Calendario', href: '/calendario' },
      { label: 'Equipos', href: '/equipos' },
      { label: 'Patrocinadores', href: '/patrocinadores' },
    ],
  },
  {
    title: 'Familias',
    links: [
      { label: 'Registro', href: '/registro' },
      { label: 'Acceso', href: '/iniciar-sesion' },
      { label: 'Perfil', href: '/app/perfil' },
    ],
  },
  {
    title: 'Información',
    links: [
      { label: 'Privacidad', href: '/legal/privacidad' },
      { label: 'Condiciones', href: '/legal/condiciones-matricula' },
      { label: 'Pagos', href: '/legal/pagos-devoluciones' },
      { label: 'Contacto', href: '/legal/aviso-legal' },
    ],
  },
]

const PARTNERS = ['Santiponce', 'Cantera', 'Escuela', 'Familias', 'Temporada 26/27', 'CDS']
const SOCIALS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/CDSantiponce/?locale=es_ES',
    icon: (
      <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
        <path
          fill="currentColor"
          d="M22 12.06C22 6.48 17.52 2 11.94 2S2 6.48 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.9h2.78l-.44 2.91h-2.34V22C18.34 21.24 22 17.08 22 12.06Z"
        />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/cd_santiponce?igsh=enpuaTJ3NGpycXN0',
    icon: (
      <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
        <path
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M7.5 2.75h9A4.75 4.75 0 0 1 21.25 7.5v9a4.75 4.75 0 0 1-4.75 4.75h-9A4.75 4.75 0 0 1 2.75 16.5v-9A4.75 4.75 0 0 1 7.5 2.75Zm8.75 4h.01M8.25 12a3.75 3.75 0 1 0 7.5 0 3.75 3.75 0 0 0-7.5 0Z"
        />
      </svg>
    ),
  },
  {
    label: 'X',
    href: 'https://x.com/cd_santiponce?s=11',
    icon: (
      <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
        <path
          fill="currentColor"
          d="M17.53 3h3.27l-7.14 8.16L22.06 21h-6.58l-5.15-6.73L4.43 21H1.16l7.64-8.73L.75 3h6.75l4.66 6.16L17.53 3Zm-1.15 16.27h1.81L6.51 4.64H4.57l11.81 14.63Z"
        />
      </svg>
    ),
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@cd.santiponce.196?_r=1',
    icon: (
      <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
        <path
          fill="currentColor"
          d="M16.6 3c.35 2.13 1.56 3.4 3.4 3.73v3.12a7.2 7.2 0 0 1-3.32-.94v5.8c0 3.95-2.43 6.29-5.86 6.29-3.18 0-5.82-2.18-5.82-5.35 0-3.4 2.7-5.55 6.29-5.29v3.25c-1.52-.22-2.82.55-2.82 1.91 0 1.17.95 1.96 2.15 1.96 1.36 0 2.38-.79 2.38-2.78V3h3.6Z"
        />
      </svg>
    ),
  },
]

export function SiteFooter() {
  return (
    <footer className="bg-[#061735] text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 md:px-8 md:py-20">
        <div className="flex flex-col items-center gap-10 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
            {PARTNERS.map((partner) => (
              <span
                key={partner}
                className="text-sm font-black uppercase tracking-[0.18em] text-white/75"
              >
                {partner}
              </span>
            ))}
          </div>

          <div>
            <p className="font-serif text-5xl font-black uppercase leading-none tracking-tight text-white md:text-7xl">
              GLORIA
            </p>
            <p className="mt-2 font-serif text-5xl font-black uppercase leading-none tracking-tight text-white md:text-7xl">
              ETERNA
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-7">
            {SOCIALS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="flex size-8 items-center justify-center text-white transition-transform hover:-translate-y-0.5"
                aria-label={social.label}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-16 grid gap-10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            >
              <Image
                src={CLUB.crest}
                alt={`Escudo del ${CLUB.legalName}`}
                width={58}
                height={58}
                className="size-14 rounded-md object-contain"
              />
              <span className="text-2xl font-black text-white">{CLUB.shortName}</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/70">
              Plataforma oficial del {CLUB.legalName}. Temporada {CLUB.season}.
            </p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-sm font-black uppercase text-white">{column.title}</h2>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.href}`}>
                    <Link
                      href={link.href}
                      className="rounded text-sm font-semibold text-white/75 outline-none hover:text-white hover:underline focus-visible:ring-2 focus-visible:ring-white/80"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="bg-white text-foreground">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 text-xs md:flex-row md:items-center md:justify-between md:px-8">
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} {CLUB.legalName}. Todos los derechos reservados.
          </p>
          <nav aria-label="Información legal">
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {LEGAL_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="font-semibold outline-none hover:text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  )
}
