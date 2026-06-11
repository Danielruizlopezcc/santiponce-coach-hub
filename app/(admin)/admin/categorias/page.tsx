'use client'

import { AdminPageShell } from '@/components/admin/admin-page-shell'
import { type Column } from '@/components/admin/admin-table'
import { ADMIN_CATEGORIAS, type AdminCategory } from '@/lib/admin'

const columns: Column<AdminCategory>[] = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'orden', label: 'Orden' },
  { key: 'estado', label: 'Estado' },
]

export default function AdminCategoriasPage() {
  return (
    <AdminPageShell
      title="Categorías"
      description="Configuración visual de categorías deportivas para la temporada."
      data={ADMIN_CATEGORIAS}
      columns={columns}
      getKey={(row) => row.id}
      searchPlaceholder="Buscar categoría"
      emptyTitle="Sin categorías"
      emptyDescription="No hay categorías configuradas."
      counterLabel="categorías"
    />
  )
}
