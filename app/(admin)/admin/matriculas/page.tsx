'use client'

import { AdminPageShell } from '@/components/admin/admin-page-shell'
import { type Column, type FilterConfig } from '@/components/admin/admin-table'
import { formatEuro } from '@/lib/format'
import { ADMIN_MATRICULAS, type AdminEnrollment } from '@/lib/admin'

const columns: Column<AdminEnrollment>[] = [
  { key: 'deportista', label: 'Deportista' },
  { key: 'tutor', label: 'Tutor', responsive: 'md' },
  { key: 'temporada', label: 'Temporada', responsive: 'lg' },
  { key: 'estadoMatricula', label: 'Estado matrícula' },
  { key: 'estadoPago', label: 'Estado pago' },
  { key: 'importe', label: 'Importe', render: (row) => formatEuro(row.importe) },
]

const filters: FilterConfig[] = [
  {
    key: 'estadoPago',
    label: 'Pago',
    options: [
      { label: 'Pagado', value: 'Pagado' },
      { label: 'Pendiente', value: 'Pendiente' },
    ],
  },
]

export default function AdminMatriculasPage() {
  return (
    <AdminPageShell
      title="Matrículas"
      description="Estado visual de matrículas y cobros asociados."
      data={ADMIN_MATRICULAS}
      columns={columns}
      getKey={(row) => row.id}
      searchPlaceholder="Buscar matrícula por deportista o tutor"
      filters={filters}
      emptyTitle="Sin matrículas"
      emptyDescription="No hay matrículas disponibles."
      counterLabel="matrículas"
    />
  )
}
