import { AdminPageShell } from '@/components/admin/admin-page-shell'
import { type Column } from '@/components/admin/admin-table'
import { getAdminSeasons } from '@/lib/admin-app'

const columns: Column[] = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'fechaInicio', label: 'Fecha inicio' },
  { key: 'fechaFin', label: 'Fecha fin' },
  { key: 'estado', label: 'Estado' },
]

export default async function AdminTemporadasPage() {
  const data = await getAdminSeasons()
  return (
    <AdminPageShell
      title="Temporadas"
      description="Temporadas deportivas disponibles en la plataforma visual."
      data={data}
      columns={columns}
      searchPlaceholder="Buscar temporada"
      emptyTitle="Sin temporadas"
      emptyDescription="No hay temporadas registradas."
      counterLabel="temporadas"
    />
  )
}
