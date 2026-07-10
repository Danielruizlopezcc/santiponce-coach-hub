import Link from 'next/link'
import type { ComponentType } from 'react'
import { ArrowRight, Award, CalendarDays, ChevronLeft, ChevronRight, CreditCard, Newspaper, Shield, Users } from 'lucide-react'
import { HomeNewsCarousel } from '@/components/home-news-carousel'
import { ClubShopBanner } from '@/components/club-shop-banner'
import { ScrollReveal } from '@/components/scroll-reveal'
import { SafeImage } from '@/components/safe-image'
import { CLUB } from '@/lib/club'
import type { PrivateNewsItem, PrivateSponsor, PrivateTeamSummary } from '@/lib/private-app-shared'

type LandingHeroProps = {
  news: PrivateNewsItem[]
  teams: PrivateTeamSummary[]
  sponsors: PrivateSponsor[]
  quickLinks?: QuickLink[]
  newsHref?: string
  teamsHref?: string
  sponsorsHref?: string
  showAuthCta?: boolean
}

export type QuickLink = {
  label: string
  href: string
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
}

export const PUBLIC_QUICK_LINKS: QuickLink[] = [
  { label: 'Noticias', href: '/noticias', icon: Newspaper },
  { label: 'Equipos', href: '/equipos', icon: Shield },
  { label: 'Patrocinadores', href: '/patrocinadores', icon: Award },
  { label: 'Registro tutores', href: '/registro', icon: Users },
]

function formatNewsDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function SectionTitle({ label, title }: { label: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">{label}</p>
      <h2 className="mt-2 text-3xl font-black tracking-tight text-foreground md:text-5xl">
        {title}
      </h2>
    </div>
  )
}

export const SOCIO_QUICK_LINKS: QuickLink[] = [
  { label: 'Noticias', href: '/app/noticias', icon: Newspaper },
  { label: 'Equipos', href: '/app/equipos', icon: Shield },
  { label: 'Patrocinadores', href: '/app/patrocinadores', icon: Award },
  { label: 'Registro tutores', href: '/registro', icon: Users },
  { label: 'Portal Socio', href: '/app/portal-socio', icon: CreditCard },
]

export const TUTOR_QUICK_LINKS: QuickLink[] = [
  { label: 'Noticias', href: '/app/noticias', icon: Newspaper },
  { label: 'Equipos', href: '/app/equipos', icon: Shield },
  { label: 'Patrocinadores', href: '/app/patrocinadores', icon: Award },
  { label: 'Registro tutores', href: '/registro', icon: Users },
  { label: 'Mis deportistas', href: '/app/deportistas', icon: Users },
  { label: 'Matriculación', href: '/app/matriculacion', icon: CreditCard },
]

export function LandingHero({
  news,
  teams,
  sponsors,
  quickLinks = PUBLIC_QUICK_LINKS,
  newsHref = '/noticias',
  teamsHref = '/equipos',
  sponsorsHref = '/patrocinadores',
  showAuthCta = true,
}: LandingHeroProps) {
  const carouselNews = news.slice(0, 3)
  const latestNews = news.slice(0, 4)
  const featuredTeams = teams.slice(0, 6)
  const featuredSponsors = sponsors.slice(0, 8)

  return (
    <div className="bg-white">
      <HomeNewsCarousel news={carouselNews} linkHref={newsHref} />

      <ScrollReveal variant="pop">
        <section className="relative z-10 mx-auto -mt-4 max-w-7xl px-4 sm:px-6">
          <div className="grid overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-black/5 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex min-h-24 items-center gap-4 border-b border-border p-5 transition-colors hover:bg-blue-50 sm:border-r lg:border-b-0"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="size-6" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-base font-black text-foreground">{item.label}</span>
                  <span className="mt-1 flex items-center gap-1 text-sm font-semibold text-primary">
                    Acceder
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay="short" variant="curtain">
        <section className="px-4 py-14 sm:px-6 md:py-16">
          <div className="mx-auto max-w-[1800px]">
            <div className="mb-7 flex items-start justify-between gap-4">
              <h2 className="font-serif text-3xl font-black uppercase tracking-tight text-foreground md:text-4xl">
                Últimas Noticias
              </h2>
              <div className="flex items-center gap-5 pt-1">
                <div className="hidden items-center gap-3 text-muted-foreground sm:flex" aria-hidden="true">
                  <ChevronLeft className="size-5 opacity-45" />
                  <ChevronRight className="size-5 text-foreground" />
                </div>
                <Link href={newsHref} className="inline-flex items-center gap-2 text-sm font-black text-foreground">
                  Ver más
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>

            {latestNews.length > 0 ? (
              <div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {latestNews.map((item) => (
                    <Link
                      key={item.id}
                      href={`${newsHref}/${item.id}`}
                      className="group block min-w-0"
                    >
                      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                        <SafeImage
                          src={item.imageUrl}
                          alt={item.title}
                          fallbackSrc="/images/Fondo1.png"
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      </div>
                      <h3 className="mt-3 line-clamp-2 text-sm font-black uppercase leading-snug text-foreground transition-colors group-hover:text-primary md:text-base">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-xs font-bold uppercase text-muted-foreground">
                        <span className="text-red-600">{item.sectionName}</span>
                        <span className="mx-2 text-border">|</span>
                        {formatNewsDate(item.createdAt)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
          ) : (
            <div className="rounded-lg bg-[#f3f6fa] p-8 text-center">
              <p className="font-bold text-foreground">Aún no hay noticias publicadas.</p>
            </div>
          )}
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal variant="tilt">
        <ClubShopBanner />
      </ScrollReveal>

      <ScrollReveal variant="drift">
        <section className="relative overflow-hidden bg-[#071c44] text-white">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                'radial-gradient(circle at 18% 18%, rgba(255,255,255,0.14) 0 1px, transparent 2px), linear-gradient(135deg, rgba(255,255,255,0.08) 0 14%, transparent 14% 28%, rgba(0,0,0,0.16) 28% 42%, transparent 42%)',
              backgroundSize: '30px 30px, 180px 180px',
            }}
          />
          <div className="absolute inset-y-0 right-0 w-1/2 bg-primary/25 blur-3xl" aria-hidden="true" />
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[0.9fr_1.1fr] md:py-20">
            <div className="relative">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-200">
                Cantera y competición
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-white md:text-5xl">
                Equipos del club
              </h2>
              <p className="mt-4 max-w-md text-base leading-7 text-white/75">
                Accede a cada plantilla, consulta jugadores y revisa la estructura deportiva de la temporada.
              </p>
              <Link href={teamsHref} className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-black uppercase text-white">
                Ver todos
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="relative grid gap-3 sm:grid-cols-2">
              {featuredTeams.length > 0 ? (
                featuredTeams.map((team) => (
                  <Link key={team.id} href={`${teamsHref}/${team.id}`} className="rounded-lg bg-white p-5 shadow-lg ring-1 ring-white/20 transition-transform hover:-translate-y-0.5">
                    <p className="text-xl font-black text-foreground">{team.nombre}</p>
                    <p className="mt-1 text-sm font-semibold text-muted-foreground">{team.categoria} · {team.temporada}</p>
                    <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-primary">
                      <Users className="size-4" aria-hidden="true" />
                      {team.jugadores} jugador{team.jugadores !== 1 ? 'es' : ''}
                    </p>
                  </Link>
                ))
              ) : (
                <div className="rounded-lg bg-white p-6 shadow-lg ring-1 ring-white/20">
                  <p className="font-bold text-foreground">Los equipos aparecerán aquí cuando estén configurados.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal variant="wipe">
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <SectionTitle label="Apoyo" title="Patrocinadores" />
            <Link href={sponsorsHref} className="inline-flex items-center gap-2 text-sm font-black uppercase text-primary">
              Ver patrocinadores
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          {featuredSponsors.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredSponsors.map((sponsor) => (
                <Link key={sponsor.id} href={sponsorsHref} className="overflow-hidden rounded-lg bg-[#f3f6fa] transition-transform hover:-translate-y-0.5">
                  <div className="relative h-36 bg-muted">
                    <SafeImage src={sponsor.imageUrl} alt={sponsor.title} fallbackSrc="/images/Escudo_Santiponce_Fondo.jpg" fill className="object-cover" sizes="(max-width: 1024px) 50vw, 25vw" />
                  </div>
                  <p className="p-4 text-base font-black text-foreground">{sponsor.title}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-[#f3f6fa] p-8 text-center">
              <p className="font-bold text-foreground">Aún no hay patrocinadores publicados.</p>
            </div>
          )}
        </section>
      </ScrollReveal>

      {showAuthCta ? (
        <ScrollReveal variant="fade-up">
          <section className="bg-primary text-white">
            <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-white/70">
                  <CalendarDays className="size-4" aria-hidden="true" />
                  Temporada {CLUB.season}
                </p>
                <h2 className="mt-3 text-3xl font-black md:text-5xl">
                  Área privada para familias y socios
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/registro" className="rounded-full bg-white px-5 py-3 text-sm font-black uppercase text-primary">
                  Registrarse
                </Link>
                <Link href="/iniciar-sesion" className="rounded-full bg-white/12 px-5 py-3 text-sm font-black uppercase text-white ring-1 ring-white/25">
                  Iniciar sesión
                </Link>
              </div>
            </div>
          </section>
        </ScrollReveal>
      ) : (
        <div className="h-16 bg-white md:h-24" aria-hidden="true" />
      )}
    </div>
  )
}
