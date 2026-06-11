'use client'

import { AdminPageShell } from '@/components/admin/admin-page-shell'
import { type Column } from '@/components/admin/admin-table'
import { ADMIN_TEMPORADAS, type AdminSeason } from '@/lib/admin'

const columns: Column<AdminSeason>[] = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'fechaInicio', label: 'Fecha inicio' },
  { key: 'fechaFin', label: 'Fecha fin' },
  { key: 'estado', label: 'Estado' },
]

export default function AdminTemporadasPage() {
  return (
    <AdminPageShell
      title="Temporadas"
      description="Temporadas deportivas disponibles en la plataforma visual."
      data={ADMIN_TEMPORADAS}
      columns={columns}
      getKey={(row) => row.id}
      searchPlaceholder="Buscar temporada"
      emptyTitle="Sin temporadas"
      emptyDescription="No hay temporadas registradas."
      counterLabel="temporadas"
    />
  )
}
