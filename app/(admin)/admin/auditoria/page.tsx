import { PageContainer } from '@/components/page-container'
import { getAdminAuditLogs } from '@/lib/admin-app'
import { AuditoriaClient } from './auditoria-client'

export default async function AdminAuditoriaPage() {
  const logs = await getAdminAuditLogs()

  return (
    <PageContainer
      title="Auditoría"
      description="Historial de acciones críticas realizadas desde el panel de administración."
      className="max-w-7xl"
    >
      <AuditoriaClient logs={logs} />
    </PageContainer>
  )
}
