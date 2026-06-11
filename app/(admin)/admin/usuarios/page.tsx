'use client'

import { AdminPageShell } from '@/components/admin/admin-page-shell'
import { type Column, type FilterConfig } from '@/components/admin/admin-table'
import { ADMIN_USUARIOS, type AdminUser } from '@/lib/admin'

const columns: Column<AdminUser>[] = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'email', label: 'Email', responsive: 'md' },
  { key: 'rol', label: 'Rol' },
  { key: 'estado', label: 'Estado' },
  { key: 'fechaAlta', label: 'Fecha de alta', responsive: 'lg' },
]

const filters: FilterConfig[] = [
  {
    key: 'rol',
    label: 'Rol',
    options: [
      { label: 'Tutor', value: 'Tutor' },
      { label: 'Administrador', value: 'Administrador' },
    ],
  },
  {
    key: 'estado',
    label: 'Estado',
    options: [
      { label: 'Activo', value: 'Activo' },
      { label: 'Pendiente', value: 'Pendiente' },
      { label: 'Bloqueado', value: 'Bloqueado' },
    ],
  },
]

export default function AdminUsuariosPage() {
  return (
    <AdminPageShell
      title="Usuarios"
      description="Vista visual básica de usuarios registrados en la plataforma."
      data={ADMIN_USUARIOS}
      columns={columns}
      getKey={(row) => row.id}
      searchPlaceholder="Buscar por nombre o email"
      filters={filters}
      emptyTitle="Sin usuarios"
      emptyDescription="No hay usuarios que coincidan con los filtros aplicados."
      counterLabel="usuarios"
    />
  )
}
