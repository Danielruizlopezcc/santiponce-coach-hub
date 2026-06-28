import { PageContainer } from '@/components/page-container'
import { CalendarioClient } from '@/app/(admin)/admin/calendario/calendario-client'
import { requireCoach } from '@/lib/auth'
import { getCoachMatches, getCoachTeams } from '@/lib/coach-app'
import {
  createCoachMatchAction,
  deleteCoachMatchAction,
  updateCoachMatchAction,
} from './actions'

export default async function CoachCalendarPage() {
  const user = await requireCoach()
  const [matches, teams] = await Promise.all([
    getCoachMatches(user.id),
    getCoachTeams(user.id),
  ])

  return (
    <PageContainer
      title="Calendario"
      description="Programa partidos y actualiza resultados de tus equipos."
      className="max-w-7xl"
    >
      {teams.length === 0 ? (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 ring-1 ring-amber-200">
          Aún no tienes un equipo asignado. Pide a un administrador que te asigne uno desde Entrenadores.
        </p>
      ) : null}
      <CalendarioClient
        matches={matches}
        teams={teams}
        actions={{
          createMatch: createCoachMatchAction,
          updateMatch: updateCoachMatchAction,
          deleteMatch: deleteCoachMatchAction,
        }}
        emptyTeamsMessage="Necesitas tener un equipo asignado antes de programar partidos."
      />
    </PageContainer>
  )
}
