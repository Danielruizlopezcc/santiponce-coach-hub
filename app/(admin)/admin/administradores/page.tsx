import { PageContainer } from '@/components/page-container'
import { getAdminManagers } from '@/lib/admin-app'
import { AdministradoresClient } from './administradores-client'

export default async function AdminAdministradoresPage() {
  const data = await getAdminManagers()
  return (
    <PageContainer
      title="Gestión de administradores"
      description="Usuarios con permisos de administración."
      className="max-w-7xl"
    >
      <AdministradoresClient admins={data} />
    </PageContainer>
  )
}
