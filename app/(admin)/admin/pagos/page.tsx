import { AdminPageShell } from '@/components/admin/admin-page-shell'
import { type Column, type FilterConfig } from '@/components/admin/admin-table'
import { formatEuro } from '@/lib/format'
import { getAdminPayments } from '@/lib/admin-app'

const columns: Column[] = [
  { key: 'operacion', label: 'Operación' },
  { key: 'deportista', label: 'Deportista' },
  { key: 'tutor', label: 'Tutor', responsive: 'md' },
  { key: 'importe', label: 'Importe' },
  { key: 'estado', label: 'Estado' },
  { key: 'proveedor', label: 'Proveedor', responsive: 'lg' },
  { key: 'fecha', label: 'Fecha', responsive: 'lg' },
]

const filters: FilterConfig[] = [
  {
    key: 'estado',
    label: 'Estado',
    options: [
      { label: 'Pagado', value: 'pagado' },
      { label: 'Pendiente', value: 'pendiente' },
      { label: 'Fallido', value: 'fallido' },
      { label: 'Reembolsado', value: 'reembolsado' },
    ],
  },
]

export default async function AdminPagosPage() {
  const data = (await getAdminPayments()).map((row) => ({
    ...row,
    importe: formatEuro(row.importe),
  }))
  return (
    <AdminPageShell
      title="Pagos"
      description="Histórico y seguimiento de operaciones registradas en la plataforma."
      data={data}
      columns={columns}
      searchPlaceholder="Buscar por operación, tutor o deportista"
      filters={filters}
      emptyTitle="Sin pagos"
      emptyDescription="No hay pagos que coincidan con los filtros aplicados."
      counterLabel="pagos"
    />
  )
}
