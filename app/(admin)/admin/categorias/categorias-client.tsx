'use client'

import { useState, useTransition } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { AdminFormDialog } from '@/components/admin-form-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageContainer } from '@/components/page-container'
import { cn } from '@/lib/utils'
import type { AdminCategoryRow } from '@/lib/admin-app'
import { createCategory, deleteCategory, updateCategory } from './actions'

type SheetMode = 'create' | 'edit'

type CategoriasClientProps = {
  categories: AdminCategoryRow[]
  embedded?: boolean
}

export function CategoriasClient({ categories, embedded = false }: CategoriasClientProps) {
  const [isPending, startTransition] = useTransition()
  const [sheetOpen, setSheetOpen]       = useState(false)
  const [mode, setMode]                 = useState<SheetMode>('create')
  const [editing, setEditing]           = useState<AdminCategoryRow | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [formError, setFormError]       = useState<string | null>(null)

  // form fields
  const [name, setName]           = useState('')
  const [sortOrder, setSortOrder] = useState('')
  const [isActive, setIsActive]   = useState(true)

  function openCreate() {
    setMode('create')
    setEditing(null)
    setName('')
    setSortOrder(String(categories.length + 1))
    setIsActive(true)
    setFormError(null)
    setSheetOpen(true)
  }

  function openEdit(cat: AdminCategoryRow) {
    setMode('edit')
    setEditing(cat)
    setName(cat.nombre)
    setSortOrder(String(cat.orden))
    setIsActive(cat.estado === 'Activa')
    setFormError(null)
    setSheetOpen(true)
  }

  function handleSubmit() {
    const trimmed = name.trim()
    const order = parseInt(sortOrder, 10)
    if (!trimmed) { setFormError('El nombre es obligatorio.'); return }
    if (isNaN(order) || order < 1) { setFormError('El orden debe ser un número mayor que 0.'); return }
    setFormError(null)

    startTransition(async () => {
      try {
        if (mode === 'create') {
          await createCategory(trimmed, order, isActive)
        } else if (editing) {
          await updateCategory(editing.id, trimmed, order, isActive)
        }
        setSheetOpen(false)
      } catch (e) {
        setFormError(e instanceof Error ? e.message : 'Error al guardar.')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteCategory(id)
        setConfirmDeleteId(null)
      } catch {
        // silent — unlikely to fail in practice
      }
    })
  }

  const content = (
    <>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center justify-end gap-3">
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" aria-hidden="true" />
          Nueva categoría
        </Button>
      </div>

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-blue-50 text-blue-950 font-bold">
              <th className="px-4 py-2.5 text-left text-xs font-bold text-blue-950">
                Nombre
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-bold text-blue-950">
                Orden
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-bold text-blue-950">
                Estado
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-bold text-blue-950">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-14 text-center text-sm text-muted-foreground">
                  No hay categorías. Crea la primera.
                </td>
              </tr>
            )}
            {categories.map((cat) => (
              <tr
                key={cat.id}
                className={cn(
                  'transition-colors hover:bg-muted/30',
                  confirmDeleteId === cat.id && 'bg-destructive/5',
                )}
              >
                <td className="px-4 py-3 font-medium">{cat.nombre}</td>
                <td className="px-4 py-3 text-muted-foreground">{cat.orden}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-medium',
                      cat.estado === 'Activa'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {cat.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {confirmDeleteId === cat.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-muted-foreground">¿Eliminar?</span>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isPending}
                        onClick={() => handleDelete(cat.id)}
                      >
                        Sí, eliminar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(cat)}>
                        <Pencil className="size-3.5" aria-hidden="true" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setConfirmDeleteId(cat.id)}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                        Eliminar
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminFormDialog
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={mode === 'create' ? 'Nueva categoría' : 'Editar categoría'}
        description={mode === 'create'
          ? 'Rellena los datos para crear una nueva categoría deportiva.'
          : 'Modifica los datos de la categoría.'}
        footer={
          <>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending
                ? 'Guardando...'
                : mode === 'create'
                  ? 'Crear categoría'
                  : 'Guardar cambios'}
            </Button>
          </>
        }
      >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cat-name">Nombre</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Benjamín"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cat-order">Orden</Label>
              <Input
                id="cat-order"
                type="number"
                min={1}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2">
              <input
                id="cat-active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="size-4 rounded border-border accent-primary"
              />
              <Label htmlFor="cat-active">Activa</Label>
            </div>

            {formError && (
              <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {formError}
              </p>
            )}
      </AdminFormDialog>
    </>
  )

  if (embedded) {
    return content
  }

  return (
    <PageContainer
      title="Categorías"
      description="Gestión de categorías deportivas para la temporada."
      className="max-w-7xl"
    >
      {content}
    </PageContainer>
  )
}
