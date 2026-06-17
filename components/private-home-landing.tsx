import { LandingHero, SOCIO_QUICK_LINKS, TUTOR_QUICK_LINKS } from '@/components/landing-hero'
import type { PrivateNewsItem, PrivateSponsor, PrivateTeamSummary } from '@/lib/private-app-shared'

type PrivateHomeLandingProps = {
  news: PrivateNewsItem[]
  teams: PrivateTeamSummary[]
  sponsors: PrivateSponsor[]
  hasGuardian: boolean
}

export function PrivateHomeLanding({ news, teams, sponsors, hasGuardian }: PrivateHomeLandingProps) {
  const quickLinks = hasGuardian ? TUTOR_QUICK_LINKS : SOCIO_QUICK_LINKS

  return (
    <LandingHero
      news={news}
      teams={teams}
      sponsors={sponsors}
      quickLinks={quickLinks}
      newsHref="/app/noticias"
      teamsHref="/app/equipos"
      sponsorsHref="/app/patrocinadores"
      showAuthCta={false}
    />
  )
}
