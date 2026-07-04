import { PageContainer } from '@/components/page-container'
import { getAdminMatches, getAdminTeams, getAdminTrainingSessions } from '@/lib/admin-app'
import { requireAdmin } from '@/lib/auth'
import { CalendarioClient } from './calendario-client'

export default async function AdminCalendarioPage() {
  const [{ role }, matches, teams, trainings] = await Promise.all([
    requireAdmin(),
    getAdminMatches(),
    getAdminTeams(),
    getAdminTrainingSessions(),
  ])

  return (
    <PageContainer
      title="Calendario"
      description="Programa partidos del club y actualiza resultados desde administración."
      className="max-w-7xl"
    >
      <CalendarioClient
        matches={matches}
        teams={teams}
        trainings={trainings}
        showCoordinatorSections={role === 'sports_coordinator'}
      />
    </PageContainer>
  )
}
