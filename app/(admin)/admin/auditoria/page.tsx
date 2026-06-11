'use client'

import { AdminPageShell } from '@/components/admin/admin-page-shell'
import { type Column } from '@/components/admin/admin-table'
import { ADMIN_AUDITORIA, type AdminAudit } from '@/lib/admin'

const columns: Column<AdminAudit>[] = [
  { key: 'fecha', label: 'Fecha' },
  { key: 'usuarioAdmin', label: 'Usuario/admin' },
  { key: 'accion', label: 'Acción' },
  { key: 'entidad', label: 'Entidad', responsive: 'md' },
  { key: 'resultado', label: 'Resultado' },
]

export default function AdminAuditoriaPage() {
  return (
    <AdminPageShell
      title="Auditoría"
      description="Actividad administrativa registrada en formato visual."
      data={ADMIN_AUDITORIA}
      columns={columns}
      getKey={(row) => row.id}
      searchPlaceholder="Buscar por acción, entidad o usuario"
      emptyTitle="Sin eventos"
      emptyDescription="No hay registros de auditoría disponibles."
      counterLabel="eventos"
    />
  )
}
