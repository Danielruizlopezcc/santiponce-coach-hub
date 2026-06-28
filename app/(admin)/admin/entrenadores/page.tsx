import { PageContainer } from '@/components/page-container'
import { getAdminCoaches, getAdminCoachTeamOptions } from '@/lib/admin-app'
import { CoachesClient } from './entrenadores-client'

export default async function AdminEntrenadoresPage() {
  const [coaches, teams] = await Promise.all([
    getAdminCoaches(),
    getAdminCoachTeamOptions(),
  ])

  return (
    <PageContainer
      title="Entrenadores"
      description="Alta y gestión de usuarios con rol de entrenador."
      className="max-w-7xl"
    >
      <CoachesClient coaches={coaches} teams={teams} />
    </PageContainer>
  )
}
