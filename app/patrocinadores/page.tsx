import { PageContainer } from '@/components/page-container'
import { PublicShell } from '@/components/public-shell'
import { SponsorsShowcase } from '@/components/sponsors-showcase'
import { getPrivateSponsors } from '@/lib/private-app'

export default async function PatrocinadoresPage() {
  const sponsors = await getPrivateSponsors()

  return (
    <PublicShell>
      <PageContainer
        title="Patrocinadores"
        className="max-w-7xl"
      >
        <SponsorsShowcase
          sponsors={sponsors}
          emptyDescription="Cuando el club añada patrocinadores, aparecerán aquí."
        />
      </PageContainer>
    </PublicShell>
  )
}
