import { PageContainer } from '@/components/page-container'
import { requireCoach } from '@/lib/auth'
import { getCoachMatches } from '@/lib/coach-app'
import { CoachStatsClient } from './estadisticas-client'

export default async function CoachStatsPage() {
  const user = await requireCoach()
  const matches = await getCoachMatches(user.id)

  return (
    <PageContainer
      title="Estadísticas"
      description="Resumen acumulado y detalle estadístico de cada partido."
      className="max-w-7xl"
    >
      <CoachStatsClient matches={matches} />
    </PageContainer>
  )
}
