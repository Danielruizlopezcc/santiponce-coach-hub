import { AdminPageShell } from '@/components/admin/admin-page-shell'
import { type Column } from '@/components/admin/admin-table'
import { getAdminAudit } from '@/lib/admin-app'

const columns: Column[] = [
  { key: 'fecha', label: 'Fecha' },
  { key: 'usuarioAdmin', label: 'Usuario/admin' },
  { key: 'accion', label: 'Acción' },
  { key: 'entidad', label: 'Entidad', responsive: 'md' },
  { key: 'resultado', label: 'Resultado' },
]

export default async function AdminAuditoriaPage() {
  const data = await getAdminAudit()
  return (
    <AdminPageShell
      title="Auditoría"
      description="Eventos derivados de los datos reales disponibles en Supabase."
      data={data}
      columns={columns}
      searchPlaceholder="Buscar por acción, entidad o usuario"
      emptyTitle="Sin eventos"
      emptyDescription="No hay registros de auditoría disponibles."
      counterLabel="eventos"
    />
  )
}
