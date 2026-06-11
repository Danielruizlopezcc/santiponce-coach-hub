import { LandingHero } from '@/components/landing-hero'
import { PublicShell } from '@/components/public-shell'

export default function HomePage() {
  return (
    <PublicShell>
      <LandingHero />
    </PublicShell>
  )
}
