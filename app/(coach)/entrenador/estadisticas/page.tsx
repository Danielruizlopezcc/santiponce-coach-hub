import { PageContainer } from '@/components/page-container'
import { requireCoach } from '@/lib/auth'
import { StatsDashboard } from '@/components/stats-dashboard'
import { getAdminMatches, getAdminTeams, getAdminTrainingSessions } from '@/lib/admin-app'

export default async function CoachStatsPage() {
  await requireCoach()
  const [matches, teams, trainings] = await Promise.all([
    getAdminMatches(),
    getAdminTeams(),
    getAdminTrainingSessions(),
  ])

  return (
    <PageContainer
      title="Estadísticas"
      description="Analiza temporadas, partidos y rendimiento individual de todo el club."
      className="max-w-7xl"
    >
      <StatsDashboard matches={matches} teams={teams} trainings={trainings} scope="coach" />
    </PageContainer>
  )
}
