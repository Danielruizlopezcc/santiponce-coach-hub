import { PageContainer } from '@/components/page-container'
import { StatsDashboard } from '@/components/stats-dashboard'
import { getAdminMatches, getAdminTeams, getAdminTrainingSessions } from '@/lib/admin-app'

export default async function AdminStatsPage() {
  const [matches, teams, trainings] = await Promise.all([
    getAdminMatches(),
    getAdminTeams(),
    getAdminTrainingSessions(),
  ])

  return (
    <PageContainer
      title="Estadísticas"
      description="Consulta estadísticas por equipo, temporada, partido y jugador."
      className="max-w-7xl"
    >
      <StatsDashboard matches={matches} teams={teams} trainings={trainings} scope="admin" />
    </PageContainer>
  )
}
