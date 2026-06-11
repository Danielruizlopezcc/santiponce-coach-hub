'use client'

import { AdminPageShell } from '@/components/admin/admin-page-shell'
import { type Column } from '@/components/admin/admin-table'
import { ADMIN_CONSENTIMIENTOS, type AdminConsent } from '@/lib/admin'

const columns: Column<AdminConsent>[] = [
  { key: 'usuario', label: 'Usuario' },
  { key: 'tipoConsentimiento', label: 'Tipo de consentimiento' },
  { key: 'version', label: 'Versión' },
  { key: 'estado', label: 'Estado' },
  { key: 'fecha', label: 'Fecha', responsive: 'md' },
  { key: 'firmante', label: 'Firmante', responsive: 'lg' },
]

export default function AdminConsentimientosPage() {
  return (
    <AdminPageShell
      title="Consentimientos"
      description="Registros visuales de aceptación y firma digital."
      data={ADMIN_CONSENTIMIENTOS}
      columns={columns}
      getKey={(row) => row.id}
      searchPlaceholder="Buscar por usuario o tipo de consentimiento"
      emptyTitle="Sin consentimientos"
      emptyDescription="No hay consentimientos disponibles."
      counterLabel="consentimientos"
    />
  )
}
