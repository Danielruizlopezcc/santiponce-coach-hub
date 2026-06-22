import { SponsorsShowcase } from '@/components/sponsors-showcase'
import { getPrivateSponsors } from '@/lib/private-app'

export default async function PrivatePatrocinadoresPage() {
  const sponsors = await getPrivateSponsors()

  return (
    <SponsorsShowcase
      sponsors={sponsors}
      emptyDescription="Cuando el administrador añada patrocinadores, los veras aqui."
    />
  )
}
