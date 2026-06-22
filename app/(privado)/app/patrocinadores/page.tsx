import { PrivatePageContainer } from '@/components/private-page-container'
import { SponsorsShowcase } from '@/components/sponsors-showcase'
import { getPrivateSponsors } from '@/lib/private-app'

export default async function PrivatePatrocinadoresPage() {
  const sponsors = await getPrivateSponsors()

  return (
    <PrivatePageContainer
      title="Patrocinadores"
      className="max-w-7xl"
    >
      <SponsorsShowcase
        sponsors={sponsors}
        emptyDescription="Cuando el administrador añada patrocinadores, los verás aquí."
      />
    </PrivatePageContainer>
  )
}
