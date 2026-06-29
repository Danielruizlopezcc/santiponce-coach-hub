import { PageContainer } from '@/components/page-container'
import { requireCoach } from '@/lib/auth'
import { StatsDashboard } from '@/components/stats-dashboard'
import { getCoachMatches, getCoachTeams } from '@/lib/coach-app'

export default async function CoachStatsPage() {
  const user = await requireCoach()
  const [matches, teams] = await Promise.all([
    getCoachMatches(user.id),
    getCoachTeams(user.id),
  ])

  return (
    <PageContainer
      title="Estadísticas"
      description="Analiza temporadas, partidos y rendimiento individual de tus jugadores."
      className="max-w-7xl"
    >
      <StatsDashboard matches={matches} teams={teams} scope="coach" />
    </PageContainer>
  )
}
