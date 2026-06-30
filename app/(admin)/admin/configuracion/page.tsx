import { PageContainer } from '@/components/page-container'
import { getAdminConfig } from '@/lib/admin-app'
import { ConfiguracionClient } from './configuracion-client'

export default async function AdminConfiguracionPage() {
  const data = await getAdminConfig()

  return (
    <PageContainer
      title="Configuración"
      description="Resumen del estado actual de la plataforma."
      className="max-w-7xl"
    >
      <ConfiguracionClient data={data} />
    </PageContainer>
  )
}
