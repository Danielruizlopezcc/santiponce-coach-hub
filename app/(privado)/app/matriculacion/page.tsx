import { MatriculacionPanel } from '@/components/matriculacion-panel'
import { PrivatePageContainer } from '@/components/private-page-container'
import { requireUser } from '@/lib/auth'
import { getPrivateAthletes, getPrivateDashboardData } from '@/lib/private-app'

export default async function MatriculacionPage() {
  const user = await requireUser()
  const [{ seasonLabel, matriculaImporte }, deportistas] = await Promise.all([
    getPrivateDashboardData(user.id),
    getPrivateAthletes(user.id),
  ])

  return (
    <PrivatePageContainer
      title="Matriculación"
      description="Gestiona la matrícula individual de cada deportista."
    >
      <MatriculacionPanel
        temporada={seasonLabel}
        importe={matriculaImporte}
        deportistas={deportistas}
      />
    </PrivatePageContainer>
  )
}
