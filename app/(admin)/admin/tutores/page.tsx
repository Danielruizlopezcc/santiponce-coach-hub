import { AdminPageShell } from '@/components/admin/admin-page-shell'
import { type Column } from '@/components/admin/admin-table'
import { maskDocument } from '@/lib/format'
import { getAdminTutors } from '@/lib/admin-app'

const columns: Column[] = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'documento', label: 'DNI/NIE' },
  { key: 'telefono', label: 'Teléfono', responsive: 'md' },
  { key: 'ciudad', label: 'Ciudad', responsive: 'lg' },
  { key: 'deportistasAsociados', label: 'Deportistas asociados' },
]

export default async function AdminTutoresPage() {
  const data = (await getAdminTutors()).map((row) => ({
    ...row,
    documento: maskDocument(row.documento),
  }))
  return (
    <AdminPageShell
      title="Tutores"
      description="Resumen visual de tutores y familias registradas."
      data={data}
      columns={columns}
      searchPlaceholder="Buscar por tutor o ciudad"
      emptyTitle="Sin tutores"
      emptyDescription="No hay tutores registrados para mostrar."
      counterLabel="tutores"
    />
  )
}
