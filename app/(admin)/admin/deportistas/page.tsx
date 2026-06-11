import { AdminPageShell } from '@/components/admin/admin-page-shell'
import { type Column, type FilterConfig } from '@/components/admin/admin-table'
import { getAdminAthletes } from '@/lib/admin-app'

const columns: Column[] = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'tutor', label: 'Tutor', responsive: 'md' },
  { key: 'categoriaSolicitada', label: 'Categoría solicitada' },
  { key: 'equipoAsignado', label: 'Equipo asignado', responsive: 'lg' },
  { key: 'temporada', label: 'Temporada', responsive: 'lg' },
  { key: 'estadoMatricula', label: 'Estado de matrícula' },
]

const filters: FilterConfig[] = [
  {
    key: 'estadoMatricula',
    label: 'Estado',
    options: [
      { label: 'Pendiente', value: 'Pendiente' },
      { label: 'Matriculado', value: 'Matriculado' },
      { label: 'En revisión', value: 'En revisión' },
    ],
  },
]

export default async function AdminDeportistasPage() {
  const data = await getAdminAthletes()
  return (
    <AdminPageShell
      title="Deportistas"
      description="Listado visual de deportistas y estado de matrícula."
      data={data}
      columns={columns}
      searchPlaceholder="Buscar por deportista, tutor o categoría"
      filters={filters}
      emptyTitle="Sin deportistas"
      emptyDescription="No hay deportistas que coincidan con la búsqueda."
      counterLabel="deportistas"
    />
  )
}
