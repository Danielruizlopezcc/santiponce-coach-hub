import { PublicShell } from '@/components/public-shell'
import { SponsorsShowcase } from '@/components/sponsors-showcase'
import { getPrivateSponsors } from '@/lib/private-app'

export default async function PatrocinadoresPage() {
  const sponsors = await getPrivateSponsors()

  return (
    <PublicShell>
      <SponsorsShowcase
        sponsors={sponsors}
        emptyDescription="Cuando el club añada patrocinadores, apareceran aqui."
      />
    </PublicShell>
  )
}
