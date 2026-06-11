'use client'

import { AdminPageShell } from '@/components/admin/admin-page-shell'
import { type Column, type FilterConfig } from '@/components/admin/admin-table'
import { formatEuro } from '@/lib/format'
import { ADMIN_PAGOS, type AdminPayment } from '@/lib/admin'

const columns: Column<AdminPayment>[] = [
  { key: 'operacion', label: 'Operación' },
  { key: 'deportista', label: 'Deportista' },
  { key: 'tutor', label: 'Tutor', responsive: 'md' },
  { key: 'importe', label: 'Importe', render: (row) => formatEuro(row.importe) },
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

export default function AdminPagosPage() {
  return (
    <AdminPageShell
      title="Pagos"
      description="Pagos y operaciones del proveedor en modo visual."
      data={ADMIN_PAGOS}
      columns={columns}
      getKey={(row) => row.id}
      searchPlaceholder="Buscar por operación, tutor o deportista"
      filters={filters}
      emptyTitle="Sin pagos"
      emptyDescription="No hay pagos que coincidan con los filtros aplicados."
      counterLabel="pagos"
    />
  )
}
