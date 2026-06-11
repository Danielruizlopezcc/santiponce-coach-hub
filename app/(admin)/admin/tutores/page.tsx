'use client'

import { AdminPageShell } from '@/components/admin/admin-page-shell'
import { type Column } from '@/components/admin/admin-table'
import { maskDocument } from '@/lib/format'
import { ADMIN_TUTORES, type AdminTutor } from '@/lib/admin'

const columns: Column<AdminTutor>[] = [
  { key: 'nombre', label: 'Nombre' },
  {
    key: 'documento',
    label: 'DNI/NIE',
    render: (row) => maskDocument(row.documento),
  },
  { key: 'telefono', label: 'Teléfono', responsive: 'md' },
  { key: 'ciudad', label: 'Ciudad', responsive: 'lg' },
  { key: 'deportistasAsociados', label: 'Deportistas asociados' },
]

export default function AdminTutoresPage() {
  return (
    <AdminPageShell
      title="Tutores"
      description="Resumen visual de tutores y familias registradas."
      data={ADMIN_TUTORES}
      columns={columns}
      getKey={(row) => row.id}
      searchPlaceholder="Buscar por tutor o ciudad"
      emptyTitle="Sin tutores"
      emptyDescription="No hay tutores registrados para mostrar."
      counterLabel="tutores"
    />
  )
}
