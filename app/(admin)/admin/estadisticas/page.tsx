import { PageContainer } from '@/components/page-container'
import { StatsDashboard } from '@/components/stats-dashboard'
import { getAdminMatches, getAdminTeams } from '@/lib/admin-app'

export default async function AdminStatsPage() {
  const [matches, teams] = await Promise.all([
    getAdminMatches(),
    getAdminTeams(),
  ])

  return (
    <PageContainer
      title="Estadísticas"
      description="Consulta estadísticas por equipo, temporada, partido y jugador."
      className="max-w-7xl"
    >
      <StatsDashboard matches={matches} teams={teams} scope="admin" />
    </PageContainer>
  )
}
