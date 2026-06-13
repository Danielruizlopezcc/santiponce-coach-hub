import { AdminPageShell } from '@/components/admin/admin-page-shell'
import { type Column } from '@/components/admin/admin-table'
import { getAdminManagers } from '@/lib/admin-app'

const columns: Column[] = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'email', label: 'Email', responsive: 'md' },
  { key: 'rol', label: 'Rol' },
  { key: 'estado', label: 'Estado' },
]

export default async function AdminAdministradoresPage() {
  const data = await getAdminManagers()
  return (
    <AdminPageShell
      title="Gestión de administradores"
      description="Usuarios con permisos de administración."
      data={data}
      columns={columns}
      searchPlaceholder="Buscar por nombre o rol"
      emptyTitle="Sin administradores"
      emptyDescription="No hay perfiles de administración disponibles."
      counterLabel="administradores"
    />
  )
}
