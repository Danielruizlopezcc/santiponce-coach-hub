import { PageContainer } from '@/components/page-container'
import { getAdminMatches, getAdminTeamColors, getAdminTeams, getAdminTrainingSessions } from '@/lib/admin-app'
import { requireAdmin } from '@/lib/auth'
import { CalendarioClient } from './calendario-client'

export default async function AdminCalendarioPage() {
  const [, matches, teams, trainings, teamColors] = await Promise.all([
    requireAdmin(),
    getAdminMatches(),
    getAdminTeams(),
    getAdminTrainingSessions(),
    getAdminTeamColors(),
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
        teamColors={teamColors}
        showCoordinatorSections
      />
    </PageContainer>
  )
}
