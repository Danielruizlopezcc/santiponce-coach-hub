import { PageContainer } from '@/components/page-container'
import { CalendarioClient } from '@/app/(admin)/admin/calendario/calendario-client'
import { requireCoach } from '@/lib/auth'
import { getAdminTrainingSessions } from '@/lib/admin-app'
import { getCoachTeams } from '@/lib/coach-app'
import {
  createCoachMatchAction,
  createCoachRecurringTrainingAction,
  createCoachTrainingAction,
  deleteCoachMatchAction,
  deleteCoachTrainingAction,
  deleteCoachTrainingSeriesAction,
  updateCoachMatchAction,
  updateCoachTrainingAttendanceAction,
  updateCoachTrainingAction,
} from '../calendario/actions'

export default async function CoachTrainingsPage() {
  const user = await requireCoach()
  const [teams, allTrainings] = await Promise.all([
    getCoachTeams(user.id),
    getAdminTrainingSessions(),
  ])
  const teamIds = new Set(teams.map((team) => team.id))
  const trainings = allTrainings.filter((training) => teamIds.has(training.teamId))

  return (
    <PageContainer
      title="Entrenamientos"
      description="Programa y gestiona entrenamientos de tus equipos asignados."
      className="max-w-7xl"
    >
      {teams.length === 0 ? (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 ring-1 ring-amber-200">
          Aún no tienes un equipo asignado. Pide a un administrador que te asigne uno desde Entrenadores.
        </p>
      ) : null}
      <CalendarioClient
        matches={[]}
        teams={teams}
        trainings={trainings}
        actions={{
          createMatch: createCoachMatchAction,
          updateMatch: updateCoachMatchAction,
          deleteMatch: deleteCoachMatchAction,
          createTraining: createCoachTrainingAction,
          createRecurringTraining: createCoachRecurringTrainingAction,
          updateTraining: updateCoachTrainingAction,
          updateTrainingAttendance: updateCoachTrainingAttendanceAction,
          deleteTraining: deleteCoachTrainingAction,
          deleteTrainingSeries: deleteCoachTrainingSeriesAction,
        }}
        emptyTeamsMessage="Necesitas tener un equipo asignado antes de programar entrenamientos."
        showCoordinatorSections
        visibleCoordinatorTabs={['entrenamientos']}
        initialCoordinatorTab="entrenamientos"
      />
    </PageContainer>
  )
}
