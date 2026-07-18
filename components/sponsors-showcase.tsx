import { BadgeCheck, Building2, ShieldCheck, Sparkles } from 'lucide-react'
import { BrandedPageHero } from '@/components/branded-page-hero'
import { SafeImage } from '@/components/safe-image'
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
      <a
        href={sponsor.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn('grid h-full', isPrincipalVariant && 'lg:grid-cols-[1.05fr_0.95fr]')}
      >
        <div className={cn('relative bg-white', isPrincipalVariant ? 'min-h-[280px]' : 'aspect-[16/10]')}>
          <SafeImage
            src={sponsor.imageUrl}
            alt={sponsor.title}
            fallbackSrc="/images/Escudo_Santiponce_Fondo.jpg"
            fill
            priority={priority}
            className="object-contain p-8 transition-transform duration-500 group-hover:scale-[1.035]"
            sizes={isPrincipalVariant ? '(max-width: 1024px) 100vw, 50vw' : '(max-width: 1280px) 50vw, 33vw'}
          />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
        </div>
        <div
          className={cn(
            'flex flex-col justify-between border-t border-border bg-[#fbfcff] p-5 lg:border-t-0',
            isPrincipalVariant && 'items-center text-center',
          )}
        >
          <div className={cn('flex flex-col', isPrincipalVariant && 'items-center justify-center flex-1')}>
            <span
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em]',
                isPrincipal
                  ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-sm shadow-primary/30'
                  : 'bg-primary/10 text-primary',
              )}
            >
              {isPrincipal ? (
                <Sparkles className="size-3.5" aria-hidden="true" />
              ) : (
                <BadgeCheck className="size-3.5" aria-hidden="true" />
              )}
              {tierOption.label}
            </span>
            <h3
              className={cn(
                'font-black leading-tight tracking-tight text-foreground',
                isPrincipalVariant ? 'mt-5 text-4xl md:text-5xl' : 'mt-4 text-2xl',
              )}
            >
              {sponsor.title}
            </h3>
          </div>
          <div className="mt-8 flex w-full items-center justify-between border-t border-border pt-4 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
            <span>{CLUB.shortName}</span>
            <span>Club oficial</span>
          </div>
        </div>
      </a>
    </li>
  )
}

function SponsorSection({ title, sponsors, variant }: SponsorSectionProps) {
  if (sponsors.length === 0) return null

  return (
    <section className="space-y-4">
      <h3 className="font-serif text-2xl font-black uppercase tracking-tight text-foreground md:text-3xl">
        {title}
      </h3>
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
            <div className="space-y-12">
              <SponsorSection
                title="Patrocinadores principales"
                sponsors={principalSponsors}
                variant="principal"
              />
              <SponsorSection
                title="Patrocinadores destacados"
                sponsors={featuredSponsors}
                variant="standard"
              />
              <SponsorSection
                title="Partners oficiales"
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
