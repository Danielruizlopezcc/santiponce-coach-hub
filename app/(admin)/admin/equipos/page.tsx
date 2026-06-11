import { AdminPageShell } from '@/components/admin/admin-page-shell'
import { type Column, type FilterConfig } from '@/components/admin/admin-table'
import { getAdminTeams } from '@/lib/admin-app'

const columns: Column[] = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'categoria', label: 'Categoría' },
  { key: 'temporada', label: 'Temporada', responsive: 'md' },
  { key: 'deportistas', label: 'Deportistas' },
  { key: 'estado', label: 'Estado' },
]

const filters: FilterConfig[] = [
  {
    key: 'estado',
    label: 'Estado',
    options: [
      { label: 'Completo', value: 'Completo' },
      { label: 'Abierto', value: 'Abierto' },
      { label: 'Pendiente', value: 'Pendiente' },
    ],
  },
]

export default async function AdminEquiposPage() {
  const data = await getAdminTeams()
  return (
    <AdminPageShell
      title="Equipos"
      description="Equipos disponibles y ocupación actual leída desde Supabase."
      data={data}
      columns={columns}
      searchPlaceholder="Buscar por equipo o categoría"
      filters={filters}
      emptyTitle="Sin equipos"
      emptyDescription="No hay equipos que coincidan con los filtros aplicados."
      counterLabel="equipos"
    />
  )
}
