import { PageContainer } from '@/components/page-container'
import { CalendarioClient } from '@/app/(admin)/admin/calendario/calendario-client'
import { requireCoach } from '@/lib/auth'
import { getAdminMatches, getAdminTeamColors, getAdminTeams, getAdminTrainingSessions } from '@/lib/admin-app'

export default async function CoachCalendarPage() {
  await requireCoach()
  const [matches, teams, trainings, teamColors] = await Promise.all([
    getAdminMatches(),
    getAdminTeams(),
    getAdminTrainingSessions(),
    getAdminTeamColors(),
  ])

  return (
    <PageContainer
      title="Calendario"
      description="Consulta la ocupación semanal de campos del club."
      className="max-w-7xl"
    >
      <CalendarioClient
        matches={matches}
        teams={teams}
        trainings={trainings}
        teamColors={teamColors}
        showCoordinatorSections
        visibleCoordinatorTabs={['horario']}
        readOnly
      />
    </PageContainer>
  )
}
