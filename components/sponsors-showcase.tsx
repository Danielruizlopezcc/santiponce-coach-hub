import Image from 'next/image'
import { BadgeCheck, Building2, Handshake, ShieldCheck, Sparkles, Trophy } from 'lucide-react'
import { BrandedPageHero } from '@/components/branded-page-hero'
import { CLUB } from '@/lib/club'
import type { PrivateSponsor } from '@/lib/private-app-shared'
import { getSponsorTierOption } from '@/lib/sponsors'
import { cn } from '@/lib/utils'

type SponsorsShowcaseProps = {
  sponsors: PrivateSponsor[]
  emptyDescription: string
}

type SponsorSectionProps = {
  title: string
  eyebrow: string
  sponsors: PrivateSponsor[]
  variant: 'principal' | 'standard'
}

function SponsorCard({
  sponsor,
  priority = false,
  variant,
}: {
  sponsor: PrivateSponsor
  priority?: boolean
  variant: 'principal' | 'standard'
}) {
  const tierOption = getSponsorTierOption(sponsor.tier)
  const isPrincipal = sponsor.tier === 'principal'
  const isPrincipalVariant = variant === 'principal'

  return (
    <li className="group overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <article className={cn('grid h-full', isPrincipalVariant && 'lg:grid-cols-[1.05fr_0.95fr]')}>
        <div className={cn('relative bg-white', isPrincipalVariant ? 'min-h-[280px]' : 'aspect-[16/10]')}>
          <Image
            src={sponsor.imageUrl}
            alt={sponsor.title}
            fill
            priority={priority}
            className="object-contain p-8 transition-transform duration-500 group-hover:scale-[1.035]"
            sizes={isPrincipalVariant ? '(max-width: 1024px) 100vw, 50vw' : '(max-width: 1280px) 50vw, 33vw'}
          />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
        </div>
        <div className="flex flex-col justify-between border-t border-border bg-[#fbfcff] p-5 lg:border-t-0">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-primary">
              {isPrincipal ? (
                <Sparkles className="size-3.5" aria-hidden="true" />
              ) : (
                <BadgeCheck className="size-3.5" aria-hidden="true" />
              )}
              {tierOption.label}
            </span>
            <h3 className={cn('mt-4 font-black leading-tight tracking-tight text-foreground', isPrincipalVariant ? 'text-3xl md:text-4xl' : 'text-2xl')}>
              {sponsor.title}
            </h3>
          </div>
          <div className="mt-8 flex items-center justify-between border-t border-border pt-4 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
            <span>{CLUB.shortName}</span>
            <span>Club oficial</span>
          </div>
        </div>
      </article>
    </li>
  )
}

function SponsorSection({ title, eyebrow, sponsors, variant }: SponsorSectionProps) {
  if (sponsors.length === 0) return null

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
        <h3 className="mt-1 text-2xl font-black tracking-tight text-foreground md:text-3xl">{title}</h3>
      </div>
      <ul className={cn('grid gap-5', variant === 'principal' ? 'xl:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3')}>
        {sponsors.map((sponsor, index) => (
          <SponsorCard
            key={sponsor.id}
            sponsor={sponsor}
            priority={variant === 'principal' && index === 0}
            variant={variant}
          />
        ))}
      </ul>
    </section>
  )
}

export function SponsorsShowcase({ sponsors, emptyDescription }: SponsorsShowcaseProps) {
  const principalSponsors = sponsors.filter((sponsor) => sponsor.tier === 'principal')
  const featuredSponsors = sponsors.filter((sponsor) => sponsor.tier === 'destacado')
  const partnerSponsors = sponsors.filter((sponsor) => sponsor.tier === 'partner')

  return (
    <section className="bg-[#f4f6f8]">
      <BrandedPageHero
        eyebrow={(
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
            Area corporativa
          </span>
        )}
        title="Patrocinadores oficiales"
      />

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        {sponsors.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center rounded-lg bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Building2 className="size-7" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-xl font-black text-foreground">Aun no hay patrocinadores disponibles</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{emptyDescription}</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-primary">
                  <Handshake className="size-4" aria-hidden="true" />
                  Red empresarial
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-foreground md:text-4xl">
                  Marcas que compiten con nosotros
                </h2>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[#06172f] shadow-sm ring-1 ring-black/5">
                <Trophy className="size-4 text-primary" aria-hidden="true" />
                Colaboradores oficiales
              </div>
            </div>

            <div className="space-y-12">
              <SponsorSection
                title="Patrocinadores principales"
                eyebrow="Máxima visibilidad"
                sponsors={principalSponsors}
                variant="principal"
              />
              <SponsorSection
                title="Patrocinadores destacados"
                eyebrow="Apoyo preferente"
                sponsors={featuredSponsors}
                variant="standard"
              />
              <SponsorSection
                title="Partners oficiales"
                eyebrow="Red de colaboradores"
                sponsors={partnerSponsors}
                variant="standard"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
