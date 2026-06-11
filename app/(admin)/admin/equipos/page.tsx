'use client'

import { AdminPageShell } from '@/components/admin/admin-page-shell'
import { type Column, type FilterConfig } from '@/components/admin/admin-table'
import { ADMIN_EQUIPOS, type AdminTeam } from '@/lib/admin'

const columns: Column<AdminTeam>[] = [
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

export default function AdminEquiposPage() {
  return (
    <AdminPageShell
      title="Equipos"
      description="Equipos disponibles y ocupación actual en modo visual."
      data={ADMIN_EQUIPOS}
      columns={columns}
      getKey={(row) => row.id}
      searchPlaceholder="Buscar por equipo o categoría"
      filters={filters}
      emptyTitle="Sin equipos"
      emptyDescription="No hay equipos que coincidan con los filtros aplicados."
      counterLabel="equipos"
    />
  )
}
