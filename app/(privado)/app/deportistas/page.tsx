import { PrivatePageContainer } from '@/components/private-page-container'
import { DeportistasOverview } from '@/components/deportistas-overview'

export default function DeportistasPage() {
  return (
    <PrivatePageContainer
      title="Mis deportistas"
      description="Gestiona las fichas deportivas asociadas a tu cuenta."
    >
      <DeportistasOverview />
    </PrivatePageContainer>
  )
}
