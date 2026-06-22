import Image from 'next/image'
import { Handshake, ShieldCheck, Star } from 'lucide-react'
import type { PrivateSponsor } from '@/lib/private-app-shared'

type SponsorsShowcaseProps = {
  sponsors: PrivateSponsor[]
  emptyDescription: string
}

export function SponsorsShowcase({ sponsors, emptyDescription }: SponsorsShowcaseProps) {
  const [mainSponsor, secondSponsor, ...restSponsors] = sponsors
  const principalSponsors = [mainSponsor, secondSponsor].filter(Boolean)

  if (sponsors.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-white/88 p-8 text-center shadow-sm backdrop-blur">
        <p className="text-base font-bold text-foreground">Aún no hay patrocinadores disponibles.</p>
        <p className="mt-2 text-sm text-muted-foreground">{emptyDescription}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-lg border border-[#0b2d66]/20 bg-[#06172f] text-white shadow-xl">
        <div className="relative">
          <div
            className="absolute inset-0 opacity-30"
            aria-hidden="true"
            style={{
              backgroundImage:
                'linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />
          <div className="relative grid gap-8 px-6 py-8 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-white/75 ring-1 ring-white/15">
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                Área empresarial
              </span>
              <h2 className="mt-5 text-4xl font-black leading-none tracking-tight md:text-6xl">
                Empresas que impulsan al CD Santiponce
              </h2>
              <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-white/76">
                Patrocinadores oficiales que sostienen la cantera, la competición y la identidad del club durante la temporada.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-white/10 p-4 ring-1 ring-white/12">
                  <p className="text-3xl font-black">{sponsors.length}</p>
                  <p className="text-xs font-bold uppercase tracking-wide text-white/60">
                    Colaboradores
                  </p>
                </div>
                <div className="rounded-lg bg-white/10 p-4 ring-1 ring-white/12">
                  <p className="text-3xl font-black">1ª</p>
                  <p className="text-xs font-bold uppercase tracking-wide text-white/60">
                    Línea local
                  </p>
                </div>
                <div className="rounded-lg bg-white/10 p-4 ring-1 ring-white/12">
                  <p className="text-3xl font-black">26/27</p>
                  <p className="text-xs font-bold uppercase tracking-wide text-white/60">
                    Temporada
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {principalSponsors.map((sponsor, index) => (
                <article
                  key={sponsor.id}
                  className="grid gap-5 rounded-lg bg-white p-4 text-foreground shadow-2xl ring-1 ring-white/20 sm:grid-cols-[260px_1fr] sm:items-center"
                >
                  <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-white">
                    <Image
                      src={sponsor.imageUrl}
                      alt={sponsor.title}
                      fill
                      priority={index === 0}
                      className="object-contain p-3"
                      sizes="260px"
                    />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black uppercase tracking-wide text-primary">
                      <Star className="size-3.5" aria-hidden="true" />
                      {index === 0 ? 'Patrocinador principal' : 'Patrocinador destacado'}
                    </span>
                    <h3 className="mt-3 text-2xl font-black tracking-tight">{sponsor.title}</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-muted-foreground">
                      Presencia preferente en la comunidad del club.
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {restSponsors.length > 0 ? (
        <section className="rounded-lg border border-border bg-white/90 p-5 shadow-sm backdrop-blur md:p-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-primary">
                <Handshake className="size-4" aria-hidden="true" />
                Club de patrocinadores
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">
                Red oficial de colaboradores
              </h2>
            </div>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {restSponsors.map((sponsor) => (
              <li
                key={sponsor.id}
                className="group overflow-hidden rounded-lg border border-border bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] bg-white">
                  <Image
                    src={sponsor.imageUrl}
                    alt={sponsor.title}
                    fill
                    className="object-contain p-5 transition-transform duration-500 group-hover:scale-[1.04]"
                    sizes="(max-width: 1280px) 50vw, 25vw"
                  />
                </div>
                <div className="border-t border-border bg-[#f8fafc] px-4 py-3 text-center">
                  <p className="truncate text-sm font-black text-foreground">{sponsor.title}</p>
                  <p className="mt-1 text-[11px] font-black uppercase tracking-[0.16em] text-primary">
                    Partner oficial
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
