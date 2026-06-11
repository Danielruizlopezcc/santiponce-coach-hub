'use client'

import { AdminPageShell } from '@/components/admin/admin-page-shell'
import { type Column } from '@/components/admin/admin-table'
import { ADMIN_ADMINISTRADORES, type AdminManager } from '@/lib/admin'

const columns: Column<AdminManager>[] = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'email', label: 'Email', responsive: 'md' },
  { key: 'rol', label: 'Rol' },
  { key: 'estado', label: 'Estado' },
]

export default function AdminAdministradoresPage() {
  return (
    <AdminPageShell
      title="Gestión de administradores"
      description="Administradores y perfiles internos en modo visual."
      data={ADMIN_ADMINISTRADORES}
      columns={columns}
      getKey={(row) => row.id}
      searchPlaceholder="Buscar por nombre o rol"
      emptyTitle="Sin administradores"
      emptyDescription="No hay perfiles de administración disponibles."
      counterLabel="administradores"
    />
  )
}
