import Image from 'next/image'
import Link from 'next/link'
import { Award, CalendarDays, Newspaper, Shield, ShieldCheck, Users } from 'lucide-react'
import { CLUB } from '@/lib/club'

const HIGHLIGHTS = [
  {
    icon: Newspaper,
    title: 'Noticias',
    description:
      'Sigue la actualidad del club organizada por secciones.',
    href: '/noticias',
  },
  {
    icon: Shield,
    title: 'Equipos',
    description:
      'Consulta los equipos, categorías y jugadores disponibles.',
    href: '/equipos',
  },
  {
    icon: Award,
    title: 'Patrocinadores',
    description:
      'Conoce las empresas y entidades que apoyan al club.',
    href: '/patrocinadores',
  },
  {
    icon: Users,
    title: 'Área de tutores',
    description:
      'Registro, perfil, deportistas y matriculación para familias.',
    href: '/registro',
  },
  {
    icon: ShieldCheck,
    title: 'Socios',
    description:
      'Accede a tu cuenta de socio para gestionar tu perfil y membresía.',
    href: '/iniciar-sesion',
  },
  {
    icon: CalendarDays,
    title: 'Temporada 2026/2027',
    description:
      'Información oficial del club centralizada y actualizada.',
    href: '/noticias',
  },
]

export function LandingHero() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="grid items-center gap-10 py-12 md:grid-cols-2 md:py-20 lg:gap-16">
        <div className="flex flex-col items-start">
          <span className="inline-flex items-center rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
            Plataforma oficial · Temporada {CLUB.season}
          </span>

          <div className="mt-5 w-full max-w-2xl rounded-3xl border border-border/60 bg-card/72 p-5 shadow-sm backdrop-blur md:p-6">
            <h1 className="text-4xl font-bold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
              Bienvenido al {CLUB.shortName}
            </h1>
            <p className="mt-5 max-w-prose text-lg leading-relaxed text-pretty text-muted-foreground">
              Esta es la plataforma oficial del {CLUB.legalName}, pensada para{' '}
              <strong className="font-semibold text-foreground">familias</strong>,{' '}
              <strong className="font-semibold text-foreground">
                deportistas
              </strong>{' '}
              y la{' '}
              <strong className="font-semibold text-foreground">
                gestión de matrículas
              </strong>
              . Regístrate para acceder a la información y a los servicios del
              club.
            </p>
          </div>

        </div>

        <div className="relative flex justify-center">
          <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-3xl border border-border/60 bg-card/70 shadow-sm backdrop-blur">
            <Image
              src={CLUB.crest || '/placeholder.svg'}
              alt={`Escudo del ${CLUB.legalName}`}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 80vw, 320px"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-3">
        {HIGHLIGHTS.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="rounded-2xl border border-border/60 bg-card/70 p-6 backdrop-blur"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <item.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-base font-semibold text-foreground">
              {item.title}
            </h2>
            <p className="mt-2 text-sm text-pretty text-muted-foreground leading-relaxed">
              {item.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
