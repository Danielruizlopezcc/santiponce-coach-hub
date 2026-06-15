import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Award, CalendarDays, Newspaper, Shield, Trophy, Users } from 'lucide-react'
import { CLUB } from '@/lib/club'
import type { PrivateNewsItem, PrivateSponsor, PrivateTeamSummary } from '@/lib/private-app-shared'

type LandingHeroProps = {
  news: PrivateNewsItem[]
  teams: PrivateTeamSummary[]
  sponsors: PrivateSponsor[]
}

const QUICK_LINKS = [
  { label: 'Noticias', href: '/noticias', icon: Newspaper },
  { label: 'Equipos', href: '/equipos', icon: Shield },
  { label: 'Patrocinadores', href: '/patrocinadores', icon: Award },
  { label: 'Registro tutores', href: '/registro', icon: Users },
]

function formatRelativeDate(value: string) {
  const date = new Date(value)
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000)

  if (diffDays <= 0) return 'hoy'
  if (diffDays === 1) return 'ayer'
  if (diffDays === 2) return 'anteayer'
  return `hace ${diffDays} días`
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

export function LandingHero({ news, teams, sponsors }: LandingHeroProps) {
  const featuredNews = news[0]
  const moreNews = news.slice(1, 4)
  const featuredTeams = teams.slice(0, 6)
  const featuredSponsors = sponsors.slice(0, 8)

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-[#061a3b] text-white">
        <Image
          src="/images/Fondo1.png"
          alt=""
          fill
          priority
          className="object-cover opacity-34"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(105deg,#03142f_0%,#07285b_48%,rgba(14,75,150,0.55)_100%)]" />
        <div
          className="absolute inset-0 opacity-35"
          aria-hidden="true"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '88px 88px',
            maskImage: 'linear-gradient(90deg, black, black 72%, transparent)',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent" />

        <div className="relative mx-auto grid min-h-[590px] max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_440px]">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-100 ring-1 ring-white/18">
              <Trophy className="size-4" aria-hidden="true" />
              Plataforma oficial · Temporada {CLUB.season}
            </div>
            <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.92] tracking-tight md:text-7xl">
              Club Deportivo Santiponce
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-white/82 md:text-xl">
              Cantera, competición y sentimiento de club para seguir creciendo temporada tras
              temporada.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/noticias"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black uppercase text-primary shadow-lg transition-colors hover:bg-blue-50"
              >
                Últimas noticias
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/equipos"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-black uppercase text-white ring-1 ring-white/25 transition-colors hover:bg-white/16"
              >
                Ver equipos
              </Link>
            </div>

            <div className="mt-12 grid max-w-2xl gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-white/9 p-4 ring-1 ring-white/14">
                <p className="text-3xl font-black">{teams.length}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-white/58">Equipos</p>
              </div>
              <div className="rounded-lg bg-white/9 p-4 ring-1 ring-white/14">
                <p className="text-3xl font-black">{news.length}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-white/58">Noticias</p>
              </div>
              <div className="rounded-lg bg-white/9 p-4 ring-1 ring-white/14">
                <p className="text-3xl font-black">{sponsors.length}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-white/58">Apoyos</p>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="overflow-hidden rounded-lg bg-white text-foreground shadow-2xl ring-1 ring-white/20">
              {featuredNews ? (
                <Link href="/noticias" className="group block">
                  <div className="relative aspect-[4/3] bg-muted">
                    <Image
                      src={featuredNews.imageUrl}
                      alt={featuredNews.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="440px"
                    />
                    <div className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-black uppercase text-white">
                      Última noticia
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                      {featuredNews.sectionName} · {formatRelativeDate(featuredNews.createdAt)}
                    </p>
                    <h2 className="mt-3 text-2xl font-black leading-tight">
                      {featuredNews.title}
                    </h2>
                    <p className="mt-5 inline-flex items-center gap-2 text-sm font-black uppercase text-primary">
                      Leer actualidad
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="p-8">
                  <Image
                    src={CLUB.crest}
                    alt={`Escudo del ${CLUB.legalName}`}
                    width={180}
                    height={180}
                    className="mx-auto size-40 object-contain"
                  />
                  <p className="mt-6 text-center text-xl font-black">Actualidad del club</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-10 max-w-7xl px-4 sm:px-6">
        <div className="grid overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-black/5 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((item) => (
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

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <SectionTitle label="Actualidad" title="Últimas noticias" />
          <Link href="/noticias" className="inline-flex items-center gap-2 text-sm font-black uppercase text-primary">
            Todas las noticias
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        {featuredNews ? (
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <Link href="/noticias" className="group block overflow-hidden rounded-lg bg-[#071c44] text-white shadow-sm">
              <div className="relative aspect-[16/9] bg-muted">
                <Image
                  src={featuredNews.imageUrl}
                  alt={featuredNews.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">
                    {featuredNews.sectionName} · {formatRelativeDate(featuredNews.createdAt)}
                  </p>
                  <h3 className="mt-3 max-w-3xl text-3xl font-black leading-tight md:text-5xl">
                    {featuredNews.title}
                  </h3>
                </div>
              </div>
            </Link>

            <div className="grid gap-4">
              {moreNews.length > 0 ? (
                moreNews.map((item) => (
                  <Link
                    key={item.id}
                    href="/noticias"
                    className="group grid grid-cols-[128px_1fr] overflow-hidden rounded-lg bg-[#f3f6fa] transition-colors hover:bg-blue-50"
                  >
                    <div className="relative min-h-32 bg-muted">
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="128px"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-[11px] font-black uppercase text-primary">
                        {item.sectionName}
                      </p>
                      <h3 className="mt-2 line-clamp-3 text-lg font-black leading-snug text-foreground">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-xs font-semibold text-muted-foreground">
                        {formatRelativeDate(item.createdAt)}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-lg bg-[#f3f6fa] p-6">
                  <p className="font-bold text-foreground">Más noticias próximamente.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-[#f3f6fa] p-8 text-center">
            <p className="font-bold text-foreground">Aún no hay noticias publicadas.</p>
          </div>
        )}
      </section>

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
            <Link href="/equipos" className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-black uppercase text-white">
              Ver todos
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="relative grid gap-3 sm:grid-cols-2">
            {featuredTeams.length > 0 ? (
              featuredTeams.map((team) => (
                <Link key={team.id} href={`/equipos/${team.id}`} className="rounded-lg bg-white p-5 shadow-lg ring-1 ring-white/20 transition-transform hover:-translate-y-0.5">
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

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <SectionTitle label="Apoyo" title="Patrocinadores" />
          <Link href="/patrocinadores" className="inline-flex items-center gap-2 text-sm font-black uppercase text-primary">
            Ver patrocinadores
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        {featuredSponsors.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredSponsors.map((sponsor) => (
              <Link key={sponsor.id} href="/patrocinadores" className="overflow-hidden rounded-lg bg-[#f3f6fa] transition-transform hover:-translate-y-0.5">
                <div className="relative h-36 bg-muted">
                  <Image src={sponsor.imageUrl} alt={sponsor.title} fill className="object-cover" sizes="(max-width: 1024px) 50vw, 25vw" />
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
            <p className="mt-3 max-w-2xl text-base leading-7 text-white/75">
              Los tutores gestionan deportistas y matriculación. Los socios consultan su perfil y su membresía.
            </p>
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
    </div>
  )
}
