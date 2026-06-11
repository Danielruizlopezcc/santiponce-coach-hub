import { PrivatePageContainer } from '@/components/private-page-container'
import { DeportistasOverview } from '@/components/deportistas-overview'
import { requireUser } from '@/lib/auth'
import { getPrivateAthletes } from '@/lib/private-app'

export default async function DeportistasPage() {
  const user = await requireUser()
  const deportistas = await getPrivateAthletes(user.id)

  return (
    <PrivatePageContainer
      title="Mis deportistas"
      description="Gestiona las fichas deportivas asociadas a tu cuenta."
    >
      <DeportistasOverview deportistas={deportistas} />
    </PrivatePageContainer>
  )
}
