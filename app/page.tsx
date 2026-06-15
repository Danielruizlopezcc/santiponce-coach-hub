import { LandingHero } from '@/components/landing-hero'
import { PublicShell } from '@/components/public-shell'
import { getPrivateNewsData, getPrivateSponsors, getPrivateTeams } from '@/lib/private-app'

export default async function HomePage() {
  const [newsData, teams, sponsors] = await Promise.all([
    getPrivateNewsData(),
    getPrivateTeams(),
    getPrivateSponsors(),
  ])

  return (
    <PublicShell>
      <LandingHero news={newsData.news} teams={teams} sponsors={sponsors} />
    </PublicShell>
  )
}
