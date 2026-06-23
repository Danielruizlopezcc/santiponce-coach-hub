import { PageContainer } from '@/components/page-container'
import { getAdminMatches, getAdminTeams } from '@/lib/admin-app'
import { CalendarioClient } from './calendario-client'

export default async function AdminCalendarioPage() {
  const [matches, teams] = await Promise.all([
    getAdminMatches(),
    getAdminTeams(),
  ])

  return (
    <PageContainer
      title="Calendario"
      description="Programa partidos del club y actualiza resultados desde administración."
      className="max-w-7xl"
    >
      <CalendarioClient matches={matches} teams={teams} />
    </PageContainer>
  )
}
