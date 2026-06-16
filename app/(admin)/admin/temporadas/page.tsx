import { PageContainer } from '@/components/page-container'
import { getAdminSeasons } from '@/lib/admin-app'
import { TemporadasClient } from './temporadas-client'

export default async function AdminTemporadasPage() {
  const seasons = await getAdminSeasons()

  return (
    <PageContainer
      title="Temporadas"
      description="Temporadas deportivas disponibles en la plataforma visual."
      className="max-w-7xl"
    >
      <TemporadasClient seasons={seasons} />
    </PageContainer>
  )
}
